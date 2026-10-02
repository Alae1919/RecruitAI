import os
import logging

from rest_framework import status, generics, permissions, viewsets
from rest_framework.decorators import action, api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.http import JsonResponse
from rest_framework.parsers import JSONParser

from .models import Interview, Question, Answer, QuestionSet, AnswerEvaluation, InterviewEvaluation
from .serializers import (
    InterviewSerializer,
    RecruiterInterviewSerializer,
    QuestionSerializer,
    QuestionSetSerializer,
    QuestionSetCreateSerializer,
    QuestionWriteSerializer,
    InterviewEvaluationSerializer,
    InterviewEvaluationDecisionSerializer,
)
from .selectors import (
    list_recruiter_interviews, list_jobseeker_interviews, get_interview_questions, all_questions_answered,
)
from .services.generate_question_set import generate_question_set, regenerate_question_set
from .services.lock_question_set import lock_question_set
from .services.override_decision import override_decision
from users.permissions import IsRecruiter, IsJobSeeker, IsRecruiterOwner
from job_offers.models import JobOffer
from applications.models import Application

logger = logging.getLogger(__name__)


class _LLMScopedThrottle(ScopedRateThrottle):
    scope = 'llm'


# ---------------------------------------------------------------------------
# QuestionSet
# ---------------------------------------------------------------------------

class QuestionSetListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    throttle_scope = 'llm'

    def get(self, request, job_offer_id):
        from .selectors import list_question_sets
        recruiter = request.user.recruiter
        question_sets = list_question_sets(job_offer_id=job_offer_id, recruiter=recruiter)
        return Response(QuestionSetSerializer(question_sets, many=True).data)

    def post(self, request, job_offer_id):
        serializer = QuestionSetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recruiter = request.user.recruiter
        try:
            qs = generate_question_set(
                job_offer_id=job_offer_id,
                recruiter=recruiter,
                **serializer.validated_data,
            )
        except JobOffer.DoesNotExist:
            return Response({'error': 'Job offer not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(QuestionSetSerializer(qs).data, status=status.HTTP_202_ACCEPTED)


class QuestionSetDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def _get_qs(self, pk, recruiter):
        from rest_framework.exceptions import PermissionDenied
        qs = QuestionSet.objects.select_related('job_offer__recruiter').prefetch_related('questions').get(pk=pk)
        if qs.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this question set.')
        return qs

    def get(self, request, pk):
        qs = self._get_qs(pk, request.user.recruiter)
        return Response(QuestionSetSerializer(qs).data)

    def patch(self, request, pk):
        qs = self._get_qs(pk, request.user.recruiter)
        if qs.status == QuestionSet.Status.LOCKED:
            return Response({'error': 'Cannot modify a LOCKED QuestionSet.'}, status=status.HTTP_400_BAD_REQUEST)

        new_status = request.data.get('status')
        if new_status == QuestionSet.Status.LOCKED:
            try:
                lock_question_set(question_set_id=pk, recruiter=request.user.recruiter)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Only allow safe recruiter-editable fields; all others are read-only on the serializer.
            allowed_keys = {'status', 'question_type', 'target_count', 'recruiter_instructions'}
            data = {k: v for k, v in request.data.items() if k in allowed_keys}
            serializer = QuestionSetSerializer(qs, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return Response(QuestionSetSerializer(self._get_qs(pk, request.user.recruiter)).data)

    def delete(self, request, pk):
        qs = self._get_qs(pk, request.user.recruiter)
        if qs.status == QuestionSet.Status.LOCKED:
            return Response({'error': 'Cannot delete a LOCKED QuestionSet.'}, status=status.HTTP_400_BAD_REQUEST)
        qs.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class QuestionSetRegenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    throttle_scope = 'llm'

    def post(self, request, pk):
        instructions = request.data.get('recruiter_instructions', '')
        try:
            qs = regenerate_question_set(
                question_set_id=pk, recruiter=request.user.recruiter, instructions=instructions
            )
        except QuestionSet.DoesNotExist:
            return Response({'error': 'QuestionSet not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QuestionSetSerializer(qs).data, status=status.HTTP_202_ACCEPTED)


class QuestionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def _get_qs(self, question_set_id, recruiter):
        from rest_framework.exceptions import PermissionDenied, ValidationError
        qs = QuestionSet.objects.select_related('job_offer__recruiter').get(id=question_set_id)
        if qs.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this question set.')
        if qs.status == QuestionSet.Status.LOCKED:
            raise ValidationError('Cannot add questions to a LOCKED QuestionSet.')
        return qs

    def post(self, request, question_set_id):
        qs = self._get_qs(question_set_id, request.user.recruiter)
        serializer = QuestionWriteSerializer(data=request.data, context={'question_set': qs})
        serializer.is_valid(raise_exception=True)
        question = Question.objects.create(
            question_set=qs, source=Question.Source.BASE, **serializer.validated_data
        )
        return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class QuestionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def _get_question(self, pk, recruiter):
        from rest_framework.exceptions import PermissionDenied, ValidationError
        q = Question.objects.select_related('question_set__job_offer__recruiter').get(pk=pk)
        if q.question_set and q.question_set.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this question.')
        if q.question_set and q.question_set.status == QuestionSet.Status.LOCKED:
            raise ValidationError('Cannot modify questions on a LOCKED QuestionSet.')
        return q

    def patch(self, request, pk):
        q = self._get_question(pk, request.user.recruiter)
        serializer = QuestionWriteSerializer(q, data=request.data, partial=True, context={'question_set': q.question_set})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(QuestionSerializer(q).data)

    def delete(self, request, pk):
        q = self._get_question(pk, request.user.recruiter)
        q.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Interview lists
# ---------------------------------------------------------------------------

class JobSeekerInterviewListAPI(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsJobSeeker]
    serializer_class = InterviewSerializer

    def get_queryset(self):
        return list_jobseeker_interviews(self.request.user.jobseeker)


class RecruiterInterviewListAPI(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    serializer_class = RecruiterInterviewSerializer

    def get_queryset(self):
        return list_recruiter_interviews(self.request.user.recruiter)


# ---------------------------------------------------------------------------
# Interview questions endpoint (candidate-facing)
# ---------------------------------------------------------------------------

class InterviewQuestionsAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, interview_id):
        try:
            interview = Interview.objects.select_related('question_set', 'application__job_seeker').get(id=interview_id)
        except Interview.DoesNotExist:
            return Response({'error': 'Interview not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Ensure it's the candidate's own interview
        try:
            if interview.application.job_seeker.user_id != request.user.id:
                return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        questions = get_interview_questions(interview)
        return Response(QuestionSerializer(questions, many=True).data)


# ---------------------------------------------------------------------------
# Evaluation views
# ---------------------------------------------------------------------------

class InterviewEvaluationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, interview_id):
        try:
            interview = Interview.objects.select_related(
                'application__job_seeker', 'application__job_offer__recruiter'
            ).get(id=interview_id)
        except Interview.DoesNotExist:
            return Response({'error': 'Interview not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow recruiter owner or candidate owner
        is_recruiter_owner = (
            hasattr(request.user, 'recruiter') and
            interview.application.job_offer.recruiter_id == request.user.recruiter.id
        )
        is_candidate = (
            hasattr(request.user, 'jobseeker') and
            interview.application.job_seeker.user_id == request.user.id
        )
        if not (is_recruiter_owner or is_candidate):
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            evaluation = InterviewEvaluation.objects.get(interview=interview)
        except InterviewEvaluation.DoesNotExist:
            return Response({'detail': 'Evaluation not yet available.'}, status=status.HTTP_202_ACCEPTED)

        return Response(InterviewEvaluationSerializer(evaluation).data)


class InterviewEvaluationDecisionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def patch(self, request, interview_id):
        serializer = InterviewEvaluationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            evaluation = override_decision(
                interview_id=interview_id,
                recruiter=request.user.recruiter,
                decision=serializer.validated_data['decision'],
                reasoning=serializer.validated_data['reasoning'],
            )
        except InterviewEvaluation.DoesNotExist:
            return Response({'error': 'Evaluation not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InterviewEvaluationSerializer(evaluation).data)


# ---------------------------------------------------------------------------
# Video upload (existing, updated to use new Answer model)
# ---------------------------------------------------------------------------

def _is_interview_candidate(user, interview) -> bool:
    return interview.application.job_seeker.user_id == user.id


def _is_interview_recruiter(user, interview) -> bool:
    return hasattr(user, 'recruiter') and interview.application.job_offer.recruiter_id == user.recruiter.id


def _question_belongs_to(question, interview) -> bool:
    """Base questions come from the interview's question set, probes are attached to the interview."""
    if question.interview_id is not None:
        return question.interview_id == interview.id
    return question.question_set_id is not None and question.question_set_id == interview.question_set_id


@api_view(['POST'])
@throttle_classes([_LLMScopedThrottle])
def upload_video(request):
    from .tasks import evaluate_answer as eval_task
    try:
        interview_id = request.POST.get('interviewId')
        if not interview_id:
            return JsonResponse({'error': 'Interview ID is required.'}, status=400)

        try:
            interview = Interview.objects.select_related('application__job_seeker').get(id=interview_id)
        except Interview.DoesNotExist:
            return JsonResponse({'error': 'Interview not found.'}, status=404)

        if not _is_interview_candidate(request.user, interview):
            return JsonResponse({'error': 'Not authorized.'}, status=403)

        video_file = request.FILES.get('video')
        if not video_file:
            return JsonResponse({'error': 'No video file provided.'}, status=400)

        if video_file.size > 100 * 1024 * 1024:
            return JsonResponse({'error': 'Video file is too large. Maximum size is 100MB.'}, status=400)

        allowed_extensions = ['.mp4', '.webm', '.mov']
        allowed_mime_types = ['video/mp4', 'video/webm', 'video/quicktime']
        file_extension = os.path.splitext(video_file.name)[1].lower()
        if file_extension not in allowed_extensions or video_file.content_type not in allowed_mime_types:
            return JsonResponse({'error': 'Invalid video format. Supported: MP4, WebM, MOV.'}, status=400)

        question_id = request.POST.get('questionId')
        if not question_id:
            return JsonResponse({'error': 'Question ID is required.'}, status=400)

        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return JsonResponse({'error': 'Question not found.'}, status=404)

        if not _question_belongs_to(question, interview):
            return JsonResponse({'error': 'Question does not belong to this interview.'}, status=400)

        answer, created = Answer.objects.get_or_create(
            interview=interview,
            question=question,
            defaults={'candidate_video': video_file},
        )
        if not created:
            answer.candidate_video = video_file
            answer.save()

        video_path = answer.candidate_video.path
        if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
            return JsonResponse({'error': 'Video file is invalid or empty.'}, status=400)

        eval_task.delay(answer.id)
        # stays AVAILABLE (resumable) until the last question is answered
        if interview.status != Interview.Status.COMPLETED and all_questions_answered(interview):
            interview.status = Interview.Status.COMPLETED
            interview.save(update_fields=['status'])

        return JsonResponse({
            'success': True,
            'message': 'Video uploaded successfully. Evaluation started.',
            'answer_id': answer.id,
        })
    except Exception as e:
        logger.error(f'Unexpected error in upload_video: {e}', exc_info=True)
        return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)


@api_view(['POST'])
def get_interview_answers(request):
    try:
        data = JSONParser().parse(request)
        interview_id = data.get('interview_id')
        if not interview_id:
            return JsonResponse({'error': 'Interview ID is required.'}, status=400)

        interview = Interview.objects.select_related(
            'application__job_seeker', 'application__job_offer'
        ).get(id=interview_id)
        if not (_is_interview_candidate(request.user, interview) or _is_interview_recruiter(request.user, interview)):
            return JsonResponse({'error': 'Not authorized.'}, status=403)

        answers = Answer.objects.filter(interview=interview).select_related('question', 'evaluation')

        answer_data = [
            {
                'question_id': a.question.id,
                'question_text': a.question.question_text,
                'video_url': a.candidate_video.url if a.candidate_video else None,
                'transcript': a.transcript,
                'score': a.evaluation.final_score if hasattr(a, 'evaluation') else None,
            }
            for a in answers
        ]
        return JsonResponse({'interview_id': interview_id, 'answers': answer_data}, status=200)

    except Interview.DoesNotExist:
        return JsonResponse({'error': 'Interview not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
