# Bio-Adaptive Coaching SaaS MVP Roadmap

This roadmap focuses on launching a real product quickly by shipping the Core Loop first.

## Core Loop (Ship First)

1. User Profile
- Required fields: gender, weight, goal, has_diabetes, period status/cycle start.
- Output: usable profile state for nutrition and warning logic.

2. Calculator Engine
- Base TDEE (Mifflin by default, Katch optional if body fat is provided).
- Cycle-aware calorie adjustment (+250 in luteal phase).
- Diabetes-safe guidance (low-GI warning and carb timing hint).

3. Daily Log
- Required logs: weight, calories, libido (1-5).
- Optional logs for phase 1.1: sleep, stress, glucose.
- Coach view: simple trend and low-libido alert trigger.

## MVP Scope Lock (What NOT to build before launch)

- Full 150+ food CRUD admin suite
- Full payment automation
- Advanced video editor and timeline tools
- Deep AI personalization infrastructure

## Feature Status Snapshot

- Profile flow: scaffolded and partially integrated
- Calculator: implemented
- Daily wellness logs: implemented UI, needs full DB persistence path
- Coach alerts: implemented at UI/logic level, partial DB wiring

## MVP Milestones

### Milestone 1: Data Truth
- Wire profile fields to Supabase tables and fetch on session start.
- Persist daily log submissions to daily_logs.
- Add minimal validation and required-field checks.

### Milestone 2: Coach Utility
- Show today status cards for assigned clients.
- Trigger alert when libido <=2 for 3 consecutive logs.
- Add one-click client note for intervention.

### Milestone 3: Launch Readiness
- Add onboarding flow for first-time clients.
- Add legal pages and visible disclaimer.
- Deploy on Vercel with environment variables.

## Success Metrics for First 30 Days

- Daily active clients submitting logs: >60%
- Coach weekly retention: >70%
- Alert-to-action rate (coach opens alerts): >50%
- Avg. logging time per client check-in: <90 seconds

## Technical Checklist

- Supabase RLS policies verified for profile + daily_logs + coach access
- Error tracking and event logging added
- Build and typecheck passing in CI
- Staging and production environments separated

## Deployment Notes (Vercel)

1. Create Vercel project from this repository.
2. Add env vars:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Set build command: npm run build
4. Set output directory: dist

## Immediate Next Build Slice

1. Profile form persistence to Supabase
2. Daily log submit API and client form wiring
3. Coach "today alerts" panel sourced from real daily_logs
