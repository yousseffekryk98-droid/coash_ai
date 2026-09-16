# FuelForge — Adaptive Coaching Workspace

FuelForge is a React + TypeScript coaching platform for coaches and clients. It combines daily wellness logging, nutrition tools, client adherence analytics, progress tracking, goals, habits, scheduling, direct messaging, coach-reviewed intelligence, cycle-aware guidance, and Supabase-backed role isolation in one responsive workspace.

## Stack

- Frontend: React 19 + TypeScript + Vite
- Styling: Tailwind CSS with a responsive light/dark SaaS design system
- Backend: Supabase Postgres, Auth, Realtime, Storage, and RLS
- Local AI: Python standard-library weighted KNN with validation, cross-validation, confidence/OOD reporting, and guardrails
- Charts: Recharts
- Motion: Framer Motion
- PDF export: jsPDF
- CI: GitHub Actions Python tests + ESLint + production TypeScript/Vite build

## Main Workspaces

### Coach

- Live overview sourced from active coaching relationships and real daily logs
- Client roster with search, adherence, latest weight, last check-in, and risk signals
- Coach Intelligence priority queue with evidence, suggested actions, confidence, and mandatory coach review
- Recommendation approval/rejection/applied states plus structured helpful/not-helpful feedback
- Secure direct coach/client messaging
- Habit assignment with daily/weekly cadence, targets, dates, pause/resume controls, and client completion tracking
- Coaching calendar with session scheduling, meeting links, notes, duration, completion, and cancellation history
- Client-visible or private coaching notes
- Compliance heatmap and plateau/risk review
- Realtime gym-log event monitoring
- Nutrition/craving coaching tools
- Integration and roadmap workspaces

### Client

- Persistent daily wellness check-in
- Body weight, calories, macros, fiber, sleep, stress, libido, cravings, bloating, and glucose logging
- Real progress analytics from Supabase data
- Goal creation, progress updates, completion tracking, and target dates
- Assigned habits with same-day completion controls
- Secure messaging with the active coach
- Upcoming coaching sessions and meeting links
- Coach-pinned guidance
- Nutrition personalization and adaptive meal tools
- Recovery, gut-health, bloodwork, and supplement modules

## Local AI / Training

`python_ai` is a local coaching-assistant pipeline, not a remote LLM dependency. V2 adds:

- strict training-row validation and duplicate removal
- supported categorical/range validation
- calorie-vs-macro consistency checks
- weighted feature distance
- leave-one-out cross-validation across candidate K values
- automatic `k` selection
- per-target MAE/MAPE metrics and a saved evaluation report
- prediction confidence and nearest-neighbor distance reporting
- out-of-distribution detection
- conservative target guardrails
- automatic coach-review requirements for low-confidence/high-context cases
- unit tests run in CI

The bundled six-row CSV is a **template for testing the pipeline only**. It is intentionally not described as a production-trained model. For useful training, collect de-identified, coach-reviewed examples and outcomes. The new `ai_recommendations` and `ai_recommendation_feedback` tables are designed to capture structured review signals for future evaluation/retraining.

See `python_ai/README.md` for commands and training-data requirements.

## Authentication

When Supabase is configured, the login screen uses real email/password authentication and supports password-reset emails.

When Supabase environment variables are missing, the application clearly enters local preview mode and exposes isolated coach/client preview accounts. Preview data is never presented as production user data.

## Database Setup

Apply the SQL in this order:

1. `supabase/schema.sql`
2. `supabase/migrations/20260916_product_overhaul.sql`
3. `supabase/migrations/20260916_ai_coaching_v2.sql`
4. `supabase/migrations/20260916_messaging.sql`

The V2 migrations add:

- `client_habits`
- `habit_checkins`
- `ai_recommendations`
- `ai_recommendation_feedback`
- `direct_messages`
- indexes and row-level-security policies for the new workflows

The product-overhaul migration also provides `client_goals`, `coach_client_notes`, and `coaching_appointments`.

## Quick Start

```bash
npm ci
```

Copy `.env.example` to `.env` and set:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Never expose a Supabase service-role key through a `VITE_` variable.

Then run:

```bash
npm run dev
```

Quality checks:

```bash
python -m unittest discover -s python_ai/tests -p "test_*.py"
npm run lint
npm run build
```

## Key Routes

- `/login` — authentication
- `/signup` — onboarding
- `/admin` — coach overview
- `/clients` — coach client management
- `/intelligence` — coach-reviewed recommendation and priority workspace
- `/messages` — secure coach/client direct messaging
- `/habits` — coach habit assignment / client completion
- `/calendar` — coaching sessions and meeting links
- `/integrations` — coach integrations
- `/roadmap` — product roadmap
- `/dashboard` — client daily workspace
- `/progress` — client analytics
- `/goals` — client goal tracking
- `/settings` — account/profile settings

## Supabase Security

The base schema and migrations use row-level security. Clients can access their own records, while coaches access client data through active `coaching_relationships` assignments. Direct messages are immutable from the browser after insertion; broad update permissions were intentionally avoided.

The browser uses only the Supabase anon key. Review `SECURITY_AUDIT.md` before production deployment and test every RLS policy with separate coach and client accounts.

## Health Scope

FuelForge is a coaching and tracking tool, not a diagnostic system or substitute for professional medical care. Health-related outputs should be treated as coaching decision support and reviewed appropriately when medical conditions, abnormal readings, or competition-prep contexts are involved. The AI layer does not automatically apply plan changes to clients.
