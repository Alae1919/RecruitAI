from applications.models import Application, Resume
from users.models import JobSeeker, Recruiter


def list_jobseeker_applications(job_seeker: JobSeeker):
    return (
        Application.objects.filter(job_seeker=job_seeker)
        .select_related('job_offer__recruiter', 'resume', 'cv_analysis')
        .order_by('-applied_at')
    )


def list_jobseeker_resumes(job_seeker: JobSeeker):
    return (
        Resume.objects.filter(job_seeker=job_seeker)
        .select_related('parsed')
        .order_by('-uploaded_at')
    )


def list_applications_for_offer(job_offer_id: int, recruiter: Recruiter):
    return (
        Application.objects.filter(
            job_offer_id=job_offer_id,
            job_offer__recruiter=recruiter,
        )
        .select_related(
            'job_seeker__user', 'resume__parsed', 'job_offer', 'cv_analysis',
            'interview__evaluation',
        )
        .prefetch_related('messages__sender__user')
        .order_by('-applied_at')
    )


def recruiter_pipeline_summary(recruiter: Recruiter) -> dict:
    """Counts for the recruiter sidebar: offers, candidates and candidates per stage."""
    from job_offers.models import JobOffer

    stages = {key: 0 for key in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')}
    applications = Application.objects.filter(job_offer__recruiter=recruiter).select_related(
        'job_offer', 'cv_analysis'
    )
    total = 0
    for application in applications:
        stages[application.stage] += 1
        total += 1
    offers = JobOffer.objects.filter(recruiter=recruiter)
    return {
        'offers': offers.count(),
        'open_offers': offers.filter(status=JobOffer.Status.OPEN).count(),
        'candidates': total,
        'stages': stages,
    }
