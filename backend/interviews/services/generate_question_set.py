from django.db import transaction

from interviews.models import QuestionSet
from job_offers.models import JobOffer
from users.models import Recruiter


def generate_question_set(
    *,
    job_offer_id: int,
    recruiter: Recruiter,
    question_type: str = QuestionSet.QuestionType.TECHNICAL,
    target_count: int = 5,
    recruiter_instructions: str = '',
) -> QuestionSet:
    from rest_framework.exceptions import PermissionDenied

    job_offer = JobOffer.objects.select_related('recruiter').get(id=job_offer_id)
    if job_offer.recruiter_id != recruiter.id:
        raise PermissionDenied('Not the owner of this job offer.')

    with transaction.atomic():
        last_version = (
            QuestionSet.objects.filter(job_offer=job_offer)
            .order_by('-version')
            .values_list('version', flat=True)
            .first()
        )
        version = (last_version or 0) + 1

        qs = QuestionSet.objects.create(
            job_offer=job_offer,
            version=version,
            status=QuestionSet.Status.DRAFT,
            question_type=question_type,
            target_count=target_count,
            recruiter_instructions=recruiter_instructions,
        )

        def _dispatch():
            from interviews.tasks import generate_question_set_task
            result = generate_question_set_task.delay(qs.id)
            QuestionSet.objects.filter(id=qs.id).update(task_id=result.id)

        transaction.on_commit(_dispatch)

    return qs


def regenerate_question_set(*, question_set_id: int, recruiter: Recruiter, instructions: str = '') -> QuestionSet:
    from rest_framework.exceptions import PermissionDenied, ValidationError

    qs = QuestionSet.objects.select_related('job_offer__recruiter').get(id=question_set_id)
    if qs.job_offer.recruiter_id != recruiter.id:
        raise PermissionDenied('Not the owner of this question set.')
    if qs.status not in (QuestionSet.Status.DRAFT, QuestionSet.Status.FAILED):
        raise ValidationError('Only DRAFT or FAILED question sets can be regenerated.')

    with transaction.atomic():
        qs.questions.all().delete()
        qs.status = QuestionSet.Status.DRAFT
        if instructions:
            qs.recruiter_instructions = instructions
        qs.save(update_fields=['status', 'recruiter_instructions', 'updated_at'])

        def _dispatch():
            from interviews.tasks import generate_question_set_task
            result = generate_question_set_task.delay(qs.id)
            QuestionSet.objects.filter(id=qs.id).update(task_id=result.id)

        transaction.on_commit(_dispatch)

    return qs
