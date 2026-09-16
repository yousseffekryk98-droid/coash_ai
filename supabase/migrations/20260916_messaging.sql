-- Secure direct messaging between active coach/client pairs.
-- Apply after 20260916_product_overhaul.sql.

create table if not exists public.direct_messages (
  id bigserial primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id = coach_id or sender_id = client_id)
);

create index if not exists direct_messages_pair_created_idx
  on public.direct_messages(coach_id, client_id, created_at desc);

alter table public.direct_messages enable row level security;

create policy "direct messages involved select"
on public.direct_messages for select
using (
  auth.uid() = coach_id
  or auth.uid() = client_id
);

create policy "direct messages active pair insert"
on public.direct_messages for insert
with check (
  sender_id = auth.uid()
  and public.client_belongs_to_active_coach(client_id, coach_id)
  and (auth.uid() = coach_id or auth.uid() = client_id)
);

-- Message rows are intentionally immutable from the client application.
-- Read receipts can be added later through a narrow SECURITY DEFINER RPC instead of broad row updates.
