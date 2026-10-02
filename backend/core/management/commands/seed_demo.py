"""Populate the database with a realistic demo dataset.

    python manage.py seed_demo           # create (no-op if already seeded)
    python manage.py seed_demo --reset   # wipe the demo accounts and recreate them
    python manage.py seed_demo --remove  # wipe the demo accounts only

Creates one recruiter with offers in every status, and candidates in every
pipeline stage with parsed CVs, AI analyses, interviews, answers and
evaluations. No LLM, Whisper or Celery call is made: everything is written
directly, so the UI is fully populated even offline.

All demo accounts use the @recrutai.demo domain and the password below.
"""
from datetime import timedelta

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from applications.models import Application, Resume, ResumeData
from core.models import CVAnalysis
from interviews.models import (
    Answer, AnswerEvaluation, Interview, InterviewEvaluation, Question, QuestionSet,
)
from job_offers.models import JobOffer
from users.models import JobSeeker, Recruiter, Role, User, UserRole

DEMO_DOMAIN = '@recrutai.demo'
DEMO_PASSWORD = 'DemoPass2026!'
RECRUITER_EMAIL = f'sara{DEMO_DOMAIN}'

S = Application.Status

OFFERS = [
    dict(key='frontend', title='Senior Frontend Engineer', department='Engineering', location='Remote · EMEA',
         employment_type='full_time', salary_range='€75k–€95k', status='open', days_ago=2,
         skills=['React', 'TypeScript', 'GraphQL', 'Design systems'], nice_skills=['Storybook', 'Playwright'],
         experience_min=5, experience_max=10,
         description='Own the evolution of our design system and the hiring dashboard that 400+ recruiters rely on every day.'),
    dict(key='designer', title='Product Designer', department='Design', location='Paris, France',
         employment_type='full_time', salary_range='€60k–€75k', status='open', days_ago=5,
         skills=['Figma', 'Prototyping', 'Research'], nice_skills=['Systems thinking'],
         experience_min=3, experience_max=8,
         description='Shape the recruiter workflow, from post-a-job to offer letter, with PM, engineering and our ML team.'),
    dict(key='ml', title='Machine Learning Engineer', department='Engineering', location='Remote · Global',
         employment_type='full_time', salary_range='€95k–€130k', status='open', days_ago=7,
         skills=['Python', 'PyTorch', 'LLMs', 'NLP'], nice_skills=['MLOps'],
         experience_min=4, experience_max=12,
         description='Build the matching models behind candidate ranking, resume parsing and interview scoring.'),
    dict(key='revops', title='Revenue Operations Lead', department='Operations', location='London, UK',
         employment_type='full_time', salary_range='£70k–£90k', status='draft', days_ago=1,
         skills=['Salesforce', 'Analytics', 'SQL'], nice_skills=[], experience_min=5, experience_max=None,
         description=''),
    dict(key='csm', title='Customer Success Manager', department='Customer', location='Berlin, Germany',
         employment_type='full_time', salary_range='€55k–€70k', status='open', days_ago=3,
         skills=['SaaS', 'Onboarding'], nice_skills=['German'], experience_min=2, experience_max=6,
         description='Own the post-sales experience for mid-market customers.'),
    dict(key='talent', title='Talent Acquisition Partner', department='People', location='Casablanca, MA',
         employment_type='contract', salary_range='', status='paused', days_ago=14,
         skills=['Sourcing', 'ATS', 'Pipelines'], nice_skills=[], experience_min=3, experience_max=7,
         description='Paused while we revise the job description.'),
]

