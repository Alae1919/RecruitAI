from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from users.models import JobSeeker, Recruiter
from job_offers.models import JobOffer


class Resume(models.Model):
    class ParsingStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        READY = 'ready', 'Ready'
        FAILED = 'failed', 'Failed'

    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE, related_name='resumes')
    original_file = models.FileField(upload_to='resumes/')
    label = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)
    parsing_status = models.CharField(
        max_length=10, choices=ParsingStatus.choices, default=ParsingStatus.PENDING
    )
    task_id = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['job_seeker', 'is_default']),
        ]

    def __str__(self):
        return f"Resume {self.id} ({self.job_seeker.user.email}) – {self.parsing_status}"


class ResumeData(models.Model):
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='parsed')
    raw_text = models.TextField(blank=True)
    skills = models.JSONField(default=list)
    experience = models.JSONField(default=list)
    education = models.JSONField(default=list)
    languages = models.JSONField(default=list)
    summary = models.TextField(blank=True)
    parsed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ResumeData for resume {self.resume_id}"


class Application(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        OFFER = 'offer', 'Offer'
        HIRED = 'hired', 'Hired'
        REJECTED = 'rejected', 'Rejected'

    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE)
    job_offer = models.ForeignKey(JobOffer, on_delete=models.CASCADE)
    resume = models.ForeignKey(
        Resume, null=True, blank=True, on_delete=models.SET_NULL, related_name='applications'
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['status', 'job_offer']),
        ]

    def __str__(self):
        return f"{self.job_seeker.user.email} -> {self.job_offer.title}"

    @property
    def stage(self) -> str:
        """Recruiter-facing pipeline stage derived from status + CV analysis.

        applied -> screening (CV score above the auto-shortlist bar) -> interview
        (accepted) -> offer -> hired; 'rejected' sits outside the pipeline.
        """
        S = self.Status
        fixed = {
            S.REJECTED: 'rejected', S.HIRED: 'hired',
            S.OFFER: 'offer', S.ACCEPTED: 'interview',
        }
        if self.status in fixed:
            return fixed[self.status]
        if self.job_offer.screening_config.get('auto_shortlist') is False:
            return 'applied'
        try:
            score = self.cv_analysis.eligibility_score
        except ObjectDoesNotExist:
            return 'applied'
        threshold = settings.RECRUITMENT['AUTO_SHORTLIST_SCORE']
        return 'screening' if score >= threshold else 'applied'


class CandidateMessage(models.Model):
    """A message from a recruiter to an applicant, delivered by email and kept as history."""
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Recruiter, on_delete=models.CASCADE, related_name='sent_messages')
    subject = models.CharField(max_length=200)
    body = models.TextField(max_length=5000)
    email_sent = models.BooleanField(default=False)  # False for demo accounts and until delivered
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message {self.id} to application {self.application_id}"


class Feedback(models.Model):
    interview = models.ForeignKey('interviews.Interview', on_delete=models.CASCADE)
    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE)
    comments = models.TextField(blank=True, null=True)
    rating = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for interview {self.interview_id}"

    def save(self, *args, **kwargs):
        if self.rating < 1 or self.rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        super().save(*args, **kwargs)
