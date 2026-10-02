from unittest.mock import patch

from django.test import TestCase
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.test import APITestCase
from rest_framework import status as http_status

from users.models import User, Recruiter, JobSeeker, Role, UserRole
from job_offers.models import JobOffer
from applications.models import Application, Resume
from interviews.models import (
    QuestionSet, Interview, Question, Answer,
    AnswerEvaluation, InterviewEvaluation,
)
from interviews.services.generate_question_set import generate_question_set, regenerate_question_set
from interviews.services.lock_question_set import lock_question_set
from interviews.services.create_evaluation import create_answer_evaluation
from interviews.services.override_decision import override_decision


# ---------------------------------------------------------------------------
# Shared test helpers
# ---------------------------------------------------------------------------

def _make_user(email, role_name=None):
    user = User.objects.create_user(username=email, email=email, password='pass')
    if role_name:
        role, _ = Role.objects.get_or_create(role_name=role_name)
        UserRole.objects.create(user=user, role=role)
    return user


def _make_recruiter(email='rec@test.com'):
    user = _make_user(email, role_name='RECRUITER')
    return Recruiter.objects.create(user=user, company_name='ACME')


def _make_job_seeker(email='js@test.com'):
    user = _make_user(email, role_name='JOBSEEKER')
    return JobSeeker.objects.create(user=user)


def _make_job_offer(recruiter, title='Backend Engineer'):
    return JobOffer.objects.create(
        recruiter=recruiter,
        title=title,
        description='Build REST APIs.',
        requirements='Python 3+ years.',
        skills=['python', 'django'],
    )


def _make_question_set(job_offer, *, qs_status=QuestionSet.Status.DRAFT, version=1):
    return QuestionSet.objects.create(
        job_offer=job_offer,
        version=version,
        status=qs_status,
        target_count=3,
    )


def _make_resume(job_seeker, *, is_default=True):
    return Resume.objects.create(
        job_seeker=job_seeker,
        original_file='resumes/test.pdf',
        label='Test CV',
        is_default=is_default,
        parsing_status=Resume.ParsingStatus.READY,
    )


def _make_application(job_seeker, job_offer, resume=None):
    return Application.objects.create(
        job_seeker=job_seeker,
        job_offer=job_offer,
        resume=resume,
        status=Application.Status.PENDING,
    )


def _make_interview(application, question_set=None):
    return Interview.objects.create(
        application=application,
        question_set=question_set,
        status=Interview.Status.AVAILABLE,
    )


def _make_question(*, question_set=None, interview=None, text='What is Python?'):
    source = Question.Source.BASE if question_set else Question.Source.PROBE
    return Question.objects.create(
        question_set=question_set,
        interview=interview,
        source=source,
        question_text=text,
    )


def _make_answer(interview, question, transcript='Python is a high-level language.'):
    return Answer.objects.create(
        interview=interview,
        question=question,
        transcript=transcript,
    )


def _make_interview_evaluation(interview, *, score=7.0, decision=InterviewEvaluation.Decision.ACCEPTED):
    return InterviewEvaluation.objects.create(
        interview=interview,
        total_score=score,
        decision=decision,
        decision_source=InterviewEvaluation.DecisionSource.RULE,
        reasoning='Auto.',
        inputs_snapshot={'answer_evaluation_ids': [], 'threshold': 6.0},
    )


# ---------------------------------------------------------------------------
# Model immutability — AnswerEvaluation
# ---------------------------------------------------------------------------

