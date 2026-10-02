from django.core.exceptions import ObjectDoesNotExist
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
    stage = serializers.CharField(read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job_offer_title', 'status', 'stage', 'applied_at', 'updated_at',
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


class CandidateSerializer(ApplicationSerializer):
    """Recruiter-only view of an applicant: contact info, AI analysis, parsed CV,
    interview progress and a timeline. Never use this for the candidate's own lists."""

    candidate_email = serializers.SerializerMethodField()
    candidate_phone = serializers.SerializerMethodField()
    candidate_address = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    analysis = serializers.SerializerMethodField()
    resume_profile = serializers.SerializerMethodField()
    interview = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()

    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + [
            'candidate_email', 'candidate_phone', 'candidate_address', 'headline',
            'match_score', 'analysis', 'resume_profile', 'interview', 'timeline',
        ]

    @staticmethod
    def _parsed(obj):
        try:
            return obj.resume.parsed if obj.resume_id else None
        except ObjectDoesNotExist:
            return None

    @staticmethod
    def _cv_analysis(obj):
        try:
            return obj.cv_analysis
        except ObjectDoesNotExist:
            return None

    @staticmethod
    def _interview(obj):
        try:
            return obj.interview
        except ObjectDoesNotExist:
            return None

    def get_candidate_email(self, obj):
        return obj.job_seeker.user.email

    def get_candidate_phone(self, obj):
        return obj.job_seeker.user.phone

    def get_candidate_address(self, obj):
        return obj.job_seeker.user.address

    def get_headline(self, obj):
        parsed = self._parsed(obj)
        latest = parsed.experience[0] if parsed and parsed.experience else None
        if not isinstance(latest, dict):
            return None
        return ' · '.join(str(latest[k]) for k in ('role', 'company') if latest.get(k)) or None

    def get_match_score(self, obj):
        analysis = self._cv_analysis(obj)
        return round(analysis.eligibility_score * 10) if analysis else None

    def get_analysis(self, obj):
        analysis = self._cv_analysis(obj)
        if not analysis:
            return None
        details = analysis.analysis_details or {}
        return {
            'strengths': details.get('strengths', []),
            'gaps': details.get('gaps', []),
            'recommendation': details.get('recommendation', ''),
            'analyzed_at': analysis.created_at,
        }

    def get_resume_profile(self, obj):
        parsed = self._parsed(obj)
        return ResumeDataSerializer(parsed).data if parsed else None

    def get_interview(self, obj):
        from interviews.selectors import get_interview_questions

        interview = self._interview(obj)
        if not interview:
            return None
        try:
            evaluation = interview.evaluation
        except ObjectDoesNotExist:
            evaluation = None
        return {
            'id': interview.id,
            'status': interview.status,
            'interview_date': interview.interview_date,
            'interview_link': interview.interview_link,
            'questions': [
                {'id': q.id, 'text': q.question_text, 'source': q.source}
                for q in get_interview_questions(interview)
            ],
            'evaluation': {
                'total_score': evaluation.total_score,
                'decision': evaluation.decision,
            } if evaluation else None,
        }

    def get_timeline(self, obj):
        events = [{'key': 'applied', 'label': 'Applied', 'at': obj.applied_at}]
        analysis = self._cv_analysis(obj)
        if analysis:
            events.append({'key': 'ai_screened', 'label': 'AI-screened', 'at': analysis.created_at})
        interview = self._interview(obj)
        if interview:
            events.append({'key': 'interview', 'label': 'Interview invited', 'at': interview.created_at})
            try:
                events.append({'key': 'evaluated', 'label': 'AI evaluation', 'at': interview.evaluation.created_at})
            except ObjectDoesNotExist:
                pass
        closing = {
            Application.Status.OFFER: ('offer', 'Offer made'),
            Application.Status.HIRED: ('hired', 'Hired'),
            Application.Status.REJECTED: ('rejected', 'Rejected'),
        }
        if obj.status in closing:
            key, label = closing[obj.status]
            events.append({'key': key, 'label': label, 'at': obj.updated_at})
        return events


class ApplicationCreateSerializer(serializers.Serializer):
    job_offer_id = serializers.IntegerField()
    resume_id = serializers.IntegerField(required=False, allow_null=True)


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'interview', 'recruiter', 'comments', 'rating', 'created_at']
