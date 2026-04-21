from django.db import transaction
from django.utils import timezone

from interviews.models import Interview, QuestionSet
from applications.models import Application
from users.models import Recruiter


def start_interview(*, application_id: int, recruiter: Recruiter) -> Interview:
    from rest_framework.exceptions import PermissionDenied, ValidationError

    application = Application.objects.select_related(
        'job_offer__recruiter', 'job_seeker__user'
    ).get(id=application_id)

    if application.job_offer.recruiter_id != recruiter.id:
        raise PermissionDenied('Not the owner of this job offer.')

    qs = (
        QuestionSet.objects.filter(
            job_offer=application.job_offer,
            status=QuestionSet.Status.READY,
        )
        .order_by('-version')
        .first()
    )
    if qs is None:
        raise ValidationError(
            'No READY QuestionSet for this job offer. Generate and lock one first.'
        )

    with transaction.atomic():
        qs.status = QuestionSet.Status.LOCKED
        qs.locked_at = timezone.now()
        qs.save(update_fields=['status', 'locked_at', 'updated_at'])

        interview, created = Interview.objects.get_or_create(
            application=application,
            defaults={
                'question_set': qs,
                'status': Interview.Status.AVAILABLE,
                'started_at': timezone.now(),
            },
        )
        if not created:
            interview.question_set = qs
            interview.started_at = timezone.now()
            interview.save(update_fields=['question_set', 'started_at'])

        def _dispatch():
            from interviews.tasks import generate_probe_questions_task
            generate_probe_questions_task.delay(interview.id)

        transaction.on_commit(_dispatch)

    return interview
