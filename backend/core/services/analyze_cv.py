import logging

from core.models import CVAnalysis
from applications.models import Application
from interviews.adapters.llm_client import PROMPT_VERSION, get_llm

logger = logging.getLogger(__name__)


def analyze_cv(application_id: int) -> CVAnalysis | None:
    application = Application.objects.select_related(
        'resume__parsed', 'job_offer'
    ).get(id=application_id)

    if CVAnalysis.objects.filter(application=application).exists():
        logger.info(f'CVAnalysis already exists for application {application_id}; skipping.')
        return CVAnalysis.objects.get(application=application)

    raw_text = ''
    if application.resume:
        try:
            raw_text = application.resume.parsed.raw_text
        except Exception:
            pass

    if not raw_text:
        logger.warning(f'No resume text for application {application_id}; skipping CV analysis.')
        return None

    job_offer = application.job_offer
    try:
        result = get_llm().analyze_cv(
            raw_text=raw_text,
            job_description=job_offer.description,
            requirements=job_offer.requirements or '',
        )
    except Exception as e:
        logger.error(f'CV analysis LLM call failed for application {application_id}: {e}')
        return None

    cv_analysis = CVAnalysis.objects.create(
        application=application,
        eligibility_score=result['eligibility_score'],
        analysis_details={
            'strengths': result['strengths'],
            'gaps': result['gaps'],
            'recommendation': result['recommendation'],
        },
        model_used='deepseek-reasoner',
        prompt_version=PROMPT_VERSION,
    )
    logger.info(f'CVAnalysis created for application {application_id}: score={result["eligibility_score"]}')
    return cv_analysis
