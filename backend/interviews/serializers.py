from rest_framework import serializers
from interviews.models import Interview,Question,InterviewResult

class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

"""
class InterviewSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Interview
        fields = ['id', 'application', 'interview_date', 'interview_link', 'status', 'created_at']
"""
class InterviewResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewResult
        fields = ['score', 'processed_at']

class InterviewSerializer(serializers.ModelSerializer):
    result = InterviewResultSerializer(source='interviewresult', read_only=True)
    offer_name = serializers.CharField(source='application.job_offer.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id',
            'offer_name',
            'interview_date', 
            'interview_link',
            'status',
            'status_display',
            'result'
        ]

# api/serializers.py
class RecruiterInterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    
    offer_title = serializers.CharField(source='application.job_offer.title')
    result = InterviewResultSerializer(source='interviewresult', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id',
            'candidate_name',
            'offer_title',
            'interview_date',
            'status',
            'status_display',
            'interview_link',
            'result'
        ]

    def get_candidate_name(self, obj):
        return f"{obj.application.job_seeker.user.first_name} {obj.application.job_seeker.user.last_name}"