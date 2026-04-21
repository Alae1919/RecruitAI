from django.db import transaction

from applications.models import Application, Resume
from job_offers.models import JobOffer
from users.models import JobSeeker


def create_application(*, job_seeker: JobSeeker, job_offer_id: int, resume_id: int | None = None) -> Application:
    from rest_framework.exceptions import ValidationError, PermissionDenied

    job_offer = JobOffer.objects.get(id=job_offer_id)

    if Application.objects.filter(job_seeker=job_seeker, job_offer=job_offer).exists():
        raise ValueError('You have already applied for this job.')

    resume = None
    if resume_id is not None:
        try:
            resume = Resume.objects.get(id=resume_id, job_seeker=job_seeker)
        except Resume.DoesNotExist:
            raise ValidationError('Resume not found or does not belong to you.')
    else:
        resume = Resume.objects.filter(job_seeker=job_seeker, is_default=True).first()

    with transaction.atomic():
        application = Application.objects.create(
            job_seeker=job_seeker,
            job_offer=job_offer,
            resume=resume,
            status=Application.Status.PENDING,
        )

        def _dispatch():
            from applications.tasks import analyze_cv_task
            analyze_cv_task.delay(application.id)

        if resume:
            transaction.on_commit(_dispatch)

    return application
