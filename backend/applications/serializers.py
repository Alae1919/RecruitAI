from rest_framework import serializers

from applications.models import Application, Feedback, Resume, ResumeData


class ResumeDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeData
        fields = ['skills', 'experience', 'education', 'languages', 'summary', 'parsed_at']
        read_only_fields = fields


class ResumeSerializer(serializers.ModelSerializer):
    parsed = ResumeDataSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id', 'label', 'is_default', 'parsing_status',
            'task_id', 'uploaded_at', 'file_url', 'parsed',
        ]
        read_only_fields = ['id', 'parsing_status', 'task_id', 'uploaded_at', 'parsed']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.original_file and request:
            return request.build_absolute_uri(obj.original_file.url)
        return None


class ResumeUploadSerializer(serializers.Serializer):
    original_file = serializers.FileField()
    label = serializers.CharField(max_length=100, required=False, allow_blank=True)
    make_default = serializers.BooleanField(default=False)

    def validate_original_file(self, value):
        from users.serializers import _validate_resume_file
        return _validate_resume_file(value)


class ApplicationSerializer(serializers.ModelSerializer):
    job_offer_title = serializers.CharField(source='job_offer.title', read_only=True)
    candidate_name = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    eligibility_score = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'job_offer_title', 'status', 'applied_at', 'updated_at',
            'candidate_name', 'resume_url', 'eligibility_score',
        ]

    def get_candidate_name(self, obj):
        return obj.job_seeker.user.get_full_name() or obj.job_seeker.user.email

    def get_resume_url(self, obj):
        request = self.context.get('request')
        if obj.resume and obj.resume.original_file and request:
            return request.build_absolute_uri(obj.resume.original_file.url)
        return None

    def get_eligibility_score(self, obj):
        try:
            return obj.cv_analysis.eligibility_score
        except Exception:
            return None


class ApplicationCreateSerializer(serializers.Serializer):
    job_offer_id = serializers.IntegerField()
    resume_id = serializers.IntegerField(required=False, allow_null=True)


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'interview', 'recruiter', 'comments', 'rating', 'created_at']
