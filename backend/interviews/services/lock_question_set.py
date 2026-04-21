from django.utils import timezone

from interviews.models import QuestionSet
from users.models import Recruiter


def lock_question_set(*, question_set_id: int, recruiter: Recruiter) -> QuestionSet:
    from rest_framework.exceptions import PermissionDenied, ValidationError

    qs = QuestionSet.objects.select_related('job_offer__recruiter').get(id=question_set_id)
    if qs.job_offer.recruiter_id != recruiter.id:
        raise PermissionDenied('Not the owner of this question set.')
    if qs.status != QuestionSet.Status.READY:
        raise ValidationError('Only READY question sets can be locked.')

    qs.status = QuestionSet.Status.LOCKED
    qs.locked_at = timezone.now()
    qs.save(update_fields=['status', 'locked_at', 'updated_at'])
    return qs


def mark_question_set_ready(*, question_set: QuestionSet) -> None:
    question_set.status = QuestionSet.Status.READY
    question_set.save(update_fields=['status', 'updated_at'])
