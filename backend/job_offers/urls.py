from django.urls import path

from .views import (
    CreateJobOfferView,
    ListJobOffersView,
    ListAllJobOffersView,
    EditJobOfferView,
    DeleteJobOfferView,
    ListCandidatesOnJobOfferView,
    GenerateJobDescriptionView,
)

urlpatterns = [
    path('create', CreateJobOfferView.as_view(), name='create_jobOffer'),
    path('list', ListJobOffersView.as_view(), name='list_jobOffer'),
    path('listALL', ListAllJobOffersView.as_view(), name='list_ALLjobOffer'),
    path('generate-description/', GenerateJobDescriptionView.as_view(), name='generate-job-description'),
    path('<int:pk>/Candidates/', ListCandidatesOnJobOfferView.as_view(), name='list_Candidates'),
    path('<int:pk>/delete/', DeleteJobOfferView.as_view(), name='delete-job-offer'),
    path('<int:pk>/edit/', EditJobOfferView.as_view(), name='edit-job-offer'),
]
