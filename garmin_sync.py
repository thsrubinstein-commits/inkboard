#!/usr/bin/env python3
"""
Inkboard — Garmin → Supabase sleep sync (rate-limit resilient).

DESIGN (cache-first, backend-only, single-flight, cooldown, graceful degradation):

  • The browser NEVER calls Garmin. It reads the last stored value from Supabase.
  • This job is the ONLY path that talks to Garmin, and it is defensive:
      1. Read `garmin_sync_state`. If a cooldown (next_allowed_sync_at) is active and we
         are not a FORCE run, exit immediately — no Garmin request.
      2. If today's night is already stored, exit — no Garmin request (cache-first).
      3. Single-flight: if another run marked itself 'syncing' moments ago, exit.
      4. Only then hit Garmin, fetching the MINIMUM needed (sleep first; HR/HRV/battery
         are best-effort and skipped while we're in a backoff state).
      5. On 429: honor Retry-After; else exponential backoff with jitter; capped; max
         retries; then set a real cooldown and STOP (never tight-loop, never parallel).
      6. Write structured status back so the dashboard shows the right message.

  A failed/rate-limited run leaves the previous night's row untouched — the home card
  keeps showing the last good value. Garmin is an upstream source, not a dependency.

Auth: garth session token in GARMIN_TOKEN_BASE64 (preferred; survives MFA). Falls back to
GARMIN_EMAIL / GARMIN_PASSWORD for non-MFA accounts.

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_USER_ID (+ Garmin creds above).
Optional: FORCE=1 bypasses cooldown/cache (manual refresh). SYNC_COOLDOWN_HOURS overrides
the post-success quiet window (default 18h).
"""

import base64
import datetime as dt
import json
import os
import random
import sys
import time

import garth
import requests

# ----- tunables (rate-limit safety) -----
MAX_RETRIES = 4            # attempts after the first try
BASE_DELAY = 1.0          # seconds
MAX_DELAY = 60.0          # cap per backoff sleep
SINGLE_FLIGHT_WINDOW = 600        # seconds; another 'syncing' run within this = skip
NO_DATA_RETRY_MIN = 60            # if today's score isn't posted yet, recheck in ~1h
SUCCESS_COOLDOWN_HRS = float(os.environ.get("SYNC_COOLDOWN_HOURS", "18"))

FORCE = os.environ.get("FORCE", "").strip() not in ("", "0", "false", "False")
_DISPLAY_NAME = None
_BACKOFF_MODE = False     # set true after any 429 so we stop fetching optional endpoints


def now_utc():
    return dt.datetime.now(dt.timezone.utc)


def iso(t):
    return t.astimezone(dt.timezone.utc).isoformat()


def log(event, **kv):
    """Structured, greppable logs. Never logs tokens/secrets."""
    parts = " ".join(f"{k}={v}" for k, v in kv.items())
    print(f"[garmin-sync] {event} {parts}".rstrip(), flush=True)


class RateLimited(Exception):
    def __init__(self, retry_after=None):
        super().__init__("garmin rate limited (429)")
        self.retry_after = retry_after


class AuthError(Exception):
    pass


# ---------------------------------------------------------------- error classification
def _status_of(e):
    """Best-effort HTTP status from a garth/requests exception."""
    for attr in ("response", "error"):
        obj = getattr(e, attr, None)
        resp = getattr(obj, "response", obj)
        code = getattr(resp, "status_code", None)
        if isinstance(code, int):
            return code, resp
    s = str(e)
    for code in (429, 401, 403, 500, 502, 503, 504):
        if str(code) in s:
            return code, None
    if "Too Many Requests" in s:
        return 429, None
    return None, None


def _retry_after(resp):
    try:
        ra = resp.headers.get("Retry-After") if resp is not None else None
        return int(ra) if ra and str(ra).isdigit() else None
    except Exception:  # noqa: BLE001
        return None


def _backoff(attempt, retry_after):
    if retry_after:
        delay = min(float(retry_after), 120.0)  # honor server, but don't sleep forever
    else:
        delay = min(MAX_DELAY, BASE_DELAY * (2 ** attempt))
        delay = delay * (0.5 + random.random())  # full jitter
    log("backoff", attempt=attempt, delay=round(delay, 1), retry_after=retry_after or "none")
    time.sleep(delay)


