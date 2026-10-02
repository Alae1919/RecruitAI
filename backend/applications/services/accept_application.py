from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from applications.models import Application
from applications.tasks import send_acceptance_email
from interviews.models import Interview, QuestionSet
from users.models import Recruiter


def accept_application(*, application_id: int, recruiter: Recruiter):
    with transaction.atomic():
        application = Application.objects.select_related(
            'job_offer__recruiter', 'job_seeker__user'
        ).get(id=application_id)

        if application.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this job offer.')

        if application.status in (Application.Status.OFFER, Application.Status.HIRED):
            raise ValidationError('This candidate is already past the interview stage.')

        # Find a READY QuestionSet before committing status change
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
                'No READY QuestionSet for this job offer. '
                'Generate and finalize a question set before accepting candidates.'
            )

        # Lock the QuestionSet and create the Interview atomically
        qs.status = QuestionSet.Status.LOCKED
        qs.locked_at = timezone.now()
        qs.save(update_fields=['status', 'locked_at', 'updated_at'])

        interview, _ = Interview.objects.get_or_create(
            application=application,
            defaults={
                'question_set': qs,
                'interview_date': timezone.now() + timedelta(days=1),
                'status': Interview.Status.AVAILABLE,
                'started_at': timezone.now(),
            },
        )
        if interview.question_set_id != qs.id:
            interview.question_set = qs
            interview.started_at = timezone.now()
            interview.save(update_fields=['question_set', 'started_at'])

        application.status = Application.Status.ACCEPTED
        application.save(update_fields=['status', 'updated_at'])

        def _dispatch_probes():
            from interviews.tasks import generate_probe_questions_task
            generate_probe_questions_task.delay(interview.id)

        transaction.on_commit(_dispatch_probes)
        transaction.on_commit(lambda: send_acceptance_email.delay(application_id))

    return application, interview
