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
    return UserRole.objects.filter(user=request.user, role__role_name=role_name).exists()


class IsRecruiter(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'RECRUITER')


class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, 'JOBSEEKER')


class IsRecruiterOwner(BasePermission):
    """
    Object-level permission: recruiter must own the object's job offer.
    Expects the object to expose a `recruiter_id` attribute or a traversal
    path defined per model (checked in order).
    """

    def _get_recruiter_id(self, obj):
        # Direct recruiter_id (JobOffer)
        if hasattr(obj, 'recruiter_id'):
            return obj.recruiter_id
        # QuestionSet → job_offer
        if hasattr(obj, 'job_offer') and hasattr(obj.job_offer, 'recruiter_id'):
            return obj.job_offer.recruiter_id
        # Interview → application → job_offer
        if hasattr(obj, 'application'):
            try:
                return obj.application.job_offer.recruiter_id
            except Exception:
                pass
        return None

    def has_object_permission(self, request, view, obj):
        recruiter = getattr(request.user, 'recruiter', None)
        if recruiter is None:
            return False
        return self._get_recruiter_id(obj) == recruiter.id


class IsApplicationOwner(BasePermission):
    """
    Object-level permission: job seeker must own the object.
    Works for Resume and Application.
    """

    def _get_job_seeker_id(self, obj):
        if hasattr(obj, 'job_seeker_id'):
            return obj.job_seeker_id
        if hasattr(obj, 'application') and hasattr(obj.application, 'job_seeker_id'):
            return obj.application.job_seeker_id
        return None

    def has_object_permission(self, request, view, obj):
        job_seeker = getattr(request.user, 'jobseeker', None)
        if job_seeker is None:
            return False
        return self._get_job_seeker_id(obj) == job_seeker.id
