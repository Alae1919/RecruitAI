import logging

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def send_acceptance_email(self, application_id: int):
    from .models import Application

    try:
        application = Application.objects.select_related('job_seeker__user').get(id=application_id)
    except Application.DoesNotExist:
        logger.error(f'Application {application_id} not found for acceptance email.')
        return

    interview_date = None
    interview_link = None
    try:
        interview = application.interview
        interview_date = interview.interview_date
        interview_link = interview.interview_link
    except Exception:
        pass

    candidate_email = application.job_seeker.user.email
    subject = 'Statut de votre candidature'
    body = (
        f'Votre candidature a été acceptée, vous pouvez passer un entretien.\n\n'
        f"Détails de l'entretien :\n"
        f'Date: {interview_date}\n'
        f'Lien: {interview_link}\n'
    )
    send_mail(subject, body, settings.EMAIL_HOST_USER, [candidate_email], fail_silently=False)
    logger.info(f'Acceptance email sent to {candidate_email}')


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def parse_resume_task(self, resume_id: int):
    from .services.parse_resume import parse_resume
    from .models import Resume

    try:
        resume = Resume.objects.get(id=resume_id)
    except Resume.DoesNotExist:
        logger.error(f'Resume {resume_id} not found.')
        return

    if resume.parsing_status == Resume.ParsingStatus.READY:
        logger.info(f'Resume {resume_id} already parsed; skipping.')
        return

    parse_resume(resume_id)


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def analyze_cv_task(self, application_id: int):
    from core.services.analyze_cv import analyze_cv

    analyze_cv(application_id)
