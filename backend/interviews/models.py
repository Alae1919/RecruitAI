from django.db import models
#from .models import Interview
# Create your models here.

class Interview(models.Model):
    from applications.models import Application

    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        SCHEDULED = 'scheduled', 'Scheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELED = 'canceled', 'Canceled'

    application = models.ForeignKey(Application, on_delete=models.CASCADE)
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_link = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interview for {self.application.job_seeker.user.email}"

class Question(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE)
    question_text = models.TextField()
    #created_by_ai = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    #correct_answer = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.question_text

class Answer(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    candidate_video = models.FileField(upload_to='interview_videos/', blank=True, null=True)  # URL ou chemin vers la réponse audio
    transcript = models.TextField(blank=True, null=True)
    score = models.FloatField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to: {self.question.question_text}"

class InterviewResult(models.Model):
    interview = models.OneToOneField(Interview, on_delete=models.CASCADE)
    score = models.FloatField()
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for {self.interview.application.job_seeker.user.email}"

