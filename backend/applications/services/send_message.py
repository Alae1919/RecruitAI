from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from applications.models import Application, CandidateMessage
from users.models import Recruiter


def send_message(*, application_id: int, recruiter: Recruiter, subject: str, body: str) -> CandidateMessage:
    """Record a message from the offer's recruiter to a candidate and email it in the background."""
    subject, body = (subject or '').strip(), (body or '').strip()
    if not subject or not body:
        raise ValidationError('A message needs a subject and a body.')

    with transaction.atomic():
        application = Application.objects.select_related('job_offer').get(id=application_id)
        if application.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this job offer.')

        message = CandidateMessage.objects.create(
            application=application, sender=recruiter, subject=subject, body=body,
        )

        def _dispatch():
            from applications.tasks import send_candidate_message_email
            send_candidate_message_email.delay(message.id)

        transaction.on_commit(_dispatch)
    return message
