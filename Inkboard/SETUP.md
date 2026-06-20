# Inkboard — setup

Your personal cross-device dashboard. The frontend (`index.html`) is already built,
deployed to GitHub Pages, and syncing via Supabase. This file covers the **Garmin sleep
sync** — the one part that needs a few secrets only you can provide.

## How it works

```
  Garmin Connect ──(daily GitHub Action, garth login)──▶ Supabase `sleep` table
                                                              │
                                          index.html reads ───┘  shows on the front card
```

- A GitHub Actions cron (`.github/workflows/garmin-sync.yml`) runs every morning.
- It runs `scripts/garmin_sync.py`, which logs into Garmin, pulls last night's sleep
  score + recovery fields, and upserts them into the Supabase `sleep` table.
- The dashboard's front-middle **Recovery** card reads the latest row, caches it locally,
  shows "synced from Garmin · …", and degrades to "—" / "waiting for first sync" if data
  is missing. A failed sync never blanks the card.

## One-time setup (≈10 min)

### 1. Database
Supabase → **SQL Editor** → paste & run **`supabase/migrations/0001_sleep.sql`**.

### 2. Get your Garmin token (on your computer)
```
pip install garth
python scripts/garmin_token.py
```
Enter your Garmin email/password (+ MFA code if asked). Copy the printed
`GARMIN_TOKEN_BASE64` string.

### 3. Find the two Supabase values
- **service_role key**: Supabase → Settings → **API** → copy the `service_role` secret.
- **your user id**: Supabase → Authentication → **Users** → click your user → copy **User UID**.

### 4. Add GitHub secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret | Value |
|---|---|
| `GARMIN_TOKEN_BASE64` | from step 2 |
| `SUPABASE_URL` | `https://xspojczmywydubmttued.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service_role key (step 3) |
| `SUPABASE_USER_ID` | your User UID (step 3) |

(Accounts without MFA can skip step 2 and instead add `GARMIN_EMAIL` + `GARMIN_PASSWORD`.)

### 5. Test it
Repo → **Actions → Garmin sleep sync → Run workflow**. When it goes green, refresh the
dashboard — your score appears on the Recovery card. After that it runs automatically each
morning (`cron: "10 11 * * *"`, ~7:10am ET — edit the time in the workflow if you like).

## Files
- `index.html` — the dashboard (compiled; edit `Inkboard.dc.html` and re-bundle to change).
- `supabase/migrations/0001_sleep.sql` — sleep table + security.
- `.github/workflows/garmin-sync.yml` — the daily job.
- `scripts/garmin_sync.py` — Garmin → Supabase sync.
- `scripts/garmin_token.py` — one-time token generator (run locally).
- `.env.example` — every secret, documented.
