from django.db import models
from users.models import Recruiter


class JobOffer(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        OPEN = 'open', 'Open'
        PAUSED = 'paused', 'Paused'
        CLOSED = 'closed', 'Closed'

    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full-time'
        PART_TIME = 'part_time', 'Part-time'
        CONTRACT = 'contract', 'Contract'
        INTERNSHIP = 'internship', 'Internship'

    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE, related_name='job_offers')
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)  # must-have
    nice_skills = models.JSONField(default=list, blank=True)
    experience_min = models.PositiveSmallIntegerField(default=0)
    experience_max = models.PositiveSmallIntegerField(null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    employment_type = models.CharField(
        max_length=12, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME
    )
    # What candidates must submit + AI auto-shortlist, e.g.
    # {"cv": true, "cover": false, "video": true, "questions": 3, "auto_shortlist": true}
    screening_config = models.JSONField(default=dict, blank=True)
    salary_range = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['recruiter', '-created_at']),
            models.Index(fields=['location']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['recruiter', 'status']),
        ]

    def __str__(self):
        return self.title
