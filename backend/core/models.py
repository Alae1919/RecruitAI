from django.db import models
from applications.models import Application

# Create your models here.






class CVAnalysis(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE)
    eligibility_score = models.FloatField()
    analysis_details = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis for {self.application.job_seeker.user.email}"



