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
