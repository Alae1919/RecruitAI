from unittest.mock import patch

from django.test import TestCase

from users.models import User, Recruiter, Role, UserRole
from job_offers.models import JobOffer
from job_offers.filters import JobOfferFilter


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _make_recruiter(email='rec@test.com'):
    user = User.objects.create_user(username=email, email=email, password='pass')
    role, _ = Role.objects.get_or_create(role_name='RECRUITER')
    UserRole.objects.create(user=user, role=role)
    return Recruiter.objects.create(user=user, company_name='ACME')


def _make_offer(recruiter, *, title='Backend Dev', location='Paris', experience_min=2):
    return JobOffer.objects.create(
        recruiter=recruiter,
        title=title,
        description='Build APIs.',
        location=location,
        experience_min=experience_min,
        skills=['python'],
    )


# ---------------------------------------------------------------------------
# JobOfferFilter
# ---------------------------------------------------------------------------

class TestJobOfferFilter(TestCase):
    def setUp(self):
        recruiter = _make_recruiter()
        self.paris_senior = _make_offer(recruiter, title='Backend Dev', location='Paris', experience_min=3)
        self.lyon_junior = _make_offer(recruiter, title='Frontend Dev', location='Lyon', experience_min=0)
        self.paris_mid = _make_offer(recruiter, title='Fullstack Dev', location='Paris', experience_min=2)

    def test_filter_by_location_icontains(self):
        f = JobOfferFilter({'location': 'ari'}, queryset=JobOffer.objects.all())
        self.assertEqual(f.qs.count(), 2)
        self.assertNotIn(self.lyon_junior, f.qs)

    def test_filter_by_title_icontains(self):
        f = JobOfferFilter({'title': 'backend'}, queryset=JobOffer.objects.all())
        self.assertEqual(f.qs.count(), 1)
        self.assertEqual(f.qs.first().title, 'Backend Dev')

    def test_filter_by_experience_min_lte(self):
        # experience_min=2 means "show jobs requiring <= 2 years"
        f = JobOfferFilter({'experience_min': 2}, queryset=JobOffer.objects.all())
        self.assertIn(self.lyon_junior, f.qs)  # 0 <= 2
        self.assertIn(self.paris_mid, f.qs)     # 2 <= 2
        self.assertNotIn(self.paris_senior, f.qs)  # 3 > 2

    def test_combined_location_and_experience_filters(self):
        f = JobOfferFilter({'location': 'Paris', 'experience_min': 2}, queryset=JobOffer.objects.all())
        self.assertEqual(f.qs.count(), 1)
        self.assertEqual(f.qs.first(), self.paris_mid)

    def test_no_filters_returns_all(self):
        f = JobOfferFilter({}, queryset=JobOffer.objects.all())
        self.assertEqual(f.qs.count(), 3)


# ---------------------------------------------------------------------------
# generate_job_description service
# ---------------------------------------------------------------------------

class TestGenerateJobDescriptionService(TestCase):
    @patch('job_offers.services.generate_job_description.get_llm')
    def test_returns_dict_with_description_and_metadata(self, mock_get_llm):
        mock_get_llm.return_value.generate_job_description.return_value = 'A great job description.'
        from job_offers.services.generate_job_description import generate_job_description
        result = generate_job_description(
            title='Backend Engineer',
            skills=['python', 'django'],
            experience_level='senior',
        )
        self.assertEqual(result['description'], 'A great job description.')
        self.assertIn('model_used', result)
        self.assertIn('prompt_version', result)

    @patch('job_offers.services.generate_job_description.get_llm')
    def test_strips_empty_skill_entries(self, mock_get_llm):
        mock_get_llm.return_value.generate_job_description.return_value = 'JD text.'
        from job_offers.services.generate_job_description import generate_job_description
        generate_job_description(
            title='Dev', skills=['python', '', '  '], experience_level='mid',
        )
        call_kwargs = mock_get_llm.return_value.generate_job_description.call_args[1]
        self.assertNotIn('', call_kwargs['skills'])
        self.assertNotIn('  ', call_kwargs['skills'])
