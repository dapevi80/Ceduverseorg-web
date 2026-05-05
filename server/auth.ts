import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users, accounts, profiles, teamUsers, teams, cooperativeMemberships, termsVersions, userTermsAcceptances, otpCodes, auditLogs } from "@shared/schema";
import { eq, and, sql, lte, inArray, notInArray } from "drizzle-orm";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { sendOtpEmail } from "./email";

// Cap how many OTP requests/verifications a single IP can make. Belt-and-suspenders
// alongside the existing 30s send cooldown and progressive verify lockout in this file.
const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes de código. Espera unos minutos." },
});
const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de verificación. Espera unos minutos." },
});
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de inicio de sesión. Espera unos minutos." },
});

// Demo accounts — loaded from DEMO_ACCOUNTS env var (JSON array) or empty if not set
type DemoAccount = { email: string; fullName: string; role: "socio_estudiante" | "admin" | "socio_comercial" | "superadmin" | "socio_instructor" | "empresa"; isOrgAdmin?: boolean };

// In production, demo accounts must use an email on one of these domains.
// Prevents typo-based privilege escalation (e.g. accidentally allowing demo@gmail.com).
const DEMO_EMAIL_DOMAIN_ALLOWLIST = ["ceduverse.org"];

function loadDemoAccounts(): DemoAccount[] {
  const raw = process.env.DEMO_ACCOUNTS;
  if (!raw) return [];
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_ACCOUNTS_IN_PROD !== "true") {
    console.error("[FATAL] DEMO_ACCOUNTS is set but ALLOW_DEMO_ACCOUNTS_IN_PROD is not 'true'. Demo accounts bypass OTP — explicit opt-in required in production.");
    process.exit(1);
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list = parsed as DemoAccount[];
    if (process.env.NODE_ENV === "production") {
      const filtered = list.filter(a => {
        const domain = (a.email || "").trim().toLowerCase().split("@")[1];
        return domain && DEMO_EMAIL_DOMAIN_ALLOWLIST.includes(domain);
      });
      const rejected = list.length - filtered.length;
      if (rejected > 0) {
        console.warn(`[auth] ${rejected} demo account(s) rejected in production — only domains [${DEMO_EMAIL_DOMAIN_ALLOWLIST.join(", ")}] are allowed`);
      }
      return filtered;
    }
    return list;
  } catch {
    console.error("[auth] Invalid DEMO_ACCOUNTS JSON — demo accounts disabled");
    return [];
  }
}

const DEMO_ACCOUNTS = loadDemoAccounts();

function findDemoAccount(email: string) {
  return DEMO_ACCOUNTS.find(d => d.email === email.trim().toLowerCase());
}

const JWT_SECRET: string = process.env.SESSION_SECRET!;
if (!process.env.SESSION_SECRET) {
  console.error("[FATAL] SESSION_SECRET environment variable is required for JWT signing");
  process.exit(1);
}
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const JWT_EXPIRY = "24h";
const AUTH_COOKIE_NAME = "cedu_token";
const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const JWT_REFRESH_AGE_MS = 12 * 60 * 60 * 1000; // refresh cookie when token is older than this

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
}

function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
}

function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7).trim();
    if (headerToken && headerToken !== "null" && headerToken !== "undefined") {
      return headerToken;
    }
  }
  const cookieToken = (req as any).cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
}

declare global {
  namespace Express {
    interface Request {
      supabaseUserId?: string;
    }
  }
}

// Periodic cleanup of expired OTP codes from the database
setInterval(async () => {
  try {
    await db.delete(otpCodes).where(lte(otpCodes.expiresAt, new Date()));
  } catch (err: any) {
    console.error("[auth] OTP cleanup error:", err.message);
  }
}, 60_000);

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Track failed OTP attempts per IP for progressive lockout
const otpFailedAttempts = new Map<string, { count: number; lastAttempt: number }>();
function checkOtpLockout(ip: string): { locked: boolean; waitSeconds: number } {
  const entry = otpFailedAttempts.get(ip);
  if (!entry) return { locked: false, waitSeconds: 0 };
  const delays = [0, 0, 0, 30, 60, 300, 600]; // progressive delays after 3rd failure
  const delay = delays[Math.min(entry.count, delays.length - 1)] * 1000;
  const elapsed = Date.now() - entry.lastAttempt;
  if (elapsed < delay) return { locked: true, waitSeconds: Math.ceil((delay - elapsed) / 1000) };
  return { locked: false, waitSeconds: 0 };
}
function recordOtpFailure(ip: string) {
  const entry = otpFailedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  entry.count++;
  entry.lastAttempt = Date.now();
  otpFailedAttempts.set(ip, entry);
}
function clearOtpFailures(ip: string) { otpFailedAttempts.delete(ip); }
// Clean up old entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 3600_000;
  for (const [ip, entry] of otpFailedAttempts) {
    if (entry.lastAttempt < cutoff) otpFailedAttempts.delete(ip);
  }
}, 600_000);

