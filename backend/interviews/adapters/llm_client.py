import json
import logging
import os
from typing import Protocol, runtime_checkable

from openai import OpenAI
from django.conf import settings

logger = logging.getLogger(__name__)

PROMPT_VERSION = 'v2'


@runtime_checkable
class LLMClientProtocol(Protocol):
    def generate_question_set(
        self, *, job_offer_snapshot: dict, instructions: str, count: int, question_type: str
    ) -> list[str]: ...

    def generate_probe_questions(
        self, *, cv_data: dict, job_offer_snapshot: dict, base_questions: list[str], n: int
    ) -> list[str]: ...

    def generate_job_description(
        self, *, title: str, skills: list[str], experience_level: str
    ) -> str: ...

    def evaluate_answer_with_reasoning(
        self, *, question_text: str, transcript: str
    ) -> dict: ...

    def parse_resume_data(self, *, raw_text: str) -> dict: ...

    def analyze_cv(self, *, raw_text: str, job_description: str, requirements: str) -> dict: ...


class DeepSeekClient:
    def __init__(self):
        api_key = getattr(settings, 'DEEPSEEK_API_KEY', '') or os.environ.get('DEEPSEEK_API_KEY', '')
        base_url = getattr(settings, 'DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
        timeout = getattr(settings, 'RECRUITMENT', {}).get('LLM_TIMEOUT', 60)
        self._client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout)

    def _chat(self, system: str, user: str, *, temperature: float = 0.5, max_tokens: int = 1000,
              json_mode: bool = False) -> str:
        kwargs: dict = dict(
            model='deepseek-reasoner',
            messages=[
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
            ],
            stream=False,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=0.9,
            frequency_penalty=0.2,
        )
        if json_mode:
            kwargs['response_format'] = {'type': 'json_object'}
        response = self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content.strip()  # type: ignore

    def generate_question_set(
        self, *, job_offer_snapshot: dict, instructions: str, count: int, question_type: str
    ) -> list[str]:
        count = max(1, int(count))
        extra = f"\nAdditional recruiter instructions: {instructions}" if instructions else ''
        user_prompt = (
            f"Job title: {job_offer_snapshot.get('title', '')}\n"
            f"Description: {job_offer_snapshot.get('description', '')}\n"
            f"Requirements: {job_offer_snapshot.get('requirements', '')}\n"
            f"Skills required: {', '.join(job_offer_snapshot.get('skills', []))}\n"
            f"Question type: {question_type}\n"
            f"Generate exactly {count} {question_type} interview questions in French. "
            f"One question per line, no numbering, no empty lines.{extra}"
        )
        raw = self._chat(
            system='You are an expert technical interviewer. Generate clear, relevant interview questions in French.',
            user=user_prompt,
            temperature=0.6,
            max_tokens=1200,
        )
        logger.info(f'generate_question_set raw (first 200): {raw[:200]}')
        questions = [q.strip() for q in raw.split('\n') if q.strip()]
        if len(questions) > count:
            questions = questions[:count]
        elif len(questions) < count:
            logger.warning(f'LLM returned {len(questions)} questions, expected {count}')
        return questions

    def generate_probe_questions(
        self, *, cv_data: dict, job_offer_snapshot: dict, base_questions: list[str], n: int
    ) -> list[str]:
        n = max(1, int(n))
        base_list = '\n'.join(f'- {q}' for q in base_questions[:10])
        skills = cv_data.get('skills', [])
        experience = cv_data.get('experience', [])
        user_prompt = (
            f"Candidate skills: {', '.join(skills) if skills else 'unknown'}\n"
            f"Candidate experience: {json.dumps(experience[:3]) if experience else 'unknown'}\n"
            f"Job: {job_offer_snapshot.get('title', '')}\n"
            f"Base questions already asked:\n{base_list}\n\n"
            f"Generate exactly {n} personalised follow-up probe questions in French based on "
            f"the candidate's background. One question per line, no numbering."
        )
        raw = self._chat(
            system='You are an expert technical interviewer. Generate personalised probe questions in French.',
            user=user_prompt,
            temperature=0.7,
            max_tokens=400,
        )
        logger.info(f'generate_probe_questions raw (first 200): {raw[:200]}')
        questions = [q.strip() for q in raw.split('\n') if q.strip()]
        return questions[:n]

    def generate_job_description(
        self, *, title: str, skills: list[str], experience_level: str
    ) -> str:
        user_prompt = (
            f"Job title: {title}\n"
            f"Required skills: {', '.join(skills)}\n"
            f"Experience level: {experience_level}\n\n"
            f"Write a professional job description in French (300–500 words). "
            f"Include: role summary, responsibilities, requirements, and benefits."
        )
        return self._chat(
            system='You are an expert HR writer. Write compelling, professional job descriptions in French.',
            user=user_prompt,
            temperature=0.7,
            max_tokens=800,
        )

    def evaluate_answer_with_reasoning(
        self, *, question_text: str, transcript: str
    ) -> dict:
        user_prompt = (
            f'Question: {question_text}\n'
            f"Candidate's answer: {transcript.lower()}\n\n"
            f'Evaluate the answer and return ONLY a JSON object with keys:\n'
            f'  "score": number 0-10\n'
            f'  "explanation": string (2-4 sentences in French explaining the score)\n'
            f'No other text.'
        )
        raw = self._chat(
            system='You evaluate interview responses. Return valid JSON only.',
            user=user_prompt,
            temperature=0.2,
            max_tokens=300,
            json_mode=True,
        )
        try:
            parsed = json.loads(raw)
            score = float(parsed['score'])
            if not (0 <= score <= 10):
                raise ValueError(f'Score out of range: {score}')
            explanation = str(parsed.get('explanation', ''))
            return {'score': score, 'explanation': explanation}
        except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
            logger.error(f"Failed to parse LLM evaluation from '{raw[:100]}': {e}")
            return {'score': 0.0, 'explanation': ''}

    def parse_resume_data(self, *, raw_text: str) -> dict:
        user_prompt = (
            f'Parse the following resume text and return ONLY a JSON object with keys:\n'
            f'  "skills": list of strings (technical and soft skills)\n'
            f'  "experience": list of objects with keys role, company, years (e.g. 2)\n'
            f'  "education": list of objects with keys degree, institution, year\n'
            f'  "languages": list of strings\n'
            f'  "summary": string (2-3 sentences about the candidate)\n\n'
            f'Resume text:\n{raw_text[:4000]}'
        )
        raw = self._chat(
            system='You are an expert resume parser. Return valid JSON only.',
            user=user_prompt,
            temperature=0.1,
            max_tokens=800,
            json_mode=True,
        )
        try:
            parsed = json.loads(raw)
            return {
                'skills': parsed.get('skills', []),
                'experience': parsed.get('experience', []),
                'education': parsed.get('education', []),
                'languages': parsed.get('languages', []),
                'summary': str(parsed.get('summary', '')),
            }
        except (json.JSONDecodeError, TypeError) as e:
            logger.error(f"Failed to parse resume data: {e}")
            return {'skills': [], 'experience': [], 'education': [], 'languages': [], 'summary': ''}

    def analyze_cv(self, *, raw_text: str, job_description: str, requirements: str) -> dict:
        user_prompt = (
            f'Job description: {job_description}\n'
            f'Requirements: {requirements}\n\n'
            f'Candidate CV:\n{raw_text[:3000]}\n\n'
            f'Analyse the candidate eligibility and return ONLY a JSON object with keys:\n'
            f'  "eligibility_score": number 0-10\n'
            f'  "strengths": list of strings\n'
            f'  "gaps": list of strings\n'
            f'  "recommendation": string (1-2 sentences in French)\n'
        )
        raw = self._chat(
            system='You are an expert recruiter. Evaluate candidate eligibility. Return valid JSON only.',
            user=user_prompt,
            temperature=0.2,
            max_tokens=500,
            json_mode=True,
        )
        try:
            parsed = json.loads(raw)
            score = float(parsed.get('eligibility_score', 0))
            if not (0 <= score <= 10):
                score = 0.0
            return {
                'eligibility_score': score,
                'strengths': parsed.get('strengths', []),
                'gaps': parsed.get('gaps', []),
                'recommendation': str(parsed.get('recommendation', '')),
            }
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            logger.error(f"Failed to parse CV analysis: {e}")
            return {'eligibility_score': 0.0, 'strengths': [], 'gaps': [], 'recommendation': ''}


_llm_client: DeepSeekClient | None = None


def get_llm() -> DeepSeekClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = DeepSeekClient()
    return _llm_client
