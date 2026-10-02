from django.conf import settings
from django.db.models import Avg, Count, F, Q
from django.db.models.functions import Round

from applications.models import Application
from job_offers.models import JobOffer
from users.models import Recruiter


def list_public_job_offers(filters: dict | None = None):
    qs = (
        JobOffer.objects.filter(status=JobOffer.Status.OPEN)
        .select_related('recruiter__user')
        .order_by('-created_at')
    )
    return qs


def with_application_stats(queryset):
    """Annotate offers with the pipeline numbers shown in the recruiter table.

    - applicants_count: every application received
    - shortlisted_count: not rejected, and either past the screening gate
      (accepted/offer/hired) or with a CV score >= AUTO_SHORTLIST_SCORE
    - avg_match: mean CV eligibility score on a 0-100 scale (null if none analysed)
    """
    S = Application.Status
    threshold = settings.RECRUITMENT['AUTO_SHORTLIST_SCORE']
    advanced = Q(application__status__in=[S.ACCEPTED, S.OFFER, S.HIRED])
    # offers that switched auto-shortlist off never promote on CV score alone
    auto_shortlist = Q(screening_config__auto_shortlist__isnull=True) | ~Q(screening_config__auto_shortlist=False)
    strong_cv = (
        Q(application__cv_analysis__eligibility_score__gte=threshold)
        & ~Q(application__status=S.REJECTED)
        & auto_shortlist
    )
    return queryset.annotate(
        applicants_count=Count('application', distinct=True),
        shortlisted_count=Count('application', filter=advanced | strong_cv, distinct=True),
        avg_match=Round(Avg(F('application__cv_analysis__eligibility_score') * 10)),
    )


def list_recruiter_job_offers(recruiter: Recruiter):
    return with_application_stats(
        JobOffer.objects.filter(recruiter=recruiter).prefetch_related('question_sets')
    ).order_by('-created_at')