BASE_QUESTIONS = {
    'frontend': [
        'Walk us through the API design of a component library you built. What changed between versions?',
        'When do design tokens implemented as CSS variables break down in practice?',
        'Describe a time you disagreed with a designer. How was it resolved?',
    ],
    'designer': [
        'Show us a flow you redesigned end to end. Which research changed your direction?',
        'How do you keep a design system consistent across several product teams?',
        'Tell us about a design decision you had to defend with data.',
    ],
    'ml': [
        'How would you evaluate a candidate-ranking model for fairness before launch?',
        'Explain how you would reduce hallucinations in an LLM-based resume parser.',
        'Describe a model you took from notebook to production.',
    ],
    'csm': [
        'How do you run the first 30 days of a new mid-market customer?',
        'Tell us about a churn risk you turned around.',
        'Which metrics tell you an account is healthy?',
    ],
}

# stage -> how the record is built. score is the CV eligibility score (0-10).
CANDIDATES = [
    dict(offer='frontend', name='Amira El-Khalil', role='Staff Frontend Engineer', company='Stripe',
         city='Amsterdam, NL', phone='+31612345678', stage='interview', score=9.4, days_ago=2, answered=False,
         skills=['React', 'TypeScript', 'GraphQL', 'Design systems', 'Storybook', 'Playwright'], years=7,
         summary="Led the design-system team at Stripe EU. Ships weekly, deep into DX tooling and component API design.",
         strengths=['Meets every core requirement', 'Built a component library used company-wide', 'Location aligned'],
         gaps=['Salary expectation at the top of the band'],
         recommendation='Strong match on every core skill. Prioritise for interview.'),
    dict(offer='frontend', name='Tomás Ribeiro', role='Senior Frontend Engineer', company='Series-B startup',
         city='Lisbon, PT', phone='+351912345678', stage='screening', score=8.8, days_ago=3,
         skills=['React', 'TypeScript', 'Next.js', 'Tailwind', 'tRPC'], years=6,
         summary='Full-stack leaning frontend engineer, comfortable with performance work and SSR edge cases.',
         strengths=['Strong stack overlap', 'Available immediately'],
         gaps=['Less exposure to large-team design systems'],
         recommendation='Excellent React/Next.js profile; probe design-system scale in interview.'),
    dict(offer='frontend', name='Priya Nair', role='Principal Engineer', company='Gojek',
         city='Singapore', phone='+6591234567', stage='interview', score=8.2, days_ago=5, answered=True,
         skills=['React', 'JavaScript', 'Architecture', 'Accessibility', 'Mentoring'], years=11,
         summary='Over a decade of frontend engineering across fintech and super-apps. Accessibility lead for her region.',
         strengths=['Deep technical expertise', 'Accessibility leadership'],
         gaps=['Possibly above the level of the role', 'Relocation needed'],
         recommendation='Senior+ by tenure; confirm scope and compensation alignment.'),
    dict(offer='frontend', name='Miguel Santos', role='Frontend Engineer', company='Freelance',
         city='Barcelona, ES', phone='+34612345678', stage='applied', score=7.2, days_ago=1,
         skills=['React', 'Vue', 'CSS', 'Animations'], years=4,
         summary='Motion-oriented frontend engineer with strong CSS and animation skills.',
         strengths=['Great visual craft'], gaps=['Limited experience at scale'],
         recommendation='Creative generalist; below the auto-shortlist bar for this senior role.'),
    dict(offer='frontend', name='Hana Yamamoto', role='Software Engineer II', company='Shopify',
         city='Toronto, CA', phone='+14165550142', stage='applied', score=None, days_ago=0,
         skills=['React', 'Ruby', 'GraphQL', 'Testing'], years=3,
         summary="Mid-level engineer from Shopify's admin UI team with a strong testing culture.",
         strengths=[], gaps=[], recommendation=''),
    dict(offer='frontend', name='Omar Benali', role='Web Developer', company='Agency',
         city='Rabat, MA', phone='+212612345678', stage='rejected', score=4.1, days_ago=9,
         skills=['jQuery', 'PHP', 'CSS'], years=2,
         summary='Agency web developer focused on marketing sites.',
         strengths=['Solid CSS'], gaps=['No React experience', 'Junior for a senior role'],
         recommendation='Not a fit for this role.'),
    dict(offer='designer', name='Dana Foster', role='Product Designer', company='Figma',
         city='New York, US', phone='+16465550199', stage='interview', score=9.1, days_ago=4, answered=False,
         skills=['Figma', 'Research', 'Systems', 'Prototyping'], years=6,
         summary="Lead designer on Figma's Dev Mode; strong systems thinker and researcher.",
         strengths=['Top-of-band systems skills', 'Conference speaker'], gaps=['Timezone difference'],
         recommendation='Exceptional systems designer; check compensation fit.'),
    dict(offer='designer', name='Noah Bergström', role='Senior Developer', company='Klarna',
         city='Stockholm, SE', phone='+46701234567', stage='offer', score=7.9, days_ago=14, answered=True,
         skills=['Figma', 'Design tokens', 'React Native'], years=5,
         summary='Design-minded engineer who shipped Klarna’s design-tokens package.',
         strengths=['Design and engineering partnership'], gaps=['More mobile than web'],
         recommendation='Good hybrid profile for a design-systems-heavy role.'),
    dict(offer='csm', name='Lina Haddad', role='Customer Success Manager', company='Personio',
         city='Berlin, DE', phone='+4915112345678', stage='hired', score=8.6, days_ago=20, answered=True,
         skills=['SaaS', 'Onboarding', 'German', 'Salesforce'], years=5,
         summary='CSM for mid-market HR-tech accounts with a strong retention record.',
         strengths=['Domain match', 'Speaks German'], gaps=[],
         recommendation='Hire.'),
    dict(offer='ml', name='Youssef Amrani', role='Data Scientist', company='OCP Group',
         city='Casablanca, MA', phone='+212661234567', stage='screening', score=7.8, days_ago=6,
         skills=['Python', 'PyTorch', 'NLP', 'SQL'], years=4,
         summary='Data scientist building NLP models for industrial document processing.',
         strengths=['Hands-on NLP', 'Production Python'], gaps=['Limited LLM fine-tuning experience'],
         recommendation='Promising; worth a technical interview.'),
]

