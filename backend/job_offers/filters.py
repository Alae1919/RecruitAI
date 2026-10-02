import django_filters

from job_offers.models import JobOffer


class JobOfferFilter(django_filters.FilterSet):
    location = django_filters.CharFilter(lookup_expr='icontains')
    title = django_filters.CharFilter(lookup_expr='icontains')
    experience_min = django_filters.NumberFilter(field_name='experience_min', lookup_expr='lte')
    status = django_filters.ChoiceFilter(choices=JobOffer.Status.choices)
    employment_type = django_filters.ChoiceFilter(choices=JobOffer.EmploymentType.choices)

    class Meta:
        model = JobOffer
        fields = ['location', 'title', 'experience_min', 'status', 'employment_type']