# ---------------------------------------------------------------- resilient Garmin call
def garmin_call(path, params=None, optional=False):
    """Single Garmin GET with bounded, jittered, Retry-After-aware retries.
    Raises RateLimited if 429 persists; AuthError on 401/403. `optional` endpoints
    return None instead of raising (used for HR/HRV/battery extras)."""
    global _BACKOFF_MODE
    if optional and _BACKOFF_MODE:
        log("skip_optional", path=path, reason="backoff_mode")
        return None
    last_ra = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            return garth.connectapi(path, params=params) or {}
        except Exception as e:  # noqa: BLE001
            code, resp = _status_of(e)
            if code == 429:
                _BACKOFF_MODE = True
                last_ra = _retry_after(resp) or last_ra
                if attempt < MAX_RETRIES and not optional:
                    _backoff(attempt, last_ra)
                    continue
                if optional:
                    log("optional_429_giveup", path=path)
                    return None
                raise RateLimited(retry_after=last_ra)
            if code in (401, 403):
                raise AuthError(str(e)[:200])
            if code and code >= 500 and attempt < MAX_RETRIES:
                _backoff(attempt, None)
                continue
            if optional:
                log("optional_failed", path=path, err=str(e)[:120])
                return None
            raise
    raise RateLimited(retry_after=last_ra)


def authenticate():
    token_b64 = os.environ.get("GARMIN_TOKEN_BASE64", "").strip()
    if token_b64:
        last = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                garth.client.loads(base64.b64decode(token_b64).decode("utf-8"))
                _ = garth.client.username  # validates session
                log("auth_ok", via="token")
                return
            except Exception as e:  # noqa: BLE001
                last = e
                code, resp = _status_of(e)
                if code == 429 and attempt < MAX_RETRIES:
                    _backoff(attempt, _retry_after(resp))
                    continue
                if code == 429:
                    raise RateLimited(retry_after=_retry_after(resp))
                break
        log("auth_token_failed", err=str(last)[:160])

    email, password = os.environ.get("GARMIN_EMAIL"), os.environ.get("GARMIN_PASSWORD")
    if not (email and password):
        raise AuthError("no GARMIN_TOKEN_BASE64 and no GARMIN_EMAIL/GARMIN_PASSWORD")
    try:
        garth.login(email, password)
        log("auth_ok", via="password")
    except Exception as e:  # noqa: BLE001
        code, resp = _status_of(e)
        if code == 429:
            raise RateLimited(retry_after=_retry_after(resp))
        raise AuthError(str(e)[:200])


# ---------------------------------------------------------------- Supabase sync-state
def _sb():
    return os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_SERVICE_KEY"], os.environ["SUPABASE_USER_ID"]


def read_state():
    url, key, uid = _sb()
    try:
        r = requests.get(
            f"{url}/rest/v1/garmin_sync_state",
            params={"user_id": f"eq.{uid}", "select": "*"},
            headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=30,
        )
        if r.ok and r.json():
            return r.json()[0]
    except Exception as e:  # noqa: BLE001
        log("state_read_failed", err=str(e)[:120])
    return {}


def write_state(**patch):
    url, key, uid = _sb()
    patch = {**patch, "user_id": uid, "updated_at": iso(now_utc())}
    try:
        r = requests.post(
            f"{url}/rest/v1/garmin_sync_state",
            params={"on_conflict": "user_id"},
            headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates,return=minimal"},
            data=json.dumps(patch), timeout=30,
        )
        if r.status_code >= 300:
            log("state_write_rejected", code=r.status_code, body=r.text[:200])
    except Exception as e:  # noqa: BLE001
        log("state_write_failed", err=str(e)[:120])


