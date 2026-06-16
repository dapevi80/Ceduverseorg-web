/**
 * Google Calendar integration for CRM meeting scheduling.
 *
 * Uses a single free Google account (no Workspace required) connected once via
 * OAuth. We store its refresh token and exchange it for short-lived access
 * tokens on demand, then create calendar events with a Google Meet link.
 * Google emails the invite to attendees directly (sendUpdates=all).
 *
 * The refresh token and the default meeting settings (timezone, duration,
 * calendar id) are stored in the `global_config` table so they can be managed
 * from the executive admin page (/admin/google-meet) at runtime. Env vars are
 * used as the bootstrap/fallback so existing deployments keep working.
 *
 * Required env (client app credentials):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 * Bootstrap / fallback:
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 *   GOOGLE_MEET_CALENDAR_ID   (default "primary")
 *   GOOGLE_MEET_TIMEZONE      (default "America/Mexico_City")
 */

import { db } from "../db";
import { globalConfig } from "@shared/schema";
import { eq } from "drizzle-orm";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const CFG = {
  refreshToken: "google_meet.refresh_token",
  timeZone: "google_meet.timezone",
  duration: "google_meet.duration_minutes",
  calendarId: "google_meet.calendar_id",
} as const;

// --- global_config helpers (jsonb key/value) ---------------------------------
async function getConfig(key: string): Promise<unknown> {
  const [row] = await db.select().from(globalConfig).where(eq(globalConfig.key, key)).limit(1);
  return row?.value;
}

async function setConfig(key: string, value: unknown, meta: { label: string; valueType: string; updatedBy?: string | null }): Promise<void> {
  await db
    .insert(globalConfig)
    .values({ key, value: value as any, category: "google_meet", label: meta.label, valueType: meta.valueType, updatedBy: meta.updatedBy ?? null })
    .onConflictDoUpdate({ target: globalConfig.key, set: { value: value as any, updatedBy: meta.updatedBy ?? null, updatedAt: new Date() } });
}

async function getStoredRefreshToken(): Promise<string | null> {
  const v = await getConfig(CFG.refreshToken);
  if (typeof v === "string" && v.trim()) return v.trim();
  return process.env.GOOGLE_OAUTH_REFRESH_TOKEN || null;
}

export type MeetSettings = { timeZone: string; durationMinutes: number; calendarId: string };

export async function getMeetSettings(): Promise<MeetSettings> {
  const [tz, dur, cal] = await Promise.all([getConfig(CFG.timeZone), getConfig(CFG.duration), getConfig(CFG.calendarId)]);
  return {
    timeZone: (typeof tz === "string" && tz) || process.env.GOOGLE_MEET_TIMEZONE || "America/Mexico_City",
    durationMinutes: (typeof dur === "number" && dur > 0 ? dur : Number(process.env.GOOGLE_MEET_DEFAULT_DURATION)) || 30,
    calendarId: (typeof cal === "string" && cal) || process.env.GOOGLE_MEET_CALENDAR_ID || "primary",
  };
}

export async function updateMeetSettings(patch: Partial<MeetSettings>, updatedBy?: string | null): Promise<MeetSettings> {
  if (patch.timeZone !== undefined) await setConfig(CFG.timeZone, patch.timeZone, { label: "Zona horaria por defecto (Google Meet)", valueType: "string", updatedBy });
  if (patch.durationMinutes !== undefined) await setConfig(CFG.duration, patch.durationMinutes, { label: "Duración por defecto en minutos (Google Meet)", valueType: "number", updatedBy });
  if (patch.calendarId !== undefined) await setConfig(CFG.calendarId, patch.calendarId, { label: "ID de calendario (Google Meet)", valueType: "string", updatedBy });
  return getMeetSettings();
}

