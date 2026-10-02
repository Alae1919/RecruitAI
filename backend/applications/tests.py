from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile

from django.test import TestCase
from rest_framework.exceptions import PermissionDenied, ValidationError

from users.models import User, Recruiter, JobSeeker, Role, UserRole
from job_offers.models import JobOffer
from applications.models import Application, Resume, ResumeData
from interviews.models import QuestionSet, Interview
from applications.services.create_application import create_application
from applications.services.accept_application import accept_application
from applications.services.upload_resume import upload_resume, set_default_resume


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
        recruiter=recruiter, title='Dev', description='Build stuff.', skills=['python'],
    )


def _make_question_set(job_offer, qs_status=QuestionSet.Status.READY):
    return QuestionSet.objects.create(
        job_offer=job_offer, version=1, status=qs_status, target_count=3,
    )


def _make_resume(job_seeker, *, is_default=True):
    return Resume.objects.create(
        job_seeker=job_seeker, original_file='resumes/test.pdf', label='CV',
        is_default=is_default, parsing_status=Resume.ParsingStatus.READY,
    )


# ---------------------------------------------------------------------------
# create_application service
# ---------------------------------------------------------------------------

class TestCreateApplicationService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        self.job_seeker = _make_job_seeker()

    @patch('applications.services.create_application.transaction.on_commit')
    def test_creates_pending_application_with_resume(self, _):
        resume = _make_resume(self.job_seeker)
        app = create_application(
            job_seeker=self.job_seeker, job_offer_id=self.job_offer.id, resume_id=resume.id,
        )
        self.assertEqual(app.status, Application.Status.PENDING)
        self.assertEqual(app.job_seeker_id, self.job_seeker.id)
        self.assertEqual(app.resume_id, resume.id)

    @patch('applications.services.create_application.transaction.on_commit')
    def test_falls_back_to_default_resume_when_no_resume_id(self, _):
        resume = _make_resume(self.job_seeker, is_default=True)
        app = create_application(job_seeker=self.job_seeker, job_offer_id=self.job_offer.id)
        self.assertEqual(app.resume_id, resume.id)

    @patch('applications.services.create_application.transaction.on_commit')
    def test_raises_value_error_on_duplicate_application(self, _):
        resume = _make_resume(self.job_seeker)
        create_application(
            job_seeker=self.job_seeker, job_offer_id=self.job_offer.id, resume_id=resume.id,
        )
        with self.assertRaises(ValueError):
            create_application(
                job_seeker=self.job_seeker, job_offer_id=self.job_offer.id, resume_id=resume.id,
            )

    def test_raises_validation_error_for_unowned_resume(self):
        other_js = _make_job_seeker(email='other@test.com')
        resume = _make_resume(other_js)
        with self.assertRaises(ValidationError):
            create_application(
                job_seeker=self.job_seeker, job_offer_id=self.job_offer.id, resume_id=resume.id,
            )


# ---------------------------------------------------------------------------
# accept_application service
# ---------------------------------------------------------------------------

class TestAcceptApplicationService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        self.qs = _make_question_set(self.job_offer, qs_status=QuestionSet.Status.READY)
        job_seeker = _make_job_seeker()
        resume = _make_resume(job_seeker)
        self.application = Application.objects.create(
            job_seeker=job_seeker, job_offer=self.job_offer,
            resume=resume, status=Application.Status.PENDING,
        )

    def test_sets_accepted_locks_qs_creates_interview(self):
        app, interview = accept_application(
            application_id=self.application.id, recruiter=self.recruiter,
        )
        self.application.refresh_from_db()
        self.qs.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.ACCEPTED)
        self.assertEqual(self.qs.status, QuestionSet.Status.LOCKED)
        self.assertIsNotNone(interview.pk)
        self.assertEqual(interview.question_set_id, self.qs.id)

    def test_raises_validation_error_if_no_ready_question_set(self):
        self.qs.status = QuestionSet.Status.DRAFT
        self.qs.save(update_fields=['status', 'updated_at'])
        with self.assertRaises(ValidationError):
            accept_application(application_id=self.application.id, recruiter=self.recruiter)

    def test_application_stays_pending_on_failure(self):
        self.qs.status = QuestionSet.Status.DRAFT
        self.qs.save(update_fields=['status', 'updated_at'])
        try:
            accept_application(application_id=self.application.id, recruiter=self.recruiter)
        except Exception:
            pass
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.PENDING)

    def test_raises_permission_denied_for_wrong_recruiter(self):
        other = _make_recruiter(email='other@test.com')
        with self.assertRaises(PermissionDenied):
            accept_application(application_id=self.application.id, recruiter=other)

    def test_second_accept_reuses_existing_interview(self):
        accept_application(application_id=self.application.id, recruiter=self.recruiter)
        # First accept locks QuestionSet v1; create v2 so the second call has a READY set
        QuestionSet.objects.create(
            job_offer=self.job_offer, version=2, status=QuestionSet.Status.READY, target_count=3,
        )
        accept_application(application_id=self.application.id, recruiter=self.recruiter)
        self.assertEqual(
            Interview.objects.filter(application=self.application).count(), 1
        )


