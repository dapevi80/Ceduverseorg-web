/**
 * Executive admin routes for the Google Meet process (/admin/google-meet).
 * All endpoints are gated to the executive email allowlist (requireExecutive).
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { requireExecutive } from "../auth";
import {
  getConnectionStatus,
  getMeetSettings,
  updateMeetSettings,
  listUpcomingEvents,
  cancelEvent,
  createTestMeetEvent,
  getOAuthConsentUrl,
  exchangeCodeAndStoreRefreshToken,
} from "../services/google-calendar";

// Short-lived CSRF state for the OAuth re-link, tied to the executive's user id.
const oauthStates = new Map<string, { userId: string; expiresAt: number }>();
function newState(userId: string): string {
  const s = crypto.randomBytes(16).toString("hex");
  oauthStates.set(s, { userId, expiresAt: Date.now() + 10 * 60_000 });
  return s;
}
function consumeState(s: string): { userId: string } | null {
  const rec = oauthStates.get(s);
  if (!rec) return null;
  oauthStates.delete(s);
  if (Date.now() > rec.expiresAt) return null;
  return { userId: rec.userId };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of oauthStates) if (now > v.expiresAt) oauthStates.delete(k);
}, 5 * 60_000).unref?.();

function callbackRedirectUri(req: Request): string {
  const proto = ((req.headers["x-forwarded-proto"] as string) || req.protocol || "https").split(",")[0].trim();
  const host = ((req.headers["x-forwarded-host"] as string) || req.get("host") || "").split(",")[0].trim();
  return `${proto}://${host}/api/admin/google-meet/oauth/callback`;
}

export function registerGoogleMeetRoutes(app: Express) {
  // Connection status + effective settings.
  app.get("/api/admin/google-meet/status", requireExecutive, async (_req, res, next) => {
    try {
      res.json(await getConnectionStatus());
    } catch (err) { next(err); }
  });

  // Read editable defaults.
  app.get("/api/admin/google-meet/settings", requireExecutive, async (_req, res, next) => {
    try {
      res.json(await getMeetSettings());
    } catch (err) { next(err); }
  });

  // Update editable defaults (timezone / duration / calendar id).
  app.put("/api/admin/google-meet/settings", requireExecutive, async (req: Request, res: Response, next) => {
    try {
      const { timeZone, durationMinutes, calendarId } = req.body as {
        timeZone?: string; durationMinutes?: number; calendarId?: string;
      };
      const patch: { timeZone?: string; durationMinutes?: number; calendarId?: string } = {};
      if (typeof timeZone === "string" && timeZone.trim()) {
        // Validate the IANA zone before persisting.
        try { new Intl.DateTimeFormat("en-US", { timeZone: timeZone.trim() }); }
        catch { return res.status(400).json({ message: "Zona horaria inválida" }); }
        patch.timeZone = timeZone.trim();
      }
      if (durationMinutes !== undefined) {
        const d = Number(durationMinutes);
        if (!Number.isFinite(d) || d < 5 || d > 480) return res.status(400).json({ message: "Duración debe estar entre 5 y 480 minutos" });
        patch.durationMinutes = Math.round(d);
      }
      if (typeof calendarId === "string" && calendarId.trim()) patch.calendarId = calendarId.trim();
      const updated = await updateMeetSettings(patch, req.supabaseUserId);
      res.json(updated);
    } catch (err) { next(err); }
  });

  // Upcoming meetings.
  app.get("/api/admin/google-meet/events", requireExecutive, async (req, res, next) => {
    try {
      const max = Number(req.query.max) || 25;
      res.json(await listUpcomingEvents(max));
    } catch (err: any) {
      if (err?.message === "GOOGLE_CALENDAR_NOT_CONFIGURED") return res.status(503).json({ message: "Google Meet no está conectado." });
      res.status(502).json({ message: err?.message?.slice(0, 200) || "No se pudieron listar los eventos" });
    }
  });

  // Cancel a meeting.
  app.delete("/api/admin/google-meet/events/:id", requireExecutive, async (req, res, next) => {
    try {
      await cancelEvent(req.params.id as string);
      res.json({ ok: true });
    } catch (err: any) {
      if (err?.message === "GOOGLE_CALENDAR_NOT_CONFIGURED") return res.status(503).json({ message: "Google Meet no está conectado." });
      res.status(502).json({ message: err?.message?.slice(0, 200) || "No se pudo cancelar el evento" });
    }
  });

  // Send a test invite.
  app.post("/api/admin/google-meet/test", requireExecutive, async (req: Request, res: Response, next) => {
    try {
      const email = String((req.body?.email || "")).trim();
      if (!email.includes("@")) return res.status(400).json({ message: "Correo inválido" });
      const ev = await createTestMeetEvent(email);
      res.json(ev);
    } catch (err: any) {
      if (err?.message === "GOOGLE_CALENDAR_NOT_CONFIGURED") return res.status(503).json({ message: "Google Meet no está conectado." });
      res.status(502).json({ message: err?.message?.slice(0, 200) || "No se pudo crear el evento de prueba" });
    }
  });

  // --- OAuth re-link: start ---------------------------------------------------
  app.get("/api/admin/google-meet/oauth/start", requireExecutive, async (req: Request, res: Response, next) => {
    try {
      const state = newState(req.supabaseUserId!);
      const url = getOAuthConsentUrl(callbackRedirectUri(req), state);
      res.json({ url });
    } catch (err: any) {
      res.status(400).json({ message: err?.message || "No se pudo iniciar la reconexión" });
    }
  });

  // --- OAuth re-link: callback (browser redirect from Google) -----------------
  app.get("/api/admin/google-meet/oauth/callback", requireExecutive, async (req: Request, res: Response) => {
    const fail = (msg: string) => res.redirect(`/admin/google-meet?error=${encodeURIComponent(msg)}`);
    try {
      const code = String(req.query.code || "");
      const state = String(req.query.state || "");
      if (req.query.error) return fail(String(req.query.error));
      if (!code || !state) return fail("Faltan parámetros de OAuth");
      const ok = consumeState(state);
      if (!ok || ok.userId !== req.supabaseUserId) return fail("Estado de OAuth inválido o expirado");
      await exchangeCodeAndStoreRefreshToken(code, callbackRedirectUri(req), req.supabaseUserId);
      res.redirect(`/admin/google-meet?connected=1`);
    } catch (err: any) {
      fail(err?.message?.slice(0, 160) || "Error al reconectar");
    }
  });
}
