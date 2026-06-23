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
            garth.client.username
            log("authenticated via saved token")
            return
        except Exception as e:
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
    global _DISPLAY_NAME
    if _DISPLAY_NAME:
        return _DISPLAY_NAME
    try:
        prof = garth.client.profile
        if isinstance(prof, dict):
            _DISPLAY_NAME = prof.get("displayName") or prof.get("profileId")
    except Exception as e:
        log("profile property failed:", e)
    if not _DISPLAY_NAME:
        try:
            prof = garth.connectapi("/userprofile-service/socialProfile") or {}
            _DISPLAY_NAME = prof.get("displayName") or str(prof.get("profileId") or "")
        except Exception as e:
            log("socialProfile lookup failed:", e)
    if not _DISPLAY_NAME:
        _DISPLAY_NAME = garth.client.username
    log("resolved Garmin displayName:", _DISPLAY_NAME)
    return _DISPLAY_NAME


def deep_find(obj, keys):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in keys and isinstance(v, (int, float)) and not isinstance(v, bool):
                return v
        for v in obj.values():
            r = deep_find(v, keys)
            if r is not None:
                return r
    elif isinstance(obj, list):
        for v in obj:
            r = deep_find(v, keys)
            if r is not None:
                return r
    return None


def fetch_sleep(target_date):
    username = display_name()
    ds = target_date.isoformat()
    sleep = garth.connectapi(
        f"/wellness-service/wellness/dailySleepData/{username}",
        params={"date": ds, "nonSleepBufferMinutes": 60},
    ) or {}
    dto = sleep.get("dailySleepDTO") or {}

    score = first(dto, "sleepScores", "overall", "value") or first(sleep, "sleepScores", "overall", "value")
    if score is None:
        ss = dto.get("sleepScores") or sleep.get("sleepScores") or {}
        if isinstance(ss, dict):
            score = first(ss, "overall", "value") or ss.get("overallScore") or ss.get("value")
    if score is None:
        score = deep_find(sleep, {"overallScore"}) or deep_find(sleep.get("sleepScores") or dto.get("sleepScores"), {"value"})

    deep_s = dto.get("deepSleepSeconds")
    rem_s = dto.get("remSleepSeconds")
    light_s = dto.get("lightSleepSeconds")
    awake_s = dto.get("awakeSleepSeconds")
    dur_s = dto.get("sleepTimeSeconds")

    levels = sleep.get("sleepLevels") or dto.get("sleepLevels")
    if dur_s is None and isinstance(levels, list) and levels:
        bucket = {0: 0, 1: 0, 2: 0, 3: 0}
        for seg in levels:
            try:
                start = float(seg.get("startGMT") or seg.get("startTimeGMT") or 0)
                end = float(seg.get("endGMT") or seg.get("endTimeGMT") or 0)
                lvl = int(seg.get("activityLevel", seg.get("value", -1)))
            except (TypeError, ValueError):
                continue
            dur = max(0.0, end - start)
            if dur > 100000:
                dur = dur / 1000.0
            if lvl in bucket:
                bucket[lvl] += dur
        if any(bucket.values()):
            deep_s = deep_s if deep_s is not None else bucket[0]
            light_s = light_s if light_s is not None else bucket[1]
            rem_s = rem_s if rem_s is not None else bucket[2]
            awake_s = awake_s if awake_s is not None else bucket[3]
            dur_s = bucket[0] + bucket[1] + bucket[2]

    deep = secs_to_min(deep_s)
    rem = secs_to_min(rem_s)
    light = secs_to_min(light_s)
    awake = secs_to_min(awake_s)
    duration = secs_to_min(dur_s)

    if score is None and duration is None:
        log(f"FULL RESPONSE {ds}:", json.dumps(sleep)[:3000])

    resting_hr = hrv = body_battery = None
    try:
        summary = garth.connectapi(
            f"/usersummary-service/usersummary/daily/{username}", params={"calendarDate": ds}
        ) or {}
        resting_hr = summary.get("restingHeartRate")
        body_battery = summary.get("bodyBatteryMostRecentValue") or summary.get("bodyBatteryHighestValue")
    except Exception as e:
        log("resting HR / body battery unavailable:", e)
    try:
        hrv_data = garth.connectapi(f"/hrv-service/hrv/{ds}") or {}
        hrv = first(hrv_data, "hrvSummary", "lastNightAvg")
    except Exception as e:
        log("HRV unavailable:", e)

    return {
        "date": ds, "score": score, "duration_min": duration,
        "deep_min": deep, "rem_min": rem, "light_min": light, "awake_min": awake,
        "resting_hr": resting_hr, "hrv": hrv, "body_battery": body_battery,
        "raw": {"dailySleepDTO": dto},
    }


def upsert(row):
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


def has_data(row):
    return row.get("score") is not None or bool(row.get("duration_min")) or bool(row.get("deep_min")) or bool(row.get("light_min"))


def main():
    authenticate()
    today = dt.date.today()
    for offset in range(0, 4):
        target = today - dt.timedelta(days=offset)
        row = fetch_sleep(target)
        if has_data(row):
            upsert(row)
            return
        log(f"no sleep data for {target.isoformat()}, trying earlier")
    log("no usable sleep data found in the last 4 days; leaving previous value in place")


if __name__ == "__main__":
    main()
