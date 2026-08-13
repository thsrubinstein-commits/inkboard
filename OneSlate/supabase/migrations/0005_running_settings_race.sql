-- ─────────────────────────────────────────────────────────────────────────────
-- running_settings.race — persist the race goal (distance + goal time + date).
--
-- The app stores the goal as a nested `race` object { dist, goalSec, date } and
-- reads it back in fetchRunning(). Before this column the goal lived only in the
-- browser's localStorage cache, so it was lost whenever settings reloaded from
-- the DB (and never synced to other devices). This jsonb column round-trips it.
-- setRaceGoal() upserts it; fetchRunning() reads it (and still falls back to the
-- local cache if this column hasn't been applied yet).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.running_settings
  add column if not exists race jsonb;
