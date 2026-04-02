-- Bio-Adaptive Coaching SaaS schema
-- Run in Supabase SQL editor. Adjust policies for your production requirements.

create extension if not exists pgcrypto;

create type public.user_role as enum ('coach', 'client', 'admin');
create type public.craving_type as enum ('Salty', 'Sweet', 'Both', 'None');
create type public.insulin_sensitivity_level as enum ('Low', 'Medium', 'High');
create type public.subscription_status as enum ('Active', 'Paused', 'Payment Overdue');
create type public.pose_type as enum ('front', 'side', 'back');
create type public.relationship_status as enum ('active', 'pending');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role public.user_role not null,
  gender text,
  avatar_url text,
  medical_tags text[] default '{}',
  has_diabetes boolean default false,
  insulin_sensitivity public.insulin_sensitivity_level default 'Medium',
  medical_notes text,
  food_sensitivity_blacklist text[] default '{}',
  subscription_state public.subscription_status default 'Active',
  created_at timestamptz default now()
);

create table if not exists public.coaching_relationships (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status public.relationship_status not null default 'pending',
  created_at timestamptz default now(),
  unique (coach_id, client_id)
);

create table if not exists public.client_metrics (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weight numeric,
  height numeric,
  body_fat numeric,
  updated_at timestamptz default now()
);

create table if not exists public.client_diet_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  activity_level text not null default 'Active',
  activity_factor numeric not null default 1.55,
  meals_per_day int not null default 4 check (meals_per_day between 3 and 6),
  snacks_per_day int not null default 1 check (snacks_per_day between 1 and 2),
  liked_foods text[] default '{}',
  disliked_foods text[] default '{}',
  updated_at timestamptz default now()
);

create table if not exists public.period_data (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_start_date date not null,
  avg_cycle_length int default 28,
  period_length_days int default 5 check (period_length_days between 1 and 10),
  luteal_calorie_bump int default 250,
  updated_at timestamptz default now()
);

create table if not exists public.period_tracking (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  cycle_start_date date not null,
  craving_type public.craving_type default 'None',
  symptom_severity int check (symptom_severity between 1 and 10),
  bloating_level int check (bloating_level between 1 and 5),
  created_at timestamptz default now()
);

