import type { Express } from "express";
import { requireAdmin, requireSuperadmin } from "../auth";
import { db } from "../db";
import {
  apiKeys,
  apiRequestLogs,
  empresasProspectos,
} from "@shared/schema";
import { eq, and, sql, count, desc, gte, lte } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getAdminApiKey } from "../env";

export function registerApiKeyRoutes(app: Express) {
  const toRows = (r: any): any[] => Array.isArray(r) ? r : (r as any).rows || [];

  app.get("/api/admin/apis/keys", requireSuperadmin, async (_req, res, next) => {
    try {
      const keys = await db.select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        owner: apiKeys.owner,
        isActive: apiKeys.isActive,
        allowedOrigins: apiKeys.allowedOrigins,
        rateLimitPerMinute: apiKeys.rateLimitPerMinute,
        rateLimitPerDay: apiKeys.rateLimitPerDay,
        requestsToday: apiKeys.requestsToday,
        requestsTodayDate: apiKeys.requestsTodayDate,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys).orderBy(desc(apiKeys.createdAt));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const logCounts = toRows(await db.execute(sql`
        SELECT api_key_id, count(*)::int as total_30d
        FROM api_request_logs WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY api_key_id
      `));
      const logMap = new Map(logCounts.map((r: any) => [r.api_key_id, r.total_30d]));

      res.json(keys.map(k => ({ ...k, totalRequests30d: logMap.get(k.id) || 0 })));
    } catch (err) { next(err); }
  });

  app.get("/api/admin/api-keys", requireAdmin, async (_req, res, next) => {
    try {
      const keys = await db.select({
        id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix,
        owner: apiKeys.owner, isActive: apiKeys.isActive,
        allowedOrigins: apiKeys.allowedOrigins,
        rateLimitPerMinute: apiKeys.rateLimitPerMinute,
        rateLimitPerDay: apiKeys.rateLimitPerDay,
        requestsToday: apiKeys.requestsToday,
        lastUsedAt: apiKeys.lastUsedAt, expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
      res.json(keys);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/apis/keys", requireSuperadmin, async (req, res, next) => {
    try {
      const { name, owner, allowedOrigins, rateLimitPerMinute, rateLimitPerDay, expiresAt } = req.body;
      if (!name || !owner) return res.status(400).json({ message: "name y owner son requeridos" });
      const rawKey = `cdv_${crypto.randomBytes(32).toString("hex")}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const keyPrefix = rawKey.slice(0, 8);
      const [newKey] = await db.insert(apiKeys).values({
        name, keyHash, keyPrefix, owner,
        allowedOrigins: allowedOrigins || [],
        rateLimitPerMinute: rateLimitPerMinute || 120,
        rateLimitPerDay: rateLimitPerDay || 50000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();
      const { keyHash: _, ...safeKey } = newKey;
      res.status(201).json({ ...safeKey, rawKey, message: "Guarda esta key. No se mostrará nuevamente." });
    } catch (err) { next(err); }
  });

  app.post("/api/admin/api-keys", requireAdmin, async (req, res, next) => {
    try {
      const { name, owner, allowedOrigins, rateLimitPerMinute, rateLimitPerDay, expiresAt } = req.body;
      if (!name || !owner) return res.status(400).json({ message: "name y owner son requeridos" });
      const rawKey = `cdv_${crypto.randomBytes(32).toString("hex")}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const keyPrefix = rawKey.slice(0, 8);
      const [newKey] = await db.insert(apiKeys).values({
        name, keyHash, keyPrefix, owner,
        allowedOrigins: allowedOrigins || [],
        rateLimitPerMinute: rateLimitPerMinute || 120,
        rateLimitPerDay: rateLimitPerDay || 50000,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();
      const { keyHash: _, ...safeKey } = newKey;
      res.status(201).json({ ...safeKey, rawKey, message: "Guarda esta key. No se mostrará nuevamente." });
    } catch (err) { next(err); }
  });

  app.post("/api/admin/apis/keys/reseed", requireSuperadmin, async (req, res, next) => {
    try {
      const { name, rawKey } = req.body;
      if (!name || !rawKey) return res.status(400).json({ message: "name y rawKey son requeridos" });

      const existing = await db.select().from(apiKeys).where(eq(apiKeys.name, name));
      for (const k of existing) {
        await db.delete(apiKeys).where(eq(apiKeys.id, k.id));
      }

      const keyHash = await bcrypt.hash(rawKey, 10);
      const keyPrefix = rawKey.slice(0, 8);
      const [newKey] = await db.insert(apiKeys).values({
        name,
        keyHash,
        keyPrefix,
        owner: "MeCorrieron.mx",
        isActive: true,
        allowedOrigins: ["*"],
        rateLimitPerMinute: 120,
        rateLimitPerDay: 50000,
      }).returning();

      const isValid = await bcrypt.compare(rawKey, newKey.keyHash);
      const { keyHash: _, ...safeKey } = newKey;
      res.json({ ...safeKey, verified: isValid, message: "Key reseeded and verified." });
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/apis/keys/:id", requireSuperadmin, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { name, owner, isActive, allowedOrigins, rateLimitPerMinute, rateLimitPerDay, expiresAt } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (typeof name === "string") updates.name = name;
      if (typeof owner === "string") updates.owner = owner;
      if (typeof isActive === "boolean") updates.isActive = isActive;
      if (allowedOrigins) updates.allowedOrigins = allowedOrigins;
      if (rateLimitPerMinute) updates.rateLimitPerMinute = rateLimitPerMinute;
      if (rateLimitPerDay) updates.rateLimitPerDay = rateLimitPerDay;
      if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
      const [updated] = await db.update(apiKeys).set(updates).where(eq(apiKeys.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "API key no encontrada" });
      const { keyHash: _h, ...safe } = updated;
      res.json(safe);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/api-keys/:id", requireAdmin, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { isActive, allowedOrigins, rateLimitPerMinute, rateLimitPerDay } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (typeof isActive === "boolean") updates.isActive = isActive;
      if (allowedOrigins) updates.allowedOrigins = allowedOrigins;
      if (rateLimitPerMinute) updates.rateLimitPerMinute = rateLimitPerMinute;
      if (rateLimitPerDay) updates.rateLimitPerDay = rateLimitPerDay;
      const [updated] = await db.update(apiKeys).set(updates).where(eq(apiKeys.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "API key no encontrada" });
      const { keyHash: _h, ...safe } = updated;
      res.json(safe);
    } catch (err) { next(err); }
  });

  app.delete("/api/admin/apis/keys/:id", requireSuperadmin, async (req, res, next) => {
    try {
      const [updated] = await db.update(apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(apiKeys.id, (req.params.id as string))).returning();
      if (!updated) return res.status(404).json({ message: "API key no encontrada" });
      res.json({ success: true, message: "API key desactivada" });
    } catch (err) { next(err); }
  });

  app.post("/api/admin/apis/keys/:id/regenerate", requireSuperadmin, async (req, res, next) => {
    try {
      const rawKey = `cdv_${crypto.randomBytes(32).toString("hex")}`;
      const keyHash = await bcrypt.hash(rawKey, 10);
      const keyPrefix = rawKey.slice(0, 8);
      const [updated] = await db.update(apiKeys)
        .set({ keyHash, keyPrefix, updatedAt: new Date() })
        .where(eq(apiKeys.id, (req.params.id as string))).returning();
      if (!updated) return res.status(404).json({ message: "API key no encontrada" });
      res.json({ rawKey, message: "Key regenerada. Guárdala ahora." });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/apis/logs", requireSuperadmin, async (req, res, next) => {
    try {
      const { api_key_id, endpoint, status, date_from, date_to } = req.query;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const conditions: any[] = [];
      if (api_key_id) conditions.push(eq(apiRequestLogs.apiKeyId, api_key_id as string));
      if (endpoint) conditions.push(sql`${apiRequestLogs.endpoint} ILIKE ${'%' + endpoint + '%'}`);
      if (status === "2xx") conditions.push(sql`${apiRequestLogs.statusCode} >= 200 AND ${apiRequestLogs.statusCode} < 300`);
      else if (status === "4xx") conditions.push(sql`${apiRequestLogs.statusCode} >= 400 AND ${apiRequestLogs.statusCode} < 500`);
      else if (status === "5xx") conditions.push(sql`${apiRequestLogs.statusCode} >= 500`);
      if (date_from) conditions.push(sql`${apiRequestLogs.createdAt} >= ${new Date(date_from as string)}`);
      if (date_to) conditions.push(sql`${apiRequestLogs.createdAt} <= ${new Date(date_to as string)}`);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logsRaw = await db.execute(sql`
        SELECT l.id, l.endpoint, l.method, l.status_code, l.response_time_ms,
               l.ip, l.user_agent, l.query_params, l.created_at,
               k.name as api_key_name
        FROM api_request_logs l
        LEFT JOIN api_keys k ON k.id = l.api_key_id
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `);
      const totalRaw = await db.execute(sql`
        SELECT count(*)::int as total FROM api_request_logs l
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      `);
      const total = toRows(totalRaw)[0]?.total || 0;
      res.json({ data: toRows(logsRaw), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/api-keys/:id/logs", requireAdmin, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const logs = await db.select().from(apiRequestLogs)
        .where(eq(apiRequestLogs.apiKeyId, id))
        .orderBy(desc(apiRequestLogs.createdAt)).limit(limit).offset((page - 1) * limit);
      const [totalResult] = await db.select({ total: count() }).from(apiRequestLogs)
        .where(eq(apiRequestLogs.apiKeyId, id));
      res.json({ logs, total: totalResult.total, page, limit });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/apis/analytics", requireSuperadmin, async (req, res, next) => {
    try {
      const periodMap: Record<string, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };
      const period = periodMap[req.query.period as string] || "30 days";
      const keyFilter = req.query.api_key_id as string | undefined;
      const keyCondition = keyFilter ? sql`AND api_key_id = ${keyFilter}` : sql``;

      const summaryRaw = toRows(await db.execute(sql`
        SELECT count(*)::int as total_requests,
               count(DISTINCT ip)::int as unique_ips,
               coalesce(avg(response_time_ms), 0)::int as avg_response_time_ms,
               coalesce(round(100.0 * count(*) FILTER(WHERE status_code >= 400) / NULLIF(count(*), 0), 2), 0) as error_rate_pct
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(period)}' ${keyCondition}
      `));
      const summary = summaryRaw[0] || {};

      const perDayRaw = toRows(await db.execute(sql`
        SELECT DATE(created_at) as date,
               count(*)::int as count,
               count(*) FILTER(WHERE status_code >= 400)::int as errors,
               coalesce(avg(response_time_ms), 0)::int as avg_time
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(period)}' ${keyCondition}
        GROUP BY DATE(created_at) ORDER BY DATE(created_at)
      `));

      const perEndpointRaw = toRows(await db.execute(sql`
        SELECT endpoint, count(*)::int as count,
               coalesce(avg(response_time_ms), 0)::int as avg_time
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(period)}' ${keyCondition}
        GROUP BY endpoint ORDER BY count DESC LIMIT 10
      `));
      const totalReqs = Number(summary.total_requests) || 1;
      const perEndpoint = perEndpointRaw.map((e: any) => ({ ...e, pct: Math.round(e.count / totalReqs * 1000) / 10 }));

      const perKeyRaw = toRows(await db.execute(sql`
        SELECT k.name as key_name, count(*)::int as count
        FROM api_request_logs l JOIN api_keys k ON k.id = l.api_key_id
        WHERE l.created_at >= NOW() - INTERVAL '${sql.raw(period)}' ${keyCondition}
        GROUP BY k.name ORDER BY count DESC
      `));
      const perKey = perKeyRaw.map((k: any) => ({ ...k, pct: Math.round(k.count / totalReqs * 1000) / 10 }));

      const topErrors = toRows(await db.execute(sql`
        SELECT status_code as status, count(*)::int as count
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(period)}' AND status_code >= 400 ${keyCondition}
        GROUP BY status_code ORDER BY count DESC LIMIT 10
      `)).map((e: any) => ({ ...e, pct: Math.round(e.count / totalReqs * 1000) / 10 }));

      const statusDist = toRows(await db.execute(sql`
        SELECT CASE
          WHEN status_code >= 200 AND status_code < 300 THEN '2xx'
          WHEN status_code >= 400 AND status_code < 500 THEN '4xx'
          WHEN status_code >= 500 THEN '5xx'
          ELSE 'other' END as status,
          count(*)::int as count
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(period)}' ${keyCondition}
        GROUP BY 1 ORDER BY 1
      `)).map((s: any) => ({ ...s, pct: Math.round(s.count / totalReqs * 1000) / 10 }));

      res.json({
        period: req.query.period || "30d",
        summary,
        requests_per_day: perDayRaw,
        requests_per_endpoint: perEndpoint,
        requests_per_key: perKey,
        top_errors: topErrors,
        status_distribution: statusDist,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/apis/analytics/realtime", requireSuperadmin, async (_req, res, next) => {
    try {
      const lastHour = toRows(await db.execute(sql`
        SELECT count(*)::int as total FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `));
      const lastMinute = toRows(await db.execute(sql`
        SELECT count(*)::int as total FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '1 minute'
      `));
      const activeKeysRaw = toRows(await db.execute(sql`
        SELECT count(DISTINCT api_key_id)::int as total FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `));
      const last10 = toRows(await db.execute(sql`
        SELECT l.endpoint, l.status_code, l.response_time_ms, l.created_at, k.name as key_name
        FROM api_request_logs l LEFT JOIN api_keys k ON k.id = l.api_key_id
        ORDER BY l.created_at DESC LIMIT 10
      `));
      res.json({
        requests_last_hour: lastHour[0]?.total || 0,
        requests_last_minute: lastMinute[0]?.total || 0,
        active_keys: activeKeysRaw[0]?.total || 0,
        last_10_requests: last10,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/apis/health", requireSuperadmin, async (_req, res, next) => {
    try {
      const [companiesCount] = await db.select({ total: count() }).from(empresasProspectos);
      const [activeKeyCount] = await db.select({ total: count() }).from(apiKeys).where(eq(apiKeys.isActive, true));
      const uptimeSeconds = process.uptime();
      res.json({
        api_status: "operational",
        database_status: "connected",
        total_companies_available: companiesCount.total,
        active_api_keys: activeKeyCount.total,
        uptime_hours: Math.round(uptimeSeconds / 3600 * 10) / 10,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/api-keys/stats/daily", requireAdmin, async (_req, res, next) => {
    try {
      const stats = await db.execute(sql`
        SELECT DATE(created_at) as date, count(*) as requests,
               count(DISTINCT api_key_id) as unique_keys,
               avg(response_time_ms)::int as avg_response_ms
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC
      `);
      res.json(toRows(stats));
    } catch (err) { next(err); }
  });
}
