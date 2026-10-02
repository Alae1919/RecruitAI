from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from applications.models import Application
from applications.services.accept_application import accept_application
from users.models import Recruiter

_NEXT_STATUS = {
    Application.Status.ACCEPTED: Application.Status.OFFER,
    Application.Status.OFFER: Application.Status.HIRED,
}


def advance_application(*, application_id: int, recruiter: Recruiter) -> Application:
    """Move an application one step forward in the pipeline.

    pending -> accepted (creates the interview), accepted -> offer, offer -> hired.
    """
    with transaction.atomic():
        application = Application.objects.select_related('job_offer__recruiter').get(id=application_id)

        if application.job_offer.recruiter_id != recruiter.id:
            raise PermissionDenied('Not the owner of this job offer.')

        if application.status == Application.Status.PENDING:
            application, _ = accept_application(application_id=application_id, recruiter=recruiter)
            return application

        next_status = _NEXT_STATUS.get(application.status)
        if next_status is None:
            raise ValidationError(f'Cannot advance an application that is {application.status}.')

        application.status = next_status
        application.save(update_fields=['status', 'updated_at'])
    return application
