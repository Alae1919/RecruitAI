from django.urls import path

from .views import (
    JobSeekerApplicationsView,
    ListInterviewView,
    JobApplicationCreateView,
    AcceptApplicationView,
    RejectApplicationView,
    AdvanceApplicationView,
    RecruiterPipelineSummaryView,
    ApplicationMessagesView,
    ResumeListCreateView,
    ResumeDetailView,
)

urlpatterns = [
    path('retreiveApplications', JobSeekerApplicationsView.as_view(), name='jobseeker-applications'),
    path('retreiveInterviews/', ListInterviewView.as_view(), name='list-interviews'),
    path('jobapplications/', JobApplicationCreateView.as_view(), name='jobapplication-create'),
    path('accept/', AcceptApplicationView.as_view(), name='accept-application'),
    path('reject/', RejectApplicationView.as_view(), name='reject-application'),
    path('advance/', AdvanceApplicationView.as_view(), name='advance-application'),
    path('pipeline/', RecruiterPipelineSummaryView.as_view(), name='pipeline-summary'),
    path('<int:application_id>/messages/', ApplicationMessagesView.as_view(), name='application-messages'),
    # Multi-resume
    path('resumes/', ResumeListCreateView.as_view(), name='resume-list'),
    path('resumes/<int:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
]
