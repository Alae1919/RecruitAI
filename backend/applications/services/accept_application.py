from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from applications.models import Application
from applications.tasks import send_acceptance_email
from interviews.models import Interview
from interviews.tasks import generateQuestions
from users.models import Recruiter


def accept_application(*, application_id: int, recruiter: Recruiter):
    with transaction.atomic():
        application = Application.objects.select_related(
            'job_offer__recruiter', 'job_seeker__user'
        ).get(id=application_id)

        if application.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied("Not the owner of this job offer.")

        interview, _ = Interview.objects.get_or_create(
            application=application,
            defaults={
                "interview_date": timezone.now() + timedelta(days=1),
                "status": Interview.Status.AVAILABLE,
            },
        )

        application.status = Application.Status.ACCEPTED
        application.save(update_fields=['status', 'updated_at'])

        transaction.on_commit(lambda: generateQuestions.delay(
            application.extracted_text, application.job_offer.description, interview.id
        ))
        transaction.on_commit(lambda: send_acceptance_email.delay(application.id))

    return application, interview