class TestAnswerEvaluationImmutability(TestCase):
    def setUp(self):
        recruiter = _make_recruiter()
        job_offer = _make_job_offer(recruiter)
        qs = _make_question_set(job_offer, qs_status=QuestionSet.Status.LOCKED)
        job_seeker = _make_job_seeker()
        resume = _make_resume(job_seeker)
        application = _make_application(job_seeker, job_offer, resume)
        interview = _make_interview(application, qs)
        question = _make_question(question_set=qs)
        answer = _make_answer(interview, question)
        self.eval = AnswerEvaluation.objects.create(
            answer=answer, raw_score=7.0, final_score=7.0,
            model_used='deepseek-reasoner', prompt_version='v2',
            explanation='Good.', input_snapshot={'question_text': 'Q?', 'transcript': 'A.'},
        )

    def test_initial_create_succeeds(self):
        self.assertIsNotNone(self.eval.pk)
        self.assertAlmostEqual(self.eval.final_score, 7.0)

    def test_any_save_raises_runtime_error(self):
        self.eval.final_score = 9.0
        with self.assertRaises(RuntimeError):
            self.eval.save()

    def test_save_without_update_fields_raises(self):
        with self.assertRaises(RuntimeError):
            self.eval.save()


# ---------------------------------------------------------------------------
# Model immutability — InterviewEvaluation
# ---------------------------------------------------------------------------

class TestInterviewEvaluationImmutability(TestCase):
    def setUp(self):
        recruiter = _make_recruiter()
        job_offer = _make_job_offer(recruiter)
        qs = _make_question_set(job_offer, qs_status=QuestionSet.Status.LOCKED)
        job_seeker = _make_job_seeker()
        resume = _make_resume(job_seeker)
        application = _make_application(job_seeker, job_offer, resume)
        interview = _make_interview(application, qs)
        self.interview = interview
        self.eval = _make_interview_evaluation(interview, score=7.0)

    def test_initial_create_succeeds(self):
        self.assertIsNotNone(self.eval.pk)

    def test_bare_save_raises(self):
        self.eval.total_score = 9.0
        with self.assertRaises(RuntimeError):
            self.eval.save()

    def test_immutable_field_via_update_fields_raises(self):
        with self.assertRaises(RuntimeError):
            self.eval.save(update_fields=['total_score'])

    def test_mutable_fields_update_succeeds(self):
        self.eval.decision = InterviewEvaluation.Decision.REJECTED
        self.eval.decision_source = InterviewEvaluation.DecisionSource.RECRUITER
        self.eval.reasoning = 'Overridden by recruiter.'
        self.eval.save(update_fields=['decision', 'decision_source', 'reasoning'])
        self.eval.refresh_from_db()
        self.assertEqual(self.eval.decision, InterviewEvaluation.Decision.REJECTED)
        self.assertEqual(self.eval.decision_source, InterviewEvaluation.DecisionSource.RECRUITER)
        self.assertAlmostEqual(self.eval.total_score, 7.0)  # score unchanged


# ---------------------------------------------------------------------------
# generate_question_set service
# ---------------------------------------------------------------------------

class TestGenerateQuestionSetService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)

    @patch('interviews.services.generate_question_set.transaction.on_commit')
    def test_creates_draft_question_set_at_version_1(self, _):
        qs = generate_question_set(
            job_offer_id=self.job_offer.id,
            recruiter=self.recruiter,
            question_type=QuestionSet.QuestionType.TECHNICAL,
            target_count=5,
        )
        self.assertEqual(qs.status, QuestionSet.Status.DRAFT)
        self.assertEqual(qs.version, 1)
        self.assertEqual(qs.target_count, 5)
        self.assertEqual(qs.job_offer_id, self.job_offer.id)
        self.assertIsNotNone(qs.task_id)

    @patch('interviews.services.generate_question_set.transaction.on_commit')
    def test_version_increments_on_each_call(self, _):
        generate_question_set(job_offer_id=self.job_offer.id, recruiter=self.recruiter)
        qs2 = generate_question_set(job_offer_id=self.job_offer.id, recruiter=self.recruiter)
        self.assertEqual(qs2.version, 2)

    def test_raises_permission_denied_for_wrong_recruiter(self):
        other = _make_recruiter(email='other@test.com')
        with self.assertRaises(PermissionDenied):
            generate_question_set(job_offer_id=self.job_offer.id, recruiter=other)

    def test_raises_does_not_exist_for_bad_job_offer(self):
        with self.assertRaises(JobOffer.DoesNotExist):
            generate_question_set(job_offer_id=99999, recruiter=self.recruiter)


