import logging

from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Application, Feedback, Resume
from interviews.models import Interview
from .serializers import (
    ApplicationSerializer,
    ApplicationCreateSerializer,
    FeedbackSerializer,
    ResumeSerializer,
    ResumeUploadSerializer,
)
from interviews.serializers import InterviewSerializer
from users.permissions import IsRecruiter, IsJobSeeker
from users.models import Recruiter, JobSeeker
from job_offers.models import JobOffer

from .services.create_application import create_application
from .services.accept_application import accept_application
from .services.advance_application import advance_application
from .services.reject_application import reject_application
from .services.upload_resume import upload_resume, set_default_resume
from .selectors import list_jobseeker_applications, list_jobseeker_resumes, recruiter_pipeline_summary

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Resume endpoints
# ---------------------------------------------------------------------------

class ResumeListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        resumes = list_jobseeker_resumes(request.user.jobseeker)
        return Response(ResumeSerializer(resumes, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resume = upload_resume(
            job_seeker=request.user.jobseeker,
            file=serializer.validated_data['original_file'],
            label=serializer.validated_data.get('label', ''),
            make_default=serializer.validated_data.get('make_default', False),
        )
        return Response(ResumeSerializer(resume, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ResumeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    parser_classes = [MultiPartParser, FormParser]

    def _get_resume(self, pk, job_seeker):
        resume = Resume.objects.get(pk=pk)
        if resume.job_seeker_id != job_seeker.id:
            raise PermissionDenied('This resume does not belong to you.')
        return resume

    def get(self, request, pk):
        resume = self._get_resume(pk, request.user.jobseeker)
        return Response(ResumeSerializer(resume, context={'request': request}).data)

    def patch(self, request, pk):
        resume = self._get_resume(pk, request.user.jobseeker)
        label = request.data.get('label')
        make_default = request.data.get('is_default', False)
        if label is not None:
            resume.label = label
            resume.save(update_fields=['label'])
        if make_default:
            set_default_resume(job_seeker=request.user.jobseeker, resume_id=pk)
            resume.refresh_from_db()
        return Response(ResumeSerializer(resume, context={'request': request}).data)

    def delete(self, request, pk):
        resume = self._get_resume(pk, request.user.jobseeker)
        resume.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Application endpoints
# ---------------------------------------------------------------------------

class JobSeekerApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        applications = list_jobseeker_applications(request.user.jobseeker)
        return Response(ApplicationSerializer(applications, many=True, context={'request': request}).data)


class ListInterviewView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Interview.objects.filter(
            application__job_seeker=self.request.user.jobseeker
        ).select_related('application__job_offer', 'application__job_seeker__user', 'evaluation')


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]


class JobApplicationCreateView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def post(self, request, *args, **kwargs):
        job_seeker = JobSeeker.objects.filter(user=request.user).first()
        if not job_seeker:
            return Response({'error': 'Job seeker profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            application = create_application(
                job_seeker=job_seeker,
                job_offer_id=serializer.validated_data['job_offer_id'],
                resume_id=serializer.validated_data.get('resume_id'),
            )
        except JobOffer.DoesNotExist:
            return Response({'error': 'Job offer not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ApplicationSerializer(application, context={'request': request}).data, status=status.HTTP_201_CREATED)


class AcceptApplicationView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'llm'

    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({'error': 'Missing application_id.'}, status=status.HTTP_400_BAD_REQUEST)

        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            application, interview = accept_application(
                application_id=application_id, recruiter=recruiter
            )
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'application': ApplicationSerializer(application, context={'request': request}).data,
            'interview': {
                'id': interview.id,
                'interview_date': interview.interview_date,
                'interview_link': interview.interview_link,
                'status': interview.status,
            },
        }, status=status.HTTP_200_OK)


class RejectApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({'error': 'Missing application_id.'}, status=status.HTTP_400_BAD_REQUEST)

        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            application = reject_application(
                application_id=application_id, recruiter=recruiter
            )
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ApplicationSerializer(application, context={'request': request}).data)


class AdvanceApplicationView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]
    throttle_scope = 'llm'

    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({'error': 'Missing application_id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = advance_application(
                application_id=application_id, recruiter=request.user.recruiter
            )
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as e:
            return Response({'error': ' '.join(str(m) for m in e.detail)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ApplicationSerializer(application, context={'request': request}).data)


class RecruiterPipelineSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def get(self, request):
        return Response(recruiter_pipeline_summary(request.user.recruiter))
