-- OneSlate — reconcile strava_sync_state with the sync function's schema.
-- Run this in Supabase → SQL Editor → New query → Run. Idempotent: safe to re-run.
--
-- Why this exists: an earlier (June) Strava attempt created public.strava_sync_state
-- with a generic source-status shape (last_attempted_at, last_successful_at,
-- last_error_code, consecutive_failures, source_status). Because 0002_strava.sql uses
-- `create table if not exists`, that pre-existing table was left untouched, so NONE of
-- the columns strava-sync actually reads/writes existed. The consequences in the live
-- function:
--   * `state.last_activity_start` was always undefined → every sync re-scanned the last
--     180 days from scratch (oldest → newest);
--   * the rate-budget columns were missing → the ~90-request budget was exhausted before
--     the loop reached the newest activities, so the MOST RECENT runs were silently
--     dropped every time;
--   * the end-of-sync state write failed silently against the missing columns → the
--     watermark never advanced, so it never recovered.
--
-- The fix is purely additive — it leaves the old columns in place and adds the seven the
-- code expects. After this, the first sync stores a batch and persists the watermark;
-- subsequent syncs are incremental and the newest runs come through.

alter table public.strava_sync_state
  add column if not exists last_activity_start timestamptz,               -- watermark: newest activity start already synced
  add column if not exists requests_15min      integer not null default 0, -- rolling rate-limit counters
  add column if not exists window_15min_start  timestamptz,
  add column if not exists requests_day         integer not null default 0,
  add column if not exists day_start            timestamptz,
  add column if not exists last_synced_at       timestamptz,
  add column if not exists last_error           text;
