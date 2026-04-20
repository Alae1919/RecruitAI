import os
import logging

from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from django.http import JsonResponse

from .models import Interview, Question, Answer, InterviewResult
from job_offers.models import JobOffer
from applications.models import Application
from .serializers import InterviewSerializer, InterviewQuestionSerializer, RecruiterInterviewSerializer
from .tasks import generateQuestions, evaluate_answer

logger = logging.getLogger(__name__)


@api_view(['GET'])
def get_interview_result(request, interview_id):
    logger.info(f"Received interview ID: {interview_id}")
    try:
        interview = Interview.objects.get(id=interview_id)
        if not InterviewResult.objects.filter(interview=interview).exists():
            return Response({'error': 'Interview result not found.'}, status=404)

        interview_result = InterviewResult.objects.get(interview=interview)
        data = {
            'name': interview.application.candidate.first_name,
            'email': interview.application.candidate.email,
            'date': interview.application.applied_at.strftime('%d %b %Y'),
            'score': interview_result.score,
        }
        return Response(data, status=200)

    except Interview.DoesNotExist:
        return Response({'error': 'Interview not found.'}, status=404)
    except InterviewResult.DoesNotExist:
        return Response({'error': 'Interview result not found.'}, status=404)


class InterviewQuestionsAPI(APIView):
    throttle_scope = 'llm'

    def post(self, request):
        interview_id = request.data.get('interview_id')
        if not interview_id:
            return Response({"error": "interview_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            interview = Interview.objects.get(id=interview_id)
            questions = Question.objects.filter(interview=interview)
            serializer = InterviewQuestionSerializer(questions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Interview.DoesNotExist:
            return Response({"error": "Interview not found."}, status=status.HTTP_404_NOT_FOUND)


class JobSeekerInterviewListAPI(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterviewSerializer

    def get_queryset(self):
        job_seeker = self.request.user.jobseeker
        applications = Application.objects.filter(job_seeker=job_seeker)
        return Interview.objects.filter(application__in=applications).prefetch_related('interviewresult')


class RecruiterInterviewListAPI(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecruiterInterviewSerializer

    def get_queryset(self):
        recruiter_offers = JobOffer.objects.filter(recruiter=self.request.user.recruiter)
        return Interview.objects.filter(
            application__job_offer__in=recruiter_offers
        ).select_related(
            'application__job_seeker__user',
            'application__job_offer',
        ).prefetch_related('interviewresult')


class _LLMScopedThrottle(ScopedRateThrottle):
    scope = 'llm'


@api_view(['POST'])
@throttle_classes([_LLMScopedThrottle])
def upload_video(request):
    try:
        interview_id = request.POST.get('interviewId')
        if not interview_id:
            return JsonResponse({'error': 'Interview ID is required.'}, status=400)

        try:
            interview = Interview.objects.get(id=interview_id)
        except Interview.DoesNotExist:
            return JsonResponse({'error': 'Interview not found.'}, status=404)

        video_file = request.FILES.get('video')
        if not video_file:
            return JsonResponse({'error': 'No video file provided.'}, status=400)

        if video_file.size > 100 * 1024 * 1024:
            return JsonResponse({'error': 'Video file is too large. Maximum size is 100MB.'}, status=400)

        allowed_extensions = ['.mp4', '.webm', '.mov']
        allowed_mime_types = ['video/mp4', 'video/webm', 'video/quicktime']
        file_extension = os.path.splitext(video_file.name)[1].lower()
        if file_extension not in allowed_extensions or video_file.content_type not in allowed_mime_types:
            return JsonResponse({'error': 'Invalid video file format. Supported formats: MP4, WebM, MOV.'}, status=400)

        question_id = request.POST.get('questionId')
        if not question_id:
            return JsonResponse({'error': 'Question ID is required.'}, status=400)

        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return JsonResponse({'error': 'Question not found.'}, status=404)

        try:
            answer, created = Answer.objects.get_or_create(
                interview=interview,
                question=question,
                defaults={'candidate_video': video_file},
            )
            if not created:
                answer.candidate_video = video_file
                answer.save()

            video_path = answer.candidate_video.path
            logger.info(f"Video saved to: {video_path}")

            if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
                return JsonResponse({'error': 'Video file is invalid or empty.'}, status=400)

            evaluate_answer.delay(answer.id)
            try:
                interview.status = Interview.Status.COMPLETED
                interview.save()
            except Exception as e:
                logger.error(f"Failed to update interview status: {e}", exc_info=True)

            return JsonResponse({
                'success': True,
                'message': 'Video uploaded successfully. Evaluation started.',
                'answer_id': answer.id,
            })
        except Exception as e:
            logger.error(f"Failed to save video: {e}", exc_info=True)
            return JsonResponse({'error': 'Failed to save video.'}, status=500)
    except Exception as e:
        logger.error(f"Unexpected error in upload_video: {e}", exc_info=True)
        return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)


@api_view(['POST'])
def get_interview_answers(request):
    try:
        data = JSONParser().parse(request)
        interview_id = data.get("interview_id")

        if not interview_id:
            return JsonResponse({"error": "Interview ID is required."}, status=400)

        interview = Interview.objects.get(id=interview_id)
        answers = Answer.objects.filter(
            interview=interview,
            question__interview=interview,
        ).select_related('question')

        answer_data = [
            {
                "question_id": answer.question.id,
                "question_text": answer.question.question_text,
                "video_url": answer.candidate_video.url if answer.candidate_video else None,
                "transcript": answer.transcript,
            }
            for answer in answers
        ]
        return JsonResponse({"interview_id": interview_id, "answers": answer_data}, status=200)

    except Interview.DoesNotExist:
        return JsonResponse({"error": "Interview not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
