from django.db import transaction

from applications.models import Application
from applications.tasks import extract_cv_text
from job_offers.models import JobOffer
from users.models import JobSeeker


def create_application(*, job_seeker: JobSeeker, job_offer_id: int) -> Application:
    job_offer = JobOffer.objects.get(id=job_offer_id)

    if Application.objects.filter(job_seeker=job_seeker, job_offer=job_offer).exists():
        raise ValueError("You have already applied for this job.")

    with transaction.atomic():
        application = Application.objects.create(
            job_seeker=job_seeker,
            job_offer=job_offer,
            status=Application.Status.PENDING,
        )
        transaction.on_commit(lambda: extract_cv_text.delay(application.id))

    return application
