from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from interviews.models import Interview
from users.models import Recruiter


def schedule_interview(*, interview_id: int, recruiter: Recruiter, interview_date, interview_link: str = '') -> Interview:
    """Set when an (asynchronous video) interview is due and tell the candidate.

    Only the offer's recruiter may do it, only while the interview is still open, and
    the date must be in the future.
    """
    with transaction.atomic():
        interview = Interview.objects.select_related('application__job_offer').get(id=interview_id)

        if interview.application.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this job offer.')
        if interview.status != Interview.Status.AVAILABLE:
            raise ValidationError('This interview is already completed and can no longer be rescheduled.')
        if interview_date <= timezone.now():
            raise ValidationError('The interview date must be in the future.')

        interview.interview_date = interview_date
        interview.interview_link = interview_link or None
        interview.save(update_fields=['interview_date', 'interview_link'])

        def _notify():
            from applications.tasks import send_interview_scheduled_email
            send_interview_scheduled_email.delay(interview.id)

        transaction.on_commit(_notify)
    return interview
