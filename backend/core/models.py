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



"""
class Question(models.Model):
    from interviews.models import Interview

    interview = models.ForeignKey(Interview, on_delete=models.CASCADE)
    question_text = models.TextField()
    created_by_ai = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question_text

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    candidate_audio = models.TextField(blank=True, null=True)  # URL ou chemin vers la réponse audio
    transcript = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to: {self.question.question_text}"

"""