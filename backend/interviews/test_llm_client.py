"""The LLM adapter must fail loudly: no silent zeros, no empty results stored as real data."""
import shutil
import tempfile
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core import mail
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, override_settings

from applications.models import Application, Resume
from applications.services.parse_resume import parse_resume
from applications.tasks import parse_resume_task, send_candidate_email
from core.management.commands.seed_demo import _pdf_bytes
from core.models import CVAnalysis
from core.services.analyze_cv import analyze_cv
from interviews.adapters.llm_client import REASONER_HEADROOM, DeepSeekClient, LLMResponseError
from interviews.models import Answer, AnswerEvaluation, QuestionSet
from interviews.tasks import evaluate_answer
from interviews.tests import (
    _make_application, _make_interview, _make_job_offer, _make_job_seeker,
    _make_question, _make_question_set, _make_recruiter,
)


def _reply(content, finish_reason='stop'):
    return SimpleNamespace(choices=[SimpleNamespace(
        message=SimpleNamespace(content=content), finish_reason=finish_reason,
    )])


def _client(reply, **settings_overrides):
    """A DeepSeekClient whose OpenAI SDK returns `reply` (an exception instance is raised)."""
    with patch('interviews.adapters.llm_client.OpenAI') as sdk:
        create = sdk.return_value.chat.completions.create
        if isinstance(reply, Exception):
            create.side_effect = reply
        else:
            create.return_value = reply
        client = DeepSeekClient()
    client._create = create  # for call inspection
    return client


class TestChatFailsLoudly(SimpleTestCase):
    def test_empty_reply_raises(self):
        with self.assertRaises(LLMResponseError):
            _client(_reply('   ')).generate_probe_questions(
                cv_data={}, job_offer_snapshot={}, base_questions=[], n=2)

    def test_truncated_reply_raises_even_if_partial_text_present(self):
        with self.assertRaises(LLMResponseError):
            _client(_reply('Question one?', finish_reason='length')).generate_probe_questions(
                cv_data={}, job_offer_snapshot={}, base_questions=[], n=2)

    def test_reply_without_any_question_raises(self):
        with self.assertRaises(LLMResponseError):
            _client(_reply('\n \n')).generate_question_set(
                job_offer_snapshot={}, instructions='', count=3, question_type='technical')

    def test_valid_probe_reply_is_split_and_capped(self):
        out = _client(_reply('Q1?\nQ2?\nQ3?')).generate_probe_questions(
            cv_data={}, job_offer_snapshot={}, base_questions=[], n=2)
        self.assertEqual(out, ['Q1?', 'Q2?'])


class TestStructuredReplies(SimpleTestCase):
    def _evaluate(self, content, **kw):
        return _client(_reply(content, **kw)).evaluate_answer_with_reasoning(question_text='Q', transcript='a')

    def test_parses_plain_and_fenced_json(self):
        self.assertEqual(self._evaluate('{"score": 7.5, "explanation": "ok"}')['score'], 7.5)
        fenced = '```json\n{"score": 4, "explanation": "meh"}\n```'
        self.assertEqual(self._evaluate(fenced), {'score': 4.0, 'explanation': 'meh'})
        chatty = 'Here you go: {"score": 9, "explanation": "great"} hope it helps'
        self.assertEqual(self._evaluate(chatty)['score'], 9.0)

    def test_malformed_json_raises_instead_of_scoring_zero(self):
        with self.assertRaises(LLMResponseError):
            self._evaluate('The answer is good, maybe a 7?')

    def test_missing_or_out_of_range_score_raises(self):
        for bad in ('{"explanation": "no score"}', '{"score": "high"}', '{"score": 11}', '{"score": -1}'):
            with self.subTest(bad=bad), self.assertRaises(LLMResponseError):
                self._evaluate(bad)

    def test_empty_evaluation_reply_raises(self):
        with self.assertRaises(LLMResponseError):
            self._evaluate('')

    def test_cv_analysis_validates_score_and_normalises_lists(self):
        ok = _client(_reply('{"eligibility_score": 8, "strengths": "x", "gaps": ["y"], "recommendation": "r"}'))
        out = ok.analyze_cv(raw_text='cv', job_description='d', requirements='r')
        self.assertEqual(out, {'eligibility_score': 8.0, 'strengths': [], 'gaps': ['y'], 'recommendation': 'r'})
        with self.assertRaises(LLMResponseError):
            _client(_reply('{"eligibility_score": 42}')).analyze_cv(raw_text='cv', job_description='d', requirements='r')

    def test_resume_parse_normalises_wrong_types(self):
        out = _client(_reply('{"skills": "python", "experience": [{"role": "Dev"}], "summary": "s"}')).parse_resume_data(raw_text='cv')
        self.assertEqual(out['skills'], [])
        self.assertEqual(out['experience'], [{'role': 'Dev'}])
        self.assertEqual(out['languages'], [])


