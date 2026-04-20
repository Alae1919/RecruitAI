import json
import re
import subprocess
from rest_framework import status,generics,permissions
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import spacy
from .models import Interview, Question, Answer, InterviewResult
from job_offers.models import JobOffer
from applications.models import Application
from .serializers import InterviewSerializer, InterviewQuestionSerializer,RecruiterInterviewSerializer
import os
from django.http import JsonResponse
import logging
import wave
from openai import OpenAI
import time
from vosk import Model, KaldiRecognizer
import whisper
from celery import shared_task
from django.db.models import Avg


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

_spacy_model_path = os.environ.get('SPACY_MODEL_PATH', '')
try:
    nlp_model = spacy.load(_spacy_model_path) if _spacy_model_path else None
except Exception as _e:
    logger.warning(f"spaCy model not loaded: {_e}")
    nlp_model = None

_deepseek_api_key = os.environ.get('DEEPSEEK_API_KEY', '')
client = OpenAI(api_key=_deepseek_api_key, base_url="https://api.deepseek.com")

_whisper_model = None

def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            _whisper_model = whisper.load_model("small")
        except Exception as _e:
            logger.warning(f"Whisper model not loaded: {_e}")
    return _whisper_model

def extract_skills(text):
    doc = nlp_model(text)
    skills = list(set(ent.text for ent in doc.ents))
    logger.info(f'Extracted skills: {skills}')
    return ', '.join(skills)



def generate_interview_questions(skills, job_description, number):
    prompt = (
        f"You are a professional interviewer tasked with generating insightful technical interview questions in French. "
        #f"The role we are hiring for requires a deep understanding of the following skills: {skills}. "
        f"Here is the job description: {job_description}. "
        f"Here is the candidate CV : {skills}. "
        f"Generate exactly {number} interview questions. Make sure each question is on a separate line and there are no empty lines."
        #f"Half the questions must be technical, and not very hard. the other half must be RH questions "
        f"the questions must be technical and easy"
    )

    response = client.chat.completions.create(
        model="deepseek-reasoner",
        messages=[
            {"role": "system", "content": "You are an AI interview assistant fluent in French."},
            {"role": "user", "content": prompt}
        ],
        stream=False,
        temperature=0.5,
        max_tokens=1000,
        top_p=0.9,
        frequency_penalty=0.2,
        presence_penalty=0.0
    )

    raw_questions = response.choices[0].message.content.strip()  # type: ignore
    logger.info(f"Raw OpenAI API Response: {raw_questions}")

    # Split and clean questions
    questions = [q.strip() for q in raw_questions.split('\n') if q.strip()]

    # Vérification du nombre de questions générées
    if len(questions) > number:
        questions = questions[:number]
    elif len(questions) < number:
        logger.warning(f"Attention : seulement {len(questions)} questions générées, moins que le nombre demandé ({number}).")

    return questions

def extract_audio_ffmpeg(video_path):
    """Extrait l'audio d'une vidéo avec FFmpeg."""
    try:
        # Générer le chemin du fichier audio
        audio_path = os.path.splitext(video_path)[0] + '.wav'
        
        # Commande FFmpeg pour extraire l'audio
        from django.conf import settings as django_settings
        media_root = os.path.realpath(django_settings.MEDIA_ROOT)
        if not os.path.realpath(video_path).startswith(media_root + os.sep):
            raise ValueError("Video path is outside MEDIA_ROOT.")

        command = [
            'ffmpeg',
            '-nostdin',
            '-i', video_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            audio_path,
        ]

        logger.info(f"Running ffmpeg command: ffmpeg -nostdin -i <video> -vn ... <audio>")
        subprocess.run(command, check=True, timeout=60)
        logger.info(f"Audio extraction successful: {audio_path}")
        return audio_path
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to extract audio using FFmpeg: {e}")
        raise Exception("Failed to extract audio from video.")
    except Exception as e:
        logger.error(f"Unexpected error in extract_audio_ffmpeg: {e}")
        raise


def clean_transcript(transcript):
    fillers = ["hum", "et", "ah", "oh", "euh"]
    words = transcript.split()
    cleaned_words = [word for word in words if word.lower() not in fillers]
    return ' '.join(cleaned_words)

def transcribe_audio_whisper(audio_path):
    whisper_model = _get_whisper_model()
    if whisper_model is None:
        raise RuntimeError("Whisper model is not available.")
    with open(audio_path, 'rb') as audio_file:  # noqa: F841 — ensures file is readable before transcribing
        transcript = whisper_model.transcribe(audio_path)
        return transcript['text']  # type: ignore

def transcribe_audio(audio_path):
    try:
        return transcribe_audio_whisper(audio_path)
    except Exception as e:
        logger.error(f"Vosk transcription failed: {e}")
        logger.info("Attempting transcription with Whisper API...")
        raise