function signJwt(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyJwt(token: string): { userId: string; email: string; iat?: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; iat?: number };
    return payload;
  } catch {
    return null;
  }
}

// Refresh the auth cookie if the token is past the refresh threshold. Silent on errors.
// Only refreshes JWTs (not admin sa_ tokens, which have server-side TTL tracking).
function maybeRefreshAuthCookie(req: Request, res: Response, token: string): void {
  if (!token || token.startsWith("sa_")) return;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; iat?: number };
    if (!payload.iat) return;
    const ageMs = Date.now() - payload.iat * 1000;
    if (ageMs > JWT_REFRESH_AGE_MS) {
      const fresh = signJwt(payload.userId, payload.email);
      setAuthCookie(res, fresh);
    }
  } catch {
    // ignore: invalid tokens won't pass auth anyway
  }
}

async function ensureLocalUser(userId: string, email: string, fullName?: string): Promise<void> {
  if (!email) {
    throw new Error("User has no email");
  }

  await db.insert(users)
    .values({ id: userId, email, password: crypto.randomBytes(32).toString("hex") })
    .onConflictDoNothing({ target: users.id });

  await db.insert(accounts)
    .values({ id: userId })
    .onConflictDoNothing({ target: accounts.id });

  await db.insert(profiles)
    .values({ id: userId, fullName: fullName || null })
    .onConflictDoNothing({ target: profiles.id });
}

