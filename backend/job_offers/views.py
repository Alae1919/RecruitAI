import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, generics, permissions, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import JobOfferFilter
from .models import JobOffer
from .selectors import list_public_job_offers, list_recruiter_job_offers
from .serializers import JobDescriptionGenerateSerializer, JobOfferSerializer
from .services.generate_job_description import generate_job_description
from applications.models import Application
from applications.serializers import ApplicationSerializer
from users.models import Recruiter
from users.permissions import IsRecruiter

logger = logging.getLogger(__name__)


class CreateJobOfferView(generics.CreateAPIView):
    queryset = JobOffer.objects.all()
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def perform_create(self, serializer):
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        serializer.save(recruiter=recruiter)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {'message': 'Job offer created successfully', 'job_offer': serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListJobOffersView(generics.ListAPIView):
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = JobOfferFilter
    ordering_fields = [
        'created_at', 'title', 'experience_min',
        'applicants_count', 'shortlisted_count', 'avg_match',
    ]
    ordering = ['-created_at']
    search_fields = ['title', 'description', 'location']

    def get_queryset(self):
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        if recruiter:
            return list_recruiter_job_offers(recruiter)
        return JobOffer.objects.none()


class ListAllJobOffersView(generics.ListAPIView):
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = JobOfferFilter
    ordering_fields = ['created_at', 'title', 'experience_min']
    ordering = ['-created_at']
    search_fields = ['title', 'description', 'location']

    def get_queryset(self):
        return list_public_job_offers()


class EditJobOfferView(generics.UpdateAPIView):
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        if recruiter:
            return JobOffer.objects.filter(recruiter=recruiter)
        return JobOffer.objects.none()

    def perform_update(self, serializer):
        if serializer.instance.recruiter.user != self.request.user:
            raise PermissionDenied('You are not allowed to edit this job offer.')
        serializer.save()


class DeleteJobOfferView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        if recruiter:
            return JobOffer.objects.filter(recruiter=recruiter)
        return JobOffer.objects.none()

    def perform_destroy(self, instance):
        if instance.recruiter.user != self.request.user:
            raise PermissionDenied('You are not allowed to delete this job offer.')
        instance.delete()


class ListCandidatesOnJobOfferView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get(self, request, pk):
        recruiter = Recruiter.objects.filter(user=request.user).first()
        job_offer = JobOffer.objects.filter(pk=pk, recruiter=recruiter).first()
        if not job_offer:
            return Response(
                {'error': 'Job offer not found or unauthorized access.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        applications = Application.objects.filter(job_offer=job_offer).select_related(
            'job_seeker__user', 'job_offer', 'resume', 'cv_analysis'
        )
        serializer = ApplicationSerializer(applications, many=True, context={'request': request})
        return Response(serializer.data)


class GenerateJobDescriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    throttle_scope = 'llm'

    def post(self, request):
        serializer = JobDescriptionGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = generate_job_description(**serializer.validated_data)
        except Exception as e:
            logger.error(f'JD generation failed: {e}', exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result)
