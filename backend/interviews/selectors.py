from interviews.models import Answer, Interview, QuestionSet, Question
from users.models import Recruiter, JobSeeker


def list_recruiter_interviews(recruiter: Recruiter):
    return (
        Interview.objects.filter(application__job_offer__recruiter=recruiter)
        .select_related(
            'application__job_seeker__user',
            'application__job_offer',
            'question_set',
        )
        .prefetch_related('answers__evaluation', 'evaluation')
        .order_by('-created_at')
    )


def list_jobseeker_interviews(job_seeker: JobSeeker):
    return (
        Interview.objects.filter(application__job_seeker=job_seeker)
        .select_related('application__job_offer', 'question_set', 'evaluation')
        .order_by('-created_at')
    )


def get_interview_questions(interview: Interview) -> list:
    base_questions = list(
        Question.objects.filter(question_set=interview.question_set).order_by('order', 'created_at')
    ) if interview.question_set else []
    probe_questions = list(
        Question.objects.filter(interview=interview).order_by('order', 'created_at')
    )
    return base_questions + probe_questions


def interview_question_ids(interview: Interview) -> set[int]:
    return {q.id for q in get_interview_questions(interview)}


def all_questions_answered(interview: Interview) -> bool:
    expected = interview_question_ids(interview)
    if not expected:
        return False
    answered = set(
        Answer.objects.filter(interview=interview, question_id__in=expected).values_list('question_id', flat=True)
    )
    return expected <= answered


def list_question_sets(job_offer_id: int, recruiter: Recruiter):
    return (
        QuestionSet.objects.filter(job_offer_id=job_offer_id, job_offer__recruiter=recruiter)
        .prefetch_related('questions')
        .order_by('-version')
    )
