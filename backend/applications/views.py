from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics, viewsets
from .models import Application, Feedback
from interviews.models import Interview
from interviews.tasks import generateQuestions
from .tasks import extract_cv_text, send_acceptance_email
from django.db import transaction
from .serializers import ApplicationSerializer, FeedbackSerializer
from interviews.serializers import InterviewSerializer
from users.permissions import IsRecruiter, IsJobSeeker
from users.models import Recruiter, JobSeeker
from job_offers.models import JobOffer
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class JobSeekerApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        job_seeker = request.user.jobseeker
        applications = Application.objects.filter(job_seeker=job_seeker).select_related('job_offer')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class ListInterviewView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        job_seeker = self.request.user.jobseeker
        return Interview.objects.filter(application__job_seeker=job_seeker)


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]


class JobApplicationCreateView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def post(self, request, *args, **kwargs):
        job_offer_id = request.data.get('job_offer_id')
        job_seeker = JobSeeker.objects.filter(user=request.user).first()
        if not job_seeker:
            return Response({"error": "Job seeker profile not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            job_offer = JobOffer.objects.get(id=job_offer_id)
        except JobOffer.DoesNotExist:
            return Response({"error": "Job offer not found."}, status=status.HTTP_404_NOT_FOUND)

        if Application.objects.filter(job_seeker=job_seeker, job_offer=job_offer).exists():
            return Response({"error": "You have already applied for this job."}, status=status.HTTP_400_BAD_REQUEST)

        application = Application.objects.create(
            job_seeker=job_seeker,
            job_offer=job_offer,
            status=Application.Status.PENDING,
        )
        extract_cv_text.delay(application.id)

        serializer = ApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AcceptApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"error": "Missing application_id in request body."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = Application.objects.select_related(
                'job_offer__recruiter', 'job_seeker__user'
            ).get(id=application_id)
        except Application.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter or application.job_offer.recruiter != recruiter:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        interview, created = Interview.objects.get_or_create(
            application=application,
            defaults={
                "interview_date": timezone.now() + timedelta(days=1),
                "status": Interview.Status.AVAILABLE,
            }
        )

        application.status = Application.Status.ACCEPTED
        application.save(update_fields=['status', 'updated_at'])

        logger.info(f"Generating new questions for interview {interview.id}")
        transaction.on_commit(lambda: generateQuestions.delay(
            application.extracted_text, application.job_offer.description, interview.id
        ))
        transaction.on_commit(lambda: send_acceptance_email.delay(application.id))

        serializer = ApplicationSerializer(application)
        return Response({
            "application": serializer.data,
            "interview": {
                "id": interview.id,
                "interview_date": interview.interview_date,
                "interview_link": interview.interview_link,
                "status": interview.status,
            }
        }, status=status.HTTP_200_OK)


class RejectApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"error": "Missing application_id in request body."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter or application.job_offer.recruiter != recruiter:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        application.status = Application.Status.REJECTED
        application.save()

        serializer = ApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)
