from django.db import models
from applications.models import Application


class CVAnalysis(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='cv_analysis')
    eligibility_score = models.FloatField()
    analysis_details = models.JSONField(blank=True, null=True)
    model_used = models.CharField(max_length=100, blank=True)
    prompt_version = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"CVAnalysis for application {self.application_id}"
