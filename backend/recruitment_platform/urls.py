"""
URL configuration for recruitment_platform project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static



#urlpatterns = [
 #   #path('admin/', admin.site.urls),
    #path('api/register/', RegisterJobSeekerView.as_view(), name='register'),
   # path('api/register/jobseeker/', RegisterJobSeekerView.as_view(), name='jobseeker_signup'),
  #  path('api/register/recruiter/', RegisterRecruiterView.as_view(), name='recruiter_signup'),
    #path('api/login/', LoginView.as_view(), name='login'),
#    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
 #   path('api/recruiter/jobOffers/create/', CreateJobOfferView.as_view(), name='create_job_offer'),
#]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/interviews/', include('interviews.urls')),          # Routes globales (core)
    path('api/users/', include('users.urls')),        # Routes pour les utilisateurs
    path('api/job_offers/', include('job_offers.urls')), # Routes pour les offres d'emploi
    path('api/applications/', include('applications.urls')), # Routes pour les candidatures
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
