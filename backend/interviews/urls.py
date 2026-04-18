from django.urls import path
from .views import JobSeekerInterviewListAPI,RecruiterInterviewListAPI,InterviewQuestionsAPI,upload_video,get_interview_answers
urlpatterns = [
    path('listinterviews/', JobSeekerInterviewListAPI.as_view(), name='jobseeker-interviews'),
    path('listrecruiterinterviews/', RecruiterInterviewListAPI.as_view(), name='recruiter-interviews'),
    path('questions/', InterviewQuestionsAPI.as_view(), name='interview-questions'),
    path('uploadVideo/', upload_video, name='upload_video'),
    path('answers/', get_interview_answers, name='get_interview_answers'),    
]
