from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics, viewsets
from .models import Application, Feedback, CVExtractionError
from interviews.models import Interview
from interviews.views import generateQuestions
from .serializers import ApplicationSerializer, FeedbackSerializer
from interviews.serializers import InterviewSerializer
from users.permissions import IsRecruiter, IsJobSeeker
from users.models import Recruiter, JobSeeker
from job_offers.models import JobOffer
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_email_to_candidate(email, message, interview_date=None, interview_link=None):
    subject = "Statut de votre candidature"
    body = f"""
    {message}

    Détails de l'entretien :
    Date: {interview_date}
    Lien: {interview_link}
    """
    send_mail(
        subject,
        body,
        settings.EMAIL_HOST_USER,
        [email],
        fail_silently=False,
    )


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
        try:
            job_offer = JobOffer.objects.get(id=job_offer_id)

            existing_application = Application.objects.filter(job_seeker=job_seeker, job_offer=job_offer).first()
            if existing_application:
                return Response({"error": "You have already applied for this job."}, status=status.HTTP_400_BAD_REQUEST)

            application = Application.objects.create(
                job_seeker=job_seeker,
                job_offer=job_offer,
                status=Application.Status.PENDING,
            )
            try:
                extracted_text = application.extract_text_from_resume()
                if extracted_text:
                    application.extracted_text = extracted_text
                    application.save(update_fields=['extracted_text'])
            except CVExtractionError as e:
                application.delete()
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            serializer = ApplicationSerializer(application)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except JobOffer.DoesNotExist:
            return Response({"error": "Job offer not found."}, status=status.HTTP_404_NOT_FOUND)
        except JobSeeker.DoesNotExist:
            return Response({"error": "Job seeker not found."}, status=status.HTTP_404_NOT_FOUND)


class AcceptApplicationView(APIView):
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

        interview, created = Interview.objects.get_or_create(
            application=application,
            defaults={
                "interview_date": timezone.now() + timedelta(days=1),
                "status": Interview.Status.AVAILABLE,
            }
        )

        logger.info(f"Generating new questions for interview {interview.id}")
        extracted_text = application.extracted_text
        generateQuestions.delay(extracted_text, application.job_offer.description, interview.id)

        candidate_email = application.job_seeker.user.email
        message = "Votre candidature a été acceptée, vous pouvez passer un entretien."
        try:
            send_email_to_candidate(
                candidate_email,
                message,
                interview_date=interview.interview_date,
                interview_link=interview.interview_link,
            )
            logger.info(f"Acceptance email sent to {candidate_email}")
        except Exception as e:
            logger.warning(f"Failed to send acceptance email to {candidate_email}: {e}")

        application.status = Application.Status.ACCEPTED
        application.save()

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
