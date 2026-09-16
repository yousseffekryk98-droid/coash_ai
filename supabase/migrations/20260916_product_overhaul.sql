-- Product overhaul: real progress goals, coach notes, and coaching appointments.
-- Apply after supabase/schema.sql.

create table if not exists public.client_goals (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  category text not null default 'General',
  target_value numeric,
  current_value numeric,
  unit text,
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_goals_user_status_idx
  on public.client_goals(user_id, status, created_at desc);

create table if not exists public.coach_client_notes (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  visible_to_client boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_client_notes_pair_idx
  on public.coach_client_notes(coach_id, client_id, created_at desc);

create table if not exists public.coaching_appointments (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Coaching session',
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30 check (duration_minutes between 10 and 240),
  meeting_url text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coaching_appointments_pair_time_idx
  on public.coaching_appointments(coach_id, client_id, scheduled_at);

alter table public.client_goals enable row level security;
alter table public.coach_client_notes enable row level security;
alter table public.coaching_appointments enable row level security;

create policy "client goals owner select"
on public.client_goals for select
using (
  auth.uid() = user_id
  or (
    public.is_coach(auth.uid())
    and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);

create policy "client goals owner insert"
on public.client_goals for insert
with check (auth.uid() = user_id);

create policy "client goals owner update"
on public.client_goals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "coach notes coach select"
on public.coach_client_notes for select
using (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "coach notes client visible select"
on public.coach_client_notes for select
using (auth.uid() = client_id and visible_to_client = true);

create policy "coach notes coach insert"
on public.coach_client_notes for insert
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "coach notes coach update"
on public.coach_client_notes for update
using (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
)
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "appointments involved select"
on public.coaching_appointments for select
using (auth.uid() = coach_id or auth.uid() = client_id);

create policy "appointments coach insert"
on public.coaching_appointments for insert
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);

create policy "appointments coach update"
on public.coaching_appointments for update
using (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
)
with check (
  auth.uid() = coach_id
  and public.client_belongs_to_active_coach(client_id, coach_id)
);
