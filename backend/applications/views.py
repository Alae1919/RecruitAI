from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics,viewsets
from .models import Application, Feedback, CVExtractionError
from interviews.models import Interview
from interviews.views import generateQuestions
from .serializers import ApplicationSerializer,FeedbackSerializer
from interviews.serializers import InterviewSerializer
from users.permissions import IsRecruiter, IsJobSeeker
from rest_framework.decorators import api_view, permission_classes
from users.models import Recruiter
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import PyPDF2
import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

"""
class JobApplicationViewSet(ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = JobApplicationSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated(), IsJobSeeker()]
        elif self.action in ['update', 'destroy', 'list', 'retrieve']:
            return [IsAuthenticated(), IsRecruiter()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'recruiter':
            # Retourner les candidatures pour les offres du recruteur
            return Application.objects.filter(job_offer__recruiter=user)
        elif user.role == 'job_seeker':
            # Retourner les candidatures soumises par le candidat
            return Application.objects.filter(candidate=user)
        return Application.objects.none()
"""


class JobSeekerApplicationsView(APIView):
    permission_classes = [IsAuthenticated,IsJobSeeker]

    def get(self, request):
        # Récupérer l'utilisateur connecté
        user = request.user

        # Récupérer les candidatures liées au JobSeeker
        job_seeker = user.jobseeker
        applications = Application.objects.filter(job_seeker=job_seeker).select_related('job_offer')

        # Sérialiser les données
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)

class ListInterviewView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retourne les entretiens associés au JobSeeker lié à l'utilisateur authentifié.
        """
        user = self.request.user
        # On récupère le JobSeeker associé à l'utilisateur connecté
        job_seeker = user.jobseeker  # Si la relation entre User et JobSeeker existe
        # On retourne les entretiens liés à ce JobSeeker
        return Interview.objects.filter(application__job_seeker=job_seeker)


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]


class JobApplicationCreateView(APIView):
    """
    API pour enregistrer une candidature
    """
    def post(self, request, *args, **kwargs):
        job_offer_id = request.data.get('job_offer_id')
        job_seeker = JobSeeker.objects.filter(user=request.user).first()
        try:
            job_offer = JobOffer.objects.get(id=job_offer_id)

            existing_application = Application.objects.filter(job_seeker=job_seeker, job_offer=job_offer).first()
            if existing_application:
                return Response({"error": "You have already applied for this job."}, status=status.HTTP_400_BAD_REQUEST)

            application = Application.objects.create(
                job_seeker=job_seeker,
                job_offer=job_offer,
                status='pending'
            )
            try:
                extracted_text = application.extract_text_from_resume()
                if extracted_text:
                    application.extracted_text = extracted_text
                    application.save(update_fields=['extracted_text'])
            except CVExtractionError as e:
                application.delete()
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            serializer = ApplicationSerializer(application)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except JobOffer.DoesNotExist:
            return Response({"error": "Job offer not found."}, status=status.HTTP_404_NOT_FOUND)
        except JobSeeker.DoesNotExist:
            return Response({"error": "Job seeker not found."}, status=status.HTTP_404_NOT_FOUND)

class AcceptApplicationView(APIView):
    """
    API pour accepter une candidature.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"error": "Missing application_id in request body."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier que l'utilisateur connecté est le recruteur associé à l'offre de la candidature
        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter or application.job_offer.recruiter != recruiter:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        
        # Créer (ou récupérer) l'objet Interview pour cette candidature.
        # Ici, on définit par défaut la date d'entretien pour le lendemain.
        interview, created = Interview.objects.get_or_create(
            application=application,
            defaults={
                "interview_date": timezone.now() + timedelta(days=1),
                "status": "available",  # ou "scheduled" selon votre logique métier
            }
        )
        
        logger.info(f"Generating new questions for interview {interview.id}")
        extracted_text = application.extracted_text
        generateQuestions.delay(extracted_text,application.job_offer.description,interview.id)
        #
        # Envoyer un email de notification au candidat
        candidate_email = application.job_seeker.user.email
        message = "Votre candidature a été acceptée, vous pouvez passer un entretien."
        #send_email_to_candidate(candidate_email, message)

        candidate_email = application.job_seeker.user.email
        message = "Votre candidature a été acceptée, vous pouvez passer un entretien."
        try:
            send_email_to_candidate(
                candidate_email,
                message,
                interview_date=interview.interview_date,
                interview_link=interview.interview_link,
            )
            logger.info(f"Acceptance email sent to {candidate_email}")
        except Exception as e:
            logger.warning(f"Failed to send acceptance email to {candidate_email}: {e}")
        # Mettre à jour le statut
        application.status = "accepted"
        application.save()

        
        serializer = ApplicationSerializer(application)
        #return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({
            "application": serializer.data,
            "interview": {
                "id": interview.id,
                "interview_date": interview.interview_date,
                "interview_link": interview.interview_link,
                "status": interview.status,
            }
        }, status=status.HTTP_200_OK)