def evaluate_response(question, transcript):
    actual_answer = transcript.lower()
    prompt = (
        f"Evaluate the following candidate response to the interview question below.\n"
        f"Question: {question.question_text}\n"
        f"Candidate's Answer: {actual_answer}\n"
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
        logger.error(f"Failed to parse structured score from LLM response '{raw_response}': {e}")
        score = 0.0
    return score
    #total_score += score

    # Average score across all questions
    #average_score = total_score / number_of_questions if number_of_questions > 0 else 0
    #percentage_score = average_score * 10
    #return round(percentage_score)

@api_view(['GET'])
def get_interview_result(request, interview_id):
    logger.info(f"Received interview ID: {interview_id}")
    try:
        interview = Interview.objects.get(id=interview_id)
        logger.info(f"Interview found: {interview}")

        # Ensure InterviewResult exists
        if not InterviewResult.objects.filter(interview=interview).exists():
            logger.error(f"InterviewResult for Interview ID {interview_id} not found.")
            return Response({'error': 'Interview result not found.'}, status=404)

        interview_result = InterviewResult.objects.get(interview=interview)

        data = {
            'name': interview.application.candidate.first_name,
            'email': interview.application.candidate.email,
            'date': interview.application.applied_at.strftime('%d %b %Y'),
            'score': interview_result.score,
        }

        logger.info(f"Fetched interview result for Interview ID {interview_id}: {data}")
        return Response(data, status=200)

    except Interview.DoesNotExist:
        logger.error(f"Interview ID {interview_id} not found.")
        return Response({'error': 'Interview not found.'}, status=404)

    except InterviewResult.DoesNotExist:
        logger.error(f"InterviewResult for Interview ID {interview_id} not found.")
        return Response({'error': 'Interview result not found.'}, status=404)

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return Response({'error': str(e)}, status=500)

@shared_task
def generateQuestions(extracted_text, description,interview_id):

    try:
        interview = Interview.objects.get(id=interview_id)
    except Interview.DoesNotExist:
        logger.error(f"Interview not found : id_{interview.id}")
        return
    #skills = extract_skills(extracted_text)
    questions = generate_interview_questions(extracted_text, description, 2)

    if not questions or len(questions) == 0:
        logger.error(f"No questions generated for interview {interview.id}")# type: ignore
        return Response({'error': 'No questions generated.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    for question_text in questions:
        if question_text and question_text.strip():  # Vérification pour s'assurer que la question n'est pas vide
                Question.objects.create(interview=interview, question_text=question_text)
                logger.info(f"Added question to interview {interview.id}: {question_text}")# type: ignore
        else:
            logger.warning(f"Skipped empty or duplicate question for interview {interview.id}")# type: ignore



class InterviewQuestionsAPI(APIView):
    throttle_scope = 'llm'

    def post(self, request):
        # Récupérer l'ID de l'entretien depuis le corps de la requête
        interview_id = request.data.get('interview_id')
        
        if not interview_id:
            return Response({"error": "interview_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Récupérer l'entretien
            interview = Interview.objects.get(id=interview_id)
            
            # Récupérer toutes les questions associées à cet entretien
            questions = Question.objects.filter(interview=interview)
            
            # Sérialiser les questions
            serializer = InterviewQuestionSerializer(questions, many=True)
            
            # Retourner les données sérialisées
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Interview.DoesNotExist:
            return Response({"error": "Interview not found."}, status=status.HTTP_404_NOT_FOUND)
class JobSeekerInterviewListAPI(generics.ListAPIView):
    #authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterviewSerializer

    def get_queryset(self):
        # Récupère le job seeker connecté via le token
        job_seeker = self.request.user.jobseeker
        
        # Récupère toutes les applications du candidat
        applications = Application.objects.filter(job_seeker=job_seeker)
        
        # Récupère tous les entretiens liés à ces applications
        return Interview.objects.filter(application__in=applications).prefetch_related('interviewresult')


class RecruiterInterviewListAPI(generics.ListAPIView):

    #authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecruiterInterviewSerializer

    def get_queryset(self):
        # Récupère les offres du recruteur connecté
        recruiter_offers = JobOffer.objects.filter(recruiter=self.request.user.recruiter)
        
        # Récupère tous les entretiens liés à ces offres
        return Interview.objects.filter(
            application__job_offer__in=recruiter_offers
        ).select_related(
            'application__job_seeker__user',
            'application__job_offer'
        ).prefetch_related('interviewresult')


@shared_task
def evaluate_answer(answer_id):
    try:
        # Fetch the answer
        try:
            answer = Answer.objects.get(id=answer_id)
        except Answer.DoesNotExist:
            logger.error(f"Answer with ID {answer_id} not found.")
            return

        video_path = answer.candidate_video.path

        # Extract audio from the video
        try:
            audio_path = extract_audio_ffmpeg(video_path)
            if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
                logger.error("Failed to extract audio from the video.")
                return
        except Exception as e:
            logger.error(f"Failed to extract audio: {e}", exc_info=True)
            return

        # Transcribe the audio
        try:
            transcript = transcribe_audio(audio_path)
            if not transcript:
                logger.error("Failed to transcribe audio.")
                return
            answer.transcript = transcript
            answer.save()
        except Exception as e:
            logger.error(f"Failed to transcribe audio: {e}", exc_info=True)
            return

        # Evaluate the response
        try:
            score = evaluate_response(answer.question, transcript)
            answer.score = score
            answer.save()
            #InterviewResult.objects.create(interview=answer.interview, score=score)
        except Exception as e:
            logger.error(f"Failed to evaluate response: {e}", exc_info=True)
            return

        interview = answer.interview
        total_answers = Answer.objects.filter(interview=interview).count()
        logger.info(f"total answers for interview {interview}. : {total_answers}")
        evaluated_answers = Answer.objects.filter(interview=interview).exclude(score=None).count()
        logger.info(f"total evaluated answers for interview . : {evaluated_answers}")

        if total_answers == evaluated_answers:
            overall_score = Answer.objects.filter(interview=interview).aggregate(Avg('score'))['score__avg']
            interview.status='evaluated'
            interview.save()
            # Save the overall interview score
            interview_result, created = InterviewResult.objects.update_or_create(
                interview=interview,
                defaults={'score': overall_score}
            )
            if created:
                logger.info(f"New interview result created with score: {overall_score}")
            else:
                logger.info(f"Updated interview result with new score: {overall_score}")

        logger.info(f"Evaluation completed for answer ID {answer_id}. Score: {score}")
    except Exception as e:
        logger.error(f"Unexpected error in evaluate_answer task: {e}", exc_info=True)

@api_view(['POST'])
def upload_video(request):
    try:
        # Validate interview_id
        try:
            interview_id = request.POST.get('interviewId')
        except ValueError:
            return JsonResponse({'error': 'Invalid interview ID.'}, status=400)

        # Fetch the interview
        try:
            interview = Interview.objects.get(id=interview_id)
        except Interview.DoesNotExist:
            return JsonResponse({'error': 'Interview not found.'}, status=404)

        # Validate video file
        video_file = request.FILES.get('video')
        if not video_file:
            return JsonResponse({'error': 'No video file provided.'}, status=400)

        # Check file size (e.g., limit to 100MB)
        if video_file.size > 100 * 1024 * 1024:  # 100MB
            return JsonResponse({'error': 'Video file is too large. Maximum size is 100MB.'}, status=400)

        # Check file extension and MIME type
        allowed_extensions = ['.mp4', '.webm', '.mov']
        allowed_mime_types = ['video/mp4', 'video/webm', 'video/quicktime']
        file_extension = os.path.splitext(video_file.name)[1].lower()
        if file_extension not in allowed_extensions or video_file.content_type not in allowed_mime_types:
            return JsonResponse({'error': 'Invalid video file format. Supported formats: MP4, WebM, MOV.'}, status=400)

        # Fetch the question (assuming question_id is passed in the request)
        question_id = request.POST.get('questionId')
        if not question_id:
            return JsonResponse({'error': 'Question ID is required.'}, status=400)

        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return JsonResponse({'error': 'Question not found.'}, status=404)

        # Save the video file to the Answer model
        try:
            answer, created = Answer.objects.get_or_create(
                interview=interview,
                question=question,
                defaults={'candidate_video': video_file}
            )

            if not created:
                answer.candidate_video = video_file
                answer.save()

            video_path = answer.candidate_video.path

            logger.info(f"Video saved to: {video_path}")

            # Check if the video file is valid
            if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
                return JsonResponse({'error': 'Video file is invalid or empty.'}, status=400)

            # Trigger the background task for evaluation
            evaluate_answer.delay(answer.id)
            try:
                interview.status = Interview.Status.COMPLETED
                interview.save()
            
            except Exception as e:
                logger.error(f"Failed to change status: {e}", exc_info=True)
            # Return success response
            return JsonResponse({
                'success': True,
                'message': 'Video uploaded successfully. Evaluation started.',
                'answer_id': answer.id,
            })
        except Exception as e:
            logger.error(f"Failed to save video: {e}", exc_info=True)
            return JsonResponse({'error': 'Failed to save video.'}, status=500)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

@api_view(['POST'])
def get_interview_answers(request):

    try:
        data = JSONParser().parse(request)
        interview_id = data.get("interview_id")

        if not interview_id:
            return JsonResponse({"error": "Interview ID is required."}, status=400)

        interview = Interview.objects.get(id=interview_id)
        answers = Answer.objects.filter(interview=interview,
                    question__interview=interview).select_related('question')

        answer_data = [
            {
                "question_id": answer.question.id,
                "question_text": answer.question.question_text,
                "video_url": answer.candidate_video.url if answer.candidate_video else None,
                "transcript": answer.transcript
            }
            for answer in answers
        ]

        return JsonResponse({"interview_id": interview_id, "answers": answer_data}, status=200)
    
    except Interview.DoesNotExist:
        return JsonResponse({"error": "Interview not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



