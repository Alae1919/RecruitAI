from django.urls import path

from .views import (
    JobSeekerInterviewListAPI,
    RecruiterInterviewListAPI,
    InterviewQuestionsAPI,
    InterviewEvaluationView,
    InterviewEvaluationDecisionView,
    QuestionSetListCreateView,
    QuestionSetDetailView,
    QuestionSetRegenerateView,
    QuestionCreateView,
    QuestionDetailView,
    upload_video,
    get_interview_answers,
)

urlpatterns = [
    # Interview lists
    path('listinterviews/', JobSeekerInterviewListAPI.as_view(), name='jobseeker-interviews'),
    path('listrecruiterinterviews/', RecruiterInterviewListAPI.as_view(), name='recruiter-interviews'),

    # Interview questions (candidate-facing)
    path('<int:interview_id>/questions/', InterviewQuestionsAPI.as_view(), name='interview-questions'),

    # Evaluation
    path('<int:interview_id>/evaluation/', InterviewEvaluationView.as_view(), name='interview-evaluation'),
    path('<int:interview_id>/evaluation/decision/', InterviewEvaluationDecisionView.as_view(), name='interview-evaluation-decision'),

    # Video upload & answers
    path('uploadVideo/', upload_video, name='upload_video'),
    path('answers/', get_interview_answers, name='get_interview_answers'),

    # QuestionSet management (recruiter)
    path('job-offers/<int:job_offer_id>/question-sets/', QuestionSetListCreateView.as_view(), name='question-set-list'),
    path('question-sets/<int:pk>/', QuestionSetDetailView.as_view(), name='question-set-detail'),
    path('question-sets/<int:pk>/regenerate/', QuestionSetRegenerateView.as_view(), name='question-set-regenerate'),
    path('question-sets/<int:question_set_id>/questions/', QuestionCreateView.as_view(), name='question-create'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
]
