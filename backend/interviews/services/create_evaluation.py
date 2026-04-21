import logging

from django.conf import settings
from django.db import transaction

from interviews.models import Answer, AnswerEvaluation, Interview, InterviewEvaluation

logger = logging.getLogger(__name__)


def create_answer_evaluation(
    *,
    answer: Answer,
    score: float,
    explanation: str,
    model_used: str,
    prompt_version: str,
) -> AnswerEvaluation:
    evaluation, created = AnswerEvaluation.objects.get_or_create(
        answer=answer,
        defaults={
            'raw_score': score,
            'final_score': score,
            'model_used': model_used,
            'prompt_version': prompt_version,
            'explanation': explanation,
            'input_snapshot': {
                'question_text': answer.question.question_text,
                'transcript': answer.transcript or '',
            },
        },
    )
    if created:
        _try_finalize_interview(answer.interview_id)
    return evaluation


def _try_finalize_interview(interview_id: int) -> None:
    threshold = getattr(settings, 'RECRUITMENT', {}).get('EVALUATION_PASS_THRESHOLD', 6.0)

    with transaction.atomic():
        # Lock the interview row to serialise concurrent finalization calls.
        try:
            interview = Interview.objects.select_for_update().get(id=interview_id)
        except Interview.DoesNotExist:
            return

        if InterviewEvaluation.objects.filter(interview=interview).exists():
            logger.info(f'InterviewEvaluation already exists for interview {interview_id}; skipping.')
            return

        total_answers = interview.answers.count()
        if total_answers == 0:
            return

        evaluations = list(AnswerEvaluation.objects.filter(answer__interview=interview))
        logger.info(f'Interview {interview_id}: {len(evaluations)}/{total_answers} answers evaluated')

        if len(evaluations) < total_answers:
            return

        scores = [e.final_score for e in evaluations]
        total_score = sum(scores) / len(scores)

        decision = (
            InterviewEvaluation.Decision.ACCEPTED
            if total_score >= threshold
            else InterviewEvaluation.Decision.REJECTED
        )
        reasoning = (
            f'Average score {total_score:.1f} '
            + ('exceeds' if total_score >= threshold else 'is below')
            + f' the configured threshold of {threshold}.'
        )

        InterviewEvaluation.objects.create(
            interview=interview,
            total_score=total_score,
            decision=decision,
            decision_source=InterviewEvaluation.DecisionSource.RULE,
            reasoning=reasoning,
            inputs_snapshot={
                'answer_evaluation_ids': [e.id for e in evaluations],
                'weights': 'equal',
                'threshold': threshold,
            },
        )
        logger.info(
            f'Created InterviewEvaluation for interview {interview_id}: '
            f'score={total_score:.2f} decision={decision}'
        )
