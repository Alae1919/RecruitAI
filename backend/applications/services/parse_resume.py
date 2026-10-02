import io
import logging

import PyPDF2

from applications.models import Resume, ResumeData

logger = logging.getLogger(__name__)


def extract_text_from_file(file) -> str:
    try:
        pdf_bytes = file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        text = ''
        for page in pdf_reader.pages:
            text += page.extract_text() or ''
        return ' '.join(text.split())
    except PyPDF2.errors.PdfReadError as e:
        logger.error(f'PDF parse error: {e}')
        raise
    except Exception as e:
        logger.error(f'Unexpected error extracting resume text: {e}')
        raise


def parse_resume(resume_id: int) -> None:
    resume = Resume.objects.select_related('job_seeker__user').get(id=resume_id)

    if resume.parsing_status == Resume.ParsingStatus.READY:
        logger.info(f'Resume {resume_id} already parsed; skipping.')
        return

    try:
        resume.original_file.open('rb')
        raw_text = extract_text_from_file(resume.original_file)
        resume.original_file.close()
    except Exception as e:
        logger.error(f'Text extraction failed for resume {resume_id}: {e}')
        resume.parsing_status = Resume.ParsingStatus.FAILED
        resume.save(update_fields=['parsing_status'])
        raise

    if not raw_text or len(raw_text) < 50:
        logger.warning(f'Resume {resume_id} produced very little text ({len(raw_text)} chars) — possibly image-based PDF.')
        resume.parsing_status = Resume.ParsingStatus.FAILED
        resume.save(update_fields=['parsing_status'])
        return

    from interviews.adapters.llm_client import get_llm
    try:
        parsed = get_llm().parse_resume_data(raw_text=raw_text)
    except Exception as e:
        # do not store an empty profile and call it READY; the task retries, then marks FAILED
        logger.error(f'LLM resume parsing failed for resume {resume_id}: {e}')
        raise

    ResumeData.objects.update_or_create(
        resume=resume,
        defaults={
            'raw_text': raw_text,
            'skills': parsed['skills'],
            'experience': parsed['experience'],
            'education': parsed['education'],
            'languages': parsed['languages'],
            'summary': parsed['summary'],
        },
    )

    resume.parsing_status = Resume.ParsingStatus.READY
    resume.save(update_fields=['parsing_status'])
    logger.info(f'Resume {resume_id} parsed successfully.')