export function setupAuth(app: Express): void {
  app.post("/api/auth/send-code", sendCodeLimiter, async (req: Request, res: Response) => {
    try {
      const { email, fullName, joinCoop, phone, curp } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Correo electrónico requerido" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: "Correo electrónico inválido" });
      }

      const demo = findDemoAccount(normalizedEmail);
      if (demo) {
        let [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail));
        let userId: string;
        if (existingUser) {
          userId = existingUser.id;
          await db.update(accounts).set({ userRole: demo.role, accountSetup: 4 }).where(eq(accounts.id, userId));
        } else {
          userId = crypto.randomUUID();
          await ensureLocalUser(userId, normalizedEmail, demo.fullName);
          await db.update(accounts).set({ userRole: demo.role, accountSetup: 4 }).where(eq(accounts.id, userId));
          if (demo.isOrgAdmin) {
            const teamId = `demo-empresa-${userId.slice(0, 8)}`;
            await db.insert(teams).values({ id: teamId, name: "Demo Empresa S.A. de C.V.", description: "Organización demo para pruebas", plan: "impulsa", status: "active" }).onConflictDoNothing();
            await db.insert(teamUsers).values({ teamId, userId, role: "admin" }).onConflictDoNothing();
          }
        }
        const token = signJwt(userId, normalizedEmail);
        setAuthCookie(res, token);
        try {
          await db.insert(auditLogs).values({
            userId,
            action: "auth.demo_login",
            metadata: { email: normalizedEmail, role: demo.role, isOrgAdmin: !!demo.isOrgAdmin },
            ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || null,
            userAgent: req.headers["user-agent"] || null,
          });
        } catch (err) {
          console.error("[auth] Failed to write demo login audit log:", err);
        }
        const profile = await db.select().from(profiles).where(eq(profiles.id, userId));
        const account = await storage.getAccount(userId);
        return res.json({
          success: true,
          autoLogin: true,
          token,
          user: { id: userId, email: normalizedEmail, fullName: profile[0]?.fullName || demo.fullName, role: account?.userRole || demo.role },
        });
      }

      // If the client signals this is a registration attempt, reject if the email is already in use.
      // Lets the UI route them to login instead of silently sending an OTP.
      // (Demo accounts above always win, even in register mode.)
      if (req.body?.mode === "register") {
        const [existingForRegister] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
        if (existingForRegister) {
          return res.status(409).json({
            message: "Ya tienes una cuenta. Inicia sesión para continuar.",
            code: "USER_EXISTS",
          });
        }
      }

      // Check for recent OTP to prevent spam (must wait 30s between requests)
      const [existing] = await db.select().from(otpCodes)
        .where(eq(otpCodes.email, normalizedEmail))
        .orderBy(sql`created_at DESC`)
        .limit(1);
      if (existing && (new Date(existing.createdAt).getTime() + 30_000) > Date.now()) {
        return res.status(429).json({ message: "Espera antes de solicitar otro código" });
      }

      // Delete any previous OTPs for this email
      await db.delete(otpCodes).where(eq(otpCodes.email, normalizedEmail));

      const code = generateOtp();
      await db.insert(otpCodes).values({
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        fullName: fullName || null,
        joinCoop: joinCoop || false,
        phone: phone || null,
        curp: curp || null,
      });
      await sendOtpEmail(normalizedEmail, code);

      res.json({ success: true, message: "Código enviado" });
    } catch (err: any) {
      console.error("[auth] send-code error:", err.message);
      res.status(500).json({ message: err.message || "Error al enviar el código" });
    }
  });

  app.post("/api/auth/verify-code", verifyCodeLimiter, async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ message: "Correo y código requeridos" });
      }

      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      const lockout = checkOtpLockout(clientIp);
      if (lockout.locked) {
        return res.status(429).json({ message: `Demasiados intentos. Espera ${lockout.waitSeconds} segundos.` });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const [entry] = await db.select().from(otpCodes)
        .where(eq(otpCodes.email, normalizedEmail))
        .orderBy(sql`created_at DESC`)
        .limit(1);

      if (!entry) {
        return res.status(400).json({ message: "No hay código pendiente. Solicita uno nuevo." });
      }

      if (new Date() > new Date(entry.expiresAt)) {
        await db.delete(otpCodes).where(eq(otpCodes.email, normalizedEmail));
        return res.status(400).json({ message: "El código ha expirado. Solicita uno nuevo." });
      }

      const newAttempts = entry.attempts + 1;
      if (newAttempts > 3) {
        await db.delete(otpCodes).where(eq(otpCodes.email, normalizedEmail));
        recordOtpFailure(clientIp);
        return res.status(429).json({ message: "Demasiados intentos. Solicita un nuevo código." });
      }

      await db.update(otpCodes).set({ attempts: newAttempts }).where(eq(otpCodes.id, entry.id));

      if (entry.code !== code.toString().trim()) {
        recordOtpFailure(clientIp);
        return res.status(400).json({ message: "Código incorrecto" });
      }

      // OTP verified — delete it
      await db.delete(otpCodes).where(eq(otpCodes.email, normalizedEmail));

      let [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail));

      let userId: string;
      let isNewUser = false;
      if (existingUser) {
        userId = existingUser.id;
        if (entry.fullName) {
          await db.update(profiles)
            .set({ fullName: entry.fullName })
            .where(eq(profiles.id, userId));
        }
      } else {
        isNewUser = true;
        userId = crypto.randomUUID();
        await ensureLocalUser(userId, normalizedEmail, entry.fullName || undefined);
      }

      if (entry.phone) {
        await db.update(profiles)
          .set({ phoneNumber: entry.phone })
          .where(eq(profiles.id, userId));
      }

      let membershipNumber: string | null = null;
      if (entry.joinCoop) {
        const [existingMembership] = await db.select().from(cooperativeMemberships).where(eq(cooperativeMemberships.userId, userId));
        if (!existingMembership) {
          const { generateMembershipCode } = await import("./seed-terms");
          membershipNumber = await generateMembershipCode();

          const acceptanceData = `${normalizedEmail}|${entry.fullName || ''}|${new Date().toISOString()}|accepted_statutes`;
          const acceptanceHash = crypto.createHash('sha256').update(acceptanceData).digest('hex');

          await db.insert(cooperativeMemberships).values({
            userId,
            fullName: entry.fullName || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            membershipNumber,
            membershipType: "consumo",
            status: "activo",
            acceptedStatutes: true,
            acceptanceHash,
          });

          await db.update(accounts)
            .set({ referralCode: membershipNumber })
            .where(eq(accounts.id, userId));
        } else {
          membershipNumber = existingMembership.membershipNumber;
        }
      }

      clearOtpFailures(clientIp);
      const token = signJwt(userId, normalizedEmail);
      setAuthCookie(res, token);

      const profile = await db.select().from(profiles).where(eq(profiles.id, userId));
      const account = await storage.getAccount(userId);

      res.json({
        token,
        user: {
          id: userId,
          email: normalizedEmail,
          fullName: profile[0]?.fullName || entry.fullName || null,
          role: account?.userRole || "socio_estudiante",
          membershipNumber,
        },
      });
    } catch (err: any) {
      console.error("[auth] verify-code error:", err.message);
      res.status(500).json({ message: "Error al verificar el código" });
    }
  });

  app.post("/api/auth/admin-login", adminLoginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Correo y contraseña requeridos" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const result = await adminLogin(normalizedEmail, password);
      if (!result) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const profile = await db.select().from(profiles).where(eq(profiles.id, result.userId));
      const account = await storage.getAccount(result.userId);

      setAuthCookie(res, result.token);

      res.json({
        token: result.token,
        user: {
          id: result.userId,
          email: normalizedEmail,
          fullName: profile[0]?.fullName || null,
          role: account?.userRole || "superadmin",
        },
      });
    } catch (err: any) {
      console.error("[auth] admin-login error:", err.message);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (token && token.startsWith("sa_")) {
      adminTokens.delete(token);
    }
    clearAuthCookie(res);
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const session = resolveToken(token);
      if (!session) {
        return res.status(401).json({ message: "Token inválido o expirado" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, session.userId));
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      const profile = await db.select().from(profiles).where(eq(profiles.id, session.userId));
      const account = await storage.getAccount(session.userId);

      res.json({
        id: session.userId,
        email: user.email,
        fullName: profile[0]?.fullName || null,
        role: account?.userRole || "socio_estudiante",
      });
    } catch (err: any) {
      console.error("[auth] me error:", err.message);
      res.status(500).json({ message: "Error de autenticación" });
    }
  });
}

