# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered recruitment platform (PFE/internship project) with Django REST Framework backend and React frontend. Features CV analysis, automated interviews (with Vosk speech recognition), role-based access for recruiters and job seekers.

## Commands

### Backend (run from `backend/`)

```bash
python manage.py runserver          # Dev server at http://localhost:8000
python manage.py migrate
python manage.py makemigrations
python manage.py test
celery -A recruitment_platform worker -l info   # Requires Redis on localhost:6379
```

### Frontend (run from `frontend/recrutai/`)

```bash
npm start           # Dev server at http://localhost:3000
npm run build
npm test
```

## Architecture

### Backend (`backend/`)

Django app split into domain-focused apps:

- **recruitment_platform/**: Project config — `settings.py`, `urls.py`, `celery.py`
- **users/**: Custom `AbstractUser` (email-based auth), `JobSeeker`, `Recruiter` profiles, JWT auth
- **job_offers/**: `JobOffer` model, CRUD endpoints
- **applications/**: `Application` model, CV text extraction (PyPDF2), `Feedback`
- **interviews/**: `Interview`, `Question`, `Answer`, `InterviewResult` — includes Vosk-based speech-to-text
- **core/**: `CVAnalysis` model with eligibility scoring via OpenAI/Spacy

Auth: SimpleJWT — email/password → access+refresh tokens. CORS allows `localhost:3000`.

### Frontend (`frontend/recrutai/src/`)

- **routes/AppRoutes.jsx**: Role-based routing (RECRUITER vs JOBSEEKER)
- **services/api.js**: Single Axios client — all API calls go through here
- **hooks/useAuth.jsx**: Auth state and JWT token management (localStorage)
- **components/recruiter/**: Dashboard, job offer management, candidate/interview views
- **components/jobseeker/**: Dashboard, profile, applications, interview flow
- **pages/**: Thin wrappers that assemble components for each route

### Data Model

```
User (email-based)
├── JobSeeker (1:1)
├── Recruiter (1:1)
└── UserRole (M:N)

JobOffer → Application (JobSeeker + JobOffer)
                └── Interview → Question / Answer / InterviewResult
                └── Feedback
                └── CVAnalysis (eligibility_score, analysis_details)
```

## Key Config

- Frontend `.env`: `REACT_APP_BACKEND_URL=http://localhost:8000`
- Backend DB: SQLite (`db.sqlite3`) for development
- Celery broker: Redis at `redis://localhost:6379`
- Email: Gmail SMTP (configured in `settings.py`)