# ---------------------------------------------------------------------------
# regenerate_question_set service
# ---------------------------------------------------------------------------

class TestRegenerateQuestionSetService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        self.qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.DRAFT)
        _make_question(question_set=self.qs, text='Old question?')

    @patch('interviews.services.generate_question_set.transaction.on_commit')
    def test_clears_questions_and_resets_to_draft(self, _):
        self.assertEqual(self.qs.questions.count(), 1)
        regenerate_question_set(
            question_set_id=self.qs.id,
            recruiter=self.recruiter,
            instructions='Focus on async patterns.',
        )
        self.qs.refresh_from_db()
        self.assertEqual(self.qs.status, QuestionSet.Status.DRAFT)
        self.assertEqual(self.qs.questions.count(), 0)
        self.assertEqual(self.qs.recruiter_instructions, 'Focus on async patterns.')

    def test_raises_validation_error_if_locked(self):
        self.qs.status = QuestionSet.Status.LOCKED
        self.qs.save(update_fields=['status', 'updated_at'])
        with self.assertRaises(ValidationError):
            regenerate_question_set(question_set_id=self.qs.id, recruiter=self.recruiter)

    def test_raises_permission_denied_for_wrong_recruiter(self):
        other = _make_recruiter(email='other@test.com')
        with self.assertRaises(PermissionDenied):
            regenerate_question_set(question_set_id=self.qs.id, recruiter=other)


# ---------------------------------------------------------------------------
# lock_question_set service
# ---------------------------------------------------------------------------

class TestLockQuestionSetService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)

    def test_transitions_ready_to_locked(self):
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.READY)
        result = lock_question_set(question_set_id=qs.id, recruiter=self.recruiter)
        result.refresh_from_db()
        self.assertEqual(result.status, QuestionSet.Status.LOCKED)
        self.assertIsNotNone(result.locked_at)

    def test_raises_validation_error_if_not_ready(self):
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.DRAFT)
        with self.assertRaises(ValidationError):
            lock_question_set(question_set_id=qs.id, recruiter=self.recruiter)

    def test_raises_permission_denied_for_wrong_recruiter(self):
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.READY)
        other = _make_recruiter(email='other@test.com')
        with self.assertRaises(PermissionDenied):
            lock_question_set(question_set_id=qs.id, recruiter=other)


# ---------------------------------------------------------------------------
# create_answer_evaluation service + auto-finalization
# ---------------------------------------------------------------------------

