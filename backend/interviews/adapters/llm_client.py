import json
import logging
import os
from typing import Protocol, runtime_checkable

from openai import OpenAI
from django.conf import settings

logger = logging.getLogger(__name__)

PROMPT_VERSION = 'v2'

# deepseek-reasoner bills its hidden chain of thought against max_tokens. With the
# small budgets these tasks need, it spent all of them thinking and returned an empty
# answer (finish_reason="length"), so reasoner calls get this extra room.
REASONER_HEADROOM = 4096


class LLMResponseError(Exception):
    """The model answered, but not with a usable result (empty, truncated, malformed)."""


def _extract_json(raw: str):
    """Parse a JSON object from a model reply, tolerating ```json fences and chatter."""
    text = (raw or '').strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1] if '\n' in text else ''
        text = text.rsplit('```', 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find('{'), text.rfind('}')
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
    raise LLMResponseError(f'Reply is not valid JSON: {text[:120]!r}')


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
        self.model = getattr(settings, 'RECRUITMENT', {}).get('LLM_MODEL', 'deepseek-chat')

    @property
    def _is_reasoner(self) -> bool:
        return 'reasoner' in self.model

    def _chat(
        self, system: str, user: str, *, temperature: float = 0.5, max_tokens: int = 1000, json_mode: bool = False,
    ) -> str:
        """One completion. Never returns an empty or truncated reply: raises LLMResponseError instead."""
        kwargs = dict(
            model=self.model,
            messages=[
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
            ],
            stream=False,
            max_tokens=max_tokens + (REASONER_HEADROOM if self._is_reasoner else 0),
        )
        if not self._is_reasoner:  # the reasoner ignores/rejects sampling and JSON-mode parameters
            kwargs.update(temperature=temperature, top_p=0.9, frequency_penalty=0.2)
            if json_mode:
                kwargs['response_format'] = {'type': 'json_object'}

        response = self._client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        content = (choice.message.content or '').strip()
        if choice.finish_reason == 'length':
            raise LLMResponseError(f'Reply was cut off at max_tokens ({kwargs["max_tokens"]}).')
        if not content:
            raise LLMResponseError('The model returned an empty reply.')
        return content

    def _chat_json(self, system: str, user: str, *, temperature: float = 0.2, max_tokens: int = 800) -> dict:
        data = _extract_json(self._chat(system, user, temperature=temperature, max_tokens=max_tokens, json_mode=True))
        if not isinstance(data, dict):
            raise LLMResponseError(f'Expected a JSON object, got {type(data).__name__}.')
        return data

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
        if not questions:
            raise LLMResponseError('No questions in the reply.')
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
        if not questions:
            raise LLMResponseError('No probe questions in the reply.')
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
        parsed = self._chat_json(
            system='You evaluate interview responses. Return valid JSON only.',
            user=user_prompt,
            temperature=0.2,
            max_tokens=400,
        )
        try:
            score = float(parsed['score'])
        except (KeyError, TypeError, ValueError):
            raise LLMResponseError(f'Evaluation has no numeric score: {str(parsed)[:120]}')
        if not (0 <= score <= 10):
            raise LLMResponseError(f'Evaluation score out of range: {score}')
        return {'score': score, 'explanation': str(parsed.get('explanation', ''))}

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
        parsed = self._chat_json(
            system='You are an expert resume parser. Return valid JSON only.',
            user=user_prompt,
            temperature=0.1,
            max_tokens=1200,
        )

        def as_list(key):
            value = parsed.get(key)
            return value if isinstance(value, list) else []

        return {
            'skills': as_list('skills'),
            'experience': as_list('experience'),
            'education': as_list('education'),
            'languages': as_list('languages'),
            'summary': str(parsed.get('summary', '')),
        }

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
        parsed = self._chat_json(
            system='You are an expert recruiter. Evaluate candidate eligibility. Return valid JSON only.',
            user=user_prompt,
            temperature=0.2,
            max_tokens=800,
        )
        try:
            score = float(parsed['eligibility_score'])
        except (KeyError, TypeError, ValueError):
            raise LLMResponseError(f'CV analysis has no numeric score: {str(parsed)[:120]}')
        if not (0 <= score <= 10):
            raise LLMResponseError(f'CV analysis score out of range: {score}')
        strengths, gaps = parsed.get('strengths'), parsed.get('gaps')
        return {
            'eligibility_score': score,
            'strengths': strengths if isinstance(strengths, list) else [],
            'gaps': gaps if isinstance(gaps, list) else [],
            'recommendation': str(parsed.get('recommendation', '')),
        }


_llm_client: DeepSeekClient | None = None


def get_llm() -> DeepSeekClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = DeepSeekClient()
    return _llm_client