# ---------------------------------------------------------------------------
# upload_resume service
# ---------------------------------------------------------------------------

class TestUploadResumeService(TestCase):
    def setUp(self):
        self.job_seeker = _make_job_seeker()

    def _file(self, name='cv.pdf'):
        return SimpleUploadedFile(name, b'%PDF-1.4 fake content', content_type='application/pdf')

    @patch('applications.services.upload_resume.transaction.on_commit')
    def test_first_resume_becomes_default(self, _):
        resume = upload_resume(job_seeker=self.job_seeker, file=self._file())
        self.assertTrue(resume.is_default)
        self.assertEqual(resume.parsing_status, Resume.ParsingStatus.PENDING)

    @patch('applications.services.upload_resume.transaction.on_commit')
    def test_second_resume_not_default_unless_requested(self, _):
        r1 = upload_resume(job_seeker=self.job_seeker, file=self._file())
        r2 = upload_resume(job_seeker=self.job_seeker, file=self._file())
        r1.refresh_from_db()
        self.assertTrue(r1.is_default)
        self.assertFalse(r2.is_default)

    @patch('applications.services.upload_resume.transaction.on_commit')
    def test_make_default_flag_demotes_existing_default(self, _):
        r1 = upload_resume(job_seeker=self.job_seeker, file=self._file())
        r2 = upload_resume(job_seeker=self.job_seeker, file=self._file(), make_default=True)
        r1.refresh_from_db()
        r2.refresh_from_db()
        self.assertFalse(r1.is_default)
        self.assertTrue(r2.is_default)


# ---------------------------------------------------------------------------
# set_default_resume service
# ---------------------------------------------------------------------------

class TestSetDefaultResumeService(TestCase):
    def setUp(self):
        self.job_seeker = _make_job_seeker()

    def test_switches_default_between_resumes(self):
        r1 = _make_resume(self.job_seeker, is_default=True)
        r2 = Resume.objects.create(
            job_seeker=self.job_seeker, original_file='resumes/r2.pdf',
            label='R2', is_default=False, parsing_status=Resume.ParsingStatus.READY,
        )
        set_default_resume(job_seeker=self.job_seeker, resume_id=r2.id)
        r1.refresh_from_db()
        r2.refresh_from_db()
        self.assertFalse(r1.is_default)
        self.assertTrue(r2.is_default)

    def test_raises_permission_denied_for_wrong_job_seeker(self):
        resume = _make_resume(self.job_seeker)
        other_js = _make_job_seeker(email='other@test.com')
        with self.assertRaises(PermissionDenied):
            set_default_resume(job_seeker=other_js, resume_id=resume.id)


# ---------------------------------------------------------------------------
# parse_resume service
# ---------------------------------------------------------------------------