class TestCreateEvaluationService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.LOCKED)
        job_seeker = _make_job_seeker()
        resume = _make_resume(job_seeker)
        application = _make_application(job_seeker, self.job_offer, resume)
        self.interview = _make_interview(application, qs)
        self.question = _make_question(question_set=qs)
        self.answer = _make_answer(self.interview, self.question)

    def _eval(self, answer, score=8.0):
        return create_answer_evaluation(
            answer=answer, score=score, explanation='Good.',
            model_used='deepseek-reasoner', prompt_version='v2',
        )

    def test_creates_answer_evaluation(self):
        ev = self._eval(self.answer, score=8.0)
        self.assertIsNotNone(ev.pk)
        self.assertAlmostEqual(ev.final_score, 8.0)
        self.assertEqual(ev.answer_id, self.answer.id)

    def test_idempotent_returns_original_on_duplicate(self):
        ev1 = self._eval(self.answer, score=8.0)
        ev2 = self._eval(self.answer, score=2.0)
        self.assertEqual(ev1.id, ev2.id)
        self.assertAlmostEqual(ev2.final_score, 8.0)

    def test_input_snapshot_contains_question_and_transcript(self):
        ev = self._eval(self.answer)
        self.assertEqual(ev.input_snapshot['question_text'], self.question.question_text)
        self.assertEqual(ev.input_snapshot['transcript'], self.answer.transcript)

    def test_finalizes_interview_when_single_answer_scored(self):
        self._eval(self.answer, score=7.5)
        self.assertTrue(InterviewEvaluation.objects.filter(interview=self.interview).exists())
        ie = InterviewEvaluation.objects.get(interview=self.interview)
        self.assertAlmostEqual(ie.total_score, 7.5)
        self.assertEqual(ie.decision_source, InterviewEvaluation.DecisionSource.RULE)

    def test_does_not_finalize_until_all_answers_scored(self):
        q2 = _make_question(question_set=self.question.question_set, text='Q2?')
        answer2 = _make_answer(self.interview, q2, transcript='B.')
        self._eval(self.answer, score=8.0)
        self.assertFalse(InterviewEvaluation.objects.filter(interview=self.interview).exists())
        self._eval(answer2, score=6.0)
        self.assertTrue(InterviewEvaluation.objects.filter(interview=self.interview).exists())
        ie = InterviewEvaluation.objects.get(interview=self.interview)
        self.assertAlmostEqual(ie.total_score, 7.0)

    def test_decision_accepted_when_avg_above_threshold(self):
        self._eval(self.answer, score=8.0)
        ie = InterviewEvaluation.objects.get(interview=self.interview)
        self.assertEqual(ie.decision, InterviewEvaluation.Decision.ACCEPTED)

    def test_decision_rejected_when_avg_below_threshold(self):
        self._eval(self.answer, score=3.0)
        ie = InterviewEvaluation.objects.get(interview=self.interview)
        self.assertEqual(ie.decision, InterviewEvaluation.Decision.REJECTED)


# ---------------------------------------------------------------------------
# override_decision service
# ---------------------------------------------------------------------------

class TestOverrideDecisionService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.LOCKED)
        job_seeker = _make_job_seeker()
        resume = _make_resume(job_seeker)
        application = _make_application(job_seeker, self.job_offer, resume)
        interview = _make_interview(application, qs)
        self.interview = interview
        self.ie = _make_interview_evaluation(interview, score=4.5, decision=InterviewEvaluation.Decision.REJECTED)

    def test_overrides_decision_to_accepted(self):
        result = override_decision(
            interview_id=self.interview.id, recruiter=self.recruiter,
            decision='accepted', reasoning='Exceptional soft skills.',
        )
        result.refresh_from_db()
        self.assertEqual(result.decision, InterviewEvaluation.Decision.ACCEPTED)
        self.assertEqual(result.decision_source, InterviewEvaluation.DecisionSource.RECRUITER)
        self.assertEqual(result.reasoning, 'Exceptional soft skills.')

    def test_total_score_unchanged_after_override(self):
        override_decision(
            interview_id=self.interview.id, recruiter=self.recruiter,
            decision='accepted', reasoning='Override.',
        )
        self.ie.refresh_from_db()
        self.assertAlmostEqual(self.ie.total_score, 4.5)

    def test_raises_permission_denied_for_wrong_recruiter(self):
        other = _make_recruiter(email='other@test.com')
        with self.assertRaises(PermissionDenied):
            override_decision(
                interview_id=self.interview.id, recruiter=other,
                decision='accepted', reasoning='x',
            )

    def test_raises_validation_error_for_invalid_decision(self):
        with self.assertRaises(ValidationError):
            override_decision(
                interview_id=self.interview.id, recruiter=self.recruiter,
                decision='maybe', reasoning='x',
            )


# ---------------------------------------------------------------------------
# QuestionSet API (integration)
# ---------------------------------------------------------------------------

