from job_offers.models import JobOffer
from users.models import Recruiter


def list_public_job_offers(filters: dict | None = None):
    qs = (
        JobOffer.objects.filter(status=JobOffer.Status.OPEN)
        .select_related('recruiter__user')
        .order_by('-created_at')
    )
    return qs


def list_recruiter_job_offers(recruiter: Recruiter):
    return (
        JobOffer.objects.filter(recruiter=recruiter)
        .prefetch_related('question_sets')
        .order_by('-created_at')
    )
