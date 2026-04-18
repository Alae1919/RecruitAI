from django.shortcuts import render
from rest_framework import status, generics,viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import JobOfferSerializer
from .models    import JobOffer
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.models   import Recruiter
from users.permissions  import IsRecruiter
from applications.models    import Application
from applications.serializers import ApplicationSerializer
from rest_framework.decorators import action

# Create your views here.
class CreateJobOfferView(generics.CreateAPIView):
    queryset = JobOffer.objects.all()
    serializer_class = JobOfferSerializer
    permission_classes = [IsAuthenticated, IsRecruiter]  # Ensure the user is a recruiter

    def perform_create(self, serializer):
        # Automatically set the recruiter field to the authenticated user
        theRecruiter = Recruiter.objects.filter(user=self.request.user).first()

        serializer.save(recruiter=theRecruiter)

    def post(self, request, *args, **kwargs):
        # Custom response
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({"message": "Job offer created successfully", "job_offer": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListJobOffersView(generics.ListAPIView):
    """
    API to list all job offers posted by the authenticated recruiter.
    """
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Fetch job offers linked to the authenticated recruiter.
        """
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        if recruiter:
            return JobOffer.objects.filter(recruiter=recruiter)
        return JobOffer.objects.none()
class ListAllJobOffersView(generics.ListAPIView):
    """
    API to list all job offers posted by the authenticated recruiter.
    """
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Fetch job offers linked to the authenticated recruiter.
        """
        job_offers = JobOffer.objects.all()
        serializer = JobOfferSerializer(job_offers, many=True)
        return job_offers

        
class EditJobOfferView(generics.UpdateAPIView):
    """
    API to edit a specific job offer.
    """
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Only allow editing job offers of the authenticated recruiter.
        """
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        if recruiter:
            return JobOffer.objects.filter(recruiter=recruiter)
        return JobOffer.objects.none()

    def perform_update(self, serializer):
        """
        Perform the update with additional checks if needed.
        """
        job_offer = self.get_object()
        if job_offer.recruiter.user != self.request.user:
            raise PermissionDenied("You are not allowed to edit this job offer.")
        serializer.save()


class ListCandidatesOnJobOfferView(APIView):
    """
    API to list all candidates for a specific job offer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        """
        Return the list of candidates who applied for the job offer.
        """
        recruiter = Recruiter.objects.filter(user=request.user).first()
        job_offer = JobOffer.objects.filter(pk=pk, recruiter=recruiter).first()
        

        if not job_offer:
            return Response({"error": "Job offer not found or unauthorized access."}, status=status.HTTP_404_NOT_FOUND)

        # Get all applications for this job offer
        applications = Application.objects.filter(job_offer=job_offer)
        serializer = ApplicationSerializer(applications, many=True,context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)



class DeleteJobOfferView(generics.DestroyAPIView):
    """
    API to delete a specific job offer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Only allow deleting job offers of the authenticated recruiter.
        """
        recruiter = Recruiter.objects.filter(user=self.request.user).first()
        if recruiter:
            return JobOffer.objects.filter(recruiter=recruiter)
        return JobOffer.objects.none()

    def perform_destroy(self, instance):
        """
        Ensure only the recruiter who owns the job offer can delete it.
        """
        if instance.recruiter.user != self.request.user:
            raise PermissionDenied("You are not allowed to delete this job offer.")
        instance.delete()
"""
class JobOfferViewSet(viewsets.ModelViewSet):
    
    ViewSet pour gérer les offres d'emploi.
   
    queryset = JobOffer.objects.all()
    serializer_class = JobOfferSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        
        Limite l'accès aux offres publiées par le recruteur connecté.
        
        theRecruiter = Recruiter.objects.filter(user=self.request.user).first()

        return JobOffer.objects.filter(recruiter=theRecruiter)

    def perform_create(self, serializer):
        Associe automatiquement l'utilisateur connecté comme recruteur.
        theRecruiter = Recruiter.objects.filter(user=self.request.user).first()
        serializer.save(recruiter=theRecruiter)
        
    def create(self, request, *args, **kwargs):
        print("Request received: ", request.data)
        return super().create(request, *args, **kwargs)

        
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        Action personnalisée pour voir les candidatures sur une offre spécifique.
        job_offer = get_object_or_404(JobOffer, pk=pk, recruiter=request.user)
        applications = Application.objects.filter(job_offer=job_offer)
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)
        """


