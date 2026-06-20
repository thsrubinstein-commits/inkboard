#!/usr/bin/env python3
"""
Inkboard — Garmin → Supabase sleep sync.

Runs once (e.g. from GitHub Actions every morning). Logs into Garmin Connect with the
`garth` library, pulls the most recent night's sleep + recovery data, and upserts one row
into the Supabase `sleep` table for your user.

Auth: Garmin has no official solo API, so this uses garth's login. Because Garmin
accounts often have MFA, the reliable CI path is a PRE-GENERATED session token:
  1. Locally run:  python scripts/garmin_token.py   (enter email/password + MFA code once)
  2. It prints a base64 token — store it as the GitHub secret GARMIN_TOKEN_BASE64.
The token is long-lived; regenerate if Garmin ever invalidates it. As a fallback this
script will try GARMIN_EMAIL / GARMIN_PASSWORD (only works for accounts without MFA).

Resilience: any field Garmin doesn't return is written as NULL and the dashboard shows
"—" for it. A failed run leaves the previous night's row untouched (the card keeps showing
the last good value from its cache), so a broken sync never blanks the dashboard.
"""

import base64
import datetime as dt
import json
import os
import sys

import garth
import requests


def log(*a):
    print("[garmin-sync]", *a, flush=True)


def authenticate():
    token_b64 = os.environ.get("GARMIN_TOKEN_BASE64", "").strip()
    if token_b64:
        try:
            garth.client.loads(base64.b64decode(token_b64).decode("utf-8"))
            garth.client.username  # forces a token refresh / validates session
            log("authenticated via saved token")
            return
        except Exception as e:  # noqa: BLE001
            log("saved token failed, falling back to email/password:", e)

    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")
    if not (email and password):
        log("ERROR: no GARMIN_TOKEN_BASE64 and no GARMIN_EMAIL/GARMIN_PASSWORD set")
        sys.exit(1)
    garth.login(email, password)  # raises on MFA-protected accounts
    log("authenticated via email/password")


def first(d, *keys, default=None):
    """Safely walk nested dicts: first(d, 'a', 'b') -> d['a']['b'] or default."""
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur or cur[k] is None:
            return default
        cur = cur[k]
    return cur


def secs_to_min(v):
    return int(round(v / 60)) if isinstance(v, (int, float)) else None


def fetch_sleep(target_date: dt.date) -> dict:
    """Return a normalized sleep row for the night ending on `target_date`."""
    username = garth.client.username
    ds = target_date.isoformat()

    # Primary sleep payload (stages, duration, sleep score).
    sleep = garth.connectapi(
        f"/wellness-service/wellness/dailySleepData/{username}",
        params={"date": ds, "nonSleepBufferMinutes": 60},
    ) or {}
    dto = sleep.get("dailySleepDTO") or {}

    score = first(dto, "sleepScores", "overall", "value")
    deep = secs_to_min(dto.get("deepSleepSeconds"))
    rem = secs_to_min(dto.get("remSleepSeconds"))
    light = secs_to_min(dto.get("lightSleepSeconds"))
    awake = secs_to_min(dto.get("awakeSleepSeconds"))
    duration = secs_to_min(dto.get("sleepTimeSeconds"))

    resting_hr = hrv = body_battery = None

    # Resting HR (best-effort, separate endpoint).
    try:
        summary = garth.connectapi(
            f"/usersummary-service/usersummary/daily/{username}", params={"calendarDate": ds}
        ) or {}
        resting_hr = summary.get("restingHeartRate")
        body_battery = summary.get("bodyBatteryMostRecentValue") or summary.get(
            "bodyBatteryHighestValue"
        )
    except Exception as e:  # noqa: BLE001
        log("resting HR / body battery unavailable:", e)

    # Overnight HRV (best-effort; endpoint not on all accounts/devices).
    try:
        hrv_data = garth.connectapi(f"/hrv-service/hrv/{ds}") or {}
        hrv = first(hrv_data, "hrvSummary", "lastNightAvg")
    except Exception as e:  # noqa: BLE001
        log("HRV unavailable:", e)

    return {
        "date": ds,
        "score": score,
        "duration_min": duration,
        "deep_min": deep,
        "rem_min": rem,
        "light_min": light,
        "awake_min": awake,
        "resting_hr": resting_hr,
        "hrv": hrv,
        "body_battery": body_battery,
        "raw": {"dailySleepDTO": dto},
    }


def upsert(row: dict):
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    user_id = os.environ["SUPABASE_USER_ID"]
    row = {**row, "user_id": user_id, "updated_at": dt.datetime.utcnow().isoformat() + "Z"}

    resp = requests.post(
        f"{url}/rest/v1/sleep",
        params={"on_conflict": "user_id,date"},
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        data=json.dumps(row),
        timeout=30,
    )
    resp.raise_for_status()
    log(f"upserted sleep for {row['date']}: score={row['score']} dur={row['duration_min']}min")


def main():
    authenticate()

    # Garmin finalizes "last night" a few hours into the morning; try today, then yesterday.
    today = dt.date.today()
    for target in (today, today - dt.timedelta(days=1)):
        row = fetch_sleep(target)
        if row.get("score") is not None or row.get("duration_min"):
            upsert(row)
            return
        log(f"no sleep data yet for {target.isoformat()}, trying earlier")

    log("no usable sleep data found; leaving previous value in place")


if __name__ == "__main__":
    main()
