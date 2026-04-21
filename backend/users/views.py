from django.shortcuts import render
from django.shortcuts import render,get_object_or_404
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework import status, generics,viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import *
from .models import Recruiter, JobSeeker, UserRole


class RegisterJobSeekerView(APIView):
    permission_classes = [AllowAny]  # Permet à tous les utilisateurs d'accéder à cette vue

    def post(self, request):
        serializer = JobSeekerSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterRecruiterView(APIView):

    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RecruiterSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Recruiter registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        
#############################################################################################################


#############################################################################################################

class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        serializer = LoginSpecialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        role = serializer.validated_data.get('role', '')

        refresh = RefreshToken.for_user(user)
        refresh['role'] = role
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })


#############################################################################################################


#############################################################################################################



class UpdateRecruiterProfileView(generics.RetrieveUpdateAPIView):
    queryset = Recruiter.objects.all()
    serializer_class = RecruiterProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Return the recruiter instance associated with the authenticated user.
        """
        return Recruiter.objects.get(user=self.request.user)

class RetrieveRecruiterProfileView(generics.RetrieveAPIView):
    """
    API to retrieve authenticated recruiter's profile information.
    """
    queryset = Recruiter.objects.all()
    serializer_class = RecruiterProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Return the recruiter instance associated with the authenticated user.
        """
        return Recruiter.objects.get(user=self.request.user)


#############################################################################################################


#############################################################################################################


class RetrieveJobSeekerProfileView(generics.RetrieveAPIView):
    """
    API pour récupérer les informations du profil du chercheur d'emploi authentifié.
    """
    queryset = JobSeeker.objects.all()
    serializer_class = JobSeekerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Retourne l'instance JobSeeker associée à l'utilisateur authentifié.
        """
        return JobSeeker.objects.get(user=self.request.user)


class UpdateJobSeekerProfileView(generics.RetrieveUpdateAPIView):
    queryset = JobSeeker.objects.all()
    serializer_class = JobSeekerProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return JobSeeker.objects.get(user=self.request.user)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = getattr(request, 'auth', None)
        role = None
        if token is not None and hasattr(token, '__getitem__'):
            try:
                role = token['role']
            except KeyError:
                pass
        if role is None:
            user_role = UserRole.objects.filter(user=request.user).select_related('role').first()
            role = user_role.role.role_name if user_role else None
        return Response({
            'id': request.user.id,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'role': role,
        })


class MeProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = getattr(request, 'auth', None)
        role = None
        if token is not None and hasattr(token, '__getitem__'):
            try:
                role = token['role']
            except KeyError:
                pass
        if role is None:
            user_role = UserRole.objects.filter(user=request.user).select_related('role').first()
            role = user_role.role.role_name if user_role else None

        if role == 'RECRUITER':
            try:
                recruiter = request.user.recruiter
                serializer = RecruiterProfileSerializer(recruiter)
                return Response({'role': role, 'profile': serializer.data})
            except Exception:
                return Response({'error': 'Recruiter profile not found.'}, status=404)
        elif role == 'JOBSEEKER':
            try:
                job_seeker = request.user.jobseeker
                serializer = JobSeekerProfileSerializer(job_seeker)
                return Response({'role': role, 'profile': serializer.data})
            except Exception:
                return Response({'error': 'Job seeker profile not found.'}, status=404)
        return Response({'error': 'Role not determined.'}, status=400)

    def patch(self, request):
        token = getattr(request, 'auth', None)
        role = None
        if token is not None and hasattr(token, '__getitem__'):
            try:
                role = token['role']
            except KeyError:
                pass
        if role is None:
            user_role = UserRole.objects.filter(user=request.user).select_related('role').first()
            role = user_role.role.role_name if user_role else None

        if role == 'RECRUITER':
            recruiter = request.user.recruiter
            serializer = RecruiterProfileUpdateSerializer(
                recruiter, data=request.data, partial=True, context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(RecruiterProfileSerializer(recruiter).data)
        elif role == 'JOBSEEKER':
            job_seeker = request.user.jobseeker
            serializer = JobSeekerProfileUpdateSerializer(
                job_seeker, data=request.data, partial=True, context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(JobSeekerProfileSerializer(job_seeker).data)
        return Response({'error': 'Role not determined.'}, status=400)