export function hasOAuthAppCredentials(): boolean {
  return !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export async function isGoogleCalendarConfigured(): Promise<boolean> {
  return hasOAuthAppCredentials() && !!(await getStoredRefreshToken());
}

// Cache the access token until shortly before it expires.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }
  const refreshToken = await getStoredRefreshToken();
  if (!hasOAuthAppCredentials() || !refreshToken) throw new Error("GOOGLE_CALENDAR_NOT_CONFIGURED");
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google OAuth token refresh failed (${res.status}): ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export type MeetEventInput = {
  summary: string;
  description?: string;
  startLocal: string; // naive wall-clock "YYYY-MM-DDTHH:mm[:ss]" interpreted in `timeZone`
  timeZone: string;   // IANA tz the wall-clock is expressed in (e.g. "America/Mexico_City")
  durationMinutes: number;
  attendees: { email: string; displayName?: string }[];
};

// Offset (ms) of `timeZone` from UTC at a given absolute instant.
function tzOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - instant.getTime();
}

// Convert a naive wall-clock time in `timeZone` to its absolute UTC instant.
// Two-pass to resolve the offset correctly across DST boundaries.
export function zonedWallTimeToInstant(local: string, timeZone: string): Date {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h, mi, s] = m;
  const guessUTC = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0));
  let offset = tzOffsetMs(new Date(guessUTC), timeZone);
  let instant = guessUTC - offset;
  offset = tzOffsetMs(new Date(instant), timeZone);
  instant = guessUTC - offset;
  return new Date(instant);
}

// Express an absolute instant as a naive wall-clock string in `timeZone`.
function instantToZonedWallTime(instant: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

export type MeetEventResult = {
  eventId: string;
  meetUrl: string | null; // hangoutLink
  htmlLink: string; // link to the event in Google Calendar
  start: string;
  end: string;
};

export async function createMeetEvent(input: MeetEventInput): Promise<MeetEventResult> {
  const settings = await getMeetSettings();
  const calendarId = settings.calendarId;
  const timeZone = input.timeZone || settings.timeZone;

  const start = zonedWallTimeToInstant(input.startLocal, timeZone);
  if (isNaN(start.getTime())) throw new Error("Fecha de inicio inválida");
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  // Send Google the wall-clock time + IANA zone so the event lands at the intended
  // local time; each attendee's calendar then renders it in their own time zone.
  const startWall = instantToZonedWallTime(start, timeZone);
  const endWall = instantToZonedWallTime(end, timeZone);

  // requestId must be unique per create request; derive it deterministically
  // from the start time + first attendee so retries don't spawn duplicate Meets.
  const requestId = `cedu-${start.getTime()}-${(input.attendees[0]?.email || "x").replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;

  const token = await getAccessToken();
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description || undefined,
        start: { dateTime: startWall, timeZone },
        end: { dateTime: endWall, timeZone },
        attendees: input.attendees.map((a) => ({ email: a.email, displayName: a.displayName })),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: true },
      }),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Calendar event create failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const ev = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    htmlLink: string;
    start: { dateTime: string };
    end: { dateTime: string };
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  };

  const meetUrl =
    ev.hangoutLink ||
    ev.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
    null;

  return {
    eventId: ev.id,
    meetUrl,
    htmlLink: ev.htmlLink,
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// Schedule a throwaway test invite ~30 min out using the default settings.
export async function createTestMeetEvent(toEmail: string): Promise<MeetEventResult> {
  const settings = await getMeetSettings();
  const start = new Date(Date.now() + 30 * 60_000);
  const startLocal = instantToZonedWallTime(start, settings.timeZone);
  return createMeetEvent({
    summary: "Prueba — Ceduverse Google Meet",
    description: "Evento de prueba generado desde el panel ejecutivo de Google Meet. Puedes cancelarlo sin problema.",
    startLocal,
    timeZone: settings.timeZone,
    durationMinutes: 15,
    attendees: [{ email: toEmail }],
  });
}

// --- Admin: connection status -----------------------------------------------
export type ConnectionStatus = {
  hasAppCredentials: boolean;
  hasRefreshToken: boolean;
  refreshTokenSource: "database" | "env" | "none";
  connected: boolean;          // a token refresh + calendar reachability succeeded
  account: string | null;      // the Google account email, if reachable
  error: string | null;
  settings: MeetSettings;
};

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const settings = await getMeetSettings();
  const dbToken = await getConfig(CFG.refreshToken);
  const hasDbToken = typeof dbToken === "string" && !!dbToken.trim();
  const hasEnvToken = !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const refreshTokenSource: ConnectionStatus["refreshTokenSource"] = hasDbToken ? "database" : hasEnvToken ? "env" : "none";
  const base = {
    hasAppCredentials: hasOAuthAppCredentials(),
    hasRefreshToken: hasDbToken || hasEnvToken,
    refreshTokenSource,
    settings,
  };
  if (!base.hasAppCredentials || !base.hasRefreshToken) {
    return { ...base, connected: false, account: null, error: !base.hasAppCredentials ? "Faltan GOOGLE_OAUTH_CLIENT_ID / SECRET" : "No hay refresh token" };
  }
  try {
    const token = await getAccessToken();
    // Reach the calendar + identify the connected account.
    const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(settings.calendarId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ...base, connected: false, account: null, error: `Calendario no accesible (${res.status}): ${txt.slice(0, 150)}` };
    }
    const cal = (await res.json()) as { id?: string; summary?: string };
    return { ...base, connected: true, account: cal.id || cal.summary || null, error: null };
  } catch (err: any) {
    return { ...base, connected: false, account: null, error: err?.message?.slice(0, 200) || "Error desconocido" };
  }
}

// --- Admin: list upcoming events --------------------------------------------
export type UpcomingEvent = {
  id: string;
  summary: string;
  start: string | null;   // ISO with offset, or all-day date
  end: string | null;
  timeZone: string | null;
  meetUrl: string | null;
  htmlLink: string;
  attendees: { email: string; responseStatus?: string }[];
  status: string;
};

export async function listUpcomingEvents(maxResults = 25): Promise<UpcomingEvent[]> {
  const settings = await getMeetSettings();
  const token = await getAccessToken();
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(Math.min(Math.max(maxResults, 1), 100)),
  });
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(settings.calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`No se pudieron listar los eventos (${res.status}): ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string; summary?: string; status?: string; htmlLink: string; hangoutLink?: string;
      start?: { dateTime?: string; date?: string; timeZone?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: { email: string; responseStatus?: string }[];
      conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
    }>;
  };
  return (data.items || []).map((e) => ({
    id: e.id,
    summary: e.summary || "(sin título)",
    start: e.start?.dateTime || e.start?.date || null,
    end: e.end?.dateTime || e.end?.date || null,
    timeZone: e.start?.timeZone || null,
    meetUrl: e.hangoutLink || e.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri || null,
    htmlLink: e.htmlLink,
    attendees: e.attendees || [],
    status: e.status || "confirmed",
  }));
}