class TestModelSelection(SimpleTestCase):
    def test_default_is_the_non_reasoning_chat_model_with_json_mode(self):
        client = _client(_reply('{"score": 5, "explanation": "e"}'))
        client.evaluate_answer_with_reasoning(question_text='Q', transcript='a')
        kwargs = client._create.call_args.kwargs
        self.assertEqual(client.model, 'deepseek-chat')
        self.assertEqual(kwargs['model'], 'deepseek-chat')
        self.assertEqual(kwargs['response_format'], {'type': 'json_object'})
        self.assertEqual(kwargs['max_tokens'], 400)

    def test_model_comes_from_settings_and_reasoner_gets_token_headroom(self):
        with override_settings(RECRUITMENT={'LLM_MODEL': 'deepseek-reasoner', 'LLM_TIMEOUT': 5}):
            client = _client(_reply('{"score": 5, "explanation": "e"}'))
        client.evaluate_answer_with_reasoning(question_text='Q', transcript='a')
        kwargs = client._create.call_args.kwargs
        self.assertEqual(kwargs['model'], 'deepseek-reasoner')
        self.assertEqual(kwargs['max_tokens'], 400 + REASONER_HEADROOM)
        self.assertNotIn('response_format', kwargs)
        self.assertNotIn('temperature', kwargs)


_MEDIA = tempfile.mkdtemp(prefix='recrutai-llm-media-')


@override_settings(MEDIA_ROOT=_MEDIA)
class TestFailuresDoNotCorruptData(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_MEDIA, ignore_errors=True)

    def setUp(self):
        self.recruiter = _make_recruiter()
        self.offer = _make_job_offer(self.recruiter)
        self.seeker = _make_job_seeker()

    def test_failed_scoring_stores_no_evaluation(self):
        qs = _make_question_set(self.offer, qs_status=QuestionSet.Status.LOCKED)
        interview = _make_interview(_make_application(self.seeker, self.offer), qs)
        answer = Answer.objects.create(
            interview=interview, question=_make_question(question_set=qs),
            candidate_video=SimpleUploadedFile('a.webm', b'video-bytes', content_type='video/webm'),
        )
        audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        audio.write(b'audio-bytes')
        audio.close()
        llm = MagicMock()
        llm.evaluate_answer_with_reasoning.side_effect = LLMResponseError('empty')
        with patch('interviews.tasks.extract_audio_ffmpeg', return_value=audio.name), \
                patch('interviews.tasks.transcribe_audio', return_value='my spoken answer'), \
                patch('interviews.tasks.get_llm', return_value=llm):
            with self.assertRaises(LLMResponseError):
                evaluate_answer(answer.id)
        answer.refresh_from_db()
        self.assertFalse(AnswerEvaluation.objects.filter(answer=answer).exists())
        self.assertEqual(answer.transcript, 'my spoken answer')  # the transcript is kept for the retry
        self.assertIn('Scoring', answer.evaluation_error)

    def test_failed_cv_analysis_stores_no_score(self):
        from applications.tests import _make_resume
        from applications.models import ResumeData
        resume = _make_resume(self.seeker)
        ResumeData.objects.create(resume=resume, raw_text='senior python developer ' * 5)
        app = Application.objects.create(job_seeker=self.seeker, job_offer=self.offer, resume=resume)
        llm = MagicMock()
        llm.analyze_cv.side_effect = LLMResponseError('empty')
        with patch('core.services.analyze_cv.get_llm', return_value=llm):
            with self.assertRaises(LLMResponseError):
                analyze_cv(app.id)
        self.assertFalse(CVAnalysis.objects.filter(application=app).exists())

    def _resume_with_text(self):
        resume = Resume.objects.create(job_seeker=self.seeker, label='cv')
        resume.original_file.save('cv.pdf', ContentFile(_pdf_bytes(['Alice Dupont', 'Senior Python developer at Acme with ten years of experience in data platforms']) ))
        return resume

    def test_failed_resume_parse_is_not_marked_ready_with_an_empty_profile(self):
        resume = self._resume_with_text()
        llm = MagicMock()
        llm.parse_resume_data.side_effect = LLMResponseError('empty')
        with patch('interviews.adapters.llm_client.get_llm', return_value=llm):
            with self.assertRaises(LLMResponseError):
                parse_resume(resume.id)
        resume.refresh_from_db()
        self.assertNotEqual(resume.parsing_status, Resume.ParsingStatus.READY)
        self.assertFalse(hasattr(resume, 'parsed'))

    def test_resume_is_marked_failed_once_retries_are_exhausted(self):
        resume = self._resume_with_text()
        llm = MagicMock()
        llm.parse_resume_data.side_effect = LLMResponseError('empty')
        with patch('interviews.adapters.llm_client.get_llm', return_value=llm):
            parse_resume_task.apply(args=(resume.id,), retries=3)
        resume.refresh_from_db()
        self.assertEqual(resume.parsing_status, Resume.ParsingStatus.FAILED)


