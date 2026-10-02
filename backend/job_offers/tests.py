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


# ---------------------------------------------------------------------------
# Offer lifecycle status
# ---------------------------------------------------------------------------

from rest_framework.test import APITestCase

from applications.services.create_application import create_application
from rest_framework.exceptions import ValidationError
from users.models import JobSeeker


def _make_job_seeker(email='js@test.com'):
    user = User.objects.create_user(username=email, email=email, password='pass')
    role, _ = Role.objects.get_or_create(role_name='JOBSEEKER')
    UserRole.objects.create(user=user, role=role)
    return JobSeeker.objects.create(user=user)


class TestOfferStatus(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.open = _make_offer(self.recruiter, title='Open role')
        self.draft = _make_offer(self.recruiter, title='Draft role')
        self.draft.status = JobOffer.Status.DRAFT
        self.draft.save()
        self.paused = _make_offer(self.recruiter, title='Paused role')
        self.paused.status = JobOffer.Status.PAUSED
        self.paused.save()

    def test_new_offer_defaults_to_open(self):
        self.assertEqual(self.open.status, JobOffer.Status.OPEN)

    def test_recruiter_list_returns_all_statuses(self):
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.get('/api/job_offers/list')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 3)

    def test_recruiter_list_filters_by_status(self):
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.get('/api/job_offers/list', {'status': 'draft'})
        self.assertEqual([o['title'] for o in res.data['results']], ['Draft role'])

    def test_public_list_hides_non_open_offers_even_if_requested(self):
        seeker = _make_job_seeker()
        self.client.force_authenticate(user=seeker.user)
        res = self.client.get('/api/job_offers/listALL', {'status': 'draft'})
        self.assertEqual(res.data['count'], 0)
        res = self.client.get('/api/job_offers/listALL')
        self.assertEqual([o['title'] for o in res.data['results']], ['Open role'])

    def test_recruiter_can_change_status(self):
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.patch(f'/api/job_offers/{self.open.id}/edit/', {'status': 'paused'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.open.refresh_from_db()
        self.assertEqual(self.open.status, JobOffer.Status.PAUSED)

    def test_cannot_apply_to_non_open_offer(self):
        seeker = _make_job_seeker()
        with self.assertRaises(ValidationError):
            create_application(job_seeker=seeker, job_offer_id=self.draft.id)