create table if not exists public.macro_templates (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  protein_pct numeric not null,
  carb_pct numeric not null,
  fat_pct numeric not null,
  is_period_adjusted boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.food_db (
  id bigserial primary key,
  name text not null unique,
  protein numeric not null,
  carbs numeric not null,
  fats numeric not null,
  fiber numeric default 0,
  glycemic_index int,
  calories_per_100g numeric not null,
  created_at timestamptz default now()
);

create table if not exists public.meal_plans (
  id bigserial primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  meals_json jsonb not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.daily_logs (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  weight numeric,
  calories_target numeric,
  calories_actual numeric,
  protein_actual numeric,
  carbs_actual numeric,
  fats_actual numeric,
  fiber_actual numeric,
  sleep_quality int check (sleep_quality between 1 and 10),
  stress_level int check (stress_level between 1 and 10),
  libido int check (libido between 1 and 5),
  cravings_type public.craving_type default 'None',
  bloating int check (bloating between 1 and 10),
  pre_workout_glucose numeric,
  post_workout_glucose numeric,
  resting_heart_rate int,
  gratitude_note text,
  unique (user_id, log_date)
);

create table if not exists public.workout_logs (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_date date not null,
  exercise_name text,
  reps int,
  weight_used numeric,
  rpe int check (rpe between 1 and 10),
  volume_total numeric,
  created_at timestamptz default now()
);

create table if not exists public.gym_logs (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  workout_completed boolean default false,
  rpe int check (rpe between 1 and 10),
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

create table if not exists public.photo_checkins (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  pose_type public.pose_type not null,
  image_path text not null,
  created_at timestamptz default now()
);

create table if not exists public.coach_notifications (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.onboarding_documents (
  id bigserial primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  contract_signed boolean default false,
  waiver_signed boolean default false,
  signed_at timestamptz
);

create table if not exists public.integration_connections (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  scopes jsonb default '[]'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, provider)
);

create table if not exists public.wearable_metrics_daily (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric_date date not null,
  steps int,
  sleep_hours numeric,
  sleep_deep_minutes int,
  sleep_rem_minutes int,
  resting_heart_rate int,
  source_provider text not null,
  created_at timestamptz default now(),
  unique (user_id, metric_date, source_provider)
);

create table if not exists public.cgm_readings (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null,
  glucose_mg_dl int not null,
  source_provider text not null,
  created_at timestamptz default now()
);

create table if not exists public.barcode_food_logs (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  barcode text not null,
  food_name text,
  macros jsonb,
  source_provider text,
  created_at timestamptz default now()
);

create table if not exists public.payment_subscriptions (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  status text not null,
  plan_name text,
  renews_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.outbound_notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  template_name text,
  payload jsonb,
  status text not null default 'queued',
  created_at timestamptz default now()
);

create table if not exists public.external_backups (
  id bigserial primary key,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  external_path text not null,
  created_at timestamptz default now()
);

create table if not exists public.smart_scale_weights (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null,
  weight numeric not null,
  body_fat numeric,
  source_provider text not null,
  created_at timestamptz default now()
);

create table if not exists public.period_calendar_sync (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  last_cycle_start date,
  summary_share_enabled boolean default false,
  created_at timestamptz default now(),
  unique (user_id, provider)
);

alter table public.profiles enable row level security;
alter table public.coaching_relationships enable row level security;
alter table public.client_metrics enable row level security;
alter table public.client_diet_preferences enable row level security;
alter table public.period_data enable row level security;
alter table public.period_tracking enable row level security;
alter table public.macro_templates enable row level security;
alter table public.food_db enable row level security;
alter table public.meal_plans enable row level security;
alter table public.daily_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.gym_logs enable row level security;
alter table public.photo_checkins enable row level security;
alter table public.coach_notifications enable row level security;
alter table public.onboarding_documents enable row level security;
alter table public.integration_connections enable row level security;
alter table public.wearable_metrics_daily enable row level security;
alter table public.cgm_readings enable row level security;
alter table public.barcode_food_logs enable row level security;
alter table public.payment_subscriptions enable row level security;
alter table public.outbound_notifications enable row level security;
alter table public.external_backups enable row level security;
alter table public.smart_scale_weights enable row level security;
alter table public.period_calendar_sync enable row level security;

create or replace function public.is_coach(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'coach');
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

create or replace function public.client_belongs_to_active_coach(client uuid, coach uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.coaching_relationships c
    where c.client_id = client and c.coach_id = coach and c.status = 'active'
  );
$$;

-- Profile visibility
create policy "profiles own select"
on public.profiles for select
using (auth.uid() = id);

create policy "coach can see assigned clients"
on public.profiles for select
using (
  public.is_coach(auth.uid()) and (
    id = auth.uid() or public.client_belongs_to_active_coach(id, auth.uid())
  )
);

create policy "profiles own update"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Assignment links readable by involved users
create policy "links visible to coach or client"
on public.coaching_relationships for select
using (auth.uid() = coach_id or auth.uid() = client_id);

-- Shared helper policies for client-owned tables
create policy "client own rows select period_tracking"
on public.period_tracking for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "client own rows write period_tracking"
on public.period_tracking for insert
with check (auth.uid() = user_id);

create policy "diet preferences owner or assigned coach"
on public.client_diet_preferences for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "diet preferences owner write"
on public.client_diet_preferences for insert
with check (auth.uid() = user_id);
create policy "diet preferences owner update"
on public.client_diet_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "client own rows update period_tracking"
on public.period_tracking for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "daily logs visible to owner or coach"
on public.daily_logs for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "daily logs owned write"
on public.daily_logs for insert
with check (auth.uid() = user_id);
create policy "daily logs owned update"
on public.daily_logs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workout logs visible to owner or coach"
on public.workout_logs for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "workout logs owned write"
on public.workout_logs for insert
with check (auth.uid() = user_id);

create policy "gym logs visible to owner or coach"
on public.gym_logs for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "gym logs owned write"
on public.gym_logs for insert
with check (auth.uid() = user_id);
create policy "gym logs owned update"
on public.gym_logs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "meal plans visible to coach-client pair"
on public.meal_plans for select
using (
  auth.uid() = client_id or auth.uid() = coach_id
);
create policy "meal plans coach write"
on public.meal_plans for insert
with check (auth.uid() = coach_id and public.client_belongs_to_active_coach(client_id, coach_id));

create policy "macro templates coach owned"
on public.macro_templates for all
using (auth.uid() = coach_id)
with check (auth.uid() = coach_id);

create policy "food db read all authenticated"
on public.food_db for select
using (auth.role() = 'authenticated');

create policy "food db coach write"
on public.food_db for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "photo checkins visible to owner or assigned coach"
on public.photo_checkins for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "photo checkins owner write"
on public.photo_checkins for insert
with check (auth.uid() = user_id);

create policy "coach notifications visible to coach"
on public.coach_notifications for select
using (auth.uid() = coach_id);

create policy "onboarding docs visible to owner or coach"
on public.onboarding_documents for select
using (
  auth.uid() = client_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(client_id, auth.uid())
  )
);

create policy "integration connections own rows"
on public.integration_connections for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wearable metrics owner or assigned coach"
on public.wearable_metrics_daily for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "wearable metrics owner write"
on public.wearable_metrics_daily for insert
with check (auth.uid() = user_id);
create policy "wearable metrics owner update"
on public.wearable_metrics_daily for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "cgm owner or assigned coach"
on public.cgm_readings for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "cgm owner write"
on public.cgm_readings for insert
with check (auth.uid() = user_id);

create policy "barcode logs own rows"
on public.barcode_food_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "payment subscriptions coach or admin"
on public.payment_subscriptions for select
using (auth.uid() = coach_id or public.is_admin(auth.uid()));
create policy "payment subscriptions admin write"
on public.payment_subscriptions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "notifications own rows"
on public.outbound_notifications for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "notifications admin write"
on public.outbound_notifications for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "backup records owner or admin"
on public.external_backups for select
using (auth.uid() = owner_user_id or public.is_admin(auth.uid()));
create policy "backup records admin write"
on public.external_backups for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "smart scale owner or assigned coach"
on public.smart_scale_weights for select
using (
  auth.uid() = user_id or (
    public.is_coach(auth.uid()) and public.client_belongs_to_active_coach(user_id, auth.uid())
  )
);
create policy "smart scale owner write"
on public.smart_scale_weights for insert
with check (auth.uid() = user_id);

create policy "period calendar sync own rows"
on public.period_calendar_sync for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Trigger: if severe sweet cravings are reported, notify assigned coach.
create or replace function public.notify_coach_on_craving()
returns trigger
language plpgsql
security definer
as $$
declare
  linked_coach uuid;
begin
  if new.craving_type = 'Sweet' and coalesce(new.symptom_severity, 0) >= 7 then
    select coach_id into linked_coach
    from public.coaching_relationships
    where client_id = new.user_id and status = 'active'
    order by id desc
    limit 1;

    if linked_coach is not null then
      insert into public.coach_notifications (coach_id, client_id, message)
      values (
        linked_coach,
        new.user_id,
        'Client reported high sweet cravings. Review luteal meal swaps.'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_coach_on_craving on public.period_tracking;
create trigger trg_notify_coach_on_craving
after insert or update on public.period_tracking
for each row
execute function public.notify_coach_on_craving();

-- Client privacy utility: right to be forgotten (self-service).
create or replace function public.delete_my_account_data()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.daily_logs where user_id = auth.uid();
  delete from public.workout_logs where user_id = auth.uid();
  delete from public.gym_logs where user_id = auth.uid();
  delete from public.period_tracking where user_id = auth.uid();
  delete from public.period_data where user_id = auth.uid();
  delete from public.photo_checkins where user_id = auth.uid();
  delete from public.client_diet_preferences where user_id = auth.uid();
  delete from public.integration_connections where user_id = auth.uid();
  delete from public.wearable_metrics_daily where user_id = auth.uid();
  delete from public.cgm_readings where user_id = auth.uid();
  delete from public.barcode_food_logs where user_id = auth.uid();
  delete from public.outbound_notifications where user_id = auth.uid();
  delete from public.external_backups where owner_user_id = auth.uid();
  delete from public.smart_scale_weights where user_id = auth.uid();
  delete from public.period_calendar_sync where user_id = auth.uid();
  delete from public.client_metrics where user_id = auth.uid();
  delete from public.onboarding_documents where client_id = auth.uid();
  delete from public.coaching_relationships where client_id = auth.uid() or coach_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;