class TestCandidateEmail(TestCase):
    def test_demo_accounts_are_never_emailed(self):
        self.assertFalse(send_candidate_email('Subject', 'Body', 'amira@recrutai.demo'))
        self.assertFalse(send_candidate_email('Subject', 'Body', 'AMIRA@RECRUTAI.DEMO'))
        self.assertEqual(len(mail.outbox), 0)

    def test_real_addresses_are_emailed(self):
        self.assertTrue(send_candidate_email('Subject', 'Body', 'real.person@example.com'))
        self.assertEqual([m.to for m in mail.outbox], [['real.person@example.com']])


# ---------------------------------------------------------------------------
# Transcription language hint
# ---------------------------------------------------------------------------

from interviews.language import guess_language, whisper_language_for


class TestTranscriptionLanguage(SimpleTestCase):
    def test_guesses_english_and_french_questions(self):
        self.assertEqual(guess_language('How would you evaluate a candidate-ranking model for fairness?'), 'en')
        self.assertEqual(guess_language('Describe a model you took from notebook to production.'), 'en')
        self.assertEqual(guess_language(
            'Comment as-tu géré la mise en production et le monitoring de modèles NLP chez OCP Group ?'), 'fr')
        self.assertEqual(guess_language('Quelles compétences en MLOps avez-vous développées ?'), 'fr')

    def test_unclear_or_empty_text_means_auto_detect(self):
        self.assertIsNone(guess_language('PyTorch NLP SQL'))
        self.assertIsNone(guess_language(''))
        self.assertIsNone(guess_language(None))

    def test_setting_overrides_the_guess(self):
        question = 'How would you evaluate a ranking model?'
        self.assertEqual(whisper_language_for(question), 'en')
        with override_settings(RECRUITMENT={'WHISPER_LANGUAGE': 'FR '}):
            self.assertEqual(whisper_language_for(question), 'fr')


class TestEvaluateAnswerLanguage(TestCase):
    def test_evaluate_answer_transcribes_in_the_questions_language(self):
        recruiter = _make_recruiter()
        offer = _make_job_offer(recruiter)
        qs = _make_question_set(offer, qs_status=QuestionSet.Status.LOCKED)
        interview = _make_interview(_make_application(_make_job_seeker(), offer), qs)
        question = _make_question(question_set=qs, text='Explain how you would reduce hallucinations in an LLM.')
        with override_settings(MEDIA_ROOT=_MEDIA):
            answer = Answer.objects.create(
                interview=interview, question=question,
                candidate_video=SimpleUploadedFile('a.webm', b'video', content_type='video/webm'),
            )
            audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            audio.write(b'audio')
            audio.close()
            llm = MagicMock()
            llm.model = 'deepseek-chat'
            llm.evaluate_answer_with_reasoning.return_value = {'score': 7.0, 'explanation': 'ok'}
            with patch('interviews.tasks.extract_audio_ffmpeg', return_value=audio.name), \
                    patch('interviews.tasks.transcribe_audio', return_value='an answer') as transcribe, \
                    patch('interviews.tasks.get_llm', return_value=llm):
                evaluate_answer(answer.id)
        transcribe.assert_called_once_with(audio.name, language='en')
