import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def extract_cv_text(self, application_id):
    from .models import Application, CVExtractionError
    try:
        application = Application.objects.select_related('job_seeker').get(id=application_id)
    except Application.DoesNotExist:
        logger.error(f"Application {application_id} not found for CV extraction.")
        return

    if application.extracted_text:
        logger.info(f"Application {application_id} already has extracted text; skipping.")
        return

    try:
        text = application.extract_text_from_resume()
        if text:
            application.extracted_text = text
            application.save(update_fields=['extracted_text'])
            logger.info(f"CV text extracted for application {application_id}")
    except CVExtractionError as e:
        logger.error(f"CV extraction failed for application {application_id}: {e}")
