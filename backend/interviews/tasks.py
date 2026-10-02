import contextlib
import logging
import os
import subprocess
import tempfile

import whisper
from celery import shared_task
from django.db.models import Avg

from .adapters.llm_client import PROMPT_VERSION, get_llm
from .language import whisper_language_for

logger = logging.getLogger(__name__)

_whisper_model = None


@contextlib.contextmanager
def _model_load_lock():
    """Serialise model loading across the worker's processes: the first one downloads the
    ~244 MB model, the others then read it from the cache instead of racing the download."""
    try:
        import fcntl
    except ImportError:  # not available on Windows; loading is then simply unserialised
        yield
        return
    with open(os.path.join(tempfile.gettempdir(), 'recrutai-whisper-load.lock'), 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        with _model_load_lock():
            _whisper_model = whisper.load_model('small')  # errors propagate so the task log shows why
    return _whisper_model


def extract_audio_ffmpeg(video_path: str) -> str:
    from django.conf import settings as django_settings

    audio_path = os.path.splitext(video_path)[0] + '.wav'
    media_root = os.path.realpath(django_settings.MEDIA_ROOT)
    if not os.path.realpath(video_path).startswith(media_root + os.sep):
        raise ValueError('Video path is outside MEDIA_ROOT.')
    command = [
        'ffmpeg', '-nostdin',
        '-i', video_path,
        '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2',
        audio_path,
    ]
    try:
        subprocess.run(command, check=True, timeout=60)
        return audio_path
    except subprocess.CalledProcessError as e:
        raise RuntimeError('Failed to extract audio from video.') from e


def transcribe_audio(audio_path: str, language: str | None = None) -> str:
    """Transcribe an audio file. `language` ('fr', 'en', ...) skips Whisper's unreliable auto-detection."""
    result = _get_whisper_model().transcribe(audio_path, language=language or None, fp16=False)
    return result['text']  # type: ignore


# ---------------------------------------------------------------------------
# QuestionSet tasks
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def generate_question_set_task(self, question_set_id: int):
    from .models import QuestionSet, Question

    try:
        qs = QuestionSet.objects.select_related('job_offer').get(id=question_set_id)
    except QuestionSet.DoesNotExist:
        logger.error(f'QuestionSet {question_set_id} not found.')
        return

    if qs.status not in (QuestionSet.Status.DRAFT, QuestionSet.Status.FAILED):
        logger.info(f'QuestionSet {question_set_id} is already {qs.status}; skipping.')
        return

    if Question.objects.filter(question_set=qs).exists():
        logger.info(f'QuestionSet {question_set_id} already has questions; marking READY.')
        qs.status = QuestionSet.Status.READY
        qs.save(update_fields=['status', 'updated_at'])
        return

    job_offer = qs.job_offer
    job_offer_snapshot = {
        'title': job_offer.title,
        'description': job_offer.description,
        'requirements': job_offer.requirements or '',
        'skills': job_offer.skills if isinstance(job_offer.skills, list) else [],
    }

    try:
        questions = get_llm().generate_question_set(
            job_offer_snapshot=job_offer_snapshot,
            instructions=qs.recruiter_instructions,
            count=qs.target_count,
            question_type=qs.question_type,
        )
    except Exception as e:
        logger.error(f'LLM call failed for QuestionSet {question_set_id}: {e}')
        qs.status = QuestionSet.Status.FAILED
        qs.save(update_fields=['status', 'updated_at'])
        raise

    if not questions:
        logger.error(f'No questions generated for QuestionSet {question_set_id}')
        qs.status = QuestionSet.Status.FAILED
        qs.save(update_fields=['status', 'updated_at'])
        return

    Question.objects.bulk_create([
        Question(question_set=qs, source=Question.Source.BASE, order=i, question_text=q)
        for i, q in enumerate(questions) if q and q.strip()
    ])

    qs.status = QuestionSet.Status.READY
    qs.model_used = get_llm().model
    qs.prompt_version = PROMPT_VERSION
    qs.save(update_fields=['status', 'model_used', 'prompt_version', 'updated_at'])
    logger.info(f'QuestionSet {question_set_id} ready with {len(questions)} questions.')


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def generate_probe_questions_task(self, interview_id: int):
    from .models import Interview, Question

    try:
        interview = Interview.objects.select_related(
            'application__resume__parsed',
            'application__job_offer',
            'question_set',
        ).get(id=interview_id)
    except Interview.DoesNotExist:
        logger.error(f'Interview {interview_id} not found.')
        return

    if Question.objects.filter(interview=interview, source=Question.Source.PROBE).exists():
        logger.info(f'Probe questions already exist for interview {interview_id}; skipping.')
        return

    job_offer = interview.application.job_offer
    job_offer_snapshot = {
        'title': job_offer.title,
        'description': job_offer.description,
        'requirements': job_offer.requirements or '',
    }

    cv_data: dict = {}
    try:
        if interview.application.resume:
            parsed = interview.application.resume.parsed
            cv_data = {
                'skills': parsed.skills,
                'experience': parsed.experience,
                'summary': parsed.summary,
            }
    except Exception:
        logger.warning(f'Could not load ResumeData for interview {interview_id}; using empty cv_data.')

    base_questions = list(
        Question.objects.filter(question_set=interview.question_set)
        .values_list('question_text', flat=True)
        .order_by('order')
    ) if interview.question_set else []

    from django.conf import settings as django_settings
    n = getattr(django_settings, 'RECRUITMENT', {}).get('PROBE_QUESTION_COUNT', 2)

    try:
        probe_texts = get_llm().generate_probe_questions(
            cv_data=cv_data,
            job_offer_snapshot=job_offer_snapshot,
            base_questions=base_questions,
            n=n,
        )
    except Exception as e:
        logger.error(f'Probe generation failed for interview {interview_id}: {e}')
        raise

    if probe_texts:
        Question.objects.bulk_create([
            Question(interview=interview, source=Question.Source.PROBE, order=i, question_text=q)
            for i, q in enumerate(probe_texts) if q and q.strip()
        ])
        logger.info(f'Created {len(probe_texts)} probe questions for interview {interview_id}.')
    else:
        logger.warning(f'No probe questions generated for interview {interview_id}.')


# ---------------------------------------------------------------------------
# Evaluation task
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def evaluate_answer(self, answer_id: int):
    from .models import Answer, AnswerEvaluation
    from .services.create_evaluation import create_answer_evaluation

    try:
        answer = Answer.objects.select_related('interview', 'question').get(id=answer_id)
    except Answer.DoesNotExist:
        logger.error(f'Answer {answer_id} not found.')
        return

    if AnswerEvaluation.objects.filter(answer=answer).exists():
        logger.info(f'Answer {answer_id} already evaluated; skipping.')
        return

    video_path = answer.candidate_video.path

    try:
        audio_path = extract_audio_ffmpeg(video_path)
        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            raise RuntimeError('Audio extraction produced an empty file.')
    except Exception as e:
        logger.error(f'Audio extraction failed for answer {answer_id}: {e}', exc_info=True)
        answer.evaluation_error = f'Audio extraction: {e}'
        answer.save(update_fields=['evaluation_error'])
        raise

    try:
        transcript = transcribe_audio(audio_path, language=whisper_language_for(answer.question.question_text))
        if not transcript:
            raise RuntimeError('Transcription returned empty.')
        answer.transcript = transcript
        answer.save(update_fields=['transcript'])
    except Exception as e:
        logger.error(f'Transcription failed for answer {answer_id}: {e}', exc_info=True)
        answer.evaluation_error = f'Transcription: {e}'
        answer.save(update_fields=['evaluation_error'])
        raise

    try:
        result = get_llm().evaluate_answer_with_reasoning(
            question_text=answer.question.question_text,
            transcript=transcript,
        )
        create_answer_evaluation(
            answer=answer,
            score=result['score'],
            explanation=result['explanation'],
            model_used=get_llm().model,
            prompt_version=PROMPT_VERSION,
        )
    except Exception as e:
        logger.error(f'Scoring/evaluation failed for answer {answer_id}: {e}', exc_info=True)
        answer.evaluation_error = f'Scoring: {e}'
        answer.save(update_fields=['evaluation_error'])
        raise

    logger.info(f'evaluate_answer completed for answer {answer_id}')
