from rest_framework.permissions import BasePermission
from .models import UserRole


class IsRecruiter(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and UserRole.objects.filter(
                user=request.user, role__role_name="RECRUITER"
            ).exists()
        )


class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and UserRole.objects.filter(
                user=request.user, role__role_name="JOBSEEKER"
            ).exists()
        )