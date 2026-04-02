# Bio-Adaptive Coaching SaaS

A production-ready coaching platform built with React, TypeScript, Vite, and Supabase.

## Stack

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS (with dark performance theme)
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- Charts and motion: Recharts + Framer Motion
- PDF export: jsPDF

## Core Modules

- Menstrual cycle and craving-aware nutrition adjustments
- Clinical optimizer (libido, glucose, stress, sleep, digestion)
- Coach command center (compliance heatmap, plateau radar, bulk macro updates)
- Recipe scaling and shopping list PDF export
- Competition prep countdown and peak week protocol
- Photo check-in comparison and real-time workout notifications

## Master Spec Tracking

- See MASTER_SPEC_STATUS.md for the implementation checklist mapped to your full project specification.
- See MVP_ROADMAP.md for the startup-focused MVP execution plan and launch sequence.
- See SECURITY_AUDIT.md for security review prompts, controls, and verification steps.

## Folder Structure

src/
- api/ (Supabase client + realtime/api helpers)
- components/
- components/coach/
- components/client/
- components/shared/
- hooks/
- store/
- utils/
- pages/

## Quick Start

1. Install dependencies:
   - npm install
2. Create environment file:
   - copy .env.example to .env
   - fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
3. Apply database schema:
   - run supabase/schema.sql in Supabase SQL editor
4. Start development server:
   - npm run dev
5. Build for production:
   - npm run build

## Supabase Security

RLS policies are included in supabase/schema.sql with coach-client assignment protections.
- Clients can only see their own health data.
- Coaches can only access assigned clients via coach_client_links.

## Medical Disclaimer

This app is a coaching tool and does not provide medical advice. Consult with a doctor before starting a diet if you have diabetes or hormonal imbalances.
