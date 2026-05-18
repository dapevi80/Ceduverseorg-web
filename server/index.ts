import { validateEnv } from "./env";
validateEnv();

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { serveStaticFiles, serveSpaCatchAll } from "./static";
import { createServer } from "http";
import { setupAuth } from "./auth";
import { seedCourses, seedModulesAndQuizzes, seedSuperadmin, seedInstructorCourses, seedBlogPosts, seedSocioProfile, migrateRoles, seedGlobalConfig } from "./seed";
import { seedStudioCourses } from "./seed-studio";
import { seedOnboardingCourses } from "./seed-onboarding";
import { seedTermsVersions, migrateExistingUsersTerms, ensureMembershipSeq, seedInsurancePlans } from "./seed-terms";
import { seedInitialApiKey } from "./seed-api-key";
import { seedStoreProducts } from "./seed-store";

import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();
const httpServer = createServer(app);

app.use(cookieParser());

// Security headers — CSP tightened in production. Dev keeps unsafe-inline/eval for Vite HMR.
const isProd = process.env.NODE_ENV === "production";
const scriptSrc = isProd
  ? ["'self'", "https://js.stripe.com"]
  : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc,
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://*.r2.cloudflarestorage.com", "https://unpkg.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://*.r2.cloudflarestorage.com", "https://api.stripe.com", "wss:", "ws:"],
      mediaSrc: ["'self'", "https://*.r2.cloudflarestorage.com", "blob:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/__health", async (_req, res) => {
  // Quick DB ping. If the DB is unreachable, return 503 so Render/CF marks the
  // instance unhealthy and reroutes/restarts.
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ status: "ok", uptime: process.uptime(), db: "ok" });
  } catch (err: any) {
    res.status(503).json({ status: "degraded", uptime: process.uptime(), db: "error", error: err?.message });
  }
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  setHeaders: (res) => {
    res.setHeader("Content-Disposition", "attachment");
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
}));

// Serve audio files: stream from R2 if configured, fall back to local audio-cache/
import { r2Storage } from "./services/r2-storage";
import fs from "fs";

app.get("/audio/:filename", async (req, res, next) => {
  const filename = req.params.filename;

  // Try R2 first
  if (r2Storage.isConfigured) {
    try {
      const obj = await r2Storage.getObject(`audio/${filename}`);
      if (obj) {
        res.set("Content-Type", obj.contentType);
        if (obj.contentLength) {
          res.set("Content-Length", String(obj.contentLength));
        }
        res.set("Cache-Control", "public, max-age=86400, immutable");
        (obj.body as any).pipe(res);
        return;
      }
    } catch (err) {
      log(`R2 audio fetch error for ${filename}: ${(err as Error).message}`);
      // fall through to local
    }
  }

  // Fall back to local audio-cache directory
  const localPath = path.join(process.cwd(), "audio-cache", filename);
  if (fs.existsSync(localPath)) {
    res.set("Cache-Control", "public, max-age=86400");
    res.sendFile(localPath);
  } else {
    res.status(404).json({ message: "Audio file not found" });
  }
});

setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

if (process.env.NODE_ENV === "production") {
  try {
    serveStaticFiles(app);
    log("static files ready");
  } catch (err: any) {
    console.error("[static]", err.message);
  }
}

const port = parseInt(process.env.PORT || "5000", 10);
httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[FATAL] Port ${port} is already in use — cannot start server`);
  } else {
    console.error(`[FATAL] Server error: ${err.message}`);
  }
  process.exit(1);
});

httpServer.listen(
  {
    port,
    host: "0.0.0.0",
  },
  () => {
    log(`serving on port ${port}`);
  },
);

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveSpaCatchAll(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  log("routes registered");

  (async () => {
    if (process.env.SKIP_SEEDS === "true") {
      log("seeds/imports skipped (SKIP_SEEDS=true)");
      return;
    }
    await migrateRoles().catch((err) => console.error("[seed] Role migration Error:", err.message));
    await seedCourses().catch((err) => console.error("[seed] Error:", err.message));
    await seedModulesAndQuizzes().catch((err) => console.error("[seed] Modules/Quizzes Error:", err.message));
    await seedSuperadmin().catch((err) => console.error("[seed] Superadmin Error:", err.message));
    await seedStudioCourses().catch((err) => console.error("[seed] Studio Error:", err.message));
    await seedOnboardingCourses().catch((err) => console.error("[seed] Onboarding Error:", err.message));
    await seedInstructorCourses().catch((err) => console.error("[seed] Instructor courses Error:", err.message));
    await seedBlogPosts().catch((err) => console.error("[seed] Blog posts Error:", err.message));
    await seedSocioProfile().catch((err) => console.error("[seed] Socio profile Error:", err.message));
    await seedTermsVersions().catch((err) => console.error("[seed] Terms versions Error:", err.message));
    await migrateExistingUsersTerms().catch((err) => console.error("[seed] Terms migration Error:", err.message));
    await ensureMembershipSeq().catch((err) => console.error("[seed] Membership seq Error:", err.message));
    await seedInsurancePlans().catch((err) => console.error("[seed] Insurance plans Error:", err.message));
    await seedInitialApiKey().catch((err) => console.error("[seed] API key Error:", err.message));
    await seedGlobalConfig().catch((err) => console.error("[seed] Global config Error:", err.message));
    await seedStoreProducts().catch((err) => console.error("[seed] Store products Error:", err.message));
    const { startPeriodicSync } = await import("./academy-sync");
    startPeriodicSync();

    const { importProspectosIfNeeded } = await import("./import-prospectos-csv");
    importProspectosIfNeeded().catch(err => console.error("[import] startup error:", err.message));

    const { importSat69b, refreshEfosMatches, insertEfosAsProspectos } = await import("./import-sat-69b");
    importSat69b()
      .then(() => insertEfosAsProspectos())
      .then(() => refreshEfosMatches())
      .catch(err => console.error("[69b] startup error:", err.message));

    log("background seeds complete");
  })().catch(err => console.error("[startup] seed error:", err.message));
})().catch((err) => {
  console.error("[FATAL] Route/startup initialization failed:", err);
  process.exit(1);
});
