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
        .select_related('job_seeker__user', 'resume__parsed', 'job_offer', 'cv_analysis')
        .order_by('-applied_at')
    )