class TestParseResumeService(TestCase):
    def setUp(self):
        job_seeker = _make_job_seeker()
        self.resume = Resume.objects.create(
            job_seeker=job_seeker, original_file='resumes/test.pdf', label='CV',
            is_default=True, parsing_status=Resume.ParsingStatus.PENDING,
        )

    @patch('interviews.adapters.llm_client.get_llm')
    @patch('applications.services.parse_resume.extract_text_from_file', return_value='A' * 200)
    @patch('django.db.models.fields.files.FieldFile.open')
    @patch('django.db.models.fields.files.FieldFile.close')
    def test_marks_ready_and_creates_resume_data(self, _close, _open, _extract, mock_llm):
        mock_llm.return_value.parse_resume_data.return_value = {
            'skills': ['python', 'django'],
            'experience': [{'role': 'Dev', 'company': 'X', 'years': 2}],
            'education': [],
            'languages': ['French'],
            'summary': 'Senior developer.',
        }
        from applications.services.parse_resume import parse_resume
        parse_resume(self.resume.id)
        self.resume.refresh_from_db()
        self.assertEqual(self.resume.parsing_status, Resume.ParsingStatus.READY)
        rd = ResumeData.objects.get(resume=self.resume)
        self.assertIn('python', rd.skills)
        self.assertEqual(rd.summary, 'Senior developer.')

    @patch('applications.services.parse_resume.extract_text_from_file', return_value='short')
    @patch('django.db.models.fields.files.FieldFile.open')
    @patch('django.db.models.fields.files.FieldFile.close')
    def test_marks_failed_when_extracted_text_too_short(self, _close, _open, _extract):
        from applications.services.parse_resume import parse_resume
        parse_resume(self.resume.id)
        self.resume.refresh_from_db()
        self.assertEqual(self.resume.parsing_status, Resume.ParsingStatus.FAILED)

    @patch('applications.services.parse_resume.extract_text_from_file')
    def test_skips_if_already_ready(self, mock_extract):
        self.resume.parsing_status = Resume.ParsingStatus.READY
        self.resume.save(update_fields=['parsing_status'])
        from applications.services.parse_resume import parse_resume
        parse_resume(self.resume.id)
        mock_extract.assert_not_called()


# ---------------------------------------------------------------------------
# Pipeline stage + advance_application
# ---------------------------------------------------------------------------

from core.models import CVAnalysis
from applications.services.advance_application import advance_application


