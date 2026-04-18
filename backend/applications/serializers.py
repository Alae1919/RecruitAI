from rest_framework import serializers
from .models import Application,Feedback


class ApplicationSerializer(serializers.ModelSerializer):
    job_offer_title = serializers.CharField(source='job_offer.title', read_only=True)
    candidate_name = serializers.CharField(source='job_seeker.user.get_full_name', read_only=True)
    resume_url = serializers.SerializerMethodField()
    class Meta:
        model = Application
        fields = ['id', 'job_offer_title', 'status', 'applied_at', 'updated_at','candidate_name','resume_url','extracted_text']
    def get_resume_url(self, obj):
        request = self.context.get('request')  # Récupère l'objet `request` du contexte
        if obj.job_seeker.resume and request is not None:
            print(obj.job_seeker.resume.url)
            print(request.build_absolute_uri(obj.job_seeker.resume.url))
            return request.build_absolute_uri(obj.job_seeker.resume.url)
        return None

 


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'interview', 'recruiter', 'comments', 'rating', 'created_at']