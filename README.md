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

- **Job offers table**: Role, Location, Applicants, Shortlist, Avg. match, Status and Posted columns. Filter by All / Open / Draft / Paused, sort by Recent / Most applicants / Best match, with live KPI cards.
- **Offer lifecycle**: offers are `draft`, `open`, `paused` or `closed`. Only open offers are visible to and accept job seekers.
- **Post-a-job wizard**: Describe, then Details, Requirements, Screening and Preview. AI drafts the description. Must-have and nice-to-have skills, experience range, department, employment type and screening options are all saved. "Save draft" works.
- **Candidate pipeline**: Applied, Screening, Interview, Offer, Hired. Stage tabs with counts, a 5-column Kanban, and match-score rings. Strong CVs (≥ 7.5/10) are auto-shortlisted into Screening, which can be switched off per offer. One click moves a candidate forward (invite, then offer, then hired).
- **Candidate detail**: contact info, AI assessment (recommendation, strengths, gaps), parsed CV (summary, experience, skills, languages), the interview questions with the CV-based ones flagged, the AI score, and a stage timeline.
- **Interview question sets**: versioned DRAFT, READY, LOCKED lifecycle per offer. Generate, edit, add and delete questions before they are locked for candidates.
- **Transparent evaluation**: per-answer scores, AI explanations, model name and prompt version, plus a recruiter decision override with reasoning.
- **Sidebar**: offer and candidate counts and a live per-stage Pipeline block.

### For Job Seekers

- **Multi-resume management**: upload several CVs (PDF/DOC/DOCX), set a default, rename or delete them. Parsing status (PENDING, then READY or FAILED) updates live.
- **Resume picker at apply time**, with the default pre-selected.
- **Offer browsing**: filter by location, title and experience level, sort, paginate. Filters are kept in the URL.
- **Application tracking** with status and timestamps.
- **In-browser video interviews**: answer each question via webcam. Whisper transcribes the answers. The interview stays resumable until the last question is answered.
- **Interview debrief**: watch your recordings, read transcripts, and see the AI score per question.

### Platform

- Email/password authentication with JWT (access 60 min, refresh 24 h, rotation and blacklist).
- Role-based access control enforced server-side (`RECRUITER` / `JOBSEEKER`), including object-level ownership checks.
- Asynchronous processing via Celery and Redis: resume parsing, CV analysis, question generation, transcription, scoring, email.
- `seed_demo` command for a fully populated demo without any LLM calls.
- CI on GitHub Actions: backend tests against Postgres, frontend tests and production build.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend framework** | Django 4.2 + Django REST Framework 3.15 |
| **Auth** | SimpleJWT (access 60 min / refresh 24 h, rotation + blacklist) |
| **Database** | PostgreSQL 16 |
| **Task queue** | Celery 5 + Redis 7 |
| **CV parsing & scoring, questions, answer scoring** | DeepSeek LLM API (OpenAI-compatible, `deepseek-reasoner`) |
| **Speech-to-text** | OpenAI Whisper (`small` model) + ffmpeg |
| **PDF extraction** | PyPDF2 |
| **Email** | Gmail SMTP (configurable) |
| **Frontend** | React 18 + React Router v6 + Axios + Tailwind CSS |
| **Server state** | TanStack React Query v5 |
| **Container** | Docker + Docker Compose |
| **Production server** | Gunicorn + Nginx (static + SPA routing + API proxy) |
| **CI** | GitHub Actions |

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
| `job_offers/` | `JobOffer` CRUD + lifecycle status, filter/sort/pagination, applicant stats, AI description generation |
| `applications/` | `Application`, `Resume`/`ResumeData`, pipeline stages, accept/advance/reject, pipeline summary |
| `interviews/` | `Interview`, `Answer`, Whisper transcription, per-answer `AnswerEvaluation`, `InterviewEvaluation`, decision override |
| `core/` | `CVAnalysis` (eligibility scoring), `seed_demo` command |

---

## Data Model

```
User (email-based auth)
├── JobSeeker  1:1  (experience, skills)
│   └── Resume  1:N  (file, label, is_default, parsing_status)
│       └── ResumeData 1:1 (skills, experience, education, languages, summary)
├── Recruiter  1:1  (company_name, position, industry, …)
└── UserRole   M:N  → Role (RECRUITER | JOBSEEKER)

JobOffer  (status: draft | open | paused | closed, skills, nice_skills,
           experience_min/max, department, employment_type, screening_config)
├── QuestionSet  1:N  (version, status: draft | ready | locked)
│   └── Question  1:N  (BASE questions)
│
└── Application  1:N  (JobSeeker + JobOffer + Resume)
      ├── status: pending | accepted | offer | hired | rejected
      ├── stage (derived): applied | screening | interview | offer | hired | rejected
      ├── CVAnalysis (eligibility_score 0-10, strengths, gaps, recommendation)
      └── Interview  (uses the locked QuestionSet)
            ├── Question[]  (PROBE questions generated from this candidate's CV)
            ├── Answer[]  (video, Whisper transcript)
            │     └── AnswerEvaluation (final_score, explanation, model_used, prompt_version)
            └── InterviewEvaluation (total_score, decision, decision_source: rule | recruiter, reasoning)
```

