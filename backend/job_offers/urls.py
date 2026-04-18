from rest_framework.routers import DefaultRouter
from django.urls import path,include

from .views import CreateJobOfferView,ListJobOffersView,EditJobOfferView,DeleteJobOfferView,ListAllJobOffersView,ListCandidatesOnJobOfferView



urlpatterns = [
    # Authentification
    path('create', CreateJobOfferView.as_view(), name='create_jobOffer'),
    path('list', ListJobOffersView.as_view(), name='list_jobOffer'),
    path('listALL', ListAllJobOffersView.as_view(), name='list_ALLjobOffer'),
    path('<int:pk>/Candidates/', ListCandidatesOnJobOfferView.as_view(), name='list_Candidates'),
    path('<int:pk>/delete/', DeleteJobOfferView.as_view(), name='delete-job-offer'),
    path('<int:pk>/edit/', EditJobOfferView.as_view(), name='edit-job-offer'),


]