function resolveToken(token: string): { userId: string } | null {
  const adminSession = verifyAdminToken(token);
  if (adminSession) return adminSession;

  const jwtPayload = verifyJwt(token);
  if (jwtPayload) return { userId: jwtPayload.userId };

  return null;
}

export const optionalAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const session = resolveToken(token);
      if (session) {
        req.supabaseUserId = session.userId;
        maybeRefreshAuthCookie(req, res, token);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const session = resolveToken(token);
    if (!session) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.supabaseUserId = session.userId;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const session = resolveToken(token);
    if (!session) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.supabaseUserId = session.userId;

    const account = await storage.getAccount(session.userId);
    if (!account || (account.userRole !== "admin" && account.userRole !== "superadmin")) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireSuperadmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const session = resolveToken(token);
    if (!session) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.supabaseUserId = session.userId;

    const account = await storage.getAccount(session.userId);
    if (!account || account.userRole !== "superadmin") {
      return res.status(403).json({ message: "Acceso denegado — se requiere superadmin" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdminOrPartner: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const session = resolveToken(token);
    if (!session) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.supabaseUserId = session.userId;

    const account = await storage.getAccount(session.userId);
    if (!account || (account.userRole !== "admin" && account.userRole !== "superadmin" && account.userRole !== "socio_comercial" && account.userRole !== "partner" && account.userRole !== "director")) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requirePartner: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const session = resolveToken(token);
    if (!session) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.supabaseUserId = session.userId;

    const account = await storage.getAccount(session.userId);
    if (!account || (account.userRole !== "socio_comercial" && account.userRole !== "partner" && account.userRole !== "director" && account.userRole !== "superadmin")) {
      return res.status(403).json({ message: "Acceso denegado — se requiere rol de socio comercial" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireOrgAdmin = (teamIdParam: string = "id"): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.supabaseUserId) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const teamId = req.params[teamIdParam] as string;
      if (!teamId) {
        return res.status(400).json({ message: "ID de equipo requerido" });
      }

      const account = await storage.getAccount(req.supabaseUserId);
      if (account?.userRole === "superadmin") {
        return next();
      }

      const [membership] = await db.select()
        .from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, req.supabaseUserId)));

      if (!membership || membership.role !== "admin") {
        return res.status(403).json({ message: "Acceso denegado — se requiere ser administrador del equipo" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

const adminTokens = new Map<string, { userId: string; expiresAt: number }>();

function generateAdminToken(userId: string): string {
  const token = `sa_${crypto.randomBytes(32).toString("hex")}`;
  adminTokens.set(token, {
    userId,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
  });
  return token;
}

function verifyAdminToken(token: string): { userId: string } | null {
  if (!token.startsWith("sa_")) return null;
  const session = adminTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    adminTokens.delete(token);
    return null;
  }
  return { userId: session.userId };
}

export const requireInstructor: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const session = resolveToken(token);
    if (!session) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.supabaseUserId = session.userId;

    const account = await storage.getAccount(session.userId);
    if (!account || (!account.isInstructor && account.userRole !== "socio_instructor" && !["admin", "superadmin"].includes(account.userRole))) {
      return res.status(403).json({ message: "Acceso denegado — se requiere rol de instructor" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export async function adminLogin(email: string, password: string): Promise<{ token: string; userId: string } | null> {
  const bcrypt = await import("bcryptjs");
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null;

  // Support both bcrypt and legacy sha256 hashes (migrate on successful login)
  let passwordValid = false;
  if (user.password.startsWith("$2")) {
    passwordValid = await bcrypt.default.compare(password, user.password);
  } else {
    const sha256Hash = crypto.createHash("sha256").update(password).digest("hex");
    passwordValid = user.password === sha256Hash;
    if (passwordValid) {
      // Migrate legacy hash to bcrypt
      const bcryptHash = await bcrypt.default.hash(password, 10);
      await db.update(users).set({ password: bcryptHash }).where(eq(users.id, user.id));
    }
  }
  if (!passwordValid) return null;

  const account = await storage.getAccount(user.id);
  if (!account) return null;

  // Allow password login for superadmin and empresa roles (accounts with passwords set)
  const allowedRoles = ["superadmin", "admin", "empresa", "empresa_rh"];
  if (!allowedRoles.includes(account.userRole || "")) return null;

  const token = account.userRole === "superadmin" ? generateAdminToken(user.id) : signJwt(user.id, email);
  return { token, userId: user.id };
}

const TERMS_EXEMPT_PREFIXES = [
  "/api/terms",
  "/api/auth",
  "/api/user/accept-terms",
];

const TERMS_EXEMPT_EXACT = [
  "/api/auth/me",
  "/api/me/account",
];

export const checkPendingTerms: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.supabaseUserId) return next();

    const url = req.originalUrl.split("?")[0];

    if (!url.startsWith("/api/")) return next();

    if (TERMS_EXEMPT_EXACT.includes(url)) return next();
    if (TERMS_EXEMPT_PREFIXES.some(p => url.startsWith(p))) return next();

    const account = await storage.getAccount(req.supabaseUserId);
    const userRole = account?.userRole || "socio_estudiante";

    const activeVersions = await db.select().from(termsVersions)
      .where(and(eq(termsVersions.isActive, true), eq(termsVersions.isBlocking, true)));

    const applicableVersions = activeVersions.filter(v =>
      v.requiredForRoles && v.requiredForRoles.includes(userRole)
    );

    if (applicableVersions.length === 0) return next();

    const acceptances = await db.select().from(userTermsAcceptances)
      .where(eq(userTermsAcceptances.userId, req.supabaseUserId));

    const acceptedVersionIds = new Set(acceptances.map(a => a.termsVersionId));
    const pendingVersions = applicableVersions.filter(v => !acceptedVersionIds.has(v.id));

    if (pendingVersions.length === 0) return next();

    return res.status(403).json({
      code: "TERMS_PENDING",
      message: "Debes aceptar los documentos legales pendientes antes de continuar.",
      pendingCount: pendingVersions.length,
    });
  } catch (err) {
    next(err);
  }
};
