# RecrutAI — Frontend

React 18 SPA for the RecrutAI recruitment platform. Dark Nordic-Slate theme, JWT auth with silent token refresh, role-gated routing, and an in-browser video interview recorder.

---

## Table of Contents

- [Commands](#commands)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Design System](#design-system)
- [HTTP Layer](#http-layer)
- [State Management](#state-management)
- [Interview Flow](#interview-flow)
- [Shared UI Components](#shared-ui-components)
- [TypeScript Migration](#typescript-migration)
- [Testing](#testing)
- [Environment Variables](#environment-variables)

---

## Commands

All commands run from `frontend/recrutai/`.

```bash
npm start          # Dev server at http://localhost:3000 (hot-reload)
npm test           # Jest in watch mode
npm test -- --watchAll=false   # Single run (CI)
npm run build      # Production bundle → build/
```

---

## Architecture

```
Browser
  │
  ├─ App.js              QueryClientProvider + AuthProvider + ToastProvider
  │
  ├─ routes/AppRoutes.jsx   Lazy routes, per-route ErrorBoundary, ProtectedRoute
  │
  ├─ shared/
  │   ├─ http/client.ts     Axios instance + 401/refresh interceptor + request() facade
  │   ├─ api/               Domain-grouped endpoint functions (auth, jobOffers, …)
  │   └─ hooks/             TanStack Query hooks (useJobOffers, useApplications, …)
  │                         Interview state machine (useInterviewMachine, useVideoRecorder)
  │
  └─ components/
      ├─ ui/                Canonical primitives: Avatar, StatusBadge, KpiCard, Button, …
      ├─ layout/            DashboardLayout (sidebar + outlet), ErrorBoundary
      ├─ recruiter/         Dashboard views (offers, candidates, interviews, profile)
      │   └─ add-offer/     Wizard steps extracted per-step (StepDescribe … StepPreview)
      │   └─ candidates/    CandidateDetail, Kanban, MatchBar
      └─ jobseeker/         Dashboard views (applications, interviews, profile)
```

### Key architectural decisions

| Decision | Rationale |
|---|---|
| `shared/http/client.ts` as the only Axios instance | All API calls share the same interceptor; silent token refresh works everywhere including `useAuth`. |
| `ApiError` typed class | Callers write one error handler regardless of endpoint. `{ status, code, message, fields }` is always the shape. |
| TanStack Query for server state | Automatic caching, deduplication, and refetch-on-focus without manual `loading`/`error` flags per screen. |
| `useReducer` FSM for interview flow | Replaces 5 overlapping boolean flags; impossible states (e.g. `SUBMITTING` while `IDLE`) are unrepresentable. |
| Promise-based `stopAndGetBlob()` in `useVideoRecorder` | Resolves on `MediaRecorder.onstop` — eliminates the 1-second `setTimeout` race condition. |
| Per-route `ErrorBoundary` | A crash in one dashboard doesn't blank the entire shell. |
| Canonical `Avatar`, `StatusBadge`, `KpiCard` in `ui/` | Prevents the per-file duplication that previously produced 8 slightly different implementations. |

---

## Folder Structure

```
src/
├── App.js                        Root providers (QueryClient, Auth, Toast)
├── setupTests.ts                 @testing-library/jest-dom setup
│
├── routes/
│   ├── AppRoutes.jsx             Lazy routes + ProtectedRoute + ErrorBoundary per route
│   └── __tests__/
│       └── ProtectedRoute.test.jsx
│
├── hooks/
│   ├── useAuth.jsx               Auth context — /me validation, token storage
│   ├── useApi.js                 Legacy fetch hook (kept as bridge during RQ migration)
│   └── useToast.js               Toast notifications
│
├── shared/
│   ├── http/
│   │   ├── client.ts             ★ Axios instance, interceptors, ApiError, request<T>()
│   │   └── __tests__/
│   │       └── client.test.ts    ApiError unit tests
│   │
│   ├── api/                      Domain endpoint functions (each returns request<T>())
│   │   ├── auth.ts               ★ registerRecruiter, loginUser, fetchCurrentUser, …
│   │   ├── jobOffers.js          listOffers, createOffer, editOffer, deleteOffer, …
│   │   ├── applications.js       getJobSeekerApplications, applyForJob, …
│   │   ├── interviews.js         fetchJobSeekerInterviews, sendVideo, …
│   │   ├── profiles.js           getRecruiterProfile, updateJobSeekerProfile, …
│   │   └── aiDraft.js            draftOffer() seam (stub → real endpoint swap)
│   │
│   └── hooks/                    TanStack Query + domain hooks
│       ├── useJobOffers.js       useJobOffers, useAllJobOffers, useEditOffer, useDeleteOffer
│       ├── useApplications.js    useApplyForJob, useAllJobOffers (jobseeker)
│       ├── useInterviewMachine.js ★ useReducer FSM (IDLE→RECORDING→SUBMITTING→DONE)
│       ├── useVideoRecorder.js   ★ Promise-based stopAndGetBlob()
│       └── __tests__/
│           └── interviewMachine.test.js  Reducer unit tests (39 assertions)
│
├── services/
│   └── api.js                    Backward-compat re-export shim (legacy callers)
│
├── components/
│   ├── ui/                       Canonical design primitives
│   │   ├── Avatar.tsx            ★ Hashed oklch color, rounded prop ('full'|'xl')
│   │   ├── StatusBadge.tsx       ★ All offer/application/interview statuses
│   │   ├── KpiCard.tsx           ★ Metric card with accent gradient
│   │   ├── Button.jsx            Primary/secondary/danger variants
│   │   ├── Input.jsx             Text, textarea, select — unified styling
│   │   ├── Modal.jsx             Accessible dialog with ConfirmModal variant
│   │   └── index.js              Barrel export
│   │
│   ├── layout/
│   │   ├── DashboardLayout.jsx   Sidebar nav + <Outlet> shell
│   │   └── ErrorBoundary.jsx     Per-route error fallback UI
│   │
│   ├── recruiter/
│   │   ├── AddOffer.jsx          ★ Orchestrator only (~86 LOC)
│   │   ├── add-offer/            Wizard steps
│   │   │   ├── shared.jsx        Field, Toggle, SkillsEditor, Stepper, StepFooter, SectionCard
│   │   │   ├── StepDescribe.jsx  AI prompt → draftOffer() → proceed
│   │   │   ├── StepDetails.jsx   Title, location, description
│   │   │   ├── StepRequirements.jsx  Must/nice skills, experience range
│   │   │   ├── StepScreening.jsx Resume, cover letter, video interview toggles
│   │   │   └── StepPreview.jsx   Candidate-facing preview + publish
│   │   ├── candidates/
│   │   │   ├── CandidateDetail.jsx  AI assessment, accept/reject, resume modal
│   │   │   ├── Kanban.jsx           Three-column kanban (Applied / Accepted / Rejected)
│   │   │   └── MatchBar.jsx         CV match score bar
│   │   ├── recruiter_candidate.jsx  Offer selection → list/kanban toggle
│   │   ├── ViewOffers.jsx           Offer table with edit/delete + pagination
│   │   ├── entretien_recruiter.jsx  Interview table with scores
│   │   └── RecruiterProfile.jsx     Profile form with company details
│   │
│   └── jobseeker/
│       ├── JobSeekerInterviewProcess.jsx  ★ Video interview UI (uses useInterviewMachine)
│       ├── JobSeekerEntretien.jsx    Interview list (start / view answers)
│       ├── JobSeekerApplications.jsx Apply flow with offer search
│       ├── JobSeekerCandidate.jsx    Application status table
│       └── JobSeekerProfile.jsx      Profile form with CV upload
│
└── pages/                        Thin route wrappers (assemble layout + component)
    ├── home.jsx                  Public landing page
    ├── login.jsx                 Login form
    ├── Register.jsx              Role-based registration
    ├── RecruiterDashboard.jsx    Recruiter shell + nav
    └── JobseekerDashboard.jsx    Jobseeker shell + nav
```

★ = recently refactored / newly extracted

---

## Design System

### Theme

Nordic Slate dark theme. One source of truth in [`tailwind.config.js`](tailwind.config.js):

```js
colors: {
  brand: {
    base:          '#090C14',   // page background
    elevated:      '#0D1018',   // sidebar
    surface:       '#101420',   // cards
    accent:        '#F59E0B',   // amber primary
    'text-primary': '#EEF0F8',
    'text-muted':   '#9BA6C4',
    'text-disabled':'#59628A',
  },
  border: {
    subtle: 'rgb(35 42 62 / 0.7)',
    base:   'rgb(35 42 62 / 0.8)',
  },
},
```

### Component CSS classes

Defined in [`src/index.css`](src/index.css) via `@layer components`:

| Class | Use |
|---|---|
| `.topbar` | Sticky header bar (backdrop blur, border-bottom) |
| `.card-dark` | Dark surface card with top accent gradient |
| `.sidebar-bg` | Sidebar gradient background |
| `.border-subtle` | `border-border-subtle` shorthand |

### Rule

> **No new inline `style={{}}` objects in PRs** unless the value is dynamically computed from JS (e.g. a score percentage for a progress bar width). All repeated palette values belong in Tailwind config or `@layer components`.

---

## HTTP Layer

All network calls flow through `shared/http/client.ts`:

```ts
// Every API call is one line:
export const listOffers = () => request({ method: 'GET', url: '/job_offers/list' });

// Errors always have the same shape — one handler covers all:
try {
  await createOffer(data);
} catch (err) {
  if (err instanceof ApiError) {
    toast.error(err.message);   // err.status, err.code, err.fields also available
  }
}
```

### Auth interceptors

- **Request:** attaches `Authorization: Bearer <accessToken>` from `localStorage`
- **Response:** on `401`, silently calls `/users/token/refresh/`. If successful, replays the original request. If the refresh token is also expired, clears storage and redirects to `/login`. Concurrent 401s are queued — only one refresh call is made.

### Domain modules

| File | Exports |
|---|---|
| `shared/api/auth.ts` | `loginUser`, `registerRecruiter`, `registerJobSeeker`, `fetchCurrentUser`, `logoutUser`, `refreshToken` |
| `shared/api/jobOffers.js` | `fetchJobOffers`, `fetchAllJobOffers`, `createJobOffer`, `editJobOffer`, `deleteJobOffer`, `fetchCandidatesForJobOffer` |
| `shared/api/applications.js` | `getJobSeekerApplications`, `applyForJob`, `acceptCandidate`, `rejectCandidate` |
| `shared/api/interviews.js` | `fetchJobSeekerInterviews`, `fetchRecruiterInterviews`, `fetchQuestions`, `sendVideo`, `fetchAnswers` |
| `shared/api/profiles.js` | `getRecruiterProfile`, `updateRecruiterProfile`, `getJobSeekerProfile`, `updateJobSeekerProfile` |
| `shared/api/aiDraft.js` | `draftOffer(prompt)` — seam for future real endpoint |

---

## State Management

| Concern | Solution |
|---|---|
| Auth state (user, loading, logout) | `AuthContext` via `useAuth()` |
| Server data (lists, mutations) | TanStack Query via domain hooks (`useJobOffers`, `useApplications`, …) |
| Toast notifications | `useToast()` + `<ToastContainer>` |
| Interview FSM | `useInterviewMachine` (`useReducer`) |
| Local UI state | Component `useState` |

No Redux, no Zustand — the app doesn't have cross-cutting client state that justifies them.

---

## Interview Flow

The async video interview recorder is the most complex part of the frontend.

### State machine (`useInterviewMachine`)

```
IDLE ──START──► RECORDING(qIdx=0)
                    │
                 SUBMITTING ──────► NEXT ──► RECORDING(qIdx+1)
                    │                              │  (more questions)
                    └──── DONE  ◄─────────────────┘  (last question)
                    │
                    └──── ERROR(message)
```

- `SUBMITTING` disables the Next/Finish button — no double-submit
- `qIdx` lives in reducer state, never in a closure — no stale-closure bugs
- `stopAndGetBlob()` returns a Promise that resolves on `MediaRecorder.onstop` — no `setTimeout` guesses

### Sequence per question

1. User clicks **Start** → `dispatch(START)` → `recorder.start()` (camera + mic on)
2. User answers, clicks **Next** → `dispatch(SUBMITTING)` → `recorder.stopAndGetBlob()` resolves with `Blob`
3. `sendVideo(FormData)` uploads to backend → Whisper transcribes → scored
4. If more questions: `dispatch(NEXT)` → `recorder.start()` again
5. If last: `dispatch(DONE)` → teardown camera

---

## Shared UI Components

All live in `src/components/ui/`. Import from the barrel:

```js
import { Avatar, StatusBadge, KpiCard, Button, Input, Modal } from '../ui/index';
```

### `Avatar` (TypeScript)

```tsx
<Avatar name="Alae Elhaouat" size={40} rounded="full" />
<Avatar name="Company Inc" size={64} rounded="xl" />
```

Color is deterministically derived from the name via a hash → `oklch()` — same name always produces the same color.

### `StatusBadge` (TypeScript)

```tsx
<StatusBadge status="accepted" />
<StatusBadge status="available" label="Ready to interview" />
```

Covers all platform statuses: `open`, `active`, `closed`, `paused`, `draft`, `pending`, `accepted`, `rejected`, `available`, `completed`, `evaluated`, `processing`.

### `KpiCard` (TypeScript)

```tsx
<KpiCard label="Total Applications" value={42} loading={isLoading} />
<KpiCard label="Avg Score" value="78" sub="/100" accentColor="#10B981" />
```

---

## TypeScript Migration

Incremental — `.ts/.tsx` files coexist with `.js/.jsx` via `allowJs: true` in [`tsconfig.json`](tsconfig.json).

### Already migrated

| File | Notes |
|---|---|
| `shared/http/client.ts` | Full types: `ApiError`, `request<T>`, interceptors |
| `shared/api/auth.ts` | `AuthUser`, `AuthTokens` interfaces |
| `components/ui/Avatar.tsx` | `AvatarProps` |
| `components/ui/StatusBadge.tsx` | `BadgeStatus` union type exported |
| `components/ui/KpiCard.tsx` | `KpiCardProps` |

### Migration order for remaining files

Suggested next: `shared/api/jobOffers`, `shared/hooks/useJobOffers`, `components/ui/Button`, `hooks/useAuth`.

### Adding types to a new file

1. Rename `.jsx` → `.tsx` (or `.js` → `.ts`)
2. Add prop interfaces above the component
3. Run `npx tsc --noEmit` to verify — zero new errors is the bar

---

## Testing

```bash
npm test                                          # watch mode
npm test -- --watchAll=false                      # single run
npm test -- --coverage --watchAll=false           # with coverage
```

### Test suites

| File | What it tests | Assertions |
|---|---|---|
| `shared/hooks/__tests__/interviewMachine.test.js` | `reducer` — all state transitions, property-style coverage | 13 |
| `shared/http/__tests__/client.test.ts` | `ApiError` — constructor, all HTTP status codes, field errors | 14 |
| `routes/__tests__/ProtectedRoute.test.jsx` | Role-based redirect logic — unauthenticated, wrong role, correct role, loading | 7 (×n assertions) |

### Conventions

- Test file sits in `__tests__/` next to the file it covers
- Mock only what the test doesn't exercise — don't mock the thing you're testing
- Domain hooks that call Axios are mocked at the API module level (`jest.mock('../../api/interviews')`)
- Component tests use `@testing-library/react` + `MemoryRouter` for routing

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_BACKEND_URL` | **Yes** | Backend base URL, e.g. `http://localhost:8000`. The Axios client appends `/api`. |

Set in `frontend/recrutai/.env` (not committed):

```dotenv
REACT_APP_BACKEND_URL=http://localhost:8000
```