STAGE_STATUS = {
    'applied': S.PENDING, 'screening': S.PENDING, 'interview': S.ACCEPTED,
    'offer': S.OFFER, 'hired': S.HIRED, 'rejected': S.REJECTED,
}


def _pdf_bytes(lines):
    """A tiny valid one-page PDF so 'View resume' renders something real."""
    def esc(text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    ops = ['BT', '/F1 11 Tf', '72 750 Td', '16 TL']
    ops += [f'({esc(line)}) Tj T*' for line in lines]
    ops.append('ET')
    stream = '\n'.join(ops).encode('latin-1', errors='replace')

    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
        b'/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        b'<< /Length %d >>\nstream\n' % len(stream) + stream + b'\nendstream',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ]
    out = bytearray(b'%PDF-1.4\n')
    offsets = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b'%d 0 obj\n' % i + body + b'\nendobj\n'
    xref = len(out)
    out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objects) + 1)
    out += b''.join(b'%010d 00000 n \n' % o for o in offsets)
    out += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objects) + 1, xref)
    return bytes(out)


def _slug(name):
    return name.lower().split()[0].replace('á', 'a').replace('ö', 'o').replace('é', 'e')


class Command(BaseCommand):
    help = 'Create a demo recruiter, offers and candidates in every pipeline stage (no LLM calls).'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete existing demo accounts first.')
        parser.add_argument('--remove', action='store_true', help='Delete the demo accounts and exit.')

    def handle(self, *args, reset=False, remove=False, **options):
        existing = User.objects.filter(email__endswith=DEMO_DOMAIN)
        if remove:
            with transaction.atomic():
                self._wipe(existing)
            return
        if existing.exists() and not reset:
            self.stdout.write(self.style.WARNING('Demo data already exists. Use --reset to recreate it.'))
            return

        with transaction.atomic():
            if existing.exists():
                self._wipe(existing)
            now = timezone.now()
            recruiter = self._recruiter()
            offers = {o['key']: self._offer(recruiter, o, now) for o in OFFERS}
            question_sets = {key: self._question_sets(offers[key], key) for key in BASE_QUESTIONS}
            for spec in CANDIDATES:
                self._candidate(spec, offers[spec['offer']], question_sets.get(spec['offer']), now)

        self.stdout.write(self.style.SUCCESS(
            f'Demo data ready: {len(OFFERS)} offers, {len(CANDIDATES)} candidates.\n'
            f'  Recruiter login: {RECRUITER_EMAIL} / {DEMO_PASSWORD}\n'
            f'  Candidate logins: <firstname>{DEMO_DOMAIN} / {DEMO_PASSWORD} (e.g. amira{DEMO_DOMAIN})'
        ))

    # -- builders -----------------------------------------------------------

    def _wipe(self, users):
        for resume in Resume.objects.filter(job_seeker__user__in=users):
            resume.original_file.delete(save=False)
        count = users.count()
        users.delete()  # cascades to profiles, offers, applications, interviews...
        self.stdout.write(f'Removed {count} demo accounts.')

    @staticmethod
    def _user(email, full_name, role_name, *, phone='', address=''):
        first, _, last = full_name.partition(' ')
        user = User.objects.create_user(
            username=email, email=email, password=DEMO_PASSWORD,
            first_name=first, last_name=last, phone=phone, address=address,
        )
        role, _ = Role.objects.get_or_create(role_name=role_name)
        UserRole.objects.create(user=user, role=role)
        return user

    def _recruiter(self):
        user = self._user(RECRUITER_EMAIL, 'Sara Ben Ali', 'RECRUITER', phone='+212600000001', address='Casablanca, MA')
        return Recruiter.objects.create(
            user=user, company_name='Acme', position='Head of Talent', industry='Technology',
            company_website='https://acme.example',
        )

    @staticmethod
    def _offer(recruiter, spec, now):
        fields = {k: v for k, v in spec.items() if k not in ('key', 'days_ago')}
        offer = JobOffer.objects.create(
            recruiter=recruiter,
            requirements=', '.join(spec['skills'] + spec['nice_skills']),
            screening_config={'cv': True, 'cover': False, 'video': True, 'questions': 3, 'auto_shortlist': True},
            **fields,
        )
        JobOffer.objects.filter(pk=offer.pk).update(created_at=now - timedelta(days=spec['days_ago']))
        return offer

    @staticmethod
    def _question_sets(offer, key):
        """v1 is LOCKED (used by existing interviews); v2 is READY so 'Invite to interview' works live."""
        sets = {}
        for version, status in ((1, QuestionSet.Status.LOCKED), (2, QuestionSet.Status.READY)):
            qs = QuestionSet.objects.create(
                job_offer=offer, version=version, status=status, target_count=len(BASE_QUESTIONS[key]),
                model_used='seed', prompt_version='seed',
                locked_at=timezone.now() if status == QuestionSet.Status.LOCKED else None,
            )
            for i, text in enumerate(BASE_QUESTIONS[key]):
                Question.objects.create(question_set=qs, source=Question.Source.BASE, order=i, question_text=text)
            sets[status] = qs
        return sets

    def _candidate(self, spec, offer, question_sets, now):
        email = f'{_slug(spec["name"])}{DEMO_DOMAIN}'
        user = self._user(email, spec['name'], 'JOBSEEKER', phone=spec['phone'], address=spec['city'])
        seeker = JobSeeker.objects.create(
            user=user, experience=f'{spec["years"]} years', skills=', '.join(spec['skills']),
        )
        applied_at = now - timedelta(days=spec['days_ago'], hours=3)

        resume = Resume.objects.create(
            job_seeker=seeker, label='Main CV', is_default=True, parsing_status=Resume.ParsingStatus.READY,
        )
        resume.original_file.save(
            f'demo_{_slug(spec["name"])}.pdf',
            ContentFile(_pdf_bytes([
                spec['name'], f'{spec["role"]} - {spec["company"]}', spec['city'], '',
                spec['summary'], '', 'Skills: ' + ', '.join(spec['skills']),
            ])),
            save=True,
        )
        ResumeData.objects.create(
            resume=resume,
            raw_text=f'{spec["name"]}\n{spec["summary"]}\nSkills: {", ".join(spec["skills"])}',
            skills=spec['skills'],
            experience=[{'role': spec['role'], 'company': spec['company'], 'years': spec['years']}],
            education=[{'degree': 'MSc Computer Science', 'institution': 'University', 'year': 2016}],
            languages=['English', 'French'],
            summary=spec['summary'],
        )

        application = Application.objects.create(
            job_seeker=seeker, job_offer=offer, resume=resume, status=STAGE_STATUS[spec['stage']],
        )
        Application.objects.filter(pk=application.pk).update(
            applied_at=applied_at, updated_at=applied_at + timedelta(days=max(1, spec['days_ago'] // 2)),
        )

        if spec['score'] is not None:
            analysis = CVAnalysis.objects.create(
                application=application, eligibility_score=spec['score'],
                analysis_details={
                    'strengths': spec['strengths'], 'gaps': spec['gaps'],
                    'recommendation': spec['recommendation'],
                },
                model_used='seed', prompt_version='seed',
            )
            CVAnalysis.objects.filter(pk=analysis.pk).update(created_at=applied_at + timedelta(hours=2))

        if spec['stage'] in ('interview', 'offer', 'hired') and question_sets:
            self._interview(spec, application, question_sets[QuestionSet.Status.LOCKED], applied_at)

    @staticmethod
    def _interview(spec, application, question_set, applied_at):
        answered = spec.get('answered', False)
        interview = Interview.objects.create(
            application=application, question_set=question_set,
            interview_date=applied_at + timedelta(days=2),
            status=Interview.Status.COMPLETED if answered else Interview.Status.AVAILABLE,
            started_at=applied_at + timedelta(days=1),
        )
        Interview.objects.filter(pk=interview.pk).update(created_at=applied_at + timedelta(days=1))

        probes = [
            f'Your CV mentions {spec["skills"][0]} at {spec["company"]}. What was the hardest problem you solved with it?',
            f'With {spec["years"]} years of experience, what would you change first in our team?',
        ]
        for i, text in enumerate(probes):
            Question.objects.create(interview=interview, source=Question.Source.PROBE, order=i, question_text=text)

        if not answered:
            return

        scores = []
        questions = list(question_set.questions.order_by('order')) + list(interview.probe_questions.order_by('order'))
        for i, question in enumerate(questions):
            score = round(min(10.0, max(0.0, spec['score'] - 0.6 + (i % 3) * 0.4)), 1)
            scores.append(score)
            answer = Answer.objects.create(
                interview=interview, question=question,
                transcript=f'(demo transcript) In my role at {spec["company"]} I handled this by ...',
            )
            AnswerEvaluation.objects.create(
                answer=answer, raw_score=score, final_score=score, model_used='seed', prompt_version='seed',
                explanation='Clear, structured answer with concrete examples.',
                input_snapshot={'question_text': question.question_text, 'transcript': answer.transcript},
            )

        total = sum(scores) / len(scores)
        evaluation = InterviewEvaluation.objects.create(
            interview=interview, total_score=total,
            decision=InterviewEvaluation.Decision.ACCEPTED if total >= 6 else InterviewEvaluation.Decision.REJECTED,
            decision_source=InterviewEvaluation.DecisionSource.RULE,
            reasoning=f'Average score {total:.1f} against a threshold of 6.0 (demo data).',
            inputs_snapshot={'answer_evaluation_ids': [], 'weights': 'equal', 'threshold': 6.0},
        )
        InterviewEvaluation.objects.filter(pk=evaluation.pk).update(created_at=applied_at + timedelta(days=3))
