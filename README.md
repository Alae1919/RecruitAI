# RecrutAI

An AI-powered recruitment platform built as a final-year internship project (PFE). Recruiters post job offers, candidates apply with their CVs, and the platform automates interview question generation, conducts video interviews with speech-to-text transcription, and evaluates answers per-question — all driven by NLP and LLM APIs.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Quick Start — Docker (Recommended)](#quick-start--docker-recommended)
- [Manual Setup — Local Development](#manual-setup--local-development)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Authors](#authors)

---

## Features

### For Recruiters

- **Job offer management** — create, edit, delete, and filter offers with location / title / experience / sort controls
- **AI-assisted job description drafting** — generate a full description from title + skills + level in one click; regenerate anytime from the edit panel
- **Interview question sets** — structured DRAFT → READY → LOCKED lifecycle per offer; recruiters generate, edit, add, delete, and version questions before locking them for candidates
- **Applicant pipeline** — browse applicants with CV eligibility scores (spaCy NER + LLM), accept or reject with email notification
- **Transparent evaluation** — per-answer scores, AI explanations, model name, and prompt version visible in a collapsible breakdown
- **Decision override** — accept or reject a candidate with custom reasoning, overriding the AI decision while preserving the original scores

### For Job Seekers

- **Multi-resume management** — upload multiple CVs (PDF/DOC/DOCX), set a default, rename, delete; parsing status (PENDING → READY/FAILED) updates in real time
- **Resume picker at apply time** — choose which resume to attach per application; default pre-selected, inline upload available
- **Offer browsing** — filter by location, title, and experience level; sort by date or title; paginated (20 per page); filters are URL-backed and survive reload
- **Application tracking** — view status (pending / accepted / rejected) with timestamps
- **In-browser video interviews** — answer questions one by one via webcam; answers transcribed by Whisper (speech-to-text)
- **Interview debrief** — watch own recordings, read transcripts, and see the AI evaluation breakdown (score, explanation per question)

### Platform

- Email/password authentication with JWT (access 60 min / refresh 24 h, auto-rotation + blacklist)
- Role-based access control enforced server-side (`RECRUITER` / `JOBSEEKER`)
- Asynchronous task processing via Celery + Redis (question generation, resume parsing, CV analysis, email)
- Async task status propagated to the UI via polling with animated banners

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend framework** | Django 4.2 + Django REST Framework 3.15 |
| **Auth** | SimpleJWT (access 60 min / refresh 24 h, rotation + blacklist) |
| **Database** | PostgreSQL 16 (SQLite for ad-hoc local testing only) |
| **Task queue** | Celery 5 + Redis 7 |
| **NLP / CV analysis** | spaCy (custom NER model) |
| **Interview questions** | DeepSeek API (OpenAI-compatible, `deepseek-reasoner` model) |
| **Speech-to-text** | OpenAI Whisper (`small` model) + Vosk (offline fallback) |
| **PDF extraction** | PyPDF2 |
| **Email** | Gmail SMTP (configurable) |
| **Frontend** | React 18 + React Router v6 + Axios + Tailwind CSS |
| **Server state** | TanStack React Query v5 (queries, mutations, polling) |
| **Container** | Docker + Docker Compose |
| **Production server** | Gunicorn 4-worker + Nginx (static + SPA routing + API proxy) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React 18)                   │
│   AuthProvider → /me validation on every page load       │
│   Axios interceptors → silent token refresh on 401       │
│   React Query → server state, polling, cache invalidation│
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / JSON
                         ▼
┌─────────────────────────────────────────────────────────┐
│            Django REST Framework  (port 8000)            │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐  │
│  │  users   │ │job_offers│ │applications│ │interviews│  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────┘  │
│                     core (CVAnalysis)                    │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
    ┌─────────────┐           ┌──────────────┐
    │ PostgreSQL  │           │ Redis + Celery│
    │  (data)     │           │ (async tasks) │
    └─────────────┘           └──────────────┘
```

**Backend app breakdown:**

| App | Responsibility |
|---|---|
| `recruitment_platform/` | Project config — `settings.py`, `urls.py`, `celery.py` |
| `users/` | Custom `AbstractUser` (email auth), `JobSeeker`, `Recruiter`, `Resume`, `Role`, JWT login, `/me`, `/me/profile/` |
| `job_offers/` | `JobOffer` CRUD, filter/sort/pagination, AI description generation, `QuestionSet` lifecycle |
| `applications/` | `Application`, CV text extraction (PyPDF2), accept/reject flow, `Feedback` |
| `interviews/` | `Interview`, `Answer`, Whisper transcription, per-answer `AnswerEvaluation`, `InterviewEvaluation`, decision override |
| `core/` | `CVAnalysis` — eligibility scoring pipeline |

---

## Data Model

```
User (email-based auth)
├── JobSeeker  1:1  (experience, skills)
│   └── Resume  1:N  (file, label, is_default, parsing_status)
├── Recruiter  1:1  (company_name, position, industry, …)
└── UserRole   M:N  → Role (RECRUITER | JOBSEEKER)

JobOffer
├── QuestionSet  1:N  (version, status: DRAFT|READY|LOCKED, task_id)
│   └── Question  1:N  (text, question_type, order)
│
└── Application  1:N  (JobSeeker + JobOffer)
      ├── status: PENDING | ACCEPTED | REJECTED
      ├── resume: FK → Resume
      ├── CVAnalysis (eligibility_score, analysis_details)
      ├── Feedback
      └── Interview
            ├── Answer[]  (video_url, transcript from Whisper)
            └── InterviewEvaluation
                  ├── total_score, decision, decision_source (rule|recruiter)
                  ├── reasoning
                  └── AnswerEvaluation[]
                        (final_score, explanation, model_used,
                         prompt_version, evaluated_at)
```

---

## API Reference

All endpoints are prefixed with `/api/`.  
Protected endpoints require `Authorization: Bearer <access_token>`.

### Auth & Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `users/register/jobseeker/` | Public | Register a job seeker |
| `POST` | `users/register/recruiter/` | Public | Register a recruiter |
| `POST` | `users/login/` | Public | Login → `access` + `refresh` tokens |
| `POST` | `users/token/refresh/` | Public | Refresh access token |
| `GET` | `users/me/` | JWT | Authenticated user (email + role) |
| `GET/PUT` | `users/profile/recruiter/` | JWT | Get / update recruiter profile |
| `GET/PUT` | `users/profile/jobseeker/` | JWT | Get / update job seeker profile |

### Resumes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `me/resumes/` | JWT (JobSeeker) | List own resumes |
| `POST` | `me/resumes/` | JWT (JobSeeker) | Upload a resume (multipart) |
| `PATCH` | `me/resumes/<id>/` | JWT (JobSeeker) | Rename or set as default |
| `DELETE` | `me/resumes/<id>/` | JWT (JobSeeker) | Delete a resume |

### Job Offers

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `job_offers/list` | JWT (Recruiter) | Recruiter's own offers — supports `?title=&location=&experience_min=&ordering=&page=` |
| `GET` | `job_offers/listALL` | JWT | All published offers — same filter/sort params |
| `POST` | `job_offers/create` | JWT (Recruiter) | Create a job offer |
| `PUT` | `job_offers/<id>/edit/` | JWT (Recruiter) | Edit a job offer |
| `DELETE` | `job_offers/<id>/delete/` | JWT (Recruiter) | Delete a job offer |
| `GET` | `job_offers/<id>/Candidates/` | JWT (Recruiter) | List applicants for an offer |
| `POST` | `job_offers/generate-description/` | JWT (Recruiter) | AI-draft a job description from `{title, skills, experience_level}` |

### Question Sets

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `interviews/job-offers/<id>/question-sets/` | JWT (Recruiter) | List question sets for an offer |
| `POST` | `interviews/job-offers/<id>/question-sets/` | JWT (Recruiter) | Create / generate a new set (async) |
| `GET` | `interviews/question-sets/<id>/` | JWT | Get a question set with questions |
| `PATCH` | `interviews/question-sets/<id>/` | JWT (Recruiter) | Update status (DRAFT→READY→LOCKED) |
| `DELETE` | `interviews/question-sets/<id>/` | JWT (Recruiter) | Delete a draft set |
| `POST` | `interviews/question-sets/<id>/regenerate/` | JWT (Recruiter) | Regenerate questions (async) |
| `POST` | `interviews/question-sets/<id>/questions/` | JWT (Recruiter) | Add a question manually |
| `PATCH` | `interviews/questions/<id>/` | JWT (Recruiter) | Edit a question |
| `DELETE` | `interviews/questions/<id>/` | JWT (Recruiter) | Delete a question |

### Applications

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `applications/jobapplications/` | JWT (JobSeeker) | Apply (`job_offer_id` + `resume_id`) |
| `GET` | `applications/retreiveApplications` | JWT (JobSeeker) | List own applications |
| `POST` | `applications/accept/` | JWT (Recruiter) | Accept → email + interview created |
| `POST` | `applications/reject/` | JWT (Recruiter) | Reject → email sent |

### Interviews & Evaluation

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `interviews/listinterviews/` | JWT (JobSeeker) | List own interviews |
| `GET` | `interviews/listrecruiterinterviews/` | JWT (Recruiter) | List interviews for recruiter's offers |
| `POST` | `interviews/questions/` | JWT | Fetch questions for an interview |
| `POST` | `interviews/uploadVideo/` | JWT | Upload video answer → transcription + scoring |
| `POST` | `interviews/answers/` | JWT | Retrieve transcribed answers |
| `GET` | `interviews/<id>/evaluation/` | JWT | Full evaluation (202 while processing) |
| `PATCH` | `interviews/<id>/evaluation/decision/` | JWT (Recruiter) | Override AI decision with reasoning |

---

## Quick Start — Docker (Recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24 (or Docker Engine + Compose v2)
- A DeepSeek API key (free tier available at [platform.deepseek.com](https://platform.deepseek.com))
- A Gmail App Password for email notifications

### 1. Clone the repository

```bash
git clone <repo-url>
cd stage_pfe
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```dotenv
DJANGO_SECRET_KEY=your-50-char-random-secret      # required
POSTGRES_PASSWORD=choose-a-db-password             # required
EMAIL_HOST_USER=your@gmail.com                     # for notifications
EMAIL_HOST_PASSWORD=your-gmail-app-password        # Gmail App Password
DEEPSEEK_API_KEY=your-deepseek-api-key             # for questions + JD generation
SPACY_MODEL_PATH=/app/models/ner_model             # path inside container
```

> **Generate a Django secret key:**
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

### 3. Add ML models (optional for full interview features)

Place your model files in `backend/models/` — Docker Compose mounts this directory into the container at `/app/models/`.

```
backend/models/
├── ner_model/          # spaCy custom NER model
└── vosk-model-fr-*/    # Vosk offline speech model (optional)
```

> Whisper downloads the `small` model (~244 MB) automatically on first use and caches it inside the container.

### 4. Start the development stack

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:3000 |
| Backend (Django) | http://localhost:8000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

The backend runs `migrate` automatically on startup.

### 5. Create a superuser (optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

Django admin is available at http://localhost:8000/admin.

### Stopping

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers AND delete volumes (wipes DB)
```

---

## Manual Setup — Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16+ running locally
- Redis running locally (or Docker: `docker run -d -p 6379:6379 redis:7-alpine`)
- `ffmpeg` installed (required by Whisper)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv env
source env/bin/activate        # Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env        # edit to point POSTGRES_HOST=localhost

# Run migrations
python manage.py migrate

# Start dev server
python manage.py runserver

# Start Celery worker (separate terminal, same venv)
celery -A recruitment_platform worker -l info
```

### Frontend

```bash
cd frontend/recrutai

# Install dependencies
npm install

# Start dev server
npm start
```

The React app is at http://localhost:3000 and proxies API calls to http://localhost:8000 via `REACT_APP_BACKEND_URL`.

---

## Environment Variables

All configuration is driven by environment variables. Never commit `.env` or `.env.prod`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | **Yes** | — | Django secret key (50+ random chars) |
| `DJANGO_DEBUG` | No | `False` | Set `True` only in development |
| `DJANGO_ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Comma-separated allowed host names |
| `POSTGRES_DB` | No | `recrutai_db` | Database name |
| `POSTGRES_USER` | No | `recrutai_user` | Database user |
| `POSTGRES_PASSWORD` | No | `recrutai_pass` | Database password |
| `POSTGRES_HOST` | No | `localhost` | Database host (`db` in Docker) |
| `POSTGRES_PORT` | No | `5432` | Database port |
| `CELERY_BROKER_URL` | No | `redis://localhost:6379/0` | Redis broker URL |
| `CELERY_RESULT_BACKEND` | No | `redis://localhost:6379/0` | Redis result backend URL |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000,...` | Comma-separated CORS origins |
| `EMAIL_HOST_USER` | No | — | Gmail sender address |
| `EMAIL_HOST_PASSWORD` | No | — | Gmail App Password |
| `DEEPSEEK_API_KEY` | No | — | DeepSeek API key (questions + JD generation) |
| `SPACY_MODEL_PATH` | No | — | Absolute path to spaCy NER model |

---

## Project Structure

```
stage_pfe/
├── .env.example                  # Environment variable template (dev)
├── .env.prod.example             # Environment variable template (prod)
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
│
├── backend/
│   ├── Dockerfile                # Dev image
│   ├── Dockerfile.prod           # Production image (gunicorn)
│   ├── requirements.txt
│   ├── models/                   # ML model files (git-ignored)
│   │   ├── ner_model/            # spaCy custom NER model
│   │   └── vosk-model-*/         # Vosk speech model
│   │
│   └── recruitment_platform/     # Django project root
│       ├── settings.py
│       ├── urls.py
│       └── celery.py
│
│   # Django apps:
│   ├── users/          # Auth, profiles, Resume model, /me endpoint
│   ├── job_offers/     # JobOffer CRUD + AI description generation
│   ├── applications/   # Application lifecycle, CV extraction
│   ├── interviews/     # QuestionSet/Question, Answer, Evaluation, override
│   └── core/           # CVAnalysis eligibility scoring
│
└── frontend/recrutai/
    ├── Dockerfile
    ├── Dockerfile.prod
    ├── nginx.conf
    │
    └── src/
        ├── App.js
        ├── hooks/
        │   ├── useAuth.jsx          # AuthContext: /me-based auth + token refresh
        │   ├── useApi.js            # Generic Axios hook
        │   └── useToast.jsx         # Toast notification context
        ├── routes/
        │   └── AppRoutes.jsx        # Role-gated routing
        ├── shared/
        │   ├── api/                 # One module per domain (jobOffers, resumes,
        │   │                        #   questionSets, evaluations, applications, …)
        │   └── hooks/               # React Query hooks (useJobOffers, useResumes,
        │                            #   useQuestionSets, useEvaluations, …)
        ├── components/
        │   ├── ui/                  # Shared primitives: Button, Modal, Card,
        │   │                        #   Input, Pagination, AsyncTaskBanner,
        │   │                        #   ConfirmDialog, StatusBadge, Avatar, …
        │   ├── interviews/          # EvaluationPanel, OverrideDecisionForm
        │   ├── jobOffers/           # JobOffersFilters
        │   ├── recruiter/           # Dashboard, offers, candidate views,
        │   │   └── questions/       #   InterviewQuestionsPage, QuestionEditor,
        │   │                        #   GenerateQuestionSetForm
        │   └── jobseeker/           # Dashboard, profile, applications,
        │       └── resumes/         #   ResumeManager, ResumeCard, ResumePickerModal
        └── pages/                   # Thin route wrappers
```

---

## Production Deployment

### 1. Prepare production environment

```bash
cp .env.prod.example .env.prod
# Edit .env.prod — set real domain, strong passwords, DJANGO_DEBUG=False
```

### 2. Build and start production stack

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

| Service | Exposed |
|---|---|
| Frontend (Nginx) | port 80 |
| Backend (Gunicorn) | internal only, proxied by Nginx |
| PostgreSQL | internal only |
| Redis | internal only |

### 3. Production checklist

- [ ] `DJANGO_SECRET_KEY` is unique, long, and random
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_ALLOWED_HOSTS` set to your real domain
- [ ] `CORS_ALLOWED_ORIGINS` set to your real frontend URL
- [ ] SSL/TLS termination configured (Nginx reverse proxy or cloud load balancer)
- [ ] Database backed up on a schedule
- [ ] Email credentials and API keys rotated from dev

---

## Security Notes

- JWT refresh tokens rotate on every use; old tokens are blacklisted
- Route access is enforced server-side via `GET /api/users/me/` — `localStorage` role is used only as a UI hint
- Axios interceptors silently refresh expired access tokens; on refresh failure, session is cleared and the user is redirected to login
- All secrets are loaded exclusively from environment variables; the app will refuse to start if `DJANGO_SECRET_KEY` is missing
- `DJANGO_DEBUG=False` in production suppresses stack traces and SQL query logs

---

## Known Limitations

- **Whisper model (~244 MB)** downloads on first container start; subsequent starts use the cache.
- **spaCy NER model** must be manually placed in `backend/models/` — it is not downloaded automatically.
- **No rate limiting** on login or LLM endpoints (planned).
- **JWT in `localStorage`** is vulnerable to XSS; moving the refresh token to an `HttpOnly` cookie is the recommended next step.
- **CV file extension check** in the serializer is bypassable via filename tricks; a MIME-type check on the server side is needed.
- **Polling is HTTP-based** — async task completion (question generation, resume parsing) uses 2–5 s polling intervals rather than WebSocket push.

---

## Authors

- **Alae Elhaouat** — [alaeelhaouat5@gmail.com](mailto:alaeelhaouat5@gmail.com)

---

## License

This project was developed as a final-year internship project (PFE). All rights reserved.
