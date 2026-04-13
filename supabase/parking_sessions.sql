-- =============================================================
-- parking_sessions table
-- Run this in your Supabase project → SQL Editor
-- =============================================================

create table if not exists public.parking_sessions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  spot_id                 text not null,
  street_name             text not null,
  zone_type               text not null check (zone_type in ('none', 'blue', 'green')),
  started_at              timestamptz not null,
  ended_at                timestamptz not null,
  actual_duration_minutes integer not null
);

-- Enable Row Level Security
alter table public.parking_sessions enable row level security;

-- Users can only read their own sessions
create policy "own_sessions_select"
  on public.parking_sessions for select
  to authenticated
  using (user_id = auth.uid());

-- Users can only insert their own sessions
create policy "own_sessions_insert"
  on public.parking_sessions for insert
  to authenticated
  with check (user_id = auth.uid());
