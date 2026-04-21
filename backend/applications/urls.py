from django.urls import path

from .views import (
    JobSeekerApplicationsView,
    ListInterviewView,
    JobApplicationCreateView,
    AcceptApplicationView,
    RejectApplicationView,
    ResumeListCreateView,
    ResumeDetailView,
)

urlpatterns = [
    path('retreiveApplications', JobSeekerApplicationsView.as_view(), name='jobseeker-applications'),
    path('retreiveInterviews/', ListInterviewView.as_view(), name='list-interviews'),
    path('jobapplications/', JobApplicationCreateView.as_view(), name='jobapplication-create'),
    path('accept/', AcceptApplicationView.as_view(), name='accept-application'),
    path('reject/', RejectApplicationView.as_view(), name='reject-application'),
    # Multi-resume
    path('resumes/', ResumeListCreateView.as_view(), name='resume-list'),
    path('resumes/<int:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
]
