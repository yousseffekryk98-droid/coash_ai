-- AI Coaching V2: habits, coach-reviewed intelligence, and feedback capture.
-- Apply after 20260916_product_overhaul.sql.

create table if not exists public.client_habits (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text,
  cadence text not null default 'daily' check (cadence in ('daily', 'weekly')),
  target_per_period int not null default 1 check (target_per_period between 1 and 20),
  starts_on date not null default current_date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create index if not exists client_habits_client_active_idx
  on public.client_habits(client_id, active, starts_on desc);
create index if not exists client_habits_coach_client_idx
  on public.client_habits(coach_id, client_id, created_at desc);

create table if not exists public.habit_checkins (
  id bigserial primary key,
  habit_id bigint not null references public.client_habits(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  checkin_date date not null default current_date,
  completed_count int not null default 1 check (completed_count between 0 and 20),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, checkin_date)
);

create index if not exists habit_checkins_client_date_idx
  on public.habit_checkins(client_id, checkin_date desc);

create table if not exists public.ai_recommendations (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  recommendation_type text not null check (recommendation_type in ('adherence', 'recovery', 'nutrition', 'training', 'engagement', 'general')),
  title text not null check (char_length(title) between 2 and 160),
  rationale text not null check (char_length(rationale) between 2 and 4000),
  payload jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  model_version text not null default 'coach-rules-v2',
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'applied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_recommendations_coach_status_idx
  on public.ai_recommendations(coach_id, status, created_at desc);
create index if not exists ai_recommendations_client_idx
  on public.ai_recommendations(client_id, created_at desc);

create table if not exists public.ai_recommendation_feedback (
  id bigserial primary key,
  recommendation_id bigint not null references public.ai_recommendations(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  score int not null check (score between 1 and 5),
  reason text,
  outcome_label text check (outcome_label is null or outcome_label in ('helpful', 'neutral', 'not_helpful', 'unsafe', 'not_applicable')),
  created_at timestamptz not null default now(),
  unique (recommendation_id, coach_id)
);

create index if not exists ai_feedback_coach_created_idx
  on public.ai_recommendation_feedback(coach_id, created_at desc);

alter table public.client_habits enable row level security;
alter table public.habit_checkins enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_recommendation_feedback enable row level security;

create policy "habits involved select"
on public.client_habits for select
using (
  auth.uid() = client_id
  or (
    auth.uid() = coach_id
    and public.client_belongs_to_active_coach(client_id, coach_id)
  )
);

create policy "habits coach insert"
on public.client_habits for insert
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "habits coach update"
on public.client_habits for update
using (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
)
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "habit checkins involved select"
on public.habit_checkins for select
using (
  auth.uid() = client_id
  or exists (
    select 1
    from public.client_habits h
    where h.id = habit_id
      and h.coach_id = auth.uid()
      and h.client_id = habit_checkins.client_id
      and public.client_belongs_to_active_coach(h.client_id, h.coach_id)
  )
);

create policy "habit checkins client insert"
on public.habit_checkins for insert
with check (
  auth.uid() = client_id
  and exists (
    select 1 from public.client_habits h
    where h.id = habit_id and h.client_id = auth.uid() and h.active = true
  )
);

create policy "habit checkins client update"
on public.habit_checkins for update
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

create policy "ai recommendations coach select"
on public.ai_recommendations for select
using (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "ai recommendations coach insert"
on public.ai_recommendations for insert
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "ai recommendations coach update"
on public.ai_recommendations for update
using (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
)
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "ai feedback coach select"
on public.ai_recommendation_feedback for select
using (auth.uid() = coach_id);

create policy "ai feedback coach insert"
on public.ai_recommendation_feedback for insert
with check (
  auth.uid() = coach_id
  and exists (
    select 1 from public.ai_recommendations r
    where r.id = recommendation_id and r.coach_id = auth.uid()
  )
);

create policy "ai feedback coach update"
on public.ai_recommendation_feedback for update
using (auth.uid() = coach_id)
with check (auth.uid() = coach_id);
