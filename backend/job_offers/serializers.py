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
            'id', 'title', 'description', 'requirements', 'skills', 'nice_skills',
            'experience_min', 'experience_max', 'department', 'employment_type',
            'screening_config', 'location', 'salary_range', 'status',
            'recruiter_name', 'question_sets_count',
            'applicants_count', 'shortlisted_count', 'avg_match',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        low = attrs.get('experience_min', getattr(self.instance, 'experience_min', 0))
        high = attrs.get('experience_max', getattr(self.instance, 'experience_max', None))
        if high is not None and low is not None and high < low:
            raise serializers.ValidationError({'experience_max': 'Must be greater than or equal to the minimum.'})
        return attrs

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
