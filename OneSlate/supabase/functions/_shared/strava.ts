// Shared Strava helpers for OneSlate edge functions.
// Tokens live in `strava_tokens` (service-role only) and never reach the browser.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const STRAVA_OAUTH = "https://www.strava.com/oauth";
export const STRAVA_API = "https://www.strava.com/api/v3";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...extra },
  });
}

// Service-role client: bypasses RLS, used for all token/run writes.
export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

// Resolve the calling user from their JWT (sent by the browser via _fnCall).
export async function requireUser(req: Request, svc: any): Promise<string> {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Error("not signed in");
  const { data, error } = await svc.auth.getUser(jwt);
  if (error || !data?.user) throw new Error("invalid session");
  return data.user.id as string;
}

// ── OAuth state signing ──────────────────────────────────────────────────────
// The callback runs without a JWT, so we bind it to the user by signing the
// user id into the `state` param with an HMAC (key = service role, server-only).
async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function signState(userId: string): Promise<string> {
  const nonce = crypto.randomUUID();
  const body = `${userId}.${nonce}`;
  return `${body}.${await hmac(body)}`;
}
export async function verifyState(state: string): Promise<string> {
  const parts = (state || "").split(".");
  if (parts.length !== 3) throw new Error("bad state");
  const [userId, nonce, sig] = parts;
  if (await hmac(`${userId}.${nonce}`) !== sig) throw new Error("bad state signature");
  return userId;
}

export function callbackUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/strava-oauth-callback`;
}

export function stravaCreds() {
  const id = Deno.env.get("STRAVA_CLIENT_ID");
  const secret = Deno.env.get("STRAVA_CLIENT_SECRET");
  if (!id || !secret) throw new Error("Strava is not configured (missing client id/secret)");
  return { id, secret };
}

// Return a valid access token for the user, refreshing via Strava if expired.
// Marks the connection `reauth_needed` and throws if the refresh token is rejected.
export async function validAccessToken(svc: any, userId: string): Promise<string> {
  const { data: tok } = await svc
    .from("strava_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!tok) throw new Error("Strava not connected");

  const expiresAt = new Date(tok.expires_at).getTime();
  // refresh a minute early to avoid edge-of-expiry 401s
  if (expiresAt - 60_000 > Date.now()) return tok.access_token;

  const { id, secret } = stravaCreds();
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: id, client_secret: secret,
      grant_type: "refresh_token", refresh_token: tok.refresh_token,
    }),
  });
  if (!res.ok) {
    await svc.from("strava_connections")
      .update({ status: "reauth_needed", updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    throw new Error("Strava reauthorization needed");
  }
  const j = await res.json();
  await svc.from("strava_tokens").update({
    access_token: j.access_token,
    refresh_token: j.refresh_token,          // Strava rotates refresh tokens
    expires_at: new Date(j.expires_at * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  return j.access_token;
}

// ── Rate-limit budget ────────────────────────────────────────────────────────
// Strava allows 100 requests / 15 min and 1000 / day. We keep a conservative
// per-invocation ceiling and persist rolling counters in strava_sync_state so
// repeated on-demand syncs can't blow the window.
export const LIMIT_15MIN = 90;      // stay under the real 100
export const LIMIT_DAY = 900;       // stay under the real 1000

export class RateBudget {
  r15: number; d: number; w15: Date; dStart: Date; used = 0;
  constructor(state: any) {
    const now = Date.now();
    const w15 = state?.window_15min_start ? new Date(state.window_15min_start) : null;
    const dS = state?.day_start ? new Date(state.day_start) : null;
    const freshWin = !w15 || now - w15.getTime() > 15 * 60_000;
    const freshDay = !dS || now - dS.getTime() > 24 * 3600_000;
    this.r15 = freshWin ? 0 : (state?.requests_15min || 0);
    this.d = freshDay ? 0 : (state?.requests_day || 0);
    this.w15 = freshWin ? new Date() : w15!;
    this.dStart = freshDay ? new Date() : dS!;
  }
  canSpend(n = 1) { return this.r15 + n <= LIMIT_15MIN && this.d + n <= LIMIT_DAY; }
  spend(n = 1) { this.r15 += n; this.d += n; this.used += n; }
  toState() {
    return {
      requests_15min: this.r15,
      window_15min_start: this.w15.toISOString(),
      requests_day: this.d,
      day_start: this.dStart.toISOString(),
    };
  }
}

// ── Stream downsampling ──────────────────────────────────────────────────────
// Strava /streams returns parallel arrays keyed by type. Reduce to ~n evenly
// spaced points the coach can reason over (pacing shape, HR drift, elevation).
export function downsampleStreams(streamSet: any, n = 120): any[] {
  const byType: Record<string, any> = {};
  const arr = Array.isArray(streamSet) ? streamSet : (streamSet?.streams || []);
  for (const s of arr) if (s?.type && Array.isArray(s.data)) byType[s.type] = s.data;
  const len = byType.time?.length || byType.distance?.length ||
    byType.heartrate?.length || byType.velocity_smooth?.length || 0;
  if (!len) return [];
  const step = Math.max(1, Math.floor(len / n));
  const out: any[] = [];
  for (let i = 0; i < len; i += step) {
    const v = byType.velocity_smooth?.[i];               // m/s
    out.push({
      t: byType.time?.[i] ?? null,                        // sec since start
      pace: v && v > 0 ? Math.round(1000 / v) : null,     // sec/km
      hr: byType.heartrate?.[i] ?? null,
      elev: byType.altitude?.[i] != null ? Math.round(byType.altitude[i]) : null,
      cad: byType.cadence?.[i] != null ? byType.cadence[i] * 2 : null, // spm (Strava reports per-leg)
    });
  }
  return out;
}

// Compact per-split summary from a detailed activity's splits_metric.
export function parseSplits(detail: any): any[] {
  const sp = detail?.splits_metric;
  if (!Array.isArray(sp)) return [];
  return sp.map((s: any, i: number) => ({
    km: i + 1,
    pace_sec_km: s.moving_time && s.distance ? Math.round(s.moving_time / (s.distance / 1000)) : null,
    hr: s.average_heartrate != null ? Math.round(s.average_heartrate) : null,
    elev_m: s.elevation_difference != null ? Math.round(s.elevation_difference) : null,
  }));
}

// Map a Strava activity type to OneSlate's run type buckets.
export function classifyRun(a: any): string {
  const name = (a.name || "").toLowerCase();
  const km = (a.distance || 0) / 1000;
  if (a.workout_type === 1 || /race/.test(name)) return "race";
  if (a.workout_type === 3 || /tempo|interval|workout|threshold|speed/.test(name)) return "workout";
  // workout_type === 2 is Strava's own "Long Run" tag; ≥14 km (~8.7 mi) covers most long runs
  if (a.workout_type === 2 || km >= 14 || /long/.test(name)) return "long";
  return "easy";
}

export function paceSecKm(a: any): number | null {
  const km = (a.distance || 0) / 1000;
  const sec = a.moving_time || 0;
  return km && sec ? Math.round(sec / km) : null;
}