export async function cancelEvent(eventId: string): Promise<void> {
  const settings = await getMeetSettings();
  const token = await getAccessToken();
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(settings.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  // 410 = already deleted; treat as success.
  if (!res.ok && res.status !== 410) {
    const txt = await res.text();
    throw new Error(`No se pudo cancelar el evento (${res.status}): ${txt.slice(0, 200)}`);
  }
}

// --- Admin: OAuth re-link flow ----------------------------------------------
export function getOAuthConsentUrl(redirectUri: string, state: string): string {
  if (!hasOAuthAppCredentials()) throw new Error("Faltan GOOGLE_OAUTH_CLIENT_ID / SECRET");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent", // force a fresh refresh_token
    state,
  });
  return `${AUTH_URL}?${params}`;
}

// Exchange the OAuth code for a refresh token and persist it in global_config.
export async function exchangeCodeAndStoreRefreshToken(code: string, redirectUri: string, updatedBy?: string | null): Promise<void> {
  if (!hasOAuthAppCredentials()) throw new Error("Faltan GOOGLE_OAUTH_CLIENT_ID / SECRET");
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Intercambio de código falló (${res.status}): ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { refresh_token?: string; access_token?: string; expires_in?: number };
  if (!data.refresh_token) {
    throw new Error("Google no devolvió un refresh_token. Revoca el acceso previo en la cuenta de Google e intenta de nuevo.");
  }
  await setConfig(CFG.refreshToken, data.refresh_token, { label: "Refresh token de Google Meet", valueType: "secret", updatedBy });
  // Prime the access-token cache so the new connection is usable immediately.
  if (data.access_token && data.expires_in) {
    cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  } else {
    cachedToken = null;
  }
}
