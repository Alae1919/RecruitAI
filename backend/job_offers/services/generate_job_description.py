import logging

from interviews.adapters.llm_client import get_llm, PROMPT_VERSION

logger = logging.getLogger(__name__)


def generate_job_description(*, title: str, skills: list, experience_level: str) -> dict:
    skills_list = [s for s in (str(x).strip() for x in skills) if s]
    result = get_llm().generate_job_description(
        title=title,
        skills=skills_list,
        experience_level=experience_level,
    )
    logger.info(f'Generated job description for "{title}" ({len(result)} chars)')
    return {
        'description': result,
        'model_used': 'deepseek-reasoner',
        'prompt_version': PROMPT_VERSION,
    }
