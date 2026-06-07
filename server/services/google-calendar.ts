/**
 * Google Calendar integration for CRM meeting scheduling.
 *
 * Uses a single free Google account (no Workspace required) connected once via
 * OAuth. We store its refresh token and exchange it for short-lived access
 * tokens on demand, then create calendar events with a Google Meet link.
 * Google emails the invite to attendees directly (sendUpdates=all).
 *
 * Required env:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REFRESH_TOKEN
 * Optional:
 *   GOOGLE_MEET_CALENDAR_ID   (default "primary")
 *   GOOGLE_MEET_TIMEZONE      (default "America/Mexico_City")
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
}

// Cache the access token until shortly before it expires.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN!,
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
  startISO: string; // ISO 8601 start time
  durationMinutes: number;
  attendees: { email: string; displayName?: string }[];
};

export type MeetEventResult = {
  eventId: string;
  meetUrl: string | null; // hangoutLink
  htmlLink: string; // link to the event in Google Calendar
  start: string;
  end: string;
};

export async function createMeetEvent(input: MeetEventInput): Promise<MeetEventResult> {
  if (!isGoogleCalendarConfigured()) {
    throw new Error("GOOGLE_CALENDAR_NOT_CONFIGURED");
  }
  const calendarId = process.env.GOOGLE_MEET_CALENDAR_ID || "primary";
  const timeZone = process.env.GOOGLE_MEET_TIMEZONE || "America/Mexico_City";

  const start = new Date(input.startISO);
  if (isNaN(start.getTime())) throw new Error("Fecha de inicio inválida");
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

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
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
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
    start: ev.start.dateTime,
    end: ev.end.dateTime,
  };
}
