from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from users.views import *

urlpatterns = [
    path('register/jobseeker/', RegisterJobSeekerView.as_view(), name='register_jobseeker'),
    path('register/recruiter/', RegisterRecruiterView.as_view(), name='register_recruiter'),
    path('update/recruiter/', UpdateRecruiterProfileView.as_view(), name='update_recruiter'),
    path('update/jobseeker/', UpdateJobSeekerProfileView.as_view(), name='update_jobseeker'),
    path('profile/recruiter/', RetrieveRecruiterProfileView.as_view(), name='retrieve-recruiter-profile'),
    path('profile/jobseeker/', RetrieveJobSeekerProfileView.as_view(), name='jobseeker-profile'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', TokenBlacklistView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('me/profile/', MeProfileView.as_view(), name='me-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
