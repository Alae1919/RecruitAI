import os
import subprocess
import logging

import spacy
import whisper
from celery import shared_task
from django.db.models import Avg

from .adapters.llm_client import get_llm

logger = logging.getLogger(__name__)

# --- spaCy ---
_spacy_model_path = os.environ.get('SPACY_MODEL_PATH', '')
try:
    nlp_model = spacy.load(_spacy_model_path) if _spacy_model_path else None
except Exception as _e:
    logger.warning(f"spaCy model not loaded: {_e}")
    nlp_model = None

# --- Whisper ---
_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            _whisper_model = whisper.load_model("small")
        except Exception as _e:
            logger.warning(f"Whisper model not loaded: {_e}")
    return _whisper_model


def extract_audio_ffmpeg(video_path):
    from django.conf import settings as django_settings
    audio_path = os.path.splitext(video_path)[0] + '.wav'
    media_root = os.path.realpath(django_settings.MEDIA_ROOT)
    if not os.path.realpath(video_path).startswith(media_root + os.sep):
        raise ValueError("Video path is outside MEDIA_ROOT.")
    command = [
        'ffmpeg', '-nostdin',
        '-i', video_path,
        '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2',
        audio_path,
    ]
    logger.info("Running ffmpeg audio extraction")
    try:
        subprocess.run(command, check=True, timeout=60)
        logger.info(f"Audio extraction successful: {audio_path}")
        return audio_path
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg failed: {e}")
        raise RuntimeError("Failed to extract audio from video.") from e


def transcribe_audio(audio_path):
    whisper_model = _get_whisper_model()
    if whisper_model is None:
        raise RuntimeError("Whisper model is not available.")
    with open(audio_path, 'rb'):  # ensures file is readable before transcribing
        result = whisper_model.transcribe(audio_path)
        return result['text']  # type: ignore


def evaluate_response(question, transcript):
    return get_llm().evaluate_answer(
        question_text=question.question_text,
        transcript=transcript,
    )


# ---------------------------------------------------------------------------
# Celery tasks
# ---------------------------------------------------------------------------

@shared_task
def generateQuestions(extracted_text, description, interview_id):
    from .models import Interview, Question
    try:
        interview = Interview.objects.get(id=interview_id)
    except Interview.DoesNotExist:
        logger.error(f"Interview not found: id={interview_id}")
        return

    questions = get_llm().generate_questions(
        cv_text=extracted_text or '',
        job_description=description,
        n=2,
    )

    if not questions:
        logger.error(f"No questions generated for interview {interview_id}")
        return

    for question_text in questions:
        if question_text and question_text.strip():
            Question.objects.create(interview=interview, question_text=question_text)
            logger.info(f"Added question to interview {interview_id}: {question_text}")
        else:
            logger.warning(f"Skipped empty question for interview {interview_id}")


@shared_task
def evaluate_answer(answer_id):
    from .models import Answer, Interview, InterviewResult
    try:
        answer = Answer.objects.select_related('interview', 'question').get(id=answer_id)
    except Answer.DoesNotExist:
        logger.error(f"Answer {answer_id} not found.")
        return

    video_path = answer.candidate_video.path

    try:
        audio_path = extract_audio_ffmpeg(video_path)
        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            logger.error("Audio extraction produced an empty file.")
            return
    except Exception as e:
        logger.error(f"Audio extraction failed for answer {answer_id}: {e}", exc_info=True)
        return

    try:
        transcript = transcribe_audio(audio_path)
        if not transcript:
            logger.error(f"Transcription returned empty for answer {answer_id}.")
            return
        answer.transcript = transcript
        answer.save(update_fields=['transcript'])
    except Exception as e:
        logger.error(f"Transcription failed for answer {answer_id}: {e}", exc_info=True)
        return

    try:
        score = evaluate_response(answer.question, transcript)
        answer.score = score
        answer.save(update_fields=['score'])
    except Exception as e:
        logger.error(f"Scoring failed for answer {answer_id}: {e}", exc_info=True)
        return

    interview = answer.interview
    total_answers = Answer.objects.filter(interview=interview).count()
    evaluated_answers = Answer.objects.filter(interview=interview).exclude(score=None).count()
    logger.info(f"Interview {interview.id}: {evaluated_answers}/{total_answers} answers evaluated")

    if total_answers == evaluated_answers:
        overall_score = Answer.objects.filter(interview=interview).aggregate(Avg('score'))['score__avg']
        interview_result, created = InterviewResult.objects.update_or_create(
            interview=interview,
            defaults={'score': overall_score},
        )
        action = "Created" if created else "Updated"
        logger.info(f"{action} InterviewResult for interview {interview.id} with score {overall_score}")

    logger.info(f"evaluate_answer completed for answer {answer_id}")
