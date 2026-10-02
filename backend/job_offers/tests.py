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


# ---------------------------------------------------------------------------
# Recruiter table stats: applicants / shortlisted / avg match + ordering
# ---------------------------------------------------------------------------

from applications.models import Application
from core.models import CVAnalysis


def _apply(offer, email, *, score=None, status=Application.Status.PENDING):
    seeker = _make_job_seeker(email)
    app = Application.objects.create(job_seeker=seeker, job_offer=offer, status=status)
    if score is not None:
        CVAnalysis.objects.create(application=app, eligibility_score=score)
    return app


class TestOfferStats(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.busy = _make_offer(self.recruiter, title='Busy')
        self.quiet = _make_offer(self.recruiter, title='Quiet')
        # busy: 4 applicants. strong CV, weak CV, accepted w/o analysis, rejected strong CV
        _apply(self.busy, 'a@t.com', score=9.0)
        _apply(self.busy, 'b@t.com', score=4.0)
        _apply(self.busy, 'c@t.com', status=Application.Status.ACCEPTED)
        _apply(self.busy, 'd@t.com', score=8.0, status=Application.Status.REJECTED)
        _apply(self.quiet, 'e@t.com', score=6.0)
        self.client.force_authenticate(user=self.recruiter.user)

    def _by_title(self):
        res = self.client.get('/api/job_offers/list')
        return {o['title']: o for o in res.data['results']}

    def test_counts(self):
        busy = self._by_title()['Busy']
        self.assertEqual(busy['applicants_count'], 4)
        # strong CV (9.0) + accepted; rejected 8.0 and weak 4.0 are excluded
        self.assertEqual(busy['shortlisted_count'], 2)

    def test_avg_match_is_percentage_of_analysed_applications(self):
        busy = self._by_title()['Busy']
        self.assertEqual(busy['avg_match'], 70.0)  # mean(9, 4, 8) * 10 = 70

    def test_avg_match_null_without_analyses(self):
        empty = _make_offer(self.recruiter, title='Empty')
        res = self.client.get('/api/job_offers/list', {'search': 'Empty'})
        self.assertEqual(res.data['results'][0]['applicants_count'], 0)
        self.assertIsNone(res.data['results'][0]['avg_match'])
        self.assertEqual(empty.id, res.data['results'][0]['id'])

    def test_order_by_most_applicants(self):
        res = self.client.get('/api/job_offers/list', {'ordering': '-applicants_count'})
        self.assertEqual([o['title'] for o in res.data['results']], ['Busy', 'Quiet'])

    def test_public_list_does_not_expose_stats(self):
        seeker = _make_job_seeker('viewer@t.com')
        self.client.force_authenticate(user=seeker.user)
        res = self.client.get('/api/job_offers/listALL')
        self.assertNotIn('applicants_count', res.data['results'][0])


# ---------------------------------------------------------------------------
# Recruiter candidate detail payload
# ---------------------------------------------------------------------------

from applications.models import Resume, ResumeData
from interviews.models import Interview, Question, QuestionSet


class TestCandidatesEndpoint(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.offer = _make_offer(self.recruiter)
        self.seeker = _make_job_seeker('cand@t.com')
        self.seeker.user.phone = '+212600000000'
        self.seeker.user.save()
        resume = Resume.objects.create(
            job_seeker=self.seeker, original_file='resumes/x.pdf', is_default=True,
            parsing_status=Resume.ParsingStatus.READY,
        )
        ResumeData.objects.create(
            resume=resume, raw_text='cv', skills=['python', 'django'],
            experience=[{'role': 'Backend Dev', 'company': 'Acme', 'years': 3}],
            summary='Solid backend engineer.',
        )
        self.app = Application.objects.create(
            job_seeker=self.seeker, job_offer=self.offer, resume=resume,
            status=Application.Status.ACCEPTED,
        )
        CVAnalysis.objects.create(
            application=self.app, eligibility_score=8.4,
            analysis_details={'strengths': ['python'], 'gaps': ['k8s'], 'recommendation': 'Interview.'},
        )
        qs = QuestionSet.objects.create(job_offer=self.offer, version=1, status=QuestionSet.Status.LOCKED)
        interview = Interview.objects.create(application=self.app, question_set=qs)
        Question.objects.create(question_set=qs, source=Question.Source.BASE, order=0, question_text='Base Q')
        Question.objects.create(interview=interview, source=Question.Source.PROBE, order=0, question_text='Probe Q')
        self.client.force_authenticate(user=self.recruiter.user)

    def _candidate(self):
        res = self.client.get(f'/api/job_offers/{self.offer.id}/Candidates/')
        self.assertEqual(res.status_code, 200)
        return res.data[0]

    def test_contact_and_headline(self):
        c = self._candidate()
        self.assertEqual(c['candidate_email'], 'cand@t.com')
        self.assertEqual(c['candidate_phone'], '+212600000000')
        self.assertEqual(c['headline'], 'Backend Dev · Acme')

    def test_match_score_and_stage(self):
        c = self._candidate()
        self.assertEqual(c['match_score'], 84)
        self.assertEqual(c['stage'], 'interview')

    def test_analysis_and_resume_profile(self):
        c = self._candidate()
        self.assertEqual(c['analysis']['strengths'], ['python'])
        self.assertEqual(c['analysis']['recommendation'], 'Interview.')
        self.assertEqual(c['resume_profile']['skills'], ['python', 'django'])

    def test_interview_questions_include_base_and_probe(self):
        c = self._candidate()
        sources = {q['text']: q['source'] for q in c['interview']['questions']}
        self.assertEqual(sources, {'Base Q': 'base', 'Probe Q': 'probe'})

    def test_timeline_events_in_order(self):
        keys = [e['key'] for e in self._candidate()['timeline']]
        self.assertEqual(keys, ['applied', 'ai_screened', 'interview'])

    def test_candidate_without_resume_or_analysis(self):
        bare = Application.objects.create(job_seeker=_make_job_seeker('bare@t.com'), job_offer=self.offer)
        res = self.client.get(f'/api/job_offers/{self.offer.id}/Candidates/')
        row = next(r for r in res.data if r['id'] == bare.id)
        self.assertIsNone(row['analysis'])
        self.assertIsNone(row['resume_profile'])
        self.assertIsNone(row['interview'])
        self.assertIsNone(row['match_score'])
        self.assertEqual(row['stage'], 'applied')

    def test_jobseeker_own_list_does_not_expose_ai_analysis(self):
        self.client.force_authenticate(user=self.seeker.user)
        res = self.client.get('/api/applications/retreiveApplications')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('analysis', res.data[0])
        self.assertNotIn('candidate_email', res.data[0])


# ---------------------------------------------------------------------------
# Wizard fields persisted on create
# ---------------------------------------------------------------------------

class TestCreateOfferWizardFields(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.client.force_authenticate(user=self.recruiter.user)
        self.payload = {
            'title': 'Senior Frontend Engineer',
            'description': 'Own the design system.',
            'location': 'Remote',
            'skills': ['React', 'TypeScript'],
            'nice_skills': ['Storybook'],
            'experience_min': 5,
            'experience_max': 10,
            'department': 'Engineering',
            'employment_type': 'contract',
            'screening_config': {'cv': True, 'video': True, 'questions': 5, 'auto_shortlist': True},
            'status': 'draft',
        }

    def test_all_wizard_fields_are_saved(self):
        res = self.client.post('/api/job_offers/create', self.payload, format='json')
        self.assertEqual(res.status_code, 201)
        offer = JobOffer.objects.get(id=res.data['job_offer']['id'])
        self.assertEqual(offer.skills, ['React', 'TypeScript'])
        self.assertEqual(offer.nice_skills, ['Storybook'])
        self.assertEqual((offer.experience_min, offer.experience_max), (5, 10))
        self.assertEqual(offer.department, 'Engineering')
        self.assertEqual(offer.employment_type, JobOffer.EmploymentType.CONTRACT)
        self.assertEqual(offer.screening_config['questions'], 5)
        self.assertEqual(offer.status, JobOffer.Status.DRAFT)

    def test_max_experience_below_min_is_rejected(self):
        self.payload['experience_max'] = 2
        res = self.client.post('/api/job_offers/create', self.payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('experience_max', res.data)

    def test_invalid_employment_type_is_rejected(self):
        self.payload['employment_type'] = 'freelance'
        res = self.client.post('/api/job_offers/create', self.payload, format='json')
        self.assertEqual(res.status_code, 400)

    def test_defaults_when_omitted(self):
        res = self.client.post('/api/job_offers/create', {'title': 'T', 'description': 'D'}, format='json')
        self.assertEqual(res.status_code, 201)
        offer = JobOffer.objects.get(id=res.data['job_offer']['id'])
        self.assertEqual(offer.employment_type, JobOffer.EmploymentType.FULL_TIME)
        self.assertEqual(offer.status, JobOffer.Status.OPEN)
        self.assertIsNone(offer.experience_max)


# ---------------------------------------------------------------------------
# Drafts and the auto-shortlist switch
# ---------------------------------------------------------------------------

class TestDraftOffers(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.client.force_authenticate(user=self.recruiter.user)

    def test_draft_can_be_saved_without_description(self):
        res = self.client.post('/api/job_offers/create', {'title': 'WIP role', 'status': 'draft'}, format='json')
        self.assertEqual(res.status_code, 201)

    def test_open_offer_requires_description(self):
        res = self.client.post('/api/job_offers/create', {'title': 'No desc'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('description', res.data)

    def test_publishing_a_draft_without_description_is_rejected(self):
        offer = _make_offer(self.recruiter)
        offer.description = ''
        offer.status = JobOffer.Status.DRAFT
        offer.save()
        res = self.client.patch(f'/api/job_offers/{offer.id}/edit/', {'status': 'open'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_publishing_a_draft_with_description_succeeds(self):
        offer = _make_offer(self.recruiter)
        offer.status = JobOffer.Status.DRAFT
        offer.save()
        res = self.client.patch(f'/api/job_offers/{offer.id}/edit/', {'status': 'open'}, format='json')
        self.assertEqual(res.status_code, 200)


class TestAutoShortlistSwitch(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.client.force_authenticate(user=self.recruiter.user)

    def _offer_with_strong_applicant(self, title, screening_config):
        offer = _make_offer(self.recruiter, title=title)
        offer.screening_config = screening_config
        offer.save()
        app = _apply(offer, f'{title}@t.com'.replace(' ', ''), score=9.0)
        return offer, app

    def test_default_promotes_strong_cv_to_screening(self):
        offer, app = self._offer_with_strong_applicant('On', {})
        app.refresh_from_db()
        self.assertEqual(app.stage, 'screening')

    def test_switched_off_keeps_applicant_in_applied(self):
        offer, app = self._offer_with_strong_applicant('Off', {'auto_shortlist': False})
        app.refresh_from_db()
        self.assertEqual(app.stage, 'applied')

    def test_shortlist_count_respects_the_switch(self):
        self._offer_with_strong_applicant('On', {'auto_shortlist': True})
        self._offer_with_strong_applicant('Off', {'auto_shortlist': False})
        res = self.client.get('/api/job_offers/list')
        by_title = {o['title']: o['shortlisted_count'] for o in res.data['results']}
        self.assertEqual(by_title, {'On': 1, 'Off': 0})
