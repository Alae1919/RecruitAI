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