class TestApplicationStage(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        self.job_seeker = _make_job_seeker()
        self.app = Application.objects.create(job_seeker=self.job_seeker, job_offer=self.job_offer)

    def test_pending_without_analysis_is_applied(self):
        self.assertEqual(self.app.stage, 'applied')

    def test_pending_below_threshold_is_applied(self):
        CVAnalysis.objects.create(application=self.app, eligibility_score=5.0)
        self.app.refresh_from_db()
        self.assertEqual(self.app.stage, 'applied')

    def test_pending_above_threshold_is_screening(self):
        CVAnalysis.objects.create(application=self.app, eligibility_score=8.0)
        self.app.refresh_from_db()
        self.assertEqual(self.app.stage, 'screening')

    def test_status_maps_to_later_stages(self):
        for status_, stage in [
            (Application.Status.ACCEPTED, 'interview'),
            (Application.Status.OFFER, 'offer'),
            (Application.Status.HIRED, 'hired'),
            (Application.Status.REJECTED, 'rejected'),
        ]:
            self.app.status = status_
            self.assertEqual(self.app.stage, stage)


class TestAdvanceApplicationService(TestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.job_offer = _make_job_offer(self.recruiter)
        _make_question_set(self.job_offer, qs_status=QuestionSet.Status.READY)
        job_seeker = _make_job_seeker()
        self.app = Application.objects.create(
            job_seeker=job_seeker, job_offer=self.job_offer,
            resume=_make_resume(job_seeker), status=Application.Status.PENDING,
        )

    def _advance(self):
        return advance_application(application_id=self.app.id, recruiter=self.recruiter)

    def test_full_pipeline_pending_to_hired(self):
        self.assertEqual(self._advance().status, Application.Status.ACCEPTED)
        self.assertTrue(Interview.objects.filter(application=self.app).exists())
        self.assertEqual(self._advance().status, Application.Status.OFFER)
        self.assertEqual(self._advance().status, Application.Status.HIRED)

    def test_cannot_advance_past_hired(self):
        self.app.status = Application.Status.HIRED
        self.app.save()
        with self.assertRaises(ValidationError):
            self._advance()

    def test_cannot_advance_rejected(self):
        self.app.status = Application.Status.REJECTED
        self.app.save()
        with self.assertRaises(ValidationError):
            self._advance()

    def test_other_recruiter_is_denied(self):
        other = _make_recruiter('other@test.com')
        with self.assertRaises(PermissionDenied):
            advance_application(application_id=self.app.id, recruiter=other)

    def test_accept_cannot_regress_offer_stage(self):
        self.app.status = Application.Status.OFFER
        self.app.save()
        with self.assertRaises(ValidationError):
            accept_application(application_id=self.app.id, recruiter=self.recruiter)


# ---------------------------------------------------------------------------
# Recruiter pipeline summary (sidebar counts)
# ---------------------------------------------------------------------------

from rest_framework.test import APITestCase


class TestPipelineSummaryEndpoint(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.open_offer = _make_job_offer(self.recruiter)
        self.paused_offer = _make_job_offer(self.recruiter)
        self.paused_offer.status = JobOffer.Status.PAUSED
        self.paused_offer.save()

        def apply(offer, email, status_=Application.Status.PENDING, score=None):
            app = Application.objects.create(
                job_seeker=_make_job_seeker(email), job_offer=offer, status=status_,
            )
            if score is not None:
                CVAnalysis.objects.create(application=app, eligibility_score=score)

        apply(self.open_offer, 'a@t.com')
        apply(self.open_offer, 'b@t.com', score=9.0)
        apply(self.open_offer, 'c@t.com', Application.Status.ACCEPTED)
        apply(self.paused_offer, 'd@t.com', Application.Status.REJECTED)
        # another recruiter's data must not leak in
        other = _make_recruiter('other@test.com')
        apply(_make_job_offer(other), 'e@t.com')

    def test_counts_for_the_calling_recruiter_only(self):
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.get('/api/applications/pipeline/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['offers'], 2)
        self.assertEqual(res.data['open_offers'], 1)
        self.assertEqual(res.data['candidates'], 4)
        self.assertEqual(res.data['stages'], {
            'applied': 1, 'screening': 1, 'interview': 1, 'offer': 0, 'hired': 0, 'rejected': 1,
        })

    def test_job_seekers_are_denied(self):
        seeker = _make_job_seeker('seeker@t.com')
        self.client.force_authenticate(user=seeker.user)
        self.assertEqual(self.client.get('/api/applications/pipeline/').status_code, 403)


# ---------------------------------------------------------------------------
# Messaging candidates
# ---------------------------------------------------------------------------

from django.core import mail

from applications.models import CandidateMessage
from applications.tasks import send_candidate_message_email


class TestApplicationMessages(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.offer = _make_job_offer(self.recruiter)
        self.candidate = _make_job_seeker('msg@real-person.com')
        self.app = Application.objects.create(job_seeker=self.candidate, job_offer=self.offer)
        self.url = f'/api/applications/{self.app.id}/messages/'

    def _post(self, user, **data):
        self.client.force_authenticate(user=user)
        return self.client.post(self.url, {'subject': 'Next steps', 'body': 'Are you available Monday?', **data}, format='json')

    @patch('applications.tasks.send_candidate_message_email.delay')
    def test_recruiter_sends_a_message_which_is_stored_and_dispatched(self, delay):
        with self.captureOnCommitCallbacks(execute=True):
            res = self._post(self.recruiter.user)
        self.assertEqual(res.status_code, 201, res.content)
        message = CandidateMessage.objects.get()
        self.assertEqual((message.subject, message.application_id, message.sender_id),
                         ('Next steps', self.app.id, self.recruiter.id))
        self.assertFalse(message.email_sent)
        delay.assert_called_once_with(message.id)

    def test_subject_and_body_are_required(self):
        self.assertEqual(self._post(self.recruiter.user, subject='').status_code, 400)
        self.assertEqual(self._post(self.recruiter.user, body='   ').status_code, 400)
        self.assertFalse(CandidateMessage.objects.exists())

    def test_other_recruiters_and_candidates_cannot_message_or_read(self):
        other = _make_recruiter('someone-else@test.com')
        self.assertEqual(self._post(other.user).status_code, 403)
        self.assertEqual(self._post(self.candidate.user).status_code, 403)
        self.client.force_authenticate(user=other.user)
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.assertFalse(CandidateMessage.objects.exists())

    def test_unknown_application_is_404(self):
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.post('/api/applications/999999/messages/', {'subject': 's', 'body': 'b'}, format='json')
        self.assertEqual(res.status_code, 404)

    def test_history_lists_newest_first(self):
        for subject in ('first', 'second'):
            CandidateMessage.objects.create(application=self.app, sender=self.recruiter, subject=subject, body='x')
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.get(self.url)
        self.assertEqual([m['subject'] for m in res.data], ['second', 'first'])
        self.assertIn('sender_name', res.data[0])

    def test_email_task_delivers_and_marks_the_message(self):
        message = CandidateMessage.objects.create(
            application=self.app, sender=self.recruiter, subject='Hello', body='Body text')
        send_candidate_message_email(message.id)
        message.refresh_from_db()
        self.assertTrue(message.email_sent)
        self.assertEqual([m.to for m in mail.outbox], [['msg@real-person.com']])
        self.assertEqual(mail.outbox[0].subject, 'Hello')
        self.assertIn('Body text', mail.outbox[0].body)
        self.assertIn(self.offer.title, mail.outbox[0].body)

    def test_email_task_never_emails_demo_accounts(self):
        demo_app = Application.objects.create(
            job_seeker=_make_job_seeker('amira@recrutai.demo'), job_offer=self.offer)
        message = CandidateMessage.objects.create(application=demo_app, sender=self.recruiter, subject='Hi', body='b')
        send_candidate_message_email(message.id)
        message.refresh_from_db()
        self.assertFalse(message.email_sent)
        self.assertEqual(len(mail.outbox), 0)

    def test_candidate_payload_carries_the_history_for_recruiters_only(self):
        CandidateMessage.objects.create(application=self.app, sender=self.recruiter, subject='Hi', body='b')
        self.client.force_authenticate(user=self.recruiter.user)
        res = self.client.get(f'/api/job_offers/{self.offer.id}/Candidates/')
        self.assertEqual([m['subject'] for m in res.data[0]['messages']], ['Hi'])
        self.client.force_authenticate(user=self.candidate.user)
        own = self.client.get('/api/applications/retreiveApplications')
        self.assertNotIn('messages', own.data[0])


# ---------------------------------------------------------------------------
# Candidate search (command palette)
# ---------------------------------------------------------------------------

class TestCandidateSearch(APITestCase):
    def setUp(self):
        self.recruiter = _make_recruiter()
        self.offer = _make_job_offer(self.recruiter)
        self.other_offer = _make_job_offer(_make_recruiter('rival@test.com'))

        def candidate(email, first, last, offer, score=None):
            seeker = _make_job_seeker(email)
            seeker.user.first_name, seeker.user.last_name = first, last
            seeker.user.save()
            app = Application.objects.create(job_seeker=seeker, job_offer=offer)
            if score is not None:
                CVAnalysis.objects.create(application=app, eligibility_score=score)
            return app

        self.amira = candidate('amira@x.com', 'Amira', 'El-Khalil', self.offer, score=9.1)
        self.tomas = candidate('tomas@y.com', 'Tomás', 'Ribeiro', self.offer)
        self.stranger = candidate('amira.other@z.com', 'Amira', 'Rival', self.other_offer)
        self.client.force_authenticate(user=self.recruiter.user)

    def _search(self, q):
        return self.client.get('/api/applications/search/', {'q': q})

    def test_matches_name_or_email_case_insensitively(self):
        self.assertEqual([r['id'] for r in self._search('amira').data], [self.amira.id])
        self.assertEqual([r['id'] for r in self._search('RIBEIRO').data], [self.tomas.id])
        self.assertEqual([r['id'] for r in self._search('tomas@y').data], [self.tomas.id])

    def test_every_word_must_match(self):
        self.assertEqual([r['id'] for r in self._search('amira el-kha').data], [self.amira.id])
        self.assertEqual(self._search('amira ribeiro').data, [])

    def test_never_returns_other_recruiters_applicants(self):
        ids = [r['id'] for r in self._search('amira').data]
        self.assertNotIn(self.stranger.id, ids)

    def test_result_shape(self):
        row = self._search('amira').data[0]
        self.assertEqual(row, {
            'id': self.amira.id, 'candidate_name': 'Amira El-Khalil', 'candidate_email': 'amira@x.com',
            'offer_id': self.offer.id, 'offer_title': self.offer.title, 'stage': 'screening', 'match_score': 91,
        })
        self.assertIsNone(self._search('tomas').data[0]['match_score'])

    def test_short_or_empty_queries_return_nothing(self):
        self.assertEqual(self._search('a').data, [])
        self.assertEqual(self._search('').data, [])

    def test_results_are_limited(self):
        for i in range(12):
            seeker = _make_job_seeker(f'bulk{i}@x.com')
            Application.objects.create(job_seeker=seeker, job_offer=self.offer)
        self.assertEqual(len(self._search('bulk').data), 8)

    def test_job_seekers_are_denied(self):
        self.client.force_authenticate(user=self.amira.job_seeker.user)
        self.assertEqual(self._search('amira').status_code, 403)
