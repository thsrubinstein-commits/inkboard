-- Inkboard — Garmin sleep / recovery storage
-- Run this in Supabase → SQL Editor → New query → Run.
-- (The `boards` table from the sync setup should already exist; this adds `sleep`.)

create table if not exists public.sleep (
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,                 -- the night that ended on this calendar morning
  score         int,                           -- Garmin overall sleep score 0-100
  duration_min  int,                           -- total time asleep, minutes
  deep_min      int,
  rem_min       int,
  light_min     int,
  awake_min     int,
  resting_hr    int,
  hrv           int,                            -- overnight HRV (ms), if available
  body_battery  int,                            -- morning Body Battery, if available
  raw           jsonb,                          -- full Garmin payload for debugging
  updated_at    timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.sleep enable row level security;

-- The signed-in owner can read their own nights. Writes come from the sync job using the
-- service-role key, which bypasses RLS, so no insert/update policy is needed here.
drop policy if exists "own sleep read" on public.sleep;
create policy "own sleep read" on public.sleep
  for select using (auth.uid() = user_id);

-- Live-update the dashboard the moment a new night lands.
alter publication supabase_realtime add table public.sleep;
