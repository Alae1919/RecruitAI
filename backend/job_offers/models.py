from django.db import models
from users.models import Recruiter


class JobOffer(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        OPEN = 'open', 'Open'
        PAUSED = 'paused', 'Paused'
        CLOSED = 'closed', 'Closed'

    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE, related_name='job_offers')
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    experience_min = models.PositiveSmallIntegerField(default=0)
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