class TestQuestionSetAPI(APITestCase):
    def setUp(self):
        rec_user = _make_user('rec@api.com', role_name='RECRUITER')
        self.recruiter = Recruiter.objects.create(user=rec_user, company_name='Corp')
        self.rec_user = rec_user

        other_rec_user = _make_user('other@api.com', role_name='RECRUITER')
        self.other_recruiter = Recruiter.objects.create(user=other_rec_user, company_name='Other')
        self.other_rec_user = other_rec_user

        js_user = _make_user('js@api.com', role_name='JOBSEEKER')
        self.job_seeker = JobSeeker.objects.create(user=js_user)
        self.js_user = js_user

        self.job_offer = _make_job_offer(self.recruiter)

    @patch('interviews.services.generate_question_set.transaction.on_commit')
    def test_recruiter_can_generate_question_set(self, _):
        self.client.force_authenticate(user=self.rec_user)
        resp = self.client.post(
            f'/api/interviews/job-offers/{self.job_offer.id}/question-sets/',
            {'question_type': 'technical', 'target_count': 5},
        )
        self.assertEqual(resp.status_code, http_status.HTTP_202_ACCEPTED)
        self.assertEqual(resp.data['status'], 'draft')
        self.assertEqual(resp.data['version'], 1)

    def test_jobseeker_cannot_access_question_set_management(self):
        self.client.force_authenticate(user=self.js_user)
        resp = self.client.post(
            f'/api/interviews/job-offers/{self.job_offer.id}/question-sets/',
            {'question_type': 'technical', 'target_count': 3},
        )
        self.assertEqual(resp.status_code, http_status.HTTP_403_FORBIDDEN)

    def test_cannot_delete_locked_question_set(self):
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.LOCKED)
        self.client.force_authenticate(user=self.rec_user)
        resp = self.client.delete(f'/api/interviews/question-sets/{qs.id}/')
        self.assertEqual(resp.status_code, http_status.HTTP_400_BAD_REQUEST)

    def test_can_delete_draft_question_set(self):
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.DRAFT)
        self.client.force_authenticate(user=self.rec_user)
        resp = self.client.delete(f'/api/interviews/question-sets/{qs.id}/')
        self.assertEqual(resp.status_code, http_status.HTTP_204_NO_CONTENT)
        self.assertFalse(QuestionSet.objects.filter(id=qs.id).exists())

    def test_patch_cannot_change_job_offer(self):
        qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.DRAFT)
        other_offer = _make_job_offer(self.recruiter, title='Other')
        self.client.force_authenticate(user=self.rec_user)
        self.client.patch(
            f'/api/interviews/question-sets/{qs.id}/',
            {'job_offer': other_offer.id},
        )
        qs.refresh_from_db()
        self.assertEqual(qs.job_offer_id, self.job_offer.id)


# ---------------------------------------------------------------------------
# Video upload / answers access control
# ---------------------------------------------------------------------------

import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

_MEDIA = tempfile.mkdtemp(prefix='recrutai-test-media-')


def _video(name='answer.webm'):
    return SimpleUploadedFile(name, b'\x1a\x45\xdf\xa3fake-webm-bytes', content_type='video/webm')


class _InterviewMediaFixture:
    """One interview with a base and a probe question, plus a foreign question and strangers."""

    def setUp(self):
        self.recruiter = _make_recruiter('owner@rec.com')
        self.offer = _make_job_offer(self.recruiter)
        self.qs = _make_question_set(self.offer, qs_status=QuestionSet.Status.LOCKED)
        self.base_q = _make_question(question_set=self.qs, text='Base?')

        self.candidate = _make_job_seeker('cand@js.com')
        self.interview = _make_interview(_make_application(self.candidate, self.offer), self.qs)
        self.probe_q = _make_question(interview=self.interview, text='Probe?')

        # someone else's interview, on another offer
        other_rec = _make_recruiter('other@rec.com')
        other_offer = _make_job_offer(other_rec, title='Other')
        other_qs = _make_question_set(other_offer, qs_status=QuestionSet.Status.LOCKED)
        self.foreign_q = _make_question(question_set=other_qs, text='Foreign?')
        self.other_recruiter = other_rec
        self.other_candidate = _make_job_seeker('other@js.com')

    def _upload(self, question):
        return self.client.post('/api/interviews/uploadVideo/', {
            'interviewId': self.interview.id, 'questionId': question.id, 'video': _video(),
        }, format='multipart')


