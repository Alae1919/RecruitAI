import logging

from django.conf import settings
from django.db import transaction

from interviews.models import Answer, AnswerEvaluation, InterviewEvaluation

logger = logging.getLogger(__name__)


def create_answer_evaluation(
    *,
    answer: Answer,
    score: float,
    explanation: str,
    model_used: str,
    prompt_version: str,
) -> AnswerEvaluation:
    if AnswerEvaluation.objects.filter(answer=answer).exists():
        return AnswerEvaluation.objects.get(answer=answer)

    evaluation = AnswerEvaluation.objects.create(
        answer=answer,
        raw_score=score,
        final_score=score,
        model_used=model_used,
        prompt_version=prompt_version,
        explanation=explanation,
        input_snapshot={
            'question_text': answer.question.question_text,
            'transcript': answer.transcript or '',
        },
    )
    _try_finalize_interview(answer.interview)
    return evaluation


def _try_finalize_interview(interview) -> None:
    total_answers = interview.answers.count()
    if total_answers == 0:
        return

    evaluated = AnswerEvaluation.objects.filter(answer__interview=interview).count()
    logger.info(f'Interview {interview.id}: {evaluated}/{total_answers} answers evaluated')

    if evaluated < total_answers:
        return

    threshold = getattr(settings, 'RECRUITMENT', {}).get('EVALUATION_PASS_THRESHOLD', 6.0)

    evaluations = AnswerEvaluation.objects.filter(answer__interview=interview)
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

    with transaction.atomic():
        evaluation, created = InterviewEvaluation.objects.get_or_create(
            interview=interview,
            defaults={
                'total_score': total_score,
                'decision': decision,
                'decision_source': InterviewEvaluation.DecisionSource.RULE,
                'reasoning': reasoning,
                'inputs_snapshot': {
                    'answer_evaluation_ids': list(evaluations.values_list('id', flat=True)),
                    'weights': 'equal',
                    'threshold': threshold,
                },
            },
        )
        action = 'Created' if created else 'Already existed'
        logger.info(
            f'{action} InterviewEvaluation for interview {interview.id}: '
            f'score={total_score:.2f} decision={decision}'
        )
