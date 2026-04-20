import logging

from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Application, Feedback
from interviews.models import Interview
from .serializers import ApplicationSerializer, FeedbackSerializer
from interviews.serializers import InterviewSerializer
from users.permissions import IsRecruiter, IsJobSeeker
from users.models import Recruiter, JobSeeker
from job_offers.models import JobOffer

from .services.create_application import create_application
from .services.accept_application import accept_application
from .services.reject_application import reject_application

logger = logging.getLogger(__name__)


class JobSeekerApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        job_seeker = request.user.jobseeker
        applications = Application.objects.filter(job_seeker=job_seeker).select_related('job_offer')
        return Response(ApplicationSerializer(applications, many=True).data)


class ListInterviewView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Interview.objects.filter(application__job_seeker=self.request.user.jobseeker)


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]


class JobApplicationCreateView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def post(self, request, *args, **kwargs):
        job_seeker = JobSeeker.objects.filter(user=request.user).first()
        if not job_seeker:
            return Response({"error": "Job seeker profile not found."}, status=status.HTTP_404_NOT_FOUND)

        job_offer_id = request.data.get('job_offer_id')
        try:
            application = create_application(job_seeker=job_seeker, job_offer_id=job_offer_id)
        except JobOffer.DoesNotExist:
            return Response({"error": "Job offer not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class AcceptApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"error": "Missing application_id in request body."}, status=status.HTTP_400_BAD_REQUEST)

        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        try:
            application, interview = accept_application(
                application_id=application_id, recruiter=recruiter
            )
        except Application.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "application": ApplicationSerializer(application).data,
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

        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        try:
            application = reject_application(
                application_id=application_id, recruiter=recruiter
            )
        except Application.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)

        return Response(ApplicationSerializer(application).data, status=status.HTTP_200_OK)
