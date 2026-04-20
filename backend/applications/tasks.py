import logging

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def send_acceptance_email(self, application_id):
    from .models import Application
    try:
        application = Application.objects.select_related(
            'job_seeker__user', 'interview'
        ).get(id=application_id)
    except Application.DoesNotExist:
        logger.error(f"Application {application_id} not found for acceptance email.")
        return

    try:
        interview = application.interview
        interview_date = interview.interview_date
        interview_link = interview.interview_link
    except Exception:
        interview_date = None
        interview_link = None

    candidate_email = application.job_seeker.user.email
    subject = "Statut de votre candidature"
    body = (
        f"Votre candidature a été acceptée, vous pouvez passer un entretien.\n\n"
        f"Détails de l'entretien :\n"
        f"Date: {interview_date}\n"
        f"Lien: {interview_link}\n"
    )
    send_mail(subject, body, settings.EMAIL_HOST_USER, [candidate_email], fail_silently=False)
    logger.info(f"Acceptance email sent to {candidate_email}")


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
