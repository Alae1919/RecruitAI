from interviews.models import InterviewEvaluation
from users.models import Recruiter


def override_decision(
    *,
    interview_id: int,
    recruiter: Recruiter,
    decision: str,
    reasoning: str,
) -> InterviewEvaluation:
    from rest_framework.exceptions import PermissionDenied, ValidationError

    evaluation = InterviewEvaluation.objects.select_related(
        'interview__application__job_offer__recruiter'
    ).get(interview_id=interview_id)

    if evaluation.interview.application.job_offer.recruiter_id != recruiter.id:
        raise PermissionDenied('Not the owner of this job offer.')

    valid_decisions = {c[0] for c in InterviewEvaluation.Decision.choices}
    if decision not in valid_decisions:
        raise ValidationError(f'Invalid decision. Choose from: {valid_decisions}')

    evaluation.decision = decision
    evaluation.decision_source = InterviewEvaluation.DecisionSource.RECRUITER
    evaluation.reasoning = reasoning
    evaluation.save(update_fields=['decision', 'decision_source', 'reasoning'])
    return evaluation
