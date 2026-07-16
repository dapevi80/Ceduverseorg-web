import { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { db } from "../db";
import {
  users,
  courseUsers,
  courses,
  certificateRequests,
  cooperativeMemberships,
  prospects,
  monthlyContributions,
} from "@shared/schema";
import { and, count, countDistinct, eq, gte, isNotNull, isNull, sum } from "drizzle-orm";

// Conector del HQ Kakaw (fase HQ-1). Contrato:
//   GET /api/hq/metrics
//   Header: x-hq-secret: <secreto>
//   200 → { app, ts, health, users:{total,active_30d}, revenue:{mrr_mxn,currency,period}, domain:{...} }
//
// Reglas del HQ: auth de servicio (nunca de usuario), SOLO agregados — jamás
// filas ni PII. El secreto vive en HQ_METRICS_SECRET (env); sin él el endpoint
// rechaza todo (no hay fallback).

const APP = "ceduverse";

function secretOk(req: Request, expected: string): boolean {
  const provided = req.header("x-hq-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual exige misma longitud; longitudes distintas = no coincide.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const n = (v: unknown): number => (v == null ? 0 : Number(v));

export function registerHqRoutes(app: Express): void {
  app.get("/api/hq/metrics", async (req: Request, res: Response) => {
    res.setHeader("cache-control", "no-store");

    const expected = process.env.HQ_METRICS_SECRET;
    if (!expected) {
      // Endpoint deshabilitado hasta configurar el secreto (sin fallback).
      return res.status(503).json({ app: APP, error: "not_configured" });
    }
    if (!secretOk(req, expected)) {
      return res.status(401).json({ app: APP, error: "unauthorized" });
    }

    const now = Date.now();
    const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const since31d = new Date(now - 31 * 24 * 60 * 60 * 1000);

    try {
      const [
        usersTotal,
        usersActive,
        mrr,
        coursesTotal,
        certsIssued,
        enrollments,
        members,
        prospectsTotal,
      ] = await Promise.all([
        db.select({ c: count() }).from(users),
        db
          .select({ c: countDistinct(courseUsers.userId) })
          .from(courseUsers)
          .where(gte(courseUsers.updatedAt, since30d)),
        db
          .select({ s: sum(monthlyContributions.grossAmount) })
          .from(monthlyContributions)
          .where(
            and(
              isNotNull(monthlyContributions.confirmedAt),
              gte(monthlyContributions.confirmedAt, since31d),
            ),
          ),
        db.select({ c: count() }).from(courses),
        db
          .select({ c: count() })
          .from(certificateRequests)
          .where(eq(certificateRequests.status, "emitido")),
        db.select({ c: count() }).from(courseUsers),
        db
          .select({ c: count() })
          .from(cooperativeMemberships)
          .where(isNull(cooperativeMemberships.separationDate)),
        db.select({ c: count() }).from(prospects),
      ]);

      return res.json({
        app: APP,
        ts: new Date().toISOString(),
        health: "ok",
        users: {
          total: n(usersTotal[0]?.c),
          active_30d: n(usersActive[0]?.c),
        },
        revenue: {
          mrr_mxn: n(mrr[0]?.s),
          currency: "MXN",
          period: "monthly",
        },
        domain: {
          courses: n(coursesTotal[0]?.c),
          certificates_issued: n(certsIssued[0]?.c),
          enrollments: n(enrollments[0]?.c),
          cooperative_members: n(members[0]?.c),
          prospects: n(prospectsTotal[0]?.c),
        },
      });
    } catch (err) {
      // Sin degradación silenciosa: si la BD falla, el HQ debe verlo "down".
      console.error("[hq] metrics query failed:", (err as Error).message);
      return res.status(200).json({
        app: APP,
        ts: new Date().toISOString(),
        health: "down",
        error: "query_failed",
      });
    }
  });
}
