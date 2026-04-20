from rest_framework.permissions import BasePermission
from .models import UserRole


def _has_role(request, role_name):
    if not request.user.is_authenticated:
        return False
    token = getattr(request, 'auth', None)
    if token is not None and hasattr(token, '__getitem__'):
        try:
            return token['role'] == role_name
        except KeyError:
            pass
    return UserRole.objects.filter(
        user=request.user, role__role_name=role_name
    ).exists()


class IsRecruiter(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'RECRUITER')


class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'JOBSEEKER')