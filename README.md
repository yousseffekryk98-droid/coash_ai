# FuelForge — Adaptive Coaching Workspace

FuelForge is a React + TypeScript coaching platform for coaches and clients. It combines daily wellness logging, nutrition tools, client adherence analytics, progress tracking, goals, coaching notes, cycle-aware guidance, and Supabase-backed role isolation in one responsive workspace.

## Stack

- Frontend: React 19 + TypeScript + Vite
- Styling: Tailwind CSS with a responsive light/dark SaaS design system
- Backend: Supabase Postgres, Auth, Realtime, Storage, and RLS
- Charts: Recharts
- Motion: Framer Motion
- PDF export: jsPDF
- CI: GitHub Actions lint + production build checks

## Main Workspaces

### Coach

- Live overview sourced from active coaching relationships and real daily logs
- Client roster with search, adherence, latest weight, last check-in, and risk signals
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
- Coach-pinned guidance
- Nutrition personalization and adaptive meal tools
- Recovery, gut-health, bloodwork, and supplement modules

## Authentication

When Supabase is configured, the login screen uses real email/password authentication and supports password-reset emails.

When Supabase environment variables are missing, the application clearly enters local preview mode and exposes isolated coach/client preview accounts. Preview data is never presented as production user data.

## Database Setup

Apply the SQL in this order:

1. `supabase/schema.sql`
2. `supabase/migrations/20260916_product_overhaul.sql`

The product-overhaul migration adds:

- `client_goals`
- `coach_client_notes`
- `coaching_appointments`
- indexes and row-level-security policies for those tables

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
npm run lint
npm run build
```

## Key Routes

- `/login` — authentication
- `/signup` — onboarding
- `/admin` — coach overview
- `/clients` — coach client management
- `/integrations` — coach integrations
- `/roadmap` — product roadmap
- `/dashboard` — client daily workspace
- `/progress` — client analytics
- `/goals` — client goal tracking
- `/settings` — account/profile settings

## Supabase Security

The base schema and product migration use row-level security. Clients can access their own records, while coaches access client data through active `coaching_relationships` assignments. The browser uses only the Supabase anon key.

Review `SECURITY_AUDIT.md` before production deployment and test every RLS policy with separate coach and client accounts.

## Health Scope

FuelForge is a coaching and tracking tool, not a diagnostic system or substitute for professional medical care. Health-related outputs should be treated as coaching guidance and reviewed appropriately when medical conditions or abnormal readings are involved.
