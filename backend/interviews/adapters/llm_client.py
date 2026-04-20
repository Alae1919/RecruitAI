import json
import logging
import os
from typing import Protocol, runtime_checkable

from openai import OpenAI
from django.conf import settings

logger = logging.getLogger(__name__)


@runtime_checkable
class LLMClientProtocol(Protocol):
    def generate_questions(self, *, cv_text: str, job_description: str, n: int) -> list[str]: ...
    def evaluate_answer(self, *, question_text: str, transcript: str) -> float: ...


class DeepSeekClient:
    def __init__(self):
        api_key = getattr(settings, 'DEEPSEEK_API_KEY', '') or os.environ.get('DEEPSEEK_API_KEY', '')
        base_url = getattr(settings, 'DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
        timeout = getattr(settings, 'RECRUITMENT', {}).get('LLM_TIMEOUT', 60)
        self._client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout)

    def generate_questions(self, *, cv_text: str, job_description: str, n: int) -> list[str]:
        n = max(1, int(n))
        prompt = (
            f"You are a professional interviewer generating technical interview questions in French. "
            f"Job description: {job_description}. "
            f"Candidate CV: {cv_text}. "
            f"Generate exactly {n} technical, easy questions. "
            f"One question per line, no empty lines."
        )
        response = self._client.chat.completions.create(
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
        raw = response.choices[0].message.content.strip()  # type: ignore
        logger.info(f"LLM generate_questions raw response (first 200 chars): {raw[:200]}")
        questions = [q.strip() for q in raw.split('\n') if q.strip()]
        if len(questions) > n:
            questions = questions[:n]
        elif len(questions) < n:
            logger.warning(f"LLM returned {len(questions)} questions, expected {n}.")
        return questions

    def evaluate_answer(self, *, question_text: str, transcript: str) -> float:
        prompt = (
            f"Evaluate the following candidate response.\n"
            f"Question: {question_text}\n"
            f"Candidate's Answer: {transcript.lower()}\n"
            f'Return ONLY a JSON object with a single key "score" (0–10). No other text.'
        )
        response = self._client.chat.completions.create(
            model="deepseek-reasoner",
            messages=[
                {"role": "system", "content": "You evaluate interview responses. Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            stream=False,
            temperature=0.2,
            max_tokens=20,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()  # type: ignore
        try:
            parsed = json.loads(raw)
            score = float(parsed["score"])
            if not (0 <= score <= 10):
                raise ValueError(f"Score out of range: {score}")
            return score
        except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
            logger.error(f"Failed to parse LLM score from '{raw}': {e}")
            return 0.0


_llm_client: DeepSeekClient | None = None


def get_llm() -> DeepSeekClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = DeepSeekClient()
    return _llm_client
