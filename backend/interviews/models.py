from django.db import models

PROMPT_VERSION = 'v2'


class QuestionSet(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        READY = 'ready', 'Ready'
        LOCKED = 'locked', 'Locked'
        FAILED = 'failed', 'Failed'

    class QuestionType(models.TextChoices):
        TECHNICAL = 'technical', 'Technical'
        HR = 'hr', 'HR'
        MIXED = 'mixed', 'Mixed'

    job_offer = models.ForeignKey(
        'job_offers.JobOffer', on_delete=models.CASCADE, related_name='question_sets'
    )
    version = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    question_type = models.CharField(
        max_length=16, choices=QuestionType.choices, default=QuestionType.TECHNICAL
    )
    target_count = models.PositiveSmallIntegerField(default=5)
    recruiter_instructions = models.TextField(blank=True)
    model_used = models.CharField(max_length=100, blank=True)
    prompt_version = models.CharField(max_length=20, blank=True)
    task_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('job_offer', 'version')
        indexes = [
            models.Index(fields=['job_offer', 'status']),
        ]

    def __str__(self):
        return f"QuestionSet v{self.version} [{self.status}] – job_offer {self.job_offer_id}"


class Interview(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        SCHEDULED = 'scheduled', 'Scheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELED = 'canceled', 'Canceled'

    application = models.OneToOneField(
        'applications.Application', on_delete=models.CASCADE, related_name='interview'
    )
    question_set = models.ForeignKey(
        QuestionSet, null=True, blank=True, on_delete=models.SET_NULL, related_name='interviews'
    )
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_link = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.AVAILABLE)
    started_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Interview {self.id}"


class Question(models.Model):
    class Source(models.TextChoices):
        BASE = 'base', 'Base'
        PROBE = 'probe', 'Probe'

    question_set = models.ForeignKey(
        QuestionSet, null=True, blank=True, on_delete=models.CASCADE, related_name='questions'
    )
    interview = models.ForeignKey(
        Interview, null=True, blank=True, on_delete=models.CASCADE, related_name='probe_questions'
    )
    source = models.CharField(max_length=8, choices=Source.choices, default=Source.BASE)
    order = models.PositiveSmallIntegerField(default=0)
    question_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(question_set__isnull=False, interview__isnull=True)
                    | models.Q(question_set__isnull=True, interview__isnull=False)
                ),
                name='question_source_xor',
            )
        ]
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.question_text[:80]


class Answer(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    candidate_video = models.FileField(upload_to='interview_videos/', blank=True, null=True)
    transcript = models.TextField(blank=True, null=True)
    evaluation_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer {self.id} to Q{self.question_id}"


class AnswerEvaluation(models.Model):
    answer = models.OneToOneField(Answer, on_delete=models.CASCADE, related_name='evaluation')
    raw_score = models.FloatField()
    final_score = models.FloatField()
    rubric_version = models.CharField(max_length=20, default='v1')
    model_used = models.CharField(max_length=100)
    prompt_version = models.CharField(max_length=20)
    explanation = models.TextField()
    input_snapshot = models.JSONField()
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk and not self._state.adding:
            raise RuntimeError('AnswerEvaluation is immutable — it cannot be updated.')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"AnswerEval {self.id}: {self.final_score}"


class InterviewEvaluation(models.Model):
    class Decision(models.TextChoices):
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        UNDECIDED = 'undecided', 'Undecided'

    class DecisionSource(models.TextChoices):
        RULE = 'rule', 'Rule'
        RECRUITER = 'recruiter', 'Recruiter'

    _MUTABLE_FIELDS = frozenset({'decision', 'decision_source', 'reasoning'})

    interview = models.OneToOneField(
        Interview, on_delete=models.CASCADE, related_name='evaluation'
    )
    total_score = models.FloatField()
    decision = models.CharField(max_length=16, choices=Decision.choices, default=Decision.UNDECIDED)
    decision_source = models.CharField(
        max_length=16, choices=DecisionSource.choices, default=DecisionSource.RULE
    )
    reasoning = models.TextField()
    inputs_snapshot = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk and not self._state.adding:
            update_fields = set(kwargs.get('update_fields') or [])
            if update_fields and not update_fields.issubset(self._MUTABLE_FIELDS):
                raise RuntimeError(
                    'InterviewEvaluation: only decision, decision_source, and reasoning are mutable.'
                )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"InterviewEval {self.id}: {self.total_score} [{self.decision}]"