def today_sleep_exists():
    """Cache-first: is last night already stored? Avoids any Garmin call."""
    url, key, uid = _sb()
    # 'last night' is yesterday's calendar date in most accounts; accept today or yesterday.
    y = (now_utc().date() - dt.timedelta(days=1)).isoformat()
    t = now_utc().date().isoformat()
    try:
        r = requests.get(
            f"{url}/rest/v1/sleep",
            params={"user_id": f"eq.{uid}", "date": f"in.({y},{t})", "select": "date,score", "order": "date.desc"},
            headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=30,
        )
        if r.ok:
            for row in r.json():
                if row.get("score") is not None:
                    return row["date"]
    except Exception as e:  # noqa: BLE001
        log("sleep_check_failed", err=str(e)[:120])
    return None


# ---------------------------------------------------------------- Garmin data helpers
def first(d, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur or cur[k] is None:
            return default
        cur = cur[k]
    return cur


def secs_to_min(v):
    return int(round(v / 60)) if isinstance(v, (int, float)) else None


def display_name():
    global _DISPLAY_NAME
    if _DISPLAY_NAME:
        return _DISPLAY_NAME
    try:
        prof = garth.client.profile
        if isinstance(prof, dict):
            _DISPLAY_NAME = prof.get("displayName") or prof.get("profileId")
    except Exception:  # noqa: BLE001
        pass
    if not _DISPLAY_NAME:
        prof = garmin_call("/userprofile-service/socialProfile", optional=True) or {}
        _DISPLAY_NAME = prof.get("displayName") or str(prof.get("profileId") or "") or garth.client.username
    log("display_name", value=_DISPLAY_NAME)
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
    """Minimal sleep fetch for the night ending on target_date. HR/HRV/battery are
    best-effort extras (skipped automatically if we've hit a 429 this run)."""
    username = display_name()
    ds = target_date.isoformat()

    sleep = garmin_call(
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

    deep_s, rem_s, light_s = dto.get("deepSleepSeconds"), dto.get("remSleepSeconds"), dto.get("lightSleepSeconds")
    awake_s, dur_s = dto.get("awakeSleepSeconds"), dto.get("sleepTimeSeconds")

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
                dur /= 1000.0
            if lvl in bucket:
                bucket[lvl] += dur
        if any(bucket.values()):
            deep_s = deep_s if deep_s is not None else bucket[0]
            light_s = light_s if light_s is not None else bucket[1]
            rem_s = rem_s if rem_s is not None else bucket[2]
            awake_s = awake_s if awake_s is not None else bucket[3]
            dur_s = bucket[0] + bucket[1] + bucket[2]

    duration = secs_to_min(dur_s)
    resting_hr = hrv = body_battery = None

    # Optional extras — only when not in backoff mode; never trigger their own retry storm.
    summary = garmin_call(f"/usersummary-service/usersummary/daily/{username}", params={"calendarDate": ds}, optional=True) or {}
    resting_hr = summary.get("restingHeartRate")
    body_battery = summary.get("bodyBatteryMostRecentValue") or summary.get("bodyBatteryHighestValue")
    hrv_data = garmin_call(f"/hrv-service/hrv/{ds}", optional=True) or {}
    hrv = first(hrv_data, "hrvSummary", "lastNightAvg")

    return {
        "date": ds, "score": score, "duration_min": duration,
        "deep_min": secs_to_min(deep_s), "rem_min": secs_to_min(rem_s),
        "light_min": secs_to_min(light_s), "awake_min": secs_to_min(awake_s),
        "resting_hr": resting_hr, "hrv": hrv, "body_battery": body_battery,
        "raw": {"dailySleepDTO": dto},
    }


def upsert(row):
    url, key, uid = _sb()
    for f in ("score", "duration_min", "deep_min", "rem_min", "light_min", "awake_min", "resting_hr", "hrv", "body_battery"):
        v = row.get(f)
        row[f] = int(round(v)) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
    row = {**row, "user_id": uid, "updated_at": iso(now_utc())}
    resp = requests.post(
        f"{url}/rest/v1/sleep", params={"on_conflict": "user_id,date"},
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"},
        data=json.dumps(row), timeout=30,
    )
    if resp.status_code >= 300:
        log("supabase_rejected", code=resp.status_code, body=resp.text[:400])
        resp.raise_for_status()
    log("upserted", date=row["date"], score=row["score"], dur=row["duration_min"])


def has_data(row):
    return row.get("score") is not None or bool(row.get("duration_min")) or bool(row.get("deep_min")) or bool(row.get("light_min"))


def schedule_cooldown(hours):
    return now_utc() + dt.timedelta(hours=hours)


# ---------------------------------------------------------------- orchestration
def main():
    state = read_state()
    now = now_utc()

    # (1) cooldown gate ---------------------------------------------------------------
    nxt = state.get("next_allowed_sync_at")
    if nxt and not FORCE:
        try:
            if now < dt.datetime.fromisoformat(nxt.replace("Z", "+00:00")):
                log("skip", reason="cooldown_active", until=nxt, status=state.get("source_status"))
                return
        except Exception:  # noqa: BLE001
            pass

    # (2) cache-first -----------------------------------------------------------------
    if not FORCE:
        have = today_sleep_exists()
        if have:
            log("skip", reason="already_have", date=have)
            write_state(source_status="ok", last_sleep_date_fetched=have,
                        next_allowed_sync_at=iso(schedule_cooldown(SUCCESS_COOLDOWN_HRS)),
                        consecutive_failures=0, last_error_code=None)
            return

    # (3) single-flight ---------------------------------------------------------------
    la = state.get("last_attempted_at")
    if state.get("source_status") == "syncing" and la and not FORCE:
        try:
            if (now - dt.datetime.fromisoformat(la.replace("Z", "+00:00"))).total_seconds() < SINGLE_FLIGHT_WINDOW:
                log("skip", reason="another_run_in_flight", since=la)
                return
        except Exception:  # noqa: BLE001
            pass

    write_state(source_status="syncing", last_attempted_at=iso(now))
    fails = int(state.get("consecutive_failures") or 0)

    # (4) talk to Garmin (the only place we do) ---------------------------------------
    try:
        authenticate()
        today = dt.date.today()
        for offset in range(0, 4):
            target = today - dt.timedelta(days=offset)
            row = fetch_sleep(target)
            if has_data(row):
                upsert(row)
                write_state(source_status="ok", last_successful_at=iso(now_utc()),
                            last_sleep_date_fetched=row["date"], consecutive_failures=0,
                            last_error_code=None, retry_after_seconds=None,
                            next_allowed_sync_at=iso(schedule_cooldown(SUCCESS_COOLDOWN_HRS)))
                log("done", result="success", date=row["date"])
                return
            log("no_data", date=target.isoformat())

        # Connected fine, but Garmin hasn't posted last night's score yet → recheck soon.
        write_state(source_status="no_data_yet", last_error_code="no_data",
                    next_allowed_sync_at=iso(now_utc() + dt.timedelta(minutes=NO_DATA_RETRY_MIN)))
        log("done", result="no_data_yet")

    except RateLimited as e:
        fails += 1
        # cooldown grows with repeated 429s; honor Retry-After if larger. Cap at 12h.
        backoff_hrs = min(12.0, 0.5 * (2 ** min(fails, 6)))
        ra_hrs = (e.retry_after or 0) / 3600.0
        cooldown = max(backoff_hrs, ra_hrs)
        write_state(source_status="rate_limited", last_error_code="429",
                    consecutive_failures=fails, retry_after_seconds=e.retry_after,
                    next_allowed_sync_at=iso(schedule_cooldown(cooldown)))
        log("done", result="rate_limited", failures=fails, cooldown_hrs=round(cooldown, 2),
            retry_after=e.retry_after or "none")
        return  # graceful: do NOT fail the workflow, do NOT retry now

    except AuthError as e:
        fails += 1
        write_state(source_status="auth_expired", last_error_code="auth",
                    consecutive_failures=fails,
                    next_allowed_sync_at=iso(schedule_cooldown(6)))
        log("done", result="auth_expired", err=str(e)[:160])
        return

    except Exception as e:  # noqa: BLE001  (5xx / network / parse)
        fails += 1
        write_state(source_status="upstream_down", last_error_code="upstream",
                    consecutive_failures=fails,
                    next_allowed_sync_at=iso(schedule_cooldown(min(6, 0.5 * (2 ** min(fails, 5))))))
        log("done", result="error", err=str(e)[:200])
        return


if __name__ == "__main__":
    main()
