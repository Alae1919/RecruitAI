from rest_framework import serializers

from job_offers.models import JobOffer


class JobOfferSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.SerializerMethodField(read_only=True)
    question_sets_count = serializers.SerializerMethodField(read_only=True)
    # Present only on the recruiter list (see selectors.with_application_stats)
    applicants_count = serializers.IntegerField(read_only=True)
    shortlisted_count = serializers.IntegerField(read_only=True)
    avg_match = serializers.FloatField(read_only=True)

    class Meta:
        model = JobOffer
        fields = [
            'id', 'title', 'description', 'requirements', 'skills',
            'experience_min', 'location', 'salary_range', 'status',
            'recruiter_name', 'question_sets_count',
            'applicants_count', 'shortlisted_count', 'avg_match',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_recruiter_name(self, obj):
        return obj.recruiter.company_name if hasattr(obj, 'recruiter') else None

    def get_question_sets_count(self, obj):
        try:
            return obj.question_sets.count()
        except Exception:
            return 0


class JobDescriptionGenerateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    skills = serializers.ListField(child=serializers.CharField(), min_length=1)
    experience_level = serializers.CharField(max_length=100)
