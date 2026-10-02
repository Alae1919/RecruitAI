# RecrutAI — Backend API Reference

**Stack:** Django 4.2 · Django REST Framework 3.15 · SimpleJWT · Celery + Redis · PostgreSQL 16
**Base URL:** `http://localhost:8000/api/`
**Auth:** `Authorization: Bearer <access_token>` on every endpoint except registration and login.

---

## Contents

1. [Architecture](#architecture)
2. [Data model](#data-model)
3. [Recruitment pipeline](#recruitment-pipeline)
4. [Auth & users](#auth--users)
5. [Job offers](#job-offers)
6. [Applications & resumes](#applications--resumes)
7. [Question sets](#question-sets)
8. [Interviews & evaluation](#interviews--evaluation)
9. [Background tasks](#background-tasks)
10. [Errors, pagination, rate limits](#errors-pagination-rate-limits)
11. [Configuration](#configuration)
12. [Demo data](#demo-data)

---

## Architecture

```
backend/
├── recruitment_platform/   settings, urls, celery
├── users/                  User (email login), Role/UserRole, JobSeeker, Recruiter, JWT, /me
├── job_offers/             JobOffer CRUD, filters, stats, AI job-description drafting
├── applications/           Application, Resume/ResumeData, pipeline (accept/advance/reject)
├── interviews/             QuestionSet/Question, Interview, Answer, evaluations, LLM adapter
└── core/                   CVAnalysis, seed_demo management command
```

Each app follows **view → service → model**. Views validate and serialize. Services in `<app>/services/` hold business rules inside `transaction.atomic`. Selectors in `<app>/selectors.py` build read querysets. Slow work runs in Celery tasks dispatched with `transaction.on_commit`. LLM calls go through `interviews/adapters/llm_client.py` (DeepSeek, OpenAI-compatible).

**Roles.** A user is `RECRUITER` or `JOBSEEKER` through a `UserRole` row. The role is embedded in the JWT `role` claim at login, so permission checks don't hit the database.

---

## Data model

```
User ─┬─ Recruiter ── JobOffer ─┬─ QuestionSet (versioned) ── Question (BASE)
      │                        └─ Application ─┬─ CVAnalysis
      └─ JobSeeker ─ Resume ─ ResumeData       ├─ Interview ─┬─ Question (PROBE, per candidate)
                       ▲                       │             ├─ Answer ── AnswerEvaluation
                       └──── Application.resume│             └─ InterviewEvaluation
                                               └─ Feedback (model only, no endpoint)
```

| Model | Key fields |
|---|---|
| `JobOffer` | `title`, `description` (may be empty for drafts), `requirements`, `skills` (must-have), `nice_skills`, `experience_min`/`experience_max`, `department`, `employment_type` (`full_time`/`part_time`/`contract`/`internship`), `salary_range`, `location`, `status` (`draft`/`open`/`paused`/`closed`), `screening_config` |
| `Application` | `status` (`pending`/`accepted`/`offer`/`hired`/`rejected`), `resume`, `applied_at`; derived `stage` |
| `Resume` / `ResumeData` | file, `label`, `is_default`, `parsing_status`; parsed `skills`, `experience[{role,company,years}]`, `education`, `languages`, `summary` |
| `CVAnalysis` | `eligibility_score` (0–10), `analysis_details{strengths,gaps,recommendation}` |
| `QuestionSet` | `version`, `status` (`draft`/`ready`/`locked`), `question_type`, `target_count` |
| `Interview` | `question_set` (locked set used), `status` (`available`/`completed`/…), `interview_date` |
| `AnswerEvaluation` | immutable: `final_score` (0–10), `explanation`, `model_used`, `prompt_version` |
| `InterviewEvaluation` | `total_score` (0–10), `decision` (`accepted`/`rejected`/`undecided`), `decision_source` (`rule`/`recruiter`), `reasoning`. Only the decision fields can change after creation. |

---

## Recruitment pipeline

The recruiter UI shows each application in one **stage**, derived by `Application.stage`:

| Stage | Rule |
|---|---|
| `applied` | `pending`, and no CV score ≥ `AUTO_SHORTLIST_SCORE` (default 7.5/10), or the offer turned auto-shortlist off |
| `screening` | `pending` with CV score ≥ `AUTO_SHORTLIST_SCORE` and `screening_config.auto_shortlist` not `false` |
| `interview` | `accepted` (an Interview exists) |
| `offer` | `offer` |
| `hired` | `hired` |
| `rejected` | `rejected` (outside the pipeline) |

`POST applications/advance/` moves an application one step: `pending → accepted` (creates the interview), `accepted → offer`, `offer → hired`.

**Interview lifecycle.**
1. Accepting a candidate locks the offer's newest **READY** question set, creates the `Interview`, and queues probe-question generation and the invitation email.
2. The candidate answers each question by video.
3. Each upload is transcribed and scored.
4. The interview becomes `completed` once **every** question (base + probe) has an answer.
5. The `InterviewEvaluation` (average score vs. `EVALUATION_PASS_THRESHOLD`, default 6.0) is created once every question's answer has been scored.
6. A recruiter can override the decision.

---

## Auth & users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `users/register/jobseeker/` | public | Register a job seeker (multipart: `email`, `password`, `full_name`, `phone`, `address`, `experience`, `skills`, `resume`) |
| POST | `users/register/recruiter/` | public | Register a recruiter (`email`, `password`, `full_name`, `phone`, `address`, `company_name`, optional `company_phone`, `position`, `company_website`, `industry`) |
| POST | `users/login/` | public · 5/min | `{email, password, role: "RECRUITER"\|"JOBSEEKER"}` → `{access, refresh}`. The access token carries the `role` claim. |
| POST | `users/token/refresh/` | public | `{refresh}` → new pair (refresh tokens rotate; the old one is blacklisted) |
| POST | `users/logout/` | JWT | `{refresh}` → blacklists it |
| GET | `users/me/` | JWT | `{email, role, …}` |
| GET / PATCH | `users/me/profile/` | JWT | `{role, profile}`. The profile shape depends on the role. |
| GET / PUT | `users/profile/recruiter/`, `users/profile/jobseeker/` | JWT | Older per-role profile endpoints, kept for compatibility (the frontend uses `users/me/profile/`) |

---

## Job offers

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `job_offers/list` | recruiter | Own offers, **with stats** (below). Filters: `status`, `title`, `location`, `experience_min`, `employment_type`, `search`. `ordering`: `created_at`, `title`, `experience_min`, `applicants_count`, `shortlisted_count`, `avg_match` (prefix `-` for descending) |
| GET | `job_offers/listALL` | any JWT | Public board: **open** offers only (a `status` filter cannot reveal drafts). Same filters, no stats. |
| POST | `job_offers/create` | recruiter | Create. `description` is required unless `status` is `draft`. `experience_max` must be ≥ `experience_min`. |
| PUT / PATCH | `job_offers/<id>/edit/` | owner | Update, including `status` (publishing a draft also requires a description) |
| DELETE | `job_offers/<id>/delete/` | owner | Delete |
| GET | `job_offers/<id>/Candidates/` | owner | Applicants as **candidate payloads** (see below) |
| POST | `job_offers/generate-description/` | recruiter · LLM | `{title, skills[], experience_level}` → `{description, model_used, prompt_version}` |

**Offer object** (recruiter list):

```json
{
  "id": 3, "title": "Senior Frontend Engineer", "status": "open",
  "description": "…", "requirements": "React, TypeScript, …",
  "skills": ["React", "TypeScript"], "nice_skills": ["Storybook"],
  "experience_min": 5, "experience_max": 10,
  "department": "Engineering", "employment_type": "full_time",
  "location": "Remote · EMEA", "salary_range": "€75k–€95k",
  "screening_config": {"cv": true, "video": true, "questions": 3, "auto_shortlist": true},
  "recruiter_name": "Acme", "question_sets_count": 2,
  "applicants_count": 6, "shortlisted_count": 3, "avg_match": 75.0,
  "created_at": "…", "updated_at": "…"
}
```

- `shortlisted_count`: applications that are not rejected and are either past screening (accepted, offer or hired) or have a CV score ≥ `AUTO_SHORTLIST_SCORE` (when auto-shortlist is on).
- `avg_match`: the mean CV score on a 0–100 scale, or `null` when no CV has been analysed.

---

## Applications & resumes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `applications/jobapplications/` | job seeker | `{job_offer_id, resume_id?}` (the default resume if omitted). Rejected if the offer is not `open`. Queues CV analysis. |
| GET | `applications/retreiveApplications` | job seeker | Own applications (`id, job_offer_title, status, stage, applied_at, updated_at, candidate_name, resume_url, eligibility_score`). AI analysis is **not** exposed to candidates. |
| GET | `applications/retreiveInterviews/` | job seeker | Own interviews |
| POST | `applications/accept/` | owner · LLM | `{application_id}` → accepts, locks the READY question set, creates the interview |
| POST | `applications/advance/` | owner · LLM | `{application_id}` → one pipeline step forward (see [pipeline](#recruitment-pipeline)) |
| POST | `applications/reject/` | owner | `{application_id}` |
| GET | `applications/pipeline/` | recruiter | Sidebar counts: `{offers, open_offers, candidates, stages: {applied, screening, interview, offer, hired, rejected}}` |
| GET / POST | `applications/resumes/` | job seeker | List, or upload (multipart `original_file`, `label?`, `make_default?`). PDF/DOC/DOCX, ≤ 3 MB. Parsing runs asynchronously. |
| GET / PATCH / DELETE | `applications/resumes/<id>/` | owner | Read, rename / set default (`{label?, is_default?}`), delete |

**Candidate payload** (recruiter only, from `job_offers/<id>/Candidates/`): the application fields above plus:

```json
{
  "candidate_email": "amira@…", "candidate_phone": "+31…", "candidate_address": "Amsterdam, NL",
  "headline": "Staff Frontend Engineer · Stripe",
  "match_score": 94,
  "analysis": {"strengths": ["…"], "gaps": ["…"], "recommendation": "…", "analyzed_at": "…"},
  "resume_profile": {"skills": [], "experience": [], "education": [], "languages": [], "summary": "…"},
  "interview": {
    "id": 1, "status": "available", "interview_date": "…",
    "questions": [{"id": 10, "text": "…", "source": "base"}, {"id": 14, "text": "…", "source": "probe"}],
    "evaluation": {"total_score": 7.9, "decision": "accepted"}
  },
  "timeline": [{"key": "applied", "label": "Applied", "at": "…"}, {"key": "ai_screened", "…": "…"}]
}
```

`analysis`, `resume_profile`, `interview` and `match_score` are `null` when not available yet.

---

## Question sets

The recruiter manages versioned question sets per offer: `draft → ready → locked`. Accepting a candidate locks the newest `ready` set. A locked set can't be edited or deleted.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | `interviews/job-offers/<offer_id>/question-sets/` | owner · LLM | List, or generate a new version (`{question_type, target_count, recruiter_instructions?}`) → `202` while generating |
| GET / PATCH / DELETE | `interviews/question-sets/<id>/` | owner | Read; update `status` (`ready`, `locked`) or settings; delete if not locked |
| POST | `interviews/question-sets/<id>/regenerate/` | owner · LLM | Regenerate questions → `202` |
| POST | `interviews/question-sets/<id>/questions/` | owner | Add a question `{question_text, order?}` |
| PATCH / DELETE | `interviews/questions/<id>/` | owner | Edit / delete a question |

---

## Interviews & evaluation

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `interviews/listinterviews/` | job seeker | Own interviews, each with `evaluation` |
| GET | `interviews/listrecruiterinterviews/` | recruiter | Interviews on own offers, each with `evaluation` |
| GET | `interviews/<id>/questions/` | the candidate | Base + probe questions for the interview |
| POST | `interviews/uploadVideo/` | the candidate · LLM | multipart `interviewId`, `questionId`, `video` (mp4/webm/mov, ≤ 100 MB). The question must belong to the interview. Queues transcription + scoring. |
| POST | `interviews/answers/` | candidate or owning recruiter | `{interview_id}` → `{answers: [{question_id, question_text, video_url, transcript, score}]}` |
| GET | `interviews/<id>/evaluation/` | candidate or owning recruiter | Full evaluation with per-answer breakdown. Returns `202` until it exists. |
| PATCH | `interviews/<id>/evaluation/decision/` | owning recruiter | `{decision, reasoning}` → override (`decision_source` becomes `recruiter`) |

---

## Background tasks

Celery workers use Redis as the broker. Tasks are idempotent and retry with backoff. An LLM call that returns an empty, truncated or malformed reply raises and is retried: no placeholder score, empty CV profile or empty question list is ever stored. A resume whose parsing keeps failing is marked `FAILED`.

| Task | Trigger | Does |
|---|---|---|
| `parse_resume_task` | resume upload | Extract PDF text (PyPDF2) → LLM parse into `ResumeData` |
| `analyze_cv_task` | application created | LLM scores the CV against the offer → `CVAnalysis` |
| `generate_question_set_task` | question-set create / regenerate | LLM base questions for the offer |
| `generate_probe_questions_task` | candidate accepted | LLM CV-specific probe questions for that interview |
| `send_acceptance_email` | candidate accepted | Invitation email (SMTP). Addresses on `@recrutai.demo` (seed data) are never emailed; without SMTP credentials emails print to the worker log. |
| `evaluate_answer` | video upload | ffmpeg → Whisper transcript (language taken from the question, because auto-detection mislabelled clear English as French) → LLM score → `AnswerEvaluation`; finalizes the interview when every question is scored |

---

## Errors, pagination, rate limits

- **Errors:** `{"error": "message"}`, DRF's `{"detail": "…"}`, or field errors `{"field": ["…"]}`.
- **Pagination:** offer lists are paginated: `{count, next, previous, results}`, 20 per page, `?page=`.
- **Rate limits:**
  - `login`: 5/minute
  - `llm`: 20/hour per user. It applies to accept, advance, question generation, JD drafting and video upload.

---

## Configuration

All settings come from environment variables (`.env` at the project root for Docker).

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | — (required) | Django signing key |
| `DJANGO_DEBUG` | `False` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts |
| `POSTGRES_DB` / `_USER` / `_PASSWORD` / `_HOST` / `_PORT` | `recrutai_db` / `recrutai_user` / `recrutai_pass` / `localhost` / `5432` | Database |
| `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | `redis://localhost:6379/0` | Celery |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,…` | Frontend origins |
| `DEEPSEEK_API_KEY` | — | LLM calls (DeepSeek, OpenAI-compatible) |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Model for every LLM task. `deepseek-reasoner` also works (the adapter adds token headroom for its hidden reasoning). |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | — | SMTP (Gmail) |
| `AUTO_SHORTLIST_SCORE` | `7.5` | CV score (0–10) that moves a candidate to Screening |
| `EVALUATION_PASS_THRESHOLD` | `6.0` | Interview average needed for an `accepted` AI decision |
| `PROBE_QUESTION_COUNT` | `2` | CV-specific questions per interview |
| `LLM_TIMEOUT` | `60` | Seconds per LLM call |
| `WHISPER_LANGUAGE` | — | Force the transcription language (`fr`, `en`, …). Empty: use the language of the question being answered, else auto-detect. |

---

## Demo data

```bash
docker compose exec backend python manage.py seed_demo           # create
docker compose exec backend python manage.py seed_demo --reset   # recreate
docker compose exec backend python manage.py seed_demo --remove  # delete demo data only
```

The command creates the recruiter `sara@recrutai.demo` (password `DemoPass2026!`). That recruiter has 6 offers, one in each status, and 10 candidates covering every pipeline stage, each with a resume PDF, parsed CV, AI analysis and, where relevant, an interview with answers and evaluations. Candidates log in as `<firstname>@recrutai.demo` with the same password. No LLM or Celery call is made.

Note that clicking **Invite to interview** in the demo still triggers the real background tasks (LLM probe questions and the invitation email).
