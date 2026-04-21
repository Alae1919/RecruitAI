from rest_framework import serializers

from interviews.models import (
    Answer,
    AnswerEvaluation,
    Interview,
    InterviewEvaluation,
    Question,
    QuestionSet,
)


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'source', 'order', 'created_at']
        read_only_fields = ['id', 'source', 'created_at']


class QuestionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['question_text', 'order']

    def validate(self, data):
        question_set = self.context.get('question_set')
        if question_set and question_set.status == QuestionSet.Status.LOCKED:
            raise serializers.ValidationError('Cannot modify questions on a LOCKED QuestionSet.')
        return data


class QuestionSetSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = QuestionSet
        fields = [
            'id', 'job_offer', 'version', 'status', 'question_type',
            'target_count', 'recruiter_instructions', 'model_used',
            'prompt_version', 'task_id', 'questions', 'question_count',
            'created_at', 'updated_at', 'locked_at',
        ]
        read_only_fields = [
            'id', 'version', 'model_used', 'prompt_version', 'task_id',
            'created_at', 'updated_at', 'locked_at',
        ]

    def get_question_count(self, obj):
        return obj.questions.count()

    def validate_status(self, value):
        instance = self.instance
        if instance is None:
            return value
        if instance.status == QuestionSet.Status.LOCKED:
            raise serializers.ValidationError('A LOCKED QuestionSet cannot be modified.')
        allowed_transitions = {
            QuestionSet.Status.DRAFT: [QuestionSet.Status.READY],
            QuestionSet.Status.READY: [QuestionSet.Status.LOCKED],
            QuestionSet.Status.FAILED: [QuestionSet.Status.DRAFT],
        }
        if value not in allowed_transitions.get(instance.status, []):
            raise serializers.ValidationError(
                f"Cannot transition from {instance.status} to {value}."
            )
        return value


class QuestionSetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionSet
        fields = ['question_type', 'target_count', 'recruiter_instructions']

    def validate_target_count(self, value):
        if value < 1 or value > 20:
            raise serializers.ValidationError('target_count must be between 1 and 20.')
        return value


class AnswerEvaluationSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='answer.question.question_text', read_only=True)
    transcript = serializers.CharField(source='answer.transcript', read_only=True)

    class Meta:
        model = AnswerEvaluation
        fields = [
            'id', 'question_text', 'transcript',
            'raw_score', 'final_score', 'explanation',
            'model_used', 'prompt_version', 'rubric_version',
            'input_snapshot', 'evaluated_at',
        ]
        read_only_fields = fields


class InterviewEvaluationSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()

    class Meta:
        model = InterviewEvaluation
        fields = [
            'id', 'total_score', 'decision', 'decision_source',
            'reasoning', 'inputs_snapshot', 'created_at', 'answers',
        ]
        read_only_fields = [
            'id', 'total_score', 'inputs_snapshot', 'created_at',
        ]

    def get_answers(self, obj):
        evaluations = AnswerEvaluation.objects.filter(
            answer__interview=obj.interview
        ).select_related('answer__question')
        return AnswerEvaluationSerializer(evaluations, many=True).data


class InterviewEvaluationDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=InterviewEvaluation.Decision.choices)
    reasoning = serializers.CharField()


class InterviewSerializer(serializers.ModelSerializer):
    offer_name = serializers.CharField(source='application.job_offer.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    evaluation = InterviewEvaluationSerializer(read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'offer_name', 'interview_date', 'interview_link',
            'status', 'status_display', 'started_at', 'created_at', 'evaluation',
        ]


class RecruiterInterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    offer_title = serializers.CharField(source='application.job_offer.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    evaluation = InterviewEvaluationSerializer(read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'candidate_name', 'offer_title',
            'interview_date', 'status', 'status_display',
            'interview_link', 'evaluation',
        ]

    def get_candidate_name(self, obj):
        u = obj.application.job_seeker.user
        return f'{u.first_name} {u.last_name}'.strip() or u.email
