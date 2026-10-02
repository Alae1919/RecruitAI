from unittest.mock import patch

from django.test import TestCase

from users.models import User, Recruiter, JobSeeker, Role, UserRole
from job_offers.models import JobOffer
from applications.models import Application, Resume, ResumeData
from core.models import CVAnalysis


# ---------------------------------------------------------------------------
# Shared helpers
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


def _make_job_offer(recruiter):
    return JobOffer.objects.create(
        recruiter=recruiter, title='Dev', description='Build APIs.', requirements='Python.',
    )


def _make_resume_with_data(job_seeker, raw_text='I am a senior Python developer with 5 years experience.'):
    resume = Resume.objects.create(
        job_seeker=job_seeker, original_file='resumes/test.pdf', label='CV',
        is_default=True, parsing_status=Resume.ParsingStatus.READY,
    )
    ResumeData.objects.create(
        resume=resume, raw_text=raw_text,
        skills=['python'], experience=[], education=[], languages=[], summary='Good dev.',
    )
    return resume


_MOCK_LLM_RESULT = {
    'eligibility_score': 8.5,
    'strengths': ['Python', 'Django'],
    'gaps': [],
    'recommendation': 'Excellent candidate.',
}


# ---------------------------------------------------------------------------
# analyze_cv service
# ---------------------------------------------------------------------------

class TestAnalyzeCVService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        self.job_seeker = _make_job_seeker()
        self.resume = _make_resume_with_data(self.job_seeker)
        self.application = Application.objects.create(
            job_seeker=self.job_seeker,
            job_offer=self.job_offer,
            resume=self.resume,
            status=Application.Status.PENDING,
        )

    @patch('core.services.analyze_cv.get_llm')
    def test_creates_cv_analysis_with_correct_score(self, mock_get_llm):
        mock_get_llm.return_value.analyze_cv.return_value = _MOCK_LLM_RESULT
        from core.services.analyze_cv import analyze_cv
        result = analyze_cv(self.application.id)
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result.eligibility_score, 8.5)
        self.assertEqual(result.application_id, self.application.id)

    @patch('core.services.analyze_cv.get_llm')
    def test_stores_strengths_gaps_and_recommendation(self, mock_get_llm):
        mock_get_llm.return_value.analyze_cv.return_value = _MOCK_LLM_RESULT
        from core.services.analyze_cv import analyze_cv
        result = analyze_cv(self.application.id)
        self.assertIn('strengths', result.analysis_details)
        self.assertEqual(result.analysis_details['strengths'], ['Python', 'Django'])
        self.assertEqual(result.analysis_details['recommendation'], 'Excellent candidate.')

    @patch('core.services.analyze_cv.get_llm')
    def test_idempotent_does_not_call_llm_twice(self, mock_get_llm):
        mock_get_llm.return_value.analyze_cv.return_value = _MOCK_LLM_RESULT
        from core.services.analyze_cv import analyze_cv
        r1 = analyze_cv(self.application.id)
        r2 = analyze_cv(self.application.id)
        self.assertEqual(r1.id, r2.id)
        mock_get_llm.return_value.analyze_cv.assert_called_once()

    def test_returns_none_when_no_resume_text(self):
        self.resume.parsed.raw_text = ''
        self.resume.parsed.save()
        from core.services.analyze_cv import analyze_cv
        result = analyze_cv(self.application.id)
        self.assertIsNone(result)
        self.assertFalse(CVAnalysis.objects.filter(application=self.application).exists())

    def test_returns_none_when_no_resume_attached(self):
        self.application.resume = None
        self.application.save()
        from core.services.analyze_cv import analyze_cv
        result = analyze_cv(self.application.id)
        self.assertIsNone(result)


# ---------------------------------------------------------------------------
# seed_demo management command
# ---------------------------------------------------------------------------

import io
import shutil
import tempfile

from django.core.management import call_command
from django.test import override_settings

from interviews.models import Interview, InterviewEvaluation

_SEED_MEDIA = tempfile.mkdtemp(prefix='recrutai-seed-media-')


@override_settings(MEDIA_ROOT=_SEED_MEDIA)
class TestSeedDemoCommand(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_SEED_MEDIA, ignore_errors=True)

    def _seed(self, *args):
        out = io.StringIO()
        call_command('seed_demo', *args, stdout=out)
        return out.getvalue()

    def test_creates_offers_in_every_status_and_candidates_in_every_stage(self):
        self._seed()
        statuses = set(JobOffer.objects.values_list('status', flat=True))
        self.assertTrue({'open', 'draft', 'paused'} <= statuses)
        stages = {a.stage for a in Application.objects.select_related('job_offer', 'cv_analysis')}
        self.assertEqual(stages, {'applied', 'screening', 'interview', 'offer', 'hired', 'rejected'})

    def test_demo_accounts_can_log_in_with_their_role(self):
        from core.management.commands.seed_demo import DEMO_PASSWORD, RECRUITER_EMAIL
        self._seed()
        res = self.client.post('/api/users/login/', {
            'email': RECRUITER_EMAIL, 'password': DEMO_PASSWORD, 'role': 'RECRUITER',
        }, content_type='application/json')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIn('access', res.json())

    def test_answered_interviews_are_completed_and_evaluated(self):
        self._seed()
        completed = Interview.objects.filter(status=Interview.Status.COMPLETED)
        self.assertTrue(completed.exists())
        for interview in completed:
            self.assertTrue(InterviewEvaluation.objects.filter(interview=interview).exists())

    def test_every_open_offer_with_candidates_can_invite(self):
        """A READY question set must exist so 'Invite to interview' works in the demo."""
        from interviews.models import QuestionSet
        self._seed()
        for offer in JobOffer.objects.filter(application__isnull=False).distinct():
            self.assertTrue(offer.question_sets.filter(status=QuestionSet.Status.READY).exists(), offer.title)

    def test_second_run_is_a_no_op_and_reset_recreates(self):
        self._seed()
        users = User.objects.count()
        self.assertIn('already exists', self._seed())
        self.assertEqual(User.objects.count(), users)
        self._seed('--reset')
        self.assertEqual(User.objects.count(), users)

    def test_remove_deletes_only_demo_accounts(self):
        keep = _make_recruiter('real@company.com')
        self._seed()
        self._seed('--remove')
        self.assertFalse(User.objects.filter(email__endswith='@recrutai.demo').exists())
        self.assertFalse(JobOffer.objects.exclude(recruiter=keep).exists())
        self.assertTrue(User.objects.filter(pk=keep.user_id).exists())
