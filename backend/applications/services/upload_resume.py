from django.db import transaction

from applications.models import Resume
from users.models import JobSeeker


def upload_resume(*, job_seeker: JobSeeker, file, label: str = '', make_default: bool = False) -> Resume:
    with transaction.atomic():
        if make_default or not Resume.objects.filter(job_seeker=job_seeker, is_default=True).exists():
            Resume.objects.filter(job_seeker=job_seeker, is_default=True).update(is_default=False)
            is_default = True
        else:
            is_default = False

        resume = Resume.objects.create(
            job_seeker=job_seeker,
            original_file=file,
            label=label or file.name,
            is_default=is_default,
            parsing_status=Resume.ParsingStatus.PENDING,
        )

        def _dispatch():
            from applications.tasks import parse_resume_task
            result = parse_resume_task.delay(resume.id)
            Resume.objects.filter(id=resume.id).update(task_id=result.id)

        transaction.on_commit(_dispatch)

    return resume


def set_default_resume(*, job_seeker: JobSeeker, resume_id: int) -> Resume:
    from rest_framework.exceptions import PermissionDenied

    resume = Resume.objects.get(id=resume_id)
    if resume.job_seeker_id != job_seeker.id:
        raise PermissionDenied('This resume does not belong to you.')

    with transaction.atomic():
        Resume.objects.filter(job_seeker=job_seeker, is_default=True).update(is_default=False)
        resume.is_default = True
        resume.save(update_fields=['is_default'])

    return resume
