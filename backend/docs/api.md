# Backend API Documentation

**Stack:** Django 4.2 · Django REST Framework 3.15 · SimpleJWT · Celery · PostgreSQL  
**Base URL:** `http://localhost:8000`  
**Auth:** Bearer JWT — include `Authorization: Bearer <access_token>` on every protected request.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Data Models](#data-models)
3. [Authentication](#authentication)
4. [Users](#users)
5. [Job Offers](#job-offers)
6. [Applications](#applications)
7. [Interviews](#interviews)
8. [Background Tasks](#background-tasks)
9. [Configuration Reference](#configuration-reference)
10. [Running Locally](#running-locally)

---

## Architecture

```
backend/
├── recruitment_platform/   # Django project config (settings, urls, celery)
├── users/                  # Auth, roles, profiles
├── job_offers/             # Job offer CRUD
├── applications/           # Candidate applications
│   ├── services/           # Business logic: create, accept, reject
│   ├── tasks.py            # Celery: CV extraction, acceptance email
│   └── adapters/           # (future) external I/O adapters
├── interviews/             # Interview lifecycle
│   ├── tasks.py            # Celery: question generation, answer evaluation
│   └── adapters/
│       └── llm_client.py   # DeepSeek/OpenAI adapter (LLMClientProtocol)
└── core/                   # CVAnalysis model
```

### Request lifecycle

```
HTTP Request
    → View (permission check, deserialize)
        → Service (business logic, @transaction.atomic)
            → Model (ORM)
            → transaction.on_commit → Celery task
                → Adapter (LLM / SMTP / ffmpeg)
    ← Response (serialize)
```

### Role system

Two roles: **RECRUITER** and **JOBSEEKER**.  
Each `User` has one or more `UserRole` join-table records. The role is embedded in the JWT `role` claim at login so permission checks avoid a DB hit on every request.

---

## Data Models

```
User (email-based AbstractUser)
├── JobSeeker (1:1)  — experience, skills, resume file
└── Recruiter (1:1)  — company_name, company_phone, position

Role ←── UserRole ──→ User

JobOffer (Recruiter FK)
    └── Application (JobSeeker FK + JobOffer FK)
            ├── status: pending | accepted | rejected
            ├── extracted_text (async, set by Celery)
            ├── Interview (1:1)
            │       ├── status: available | scheduled | completed | canceled
            │       ├── Question[] (AI-generated)
            │       ├── Answer[]   (video upload → transcript → score)
            │       └── InterviewResult (aggregate score)
            ├── CVAnalysis (eligibility_score, analysis_details)
            └── Feedback (Recruiter rating)
```

---

## Authentication

All endpoints except registration and login require `Authorization: Bearer <access_token>`.

### POST `/api/users/login/`

Rate-limited: **5 requests / minute**.

**Request**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response 200**
```json
{
  "access":  "<JWT access token — valid 60 min>",
  "refresh": "<JWT refresh token — valid 1 day>"
}
```
The access token payload includes a `role` claim (`RECRUITER` or `JOBSEEKER`).

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Invalid credentials |
| 429 | Rate limit exceeded |

---

### POST `/api/users/token/refresh/`

**Request**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200**
```json
{ "access": "<new_access_token>", "refresh": "<new_refresh_token>" }
```
Refresh tokens rotate on every use. The old token is blacklisted immediately.

---

### POST `/api/users/logout/`

Blacklists the refresh token.

**Request**
```json
{ "refresh": "<refresh_token>" }
```

**Response 200** — `{}`

---

## Users

### POST `/api/users/register/jobseeker/`

Public — no auth required.

**Request** (`multipart/form-data`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | ✓ | Must be unique per role |
| `password` | string | ✓ | ≥ 8 characters |
| `full_name` | string | ✓ | Split into first/last name |
| `phone` | string | ✓ | |
| `address` | string | ✓ | |
| `experience` | string | ✓ | |
| `skills` | string | ✓ | |
| `resume` | file | ✓ | `.pdf`, `.doc`, `.docx` · max 3 MB |

**Response 201**
```json
{ "message": "User registered successfully!" }
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Validation error (email taken, bad password, invalid resume) |

---

### POST `/api/users/register/recruiter/`

Public — no auth required.

**Request** (`multipart/form-data`)

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✓ |
| `password` | string | ✓ |
| `full_name` | string | ✓ |
| `phone` | string | ✓ |
| `address` | string | ✓ |
| `company_name` | string | ✓ |
| `company_phone` | string | |
| `position` | string | |
| `company_website` | string | |
| `industry` | string | |

**Response 201**
```json
{ "message": "Recruiter registered successfully" }
```

---

### GET `/api/users/me/`

Returns the authenticated user's email and role (from JWT claim; falls back to DB).

**Response 200**
```json
{
  "email": "user@example.com",
  "role": "JOBSEEKER"
}
```

---

### GET/PUT/PATCH `/api/users/profile/jobseeker/` · `/api/users/update/jobseeker/`

Retrieve or update the authenticated job seeker's profile.

**GET response 200**
```json
{
  "email": "alice@example.com",
  "full_name": "Alice Dupont",
  "phone": "+33600000000",
  "experience": "3 years backend development",
  "skills": "Python, Django, PostgreSQL",
  "resume": "/media/resumes/alice_cv.pdf"
}
```

---

### GET/PUT/PATCH `/api/users/profile/recruiter/` · `/api/users/update/recruiter/`

Retrieve or update the authenticated recruiter's profile.

**GET response 200**
```json
{
  "email": "bob@acme.com",
  "full_name": "Bob Martin",
  "company_name": "Acme Corp",
  "company_phone": "+33700000000",
  "position": "HR Manager",
  "company_website": "https://acme.com",
  "industry": "Technology"
}
```

---

## Job Offers

### POST `/api/job_offers/create`

**Role required:** RECRUITER

**Request** (`application/json`)
```json
{
  "title": "Backend Developer",
  "description": "We are looking for a Python developer...",
  "requirements": "3+ years Django experience",
  "salary_range": "40 000 – 55 000 €",
  "location": "Paris, France"
}
```

**Response 201**
```json
{
  "message": "Job offer created successfully",
  "job_offer": {
    "id": 7,
    "title": "Backend Developer",
    "description": "We are looking for a Python developer...",
    "requirements": "3+ years Django experience",
    "salary_range": "40 000 – 55 000 €",
    "location": "Paris, France"
  }
}
```

---

### GET `/api/job_offers/list`

**Role required:** RECRUITER — returns only the authenticated recruiter's offers.

**Response 200**
```json
[
  {
    "id": 7,
    "title": "Backend Developer",
    "description": "...",
    "requirements": "...",
    "salary_range": "40 000 – 55 000 €",
    "location": "Paris, France"
  }
]
```

---

### GET `/api/job_offers/listALL`

**Auth required** (any role) — returns all job offers in the system (paginated, page size 20).

**Response 200** — same schema as above, wrapped in DRF pagination envelope:
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/job_offers/listALL?page=2",
  "previous": null,
  "results": [ ... ]
}
```

---

### GET `/api/job_offers/<pk>/Candidates/`

**Role required:** RECRUITER — lists all applications for a specific job offer.

**Response 200**
```json
[
  {
    "id": 3,
    "job_offer_title": "Backend Developer",
    "candidate_name": "Alice Dupont",
    "status": "pending",
    "applied_at": "2025-03-15T10:23:00Z",
    "updated_at": "2025-03-15T10:23:00Z",
    "resume_url": "http://localhost:8000/media/resumes/alice_cv.pdf",
    "extracted_text": null
  }
]
```
`extracted_text` is `null` until the background CV extraction task completes.

---

### PATCH `/api/job_offers/<pk>/edit/`

**Role required:** RECRUITER (must own the offer).

**Request** — any subset of the job offer fields.

**Response 200** — updated job offer object.

---

### DELETE `/api/job_offers/<pk>/delete/`

**Role required:** RECRUITER (must own the offer).

**Response 204** — no content.

---

## Applications

### POST `/api/applications/jobapplications/`

**Role required:** JOBSEEKER

Submit an application for a job offer. CV text extraction runs asynchronously — the response is returned immediately.

**Request** (`application/json`)
```json
{ "job_offer_id": 7 }
```

**Response 201**
```json
{
  "id": 3,
  "job_offer_title": "Backend Developer",
  "candidate_name": "Alice Dupont",
  "status": "pending",
  "applied_at": "2025-03-15T10:23:00Z",
  "updated_at": "2025-03-15T10:23:00Z",
  "resume_url": "http://localhost:8000/media/resumes/alice_cv.pdf",
  "extracted_text": null
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Already applied to this offer |
| 404 | Job offer not found / job seeker profile not found |

> **Note:** `extracted_text` is populated asynchronously by the `extract_cv_text` Celery task. Poll the applications list or wait for the interview to be accepted.

---

### GET `/api/applications/retreiveApplications`

**Role required:** JOBSEEKER — returns all applications submitted by the authenticated job seeker.

**Response 200** — array of application objects (same schema as above).

---

### GET `/api/applications/retreiveInterviews/`

**Role required:** JOBSEEKER — returns all interviews linked to the authenticated job seeker's applications.

**Response 200**
```json
[
  {
    "id": 1,
    "offer_name": "Backend Developer",
    "interview_date": "2025-03-16T09:00:00Z",
    "interview_link": null,
    "status": "available",
    "status_display": "Available",
    "result": null
  }
]
```

---

### POST `/api/applications/accept/`

**Role required:** RECRUITER (must own the job offer)  
**Rate limit:** 20 requests / hour (LLM scope)

Accepts an application. Atomically:
1. Creates or retrieves the `Interview` record.
2. Sets `application.status = "accepted"`.
3. On commit: dispatches `generateQuestions` Celery task (LLM question generation).
4. On commit: dispatches `send_acceptance_email` Celery task (SMTP notification).

**Request** (`application/json`)
```json
{ "application_id": 3 }
```

**Response 200**
```json
{
  "application": {
    "id": 3,
    "status": "accepted",
    ...
  },
  "interview": {
    "id": 1,
    "interview_date": "2025-03-16T09:00:00Z",
    "interview_link": null,
    "status": "available"
  }
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Missing `application_id` |
| 403 | Recruiter does not own the job offer |
| 404 | Application not found |

---

### POST `/api/applications/reject/`

**Role required:** RECRUITER (must own the job offer)

**Request**
```json
{ "application_id": 3 }
```

**Response 200** — updated application object with `status: "rejected"`.

---

## Interviews

### GET `/api/interviews/listinterviews/`

**Role required:** JOBSEEKER — returns the authenticated job seeker's interviews.

**Response 200**
```json
[
  {
    "id": 1,
    "offer_name": "Backend Developer",
    "interview_date": "2025-03-16T09:00:00Z",
    "interview_link": null,
    "status": "available",
    "status_display": "Available",
    "result": {
      "score": 7.4,
      "processed_at": "2025-03-16T11:00:00Z"
    }
  }
]
```

---

### GET `/api/interviews/listrecruiterinterviews/`

**Role required:** RECRUITER — returns all interviews for the recruiter's job offers.

**Response 200**
```json
[
  {
    "id": 1,
    "candidate_name": "Alice Dupont",
    "offer_title": "Backend Developer",
    "interview_date": "2025-03-16T09:00:00Z",
    "status": "available",
    "status_display": "Available",
    "interview_link": null,
    "result": null
  }
]
```

---

### POST `/api/interviews/questions/`

**Auth required**  
**Rate limit:** 20 requests / hour (LLM scope)

Returns all AI-generated questions for an interview.

**Request**
```json
{ "interview_id": 1 }
```

**Response 200**
```json
[
  { "id": 10, "interview": 1, "question_text": "Explain the difference between SQL and NoSQL databases.", "created_at": "..." },
  { "id": 11, "interview": 1, "question_text": "What is REST and how does it differ from GraphQL?", "created_at": "..." }
]
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Missing `interview_id` |
| 404 | Interview not found |

> Questions are generated asynchronously after `POST /api/applications/accept/`. If this endpoint returns an empty array, the generation task may still be running.

---

### POST `/api/interviews/uploadVideo/`

**Auth required**  
**Rate limit:** 20 requests / hour (LLM scope)

Uploads a video answer for a specific question. Triggers asynchronous evaluation.

**Request** (`multipart/form-data`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `interviewId` | string | ✓ | ID of the interview |
| `questionId` | string | ✓ | ID of the question being answered |
| `video` | file | ✓ | `.mp4`, `.webm`, or `.mov` · max 100 MB |

**Response 200**
```json
{
  "success": true,
  "message": "Video uploaded successfully. Evaluation started.",
  "answer_id": 5
}
```

**Errors**
| Status | Meaning |
|--------|---------|
| 400 | Missing interview/question ID, no video, invalid format, file too large |
| 404 | Interview or question not found |
| 500 | Failed to save video |

> After this call the `evaluate_answer` Celery task runs: it extracts audio with ffmpeg, transcribes with Whisper, scores with the LLM, and writes the aggregate `InterviewResult` once all answers are evaluated.

---

### POST `/api/interviews/answers/`

**Auth required**

Returns all submitted answers for an interview (transcripts and video URLs).

**Request**
```json
{ "interview_id": 1 }
```

**Response 200**
```json
{
  "interview_id": 1,
  "answers": [
    {
      "question_id": 10,
      "question_text": "Explain the difference between SQL and NoSQL databases.",
      "video_url": "/media/interview_videos/answer_10.mp4",
      "transcript": "SQL databases are relational and use structured schemas..."
    }
  ]
}
```

---

## Background Tasks

All tasks are processed by Celery workers using Redis as the broker. Tasks are idempotent and configured with `max_retries=3` and exponential backoff.

### `extract_cv_text(application_id)`

**Trigger:** `POST /api/applications/jobapplications/` (on commit)  
**App:** `applications`

Reads the job seeker's uploaded resume PDF and writes extracted plain text to `Application.extracted_text`. Skips if `extracted_text` is already set (idempotent).

---

### `send_acceptance_email(application_id)`

**Trigger:** `POST /api/applications/accept/` (on commit)  
**App:** `applications`

Sends an acceptance email via Gmail SMTP to the job seeker with the interview date and link.

---

### `generateQuestions(extracted_text, description, interview_id)`

**Trigger:** `POST /api/applications/accept/` (on commit)  
**App:** `interviews`

Calls the DeepSeek LLM to generate 2 technical interview questions in French based on the CV text and job description. Skips if questions already exist for the interview (idempotent). Uses `bulk_create` for efficiency.

---

### `evaluate_answer(answer_id)`

**Trigger:** `POST /api/interviews/uploadVideo/`  
**App:** `interviews`

Pipeline per answer:
1. Extract audio from video (`ffmpeg`)
2. Transcribe audio (Whisper `small` model)
3. Score transcript against the question (DeepSeek LLM, returns 0–10)
4. Write score to `Answer.score`
5. When all answers for an interview are scored, compute the average and write `InterviewResult`

Skips if `Answer.score` is already set (idempotent).

---

## Configuration Reference

All configuration is read from environment variables (`.env` file at the project root).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | ✓ | — | Django secret key |
| `DJANGO_DEBUG` | | `False` | Set to `True` for development |
| `DJANGO_ALLOWED_HOSTS` | | `localhost,127.0.0.1` | Comma-separated allowed hosts |
| `POSTGRES_DB` | ✓ | `recrutai_db` | PostgreSQL database name |
| `POSTGRES_USER` | ✓ | `recrutai_user` | PostgreSQL user |
| `POSTGRES_PASSWORD` | ✓ | `recrutai_pass` | PostgreSQL password |
| `POSTGRES_HOST` | | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | | `5432` | PostgreSQL port |
| `CELERY_BROKER_URL` | | `redis://localhost:6379/0` | Redis broker URL |
| `CELERY_RESULT_BACKEND` | | `redis://localhost:6379/0` | Redis result backend URL |
| `DEEPSEEK_API_KEY` | ✓ | — | DeepSeek / OpenAI-compatible API key |
| `SPACY_MODEL_PATH` | | `""` | Path to spaCy model (optional) |
| `EMAIL_HOST_USER` | ✓ | `""` | Gmail address for SMTP |
| `EMAIL_HOST_PASSWORD` | ✓ | `""` | Gmail app password |
| `CORS_ALLOWED_ORIGINS` | | `http://localhost:3000,...` | Comma-separated allowed CORS origins |

---

## Running Locally

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- ffmpeg (in `$PATH`)

### Setup

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set DJANGO_SECRET_KEY, POSTGRES_*, DEEPSEEK_API_KEY, EMAIL_*

# 4. Apply migrations
cd backend
python manage.py migrate

# 5. Create superuser (optional)
python manage.py createsuperuser

# 6. Start Django dev server
python manage.py runserver
```

### Running Celery

Open a separate terminal for each:

```bash
# Worker — processes all tasks
celery -A recruitment_platform worker -l info

# Optional: Flower dashboard (pip install flower)
celery -A recruitment_platform flower
```

### Docker (recommended)

```bash
docker-compose up --build
```

Starts PostgreSQL, Redis, Django, and the Celery worker together.

---

## Rate Limits

| Scope | Limit | Applied to |
|-------|-------|-----------|
| `login` | 5 / minute | `POST /api/users/login/` |
| `llm` | 20 / hour | `POST /api/applications/accept/`, `POST /api/interviews/questions/`, `POST /api/interviews/uploadVideo/` |

---

## Error Format

All errors follow DRF's standard envelope:

```json
{ "error": "Human-readable message." }
```

or for field-level validation errors:

```json
{
  "email": ["This field is required."],
  "password": ["Password must be at least 8 characters long."]
}
```

---

## Interview Status Flow

```
pending (Application)
    → accepted → Interview created (available)
                    → video uploaded (completed)
                        → evaluate_answer task runs
                            → InterviewResult written
    → rejected
```
