from django.db import transaction
from rest_framework.exceptions import PermissionDenied

from applications.models import Application
from users.models import Recruiter


def reject_application(*, application_id: int, recruiter: Recruiter) -> Application:
    with transaction.atomic():
        application = Application.objects.select_related('job_offer__recruiter').get(id=application_id)

        if application.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied("Not the owner of this job offer.")

        application.status = Application.Status.REJECTED
        application.save(update_fields=['status', 'updated_at'])

    return application
