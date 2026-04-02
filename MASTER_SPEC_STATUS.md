# Bio-Adaptive Coaching SaaS: Master Spec Status

Status legend:
- [x] Implemented in current codebase
- [~] Partially implemented (scaffolded or basic logic present)
- [ ] Not implemented yet

## 1) Biological and Hormonal Engine
- [x] Menstrual cycle syncing (phase calculation)
- [x] Luteal metabolic bump (+250 style adjustment)
- [x] Bio-adaptive cravings toggle with sweet/salty swaps
- [x] Libido tracker and coach alert logic
- [~] Period-specific training advice surfaced in UI

## 2) Clinical and Medical Module
- [x] Diabetes mode with low-GI warning behavior
- [x] Pre/post workout glucose logging fields
- [~] Glucose trend graphing
- [~] Insulin sensitivity logic affecting carb/fat ratios end-to-end
- [x] Medical disclaimer UI

## 3) Bodybuilding and Performance Engine
- [x] Dual TDEE formulas (Mifflin and Katch)
- [x] Advanced recipe scaler utilities
- [~] Strength analytics with true Brzycki + weekly volume rollups
- [x] RPE and fatigue tracking with deload signal

## 4) Coach Command Center
- [x] Client compliance heatmap
- [x] Plateau detection alerting
- [~] Master food database as full CRUD (currently static typed catalog)
- [~] Peak week and competition mode depth

## 5) Client Experience
- [x] Secure dual interface (coach/client routes)
- [x] Morning check-in sliders and wellness inputs
- [x] Interactive workout calendar with notes
- [x] Gut health and digestion tracking
- [~] Full meal plan PDF export (shopping list PDF is implemented)

## 6) Technical and SaaS Architecture
- [x] React + Vite frontend
- [x] TypeScript strict compilation passing
- [x] Supabase backend integration scaffold
- [x] RLS-focused SQL policies
- [x] Realtime subscription pattern for coach notifications
- [x] Tailwind performance-oriented dark theme

## High Impact Next Tasks
1. Implement full Food DB CRUD screens and Supabase persistence.
2. Add Brzycki 1RM and weekly volume calculator modules with charts.
3. Add glucose trend charts and insulin-sensitivity-driven macro partitioning.
4. Upgrade meal plan PDF from shopping list to full structured plan export.
5. Add richer period training advice cards directly in daily workflow screens.

## 7) Endgame Extensions
- [x] Bloodwork Vault (upload entry point + biomarker trend module)
- [x] Health range alerts for out-of-range biomarker values
- [x] Conditional supplementation with phase-based timing
- [x] AI macro-equivalent search (restaurant mode)
- [x] Fridge mode ingredient-based gram planner
- [x] Supplement inventory low-state coach notification workflow (UI-level)
- [x] Video feedback integration scaffold with archive timeline
- [x] Historical side-by-side comparison (year-over-year)