---

## API Reference

The full, current reference is in **[backend/docs/api.md](backend/docs/api.md)**. It covers endpoints, payloads, the pipeline rules, background tasks and configuration. All paths are under `/api/`. Protected endpoints need `Authorization: Bearer <access_token>`.

| Area | Main endpoints |
|---|---|
| Auth | `users/login/` (`{email, password, role}`), `users/token/refresh/`, `users/logout/`, `users/me/`, `users/me/profile/` |
| Job offers | `job_offers/list` (recruiter, with stats), `job_offers/listALL` (open offers), `create`, `<id>/edit/`, `<id>/delete/`, `<id>/Candidates/`, `generate-description/` |
| Applications | `applications/jobapplications/`, `retreiveApplications`, `accept/`, `advance/`, `reject/`, `pipeline/` |
| Resumes | `applications/resumes/`, `applications/resumes/<id>/` |
| Question sets | `interviews/job-offers/<id>/question-sets/`, `interviews/question-sets/<id>/`, `…/regenerate/`, `…/questions/`, `interviews/questions/<id>/` |
| Interviews | `interviews/listinterviews/`, `listrecruiterinterviews/`, `interviews/<id>/questions/`, `uploadVideo/`, `answers/`, `interviews/<id>/evaluation/`, `…/evaluation/decision/` |

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
DEEPSEEK_API_KEY=your-deepseek-api-key             # CV analysis, questions, scoring, JD drafting
```

> **Generate a Django secret key:**
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

### 3. Speech model

Nothing to install. Whisper downloads the `small` model (~244 MB) automatically on first use and caches it inside the container.

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

### 5. Load demo data (recommended)

```bash
docker compose exec backend python manage.py seed_demo
```

Sign in at http://localhost:3000 as **sara@recrutai.demo** / **DemoPass2026!** (recruiter). Every screen is populated: offers in each status and candidates in each pipeline stage. Candidates sign in as `<firstname>@recrutai.demo` with the same password. `--reset` recreates the data, and `--remove` deletes only the demo accounts. No LLM calls are made.

### 6. Create a superuser (optional)

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
| `DEEPSEEK_API_KEY` | No | — | DeepSeek API key (CV analysis, questions, scoring, JD drafting) |
| `AUTO_SHORTLIST_SCORE` | No | `7.5` | CV score (0–10) that moves a candidate to Screening |
| `EVALUATION_PASS_THRESHOLD` | No | `6.0` | Interview average needed for an "accepted" AI decision |
| `PROBE_QUESTION_COUNT` | No | `2` | CV-specific questions per interview |

---

## Project Structure

```
stage_pfe/
├── .env.example                  # Environment variable template (dev)
├── .env.prod.example             # Environment variable template (prod)
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
├── .github/workflows/ci.yml      # CI: backend + frontend tests, build
│
├── backend/
│   ├── Dockerfile                # Dev image
│   ├── Dockerfile.prod           # Production image (gunicorn)
│   ├── requirements.txt
│   ├── docs/api.md               # Backend API reference
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
│   └── core/           # CVAnalysis + seed_demo management command
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

- **Whisper model (~244 MB)** downloads on first use; later runs use the cache.
- **Probe questions can come back empty.** `deepseek-reasoner` counts its reasoning tokens against the small `max_tokens` used for probe questions. The interview then runs with base questions only.
- **JWT in `localStorage`** is vulnerable to XSS. Moving the refresh token to an `HttpOnly` cookie is the recommended next step.
- **No per-user LLM cost cap.** There is rate limiting (`llm`: 20/hour per user), but no daily budget.
- **Polling, not push.** Async task completion uses 2–5 s polling rather than WebSockets.
- **Recruiter actions not implemented yet**: scheduling an interview date, messaging a candidate, and drag-and-drop between Kanban columns.

---

## Authors

- **Alae Elhaouat** — [alaeelhaouat5@gmail.com](mailto:alaeelhaouat5@gmail.com)

---

## License

This project was developed as a final-year internship project (PFE). All rights reserved.