class RejectApplicationView(APIView):
    """
    API pour rejeter une candidature.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):

        application_id = request.data.get('application_id')
        if not application_id:
            return Response({"error": "Missing application_id in request body."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier que l'utilisateur connecté est le recruteur associé à l'offre de la candidature
        recruiter = Recruiter.objects.filter(user=request.user).first()
        if not recruiter or application.job_offer.recruiter != recruiter:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        # Mettre à jour le statut
        application.status = "rejected"
        application.save()

        serializer = ApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)

def extract_CV_text():
        pdfReader = PyPDF2.PdfReader(file)
            
            # Initialize a variable to store the extracted text
        extracted_text = ""
            
            # Loop through each page in the PDF
        for page in pdfReader.pages:
                # Extract text from the page and add it to the extracted_text variable
                # Replace newline characters with spaces
            extracted_text += page.extract_text().replace('\n', ' ') + " "

def send_email_to_candidate(email, message, interview_date=None, interview_link=None):
    subject = "Statut de votre candidature"
    body = f"""
    {message}
    
    Détails de l'entretien :
    Date: {interview_date}
    Lien: {interview_link}
    """
    send_mail(
        subject,
        body,
        settings.EMAIL_HOST_USER,  # Expéditeur
        [email],  # Destinataire
        fail_silently=False,
    )
"""

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_application(request, application_id):
"""
   # Accepte la candidature : met à jour le statut à 'accepted' et informe le candidat (par exemple, via e-mail).
"""
    try:
        # Récupérer la candidature
        application = Application.objects.get(id=application_id)
    except Application.DoesNotExist:
        return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

    # Vérifier que l'utilisateur connecté est bien le recruteur associé à l'offre
    recruiter = Recruiter.objects.filter(user=request.user).first()
    if not recruiter or application.job_offer.recruiter != recruiter:
        return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

    # Mettre à jour le statut de la candidature
    application.status = "accepted"
    application.save()

    candidate_email = application.job_seeker.user.email
    send_email_to_candidate(candidate_email)


    return Response({"message": "Application accepted. Candidate has been informed to proceed with the interview."},
                    status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_application(request, application_id):
    """
   # Rejette la candidature : met à jour le statut à 'rejected'.
"""
    try:
        application = Application.objects.get(id=application_id)
    except Application.DoesNotExist:
        return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

    recruiter = Recruiter.objects.filter(user=request.user).first()
    if not recruiter or application.job_offer.recruiter != recruiter:
        return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

    application.status = "rejected"
    application.save()

    return Response({"message": "Application rejected."}, status=status.HTTP_200_OK)

def send_email_to_candidate(candidate_email):
    subject = "Candidature acceptée - Entretien à venir"
    message = (
        "Bonjour,\n\n"
        "Nous avons le plaisir de vous informer que votre candidature a été acceptée. "
        "Vous pouvez désormais passer à l'étape suivante qui est l'entretien. Nous vous contacterons sous peu pour convenir d'une date et d'une heure.\n\n"
        "Cordialement,\n"
        "L'équipe de recrutement"
    )
    from_email = "no-reply@votredomaine.com"  # Remplacez par l'adresse d'envoi configurée
    recipient_list = [candidate_email]
    
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)
    """