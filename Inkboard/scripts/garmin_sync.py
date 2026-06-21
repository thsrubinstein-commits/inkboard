#!/usr/bin/env python3
"""Inkboard — Garmin → Supabase sleep sync."""

import base64
import datetime as dt
import json
import os
import sys

import garth
import requests

_DISPLAY_NAME = None


def log(*a):
    print("[garmin-sync]", *a, flush=True)


def authenticate():
    token_b64 = os.environ.get("GARMIN_TOKEN_BASE64", "").strip()
    if token_b64:
        try:
            garth.client.loads(base64.b64decode(token_b64).decode("utf-8"))
            garth.client.username  # validates session
            log("authenticated via saved token")
            return
        except Exception as e:  # noqa: BLE001
            log("saved token failed, falling back to email/password:", e)

    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")
    if not (email and password):
        log("ERROR: no GARMIN_TOKEN_BASE64 and no GARMIN_EMAIL/GARMIN_PASSWORD set")
        sys.exit(1)
    garth.login(email, password)
    log("authenticated via email/password")


def first(d, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur or cur[k] is None:
            return default
        cur = cur[k]
    return cur


def secs_to_min(v):
    return int(round(v / 60)) if isinstance(v, (int, float)) else None


def display_name() -> str:
    """Garmin wellness endpoints key on the profile displayName (a GUID), not the email."""
    global _DISPLAY_NAME
    if _DISPLAY_NAME:
        return _DISPLAY_NAME
    try:
        prof = garth.client.profile
        if isinstance(prof, dict):
            _DISPLAY_NAME = prof.get("displayName") or prof.get("profileId")
    except Exception as e:  # noqa: BLE001
        log("profile property failed:", e)
    if not _DISPLAY_NAME:
        try:
            prof = garth.connectapi("/userprofile-service/socialProfile") or {}
            _DISPLAY_NAME = prof.get("displayName") or str(prof.get("profileId") or "")
        except Exception as e:  # noqa: BLE001
            log("socialProfile lookup failed:", e)
    if not _DISPLAY_NAME:
        _DISPLAY_NAME = garth.client.username
    log("resolved Garmin displayName:", _DISPLAY_NAME)
    return _DISPLAY_NAME


def fetch_sleep(target_date: dt.date) -> dict:
    username = display_name()
    ds = target_date.isoformat()

    sleep = garth.connectapi(
        f"/wellness-service/wellness/dailySleepData/{username}",
        params={"date": ds, "nonSleepBufferMinutes": 60},
    ) or {}
    if not (sleep.get("dailySleepDTO") or {}).get("sleepScores"):
        log(f"raw sleep keys for {ds}:", list(sleep.keys()) if isinstance(sleep, dict) else type(sleep))
    dto = sleep.get("dailySleepDTO") or {}

    score = first(dto, "sleepScores", "overall", "value")
    deep = secs_to_min(dto.get("deepSleepSeconds"))
    rem = secs_to_min(dto.get("remSleepSeconds"))
    light = secs_to_min(dto.get("lightSleepSeconds"))
    awake = secs_to_min(dto.get("awakeSleepSeconds"))
    duration = secs_to_min(dto.get("sleepTimeSeconds"))

    resting_hr = hrv = body_battery = None
    try:
        summary = garth.connectapi(
            f"/usersummary-service/usersummary/daily/{username}", params={"calendarDate": ds}
        ) or {}
        resting_hr = summary.get("restingHeartRate")
        body_battery = summary.get("bodyBatteryMostRecentValue") or summary.get("bodyBatteryHighestValue")
    except Exception as e:  # noqa: BLE001
        log("resting HR / body battery unavailable:", e)

    try:
        hrv_data = garth.connectapi(f"/hrv-service/hrv/{ds}") or {}
        hrv = first(hrv_data, "hrvSummary", "lastNightAvg")
    except Exception as e:  # noqa: BLE001
        log("HRV unavailable:", e)

    return {
        "date": ds, "score": score, "duration_min": duration,
        "deep_min": deep, "rem_min": rem, "light_min": light, "awake_min": awake,
        "resting_hr": resting_hr, "hrv": hrv, "body_battery": body_battery,
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
            "apikey": key, "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        data=json.dumps(row), timeout=30,
    )
    resp.raise_for_status()
    log(f"upserted sleep for {row['date']}: score={row['score']} dur={row['duration_min']}min")


def main():
    authenticate()
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
