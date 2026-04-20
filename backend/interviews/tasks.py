import json
import os
import subprocess
import logging

import spacy
import whisper
from openai import OpenAI
from celery import shared_task
from django.db.models import Avg

logger = logging.getLogger(__name__)

# --- spaCy ---
_spacy_model_path = os.environ.get('SPACY_MODEL_PATH', '')
try:
    nlp_model = spacy.load(_spacy_model_path) if _spacy_model_path else None
except Exception as _e:
    logger.warning(f"spaCy model not loaded: {_e}")
    nlp_model = None

# --- DeepSeek / OpenAI ---
client = OpenAI(
    api_key=os.environ.get('DEEPSEEK_API_KEY', ''),
    base_url="https://api.deepseek.com",
)

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


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def generate_interview_questions(cv_text, job_description, number):
    prompt = (
        f"You are a professional interviewer tasked with generating insightful technical interview questions in French. "
        f"Here is the job description: {job_description}. "
        f"Here is the candidate CV : {cv_text}. "
        f"Generate exactly {number} interview questions. Make sure each question is on a separate line and there are no empty lines."
        f"the questions must be technical and easy"
    )
    response = client.chat.completions.create(
        model="deepseek-reasoner",
        messages=[
            {"role": "system", "content": "You are an AI interview assistant fluent in French."},
            {"role": "user", "content": prompt},
        ],
        stream=False,
        temperature=0.5,
        max_tokens=1000,
        top_p=0.9,
        frequency_penalty=0.2,
        presence_penalty=0.0,
    )
    raw_questions = response.choices[0].message.content.strip()  # type: ignore
    logger.info(f"Raw LLM response: {raw_questions}")
    questions = [q.strip() for q in raw_questions.split('\n') if q.strip()]
    if len(questions) > number:
        questions = questions[:number]
    elif len(questions) < number:
        logger.warning(f"Only {len(questions)} questions generated, expected {number}.")
    return questions


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
    prompt = (
        f"Evaluate the following candidate response to the interview question below.\n"
        f"Question: {question.question_text}\n"
        f"Candidate's Answer: {transcript.lower()}\n"
        f'Return ONLY a JSON object with a single key "score" whose value is a number between 0 and 10 '
        f"(0 = completely wrong, 10 = perfect). No other text."
    )
    response = client.chat.completions.create(
        model="deepseek-reasoner",
        messages=[
            {"role": "system", "content": "You are an AI that evaluates interview responses. Always respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        stream=False,
        temperature=0.2,
        max_tokens=20,
        response_format={"type": "json_object"},
    )
    raw_response = response.choices[0].message.content.strip()  # type: ignore
    try:
        parsed = json.loads(raw_response)
        score = float(parsed["score"])
        if not (0 <= score <= 10):
            raise ValueError(f"Score out of range: {score}")
    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
        logger.error(f"Failed to parse score from LLM response '{raw_response}': {e}")
        score = 0.0
    return score


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

    questions = generate_interview_questions(extracted_text, description, 2)

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