@override_settings(MEDIA_ROOT=_MEDIA)
class TestInterviewMediaAccess(_InterviewMediaFixture, APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_MEDIA, ignore_errors=True)

    @patch('interviews.tasks.evaluate_answer.delay')
    def test_candidate_can_upload_base_and_probe_answers(self, _):
        self.client.force_authenticate(user=self.candidate.user)
        self.assertEqual(self._upload(self.base_q).status_code, 200)
        self.assertEqual(self._upload(self.probe_q).status_code, 200)
        self.assertEqual(Answer.objects.filter(interview=self.interview).count(), 2)

    @patch('interviews.tasks.evaluate_answer.delay')
    def test_other_candidate_cannot_upload(self, delay):
        self.client.force_authenticate(user=self.other_candidate.user)
        self.assertEqual(self._upload(self.base_q).status_code, 403)
        self.assertFalse(Answer.objects.exists())
        delay.assert_not_called()

    @patch('interviews.tasks.evaluate_answer.delay')
    def test_recruiter_cannot_upload_on_candidate_behalf(self, _):
        self.client.force_authenticate(user=self.recruiter.user)
        self.assertEqual(self._upload(self.base_q).status_code, 403)

    @patch('interviews.tasks.evaluate_answer.delay')
    def test_question_from_another_interview_is_rejected(self, delay):
        self.client.force_authenticate(user=self.candidate.user)
        res = self._upload(self.foreign_q)
        self.assertEqual(res.status_code, 400)
        self.assertFalse(Answer.objects.exists())
        delay.assert_not_called()

    def _answers(self):
        return self.client.post('/api/interviews/answers/', {'interview_id': self.interview.id}, format='json')

    def test_candidate_and_owning_recruiter_can_read_answers(self):
        _make_answer(self.interview, self.base_q)
        for user in (self.candidate.user, self.recruiter.user):
            self.client.force_authenticate(user=user)
            res = self._answers()
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()['answers']), 1)

    def test_strangers_cannot_read_answers(self):
        _make_answer(self.interview, self.base_q)
        for user in (self.other_candidate.user, self.other_recruiter.user):
            self.client.force_authenticate(user=user)
            self.assertEqual(self._answers().status_code, 403)


# ---------------------------------------------------------------------------
# Interview completion waits for every question
# ---------------------------------------------------------------------------

@override_settings(MEDIA_ROOT=_MEDIA)
class TestInterviewCompletion(_InterviewMediaFixture, APITestCase):

    @patch('interviews.tasks.evaluate_answer.delay')
    def test_interview_completes_only_after_last_question(self, _):
        self.client.force_authenticate(user=self.candidate.user)
        self._upload(self.base_q)
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, Interview.Status.AVAILABLE)
        self._upload(self.probe_q)
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, Interview.Status.COMPLETED)

    def _eval(self, answer, score):
        return create_answer_evaluation(
            answer=answer, score=score, explanation='ok', model_used='m', prompt_version='v',
        )

    def test_not_finalized_while_a_question_is_unanswered(self):
        a1 = _make_answer(self.interview, self.base_q)
        self._eval(a1, 9.0)
        self.assertFalse(InterviewEvaluation.objects.filter(interview=self.interview).exists())

        a2 = _make_answer(self.interview, self.probe_q)
        self._eval(a2, 5.0)
        ie = InterviewEvaluation.objects.get(interview=self.interview)
        self.assertAlmostEqual(ie.total_score, 7.0)
