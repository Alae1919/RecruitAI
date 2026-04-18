from datetime import timezone
from rest_framework import serializers
from .models import JobOffer


#############################################################################################################


#############################################################################################################


#############################################################################################################

class JobOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobOffer
        fields = ['id', 'title', 'description','requirements', 'location', 'salary_range']
        read_only_fields = ['id']

    def validate_deadline(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("The deadline must be a future date.")
        return value


