import logging

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_candidate_email(subject: str, body: str, to_email: str) -> bool:
    """Send one email to a candidate. Demo accounts (seed_demo) are skipped and only logged."""
    if to_email.lower().endswith(settings.DEMO_EMAIL_DOMAIN):
        logger.info(f'Skipping email to demo account {to_email}: {subject!r}')
        return False
    send_mail(subject, body, settings.EMAIL_HOST_USER, [to_email], fail_silently=False)
    return True


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def send_interview_scheduled_email(self, interview_id: int):
    from interviews.models import Interview

    try:
        interview = Interview.objects.select_related(
            'application__job_seeker__user', 'application__job_offer'
        ).get(id=interview_id)
    except Interview.DoesNotExist:
        logger.error(f'Interview {interview_id} not found for scheduling email.')
        return

    when = interview.interview_date.strftime('%d/%m/%Y à %H:%M UTC') if interview.interview_date else 'à définir'
    lines = [
        f"Votre entretien pour le poste « {interview.application.job_offer.title} » est à passer avant le {when}.",
    ]
    if interview.interview_link:
        lines.append(f'Lien : {interview.interview_link}')
    lines += ['', 'Connectez-vous à votre espace candidat, rubrique Entretiens, pour répondre aux questions en vidéo.']
    body = '\n'.join(lines)
    send_candidate_email('Entretien planifié', body, interview.application.job_seeker.user.email)


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def send_candidate_message_email(self, message_id: int):
    from .models import CandidateMessage

    try:
        message = CandidateMessage.objects.select_related(
            'application__job_seeker__user', 'application__job_offer', 'sender__user'
        ).get(id=message_id)
    except CandidateMessage.DoesNotExist:
        logger.error(f'CandidateMessage {message_id} not found.')
        return

    sender = message.sender
    signature = f"{sender.user.get_full_name() or sender.user.email}, {sender.company_name}"
    body = (
        f"{message.body}\n\n--\n{signature}\n"
        f"Concernant votre candidature : {message.application.job_offer.title}"
    )
    delivered = send_candidate_email(message.subject, body, message.application.job_seeker.user.email)
    if delivered != message.email_sent:
        message.email_sent = delivered
        message.save(update_fields=['email_sent'])


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
    if send_candidate_email(subject, body, candidate_email):
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

    try:
        parse_resume(resume_id)
    except Exception:
        if self.request.retries >= self.max_retries:
            Resume.objects.filter(id=resume_id).update(parsing_status=Resume.ParsingStatus.FAILED)
        raise


@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def analyze_cv_task(self, application_id: int):
    from core.services.analyze_cv import analyze_cv

    analyze_cv(application_id)
