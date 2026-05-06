import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { apiKeys, apiRequestLogs, empresasProspectos, sat69b } from "@shared/schema";
import { eq, and, sql, gte, lte, desc, count, isNotNull, ilike, or, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";

type ApiKey = typeof apiKeys.$inferSelect;
type EmpresaProspecto = typeof empresasProspectos.$inferSelect;

function obfuscateId(uuid: string): string {
  return `ceduverse-${uuid}`;
}

function deobfuscateId(obfuscated: string): string | null {
  if (!obfuscated.startsWith("ceduverse-")) return null;
  return obfuscated.replace("ceduverse-", "");
}

function mapEmpresaToExternal(emp: EmpresaProspecto, sat69bMatch?: any) {
  return {
    id: obfuscateId(emp.id),
    name: emp.nombreComercial,
    legal_name: emp.razonSocial || null,
    rfc: emp.rfc || null,
    sector: emp.grupoSector || null,
    economic_activity: emp.actividadEconomica || null,
    establishment_type: emp.tipoEstablecimiento || null,
    employee_range: emp.estratoPersonal || null,
    employees_estimated: emp.empleadosEstimados || null,
    employees_min: emp.empleadosMin || null,
    employees_max: emp.empleadosMax || null,
    phone: emp.telefono || null,
    email: emp.correoElectronico || null,
    website: emp.sitioWeb || null,
    address: {
      street: emp.calle || null,
      exterior_number: emp.numExterior || null,
      interior_number: emp.numInterior || null,
      neighborhood: emp.colonia || null,
      postal_code: emp.codigoPostal || null,
      municipality: emp.municipio || null,
      state: emp.estado || null,
      full_address: emp.direccionCompleta || null,
    },
    location: {
      latitude: emp.latitud || null,
      longitude: emp.longitud || null,
    },
    risk_level: emp.nivelRiesgo || null,
    applicable_noms: emp.nomsAplicables || [],
    commercial_zone: emp.zonaComercial || null,
    registration_date: emp.fechaAlta || null,
    sat_69b: sat69bMatch ? {
      listed: true,
      rfc: sat69bMatch.rfc,
      status: sat69bMatch.situacion,
      name_in_list: sat69bMatch.nombre_contribuyente || sat69bMatch.nombreContribuyente,
      publication_date_presuntos: sat69bMatch.fecha_publicacion_presuntos || sat69bMatch.fechaPublicacionPresuntos || null,
      publication_date_definitivos: sat69bMatch.fecha_publicacion_definitivos || sat69bMatch.fechaPublicacionDefinitivos || null,
      publication_date_desvirtuados: sat69bMatch.fecha_publicacion_desvirtuados || sat69bMatch.fechaPublicacionDesvirtuados || null,
      publication_date_sentencia: sat69bMatch.fecha_publicacion_sentencia || sat69bMatch.fechaPublicacionSentencia || null,
    } : { listed: false },
    source: "Directorio Empresarial Ceduverse",
  };
}

async function find69bMatches(names: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  if (names.length === 0) return map;

  const cleanNames = names
    .filter(n => n && n.length > 3)
    .map(n => normalizeCompanyName(n));
  
  if (cleanNames.length === 0) return map;

  const batchSize = 50;
  for (let i = 0; i < cleanNames.length; i += batchSize) {
    const batch = cleanNames.slice(i, i + batchSize);
    const conditions = batch.map(name => 
      sql`UPPER(REGEXP_REPLACE(nombre_contribuyente, '[^A-Z0-9 ]', '', 'g')) = ${name}`
    );
    
    const results = await db.execute(
      sql`SELECT * FROM sat_69b WHERE ${sql.join(conditions, sql` OR `)}`
    );

    for (const row of (results as any).rows || []) {
      const normalized = normalizeCompanyName(row.nombre_contribuyente);
      map.set(normalized, row);
    }
  }

  return map;
}

function normalizeCompanyName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function find69bForEmpresa(emp: EmpresaProspecto): Promise<any | null> {
  if (emp.rfc) {
    const [byRfc] = await db.select().from(sat69b).where(eq(sat69b.rfc, emp.rfc.toUpperCase())).limit(1);
    if (byRfc) return byRfc;
  }

  for (const nameToSearch of [emp.razonSocial, emp.nombreComercial]) {
    if (!nameToSearch || nameToSearch.length < 4) continue;
    const normalized = normalizeCompanyName(nameToSearch);
    const results = await db.execute(
      sql`SELECT * FROM sat_69b WHERE UPPER(REGEXP_REPLACE(nombre_contribuyente, '[^A-Z0-9 ]', '', 'g')) = ${normalized} LIMIT 1`
    );
    const match = (results as any).rows?.[0];
    if (match) return match;
  }

  return null;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
      _apiStartTime?: number;
    }
  }
}

function setDefaultRateLimitHeaders(res: Response) {
  if (!res.getHeader("X-RateLimit-Reset")) {
    res.setHeader("X-RateLimit-Reset", String(Math.ceil((Date.now() + 60_000) / 1000)));
  }
  if (!res.getHeader("X-RateLimit-Limit")) {
    res.setHeader("X-RateLimit-Limit", "0");
  }
  if (!res.getHeader("X-RateLimit-Remaining")) {
    res.setHeader("X-RateLimit-Remaining", "0");
  }
}

function logFailedAuthRequest(req: Request, statusCode: number) {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  console.log(`[external-api] Auth failed: ${req.method} ${req.path} status=${statusCode} ip=${ip}`);
}

async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    setDefaultRateLimitHeaders(res);
    logFailedAuthRequest(req, 401);
    return res.status(401).json({
      error: "unauthorized",
      message: "API key required. Use Authorization: Bearer <api_key>",
    });
  }

  const rawKey = authHeader.slice(7);
  const prefix = rawKey.slice(0, 8);

  const [keyRecord] = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, prefix), eq(apiKeys.isActive, true)));

  if (!keyRecord) {
    setDefaultRateLimitHeaders(res);
    logFailedAuthRequest(req, 401);
    return res.status(401).json({ error: "unauthorized", message: "Invalid API key" });
  }

  const isValid = await bcrypt.compare(rawKey, keyRecord.keyHash);
  if (!isValid) {
    setDefaultRateLimitHeaders(res);
    logFailedAuthRequest(req, 401);
    return res.status(401).json({ error: "unauthorized", message: "Invalid API key" });
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    setDefaultRateLimitHeaders(res);
    logFailedAuthRequest(req, 401);
    return res.status(401).json({ error: "unauthorized", message: "API key expired" });
  }

  const origin = req.headers.origin;
  if (origin) {
    const origins = keyRecord.allowedOrigins || [];
    if (origins.length === 0) {
      setDefaultRateLimitHeaders(res);
      logFailedAuthRequest(req, 403);
      return res.status(403).json({ error: "forbidden", message: "No origins configured for this API key" });
    }
    const matchedOrigin = origins.find(o => o === "*" || o === origin);
    if (!matchedOrigin) {
      setDefaultRateLimitHeaders(res);
      logFailedAuthRequest(req, 403);
      return res.status(403).json({ error: "forbidden", message: "Origin not allowed" });
    }
    res.setHeader("Access-Control-Allow-Origin", matchedOrigin === "*" ? "*" : origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }

  const minuteKey = `${keyRecord.id}:minute`;
  const now = Date.now();
  let minuteEntry = rateLimitMap.get(minuteKey);
  if (!minuteEntry || now >= minuteEntry.resetAt) {
    minuteEntry = { count: 1, resetAt: now + 60_000 };
    rateLimitMap.set(minuteKey, minuteEntry);
  } else {
    minuteEntry.count++;
  }

  const resetEpoch = Math.ceil(minuteEntry.resetAt / 1000);

  if (minuteEntry.count > keyRecord.rateLimitPerMinute) {
    res.setHeader("X-RateLimit-Limit", String(keyRecord.rateLimitPerMinute));
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("X-RateLimit-Reset", String(resetEpoch));
    req.apiKey = keyRecord;
    req._apiStartTime = startTime;
    res.status(429).json({ error: "rate_limit_exceeded", message: "Too many requests per minute" });
    logRequest(req, res);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  let dailyCount = keyRecord.requestsToday;
  if (keyRecord.requestsTodayDate !== today) {
    dailyCount = 0;
  }
  dailyCount++;
  if (dailyCount > keyRecord.rateLimitPerDay) {
    res.setHeader("X-RateLimit-Daily-Limit", String(keyRecord.rateLimitPerDay));
    res.setHeader("X-RateLimit-Daily-Remaining", "0");
    res.setHeader("X-RateLimit-Reset", String(resetEpoch));
    req.apiKey = keyRecord;
    req._apiStartTime = startTime;
    res.status(429).json({ error: "rate_limit_exceeded", message: "Daily request limit exceeded" });
    logRequest(req, res);
    return;
  }

  await db.update(apiKeys).set({
    lastUsedAt: new Date(),
    requestsToday: dailyCount,
    requestsTodayDate: today,
  }).where(eq(apiKeys.id, keyRecord.id));

  const minuteRemaining = Math.max(0, keyRecord.rateLimitPerMinute - minuteEntry.count);
  res.setHeader("X-RateLimit-Limit", String(keyRecord.rateLimitPerMinute));
  res.setHeader("X-RateLimit-Remaining", String(minuteRemaining));
  res.setHeader("X-RateLimit-Reset", String(resetEpoch));
  res.setHeader("X-RateLimit-Daily-Limit", String(keyRecord.rateLimitPerDay));
  res.setHeader("X-RateLimit-Daily-Remaining", String(Math.max(0, keyRecord.rateLimitPerDay - dailyCount)));

  req.apiKey = keyRecord;
  req._apiStartTime = startTime;
  next();
}

function logRequest(req: Request, res: Response) {
  const startTime = req._apiStartTime || Date.now();
  const responseTimeMs = Date.now() - startTime;
  const apiKeyId = req.apiKey?.id;
  if (!apiKeyId) return;

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";

  const params = Object.keys(req.query).length > 0 ? req.query : null;
  db.insert(apiRequestLogs).values({
    apiKeyId,
    endpoint: req.path,
    method: req.method,
    statusCode: res.statusCode,
    responseTimeMs,
    ip,
    userAgent,
    queryParams: params,
  }).catch(err => console.error("[external-api] Log error:", err));
}

async function corsPreflightHandler(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (!origin) {
    res.status(204).end();
    return;
  }

  const allKeys = await db.select({
    allowedOrigins: apiKeys.allowedOrigins,
    isActive: apiKeys.isActive,
  }).from(apiKeys).where(eq(apiKeys.isActive, true));

  let allowed = false;
  for (const k of allKeys) {
    if (k.allowedOrigins && k.allowedOrigins.some(o => o === "*" || o === origin)) {
      allowed = true;
      break;
    }
  }

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  res.status(204).end();
}

export function registerExternalApiRoutes(app: Express) {
  app.options("/api/v1/external/health", corsPreflightHandler);
  app.options(["/api/v1/external/companies/viewport", "/api/v1/external/empresas/viewport"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/search", "/api/v1/external/empresas/search"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/nearby", "/api/v1/external/empresas/nearby"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/stats", "/api/v1/external/empresas/stats"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/filters", "/api/v1/external/empresas/filters"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/:id", "/api/v1/external/empresas/:id"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/69b/lookup", "/api/v1/external/empresas/69b/consulta"], corsPreflightHandler);
  app.options(["/api/v1/external/companies/69b/stats", "/api/v1/external/empresas/69b/estadisticas"], corsPreflightHandler);

  app.get("/api/v1/external/docs", authenticateApiKey, (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(getDocsHtml());
    logRequest(req, res);
  });

  app.get("/api/v1/external/health", authenticateApiKey, async (req, res) => {
    try {
      const [result] = await db.select({ total: count() }).from(empresasProspectos);
      const [sat69bResult] = await db.select({ total: count() }).from(sat69b);
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json({
        status: "ok",
        service: "Directorio Empresarial Ceduverse",
        companies_count: result.total,
        sat_69b_count: sat69bResult.total,
        timestamp: new Date().toISOString(),
      });
      logRequest(req, res);
    } catch (err: any) {
      res.status(500).json({ error: "internal", message: "Service unavailable" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/viewport", "/api/v1/external/empresas/viewport"], authenticateApiKey, async (req, res) => {
    try {
      const { ne_lat, ne_lng, sw_lat, sw_lng, sector, risk_level, limit: lim } = req.query;
      if (!ne_lat || !ne_lng || !sw_lat || !sw_lng) {
        res.status(400).json({ error: "bad_request", message: "ne_lat, ne_lng, sw_lat, sw_lng params required" });
        logRequest(req, res);
        return;
      }

      const north = parseFloat(ne_lat as string);
      const south = parseFloat(sw_lat as string);
      const east = parseFloat(ne_lng as string);
      const west = parseFloat(sw_lng as string);
      const maxResults = Math.min(parseInt(lim as string) || 200, 500);

      const conditions = [
        gte(empresasProspectos.latitud, south),
        lte(empresasProspectos.latitud, north),
        gte(empresasProspectos.longitud, west),
        lte(empresasProspectos.longitud, east),
        isNotNull(empresasProspectos.latitud),
        isNotNull(empresasProspectos.longitud),
      ];

      if (sector) conditions.push(eq(empresasProspectos.grupoSector, sector as string));
      if (risk_level) conditions.push(eq(empresasProspectos.nivelRiesgo, risk_level as string));

      const results = await db.select().from(empresasProspectos)
        .where(and(...conditions))
        .limit(maxResults);

      const names = results.flatMap(r => [r.razonSocial, r.nombreComercial].filter((s): s is string => Boolean(s)));
      const matches69b = await find69bMatches(names);

      const companies = results.map(emp => {
        const match = matches69b.get(normalizeCompanyName(emp.razonSocial || "")) ||
                      matches69b.get(normalizeCompanyName(emp.nombreComercial || "")) || null;
        return mapEmpresaToExternal(emp, match);
      });

      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({
        companies,
        count: results.length,
        viewport: { ne_lat: north, ne_lng: east, sw_lat: south, sw_lng: west },
        source: "Directorio Empresarial Ceduverse",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] viewport error:", err);
      res.status(500).json({ error: "internal", message: "Error fetching viewport data" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/search", "/api/v1/external/empresas/search"], authenticateApiKey, async (req, res) => {
    try {
      const { q, sector, municipality, state, risk_level, page: p, limit: l } = req.query;

      if (!q || (q as string).trim().length < 3) {
        res.status(400).json({ error: "bad_request", message: "Query parameter 'q' is required (minimum 3 characters)" });
        logRequest(req, res);
        return;
      }

      const page = Math.max(1, parseInt(p as string) || 1);
      const limit = Math.min(parseInt(l as string) || 50, 100);
      const offset = (page - 1) * limit;

      const searchTerm = `%${q}%`;
      const searchCondition = sql`(${empresasProspectos.nombreComercial} ILIKE ${searchTerm} OR ${empresasProspectos.razonSocial} ILIKE ${searchTerm} OR ${empresasProspectos.actividadEconomica} ILIKE ${searchTerm})`;
      const filters = [searchCondition];
      if (sector) filters.push(eq(empresasProspectos.grupoSector, sector as string));
      if (municipality) filters.push(eq(empresasProspectos.municipio, municipality as string));
      if (state) filters.push(eq(empresasProspectos.estado, state as string));
      if (risk_level) filters.push(eq(empresasProspectos.nivelRiesgo, risk_level as string));

      const whereClause = and(...filters);

      const [totalResult] = await db.select({ total: count() }).from(empresasProspectos)
        .where(whereClause);

      const results = await db.select().from(empresasProspectos)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      const names = results.flatMap(r => [r.razonSocial, r.nombreComercial].filter((s): s is string => Boolean(s)));
      const matches69b = await find69bMatches(names);

      const companies = results.map(emp => {
        const match = matches69b.get(normalizeCompanyName(emp.razonSocial || "")) || 
                      matches69b.get(normalizeCompanyName(emp.nombreComercial || "")) || null;
        return mapEmpresaToExternal(emp, match);
      });

      res.setHeader("Cache-Control", "public, max-age=60");
      res.json({
        companies,
        count: results.length,
        total: totalResult.total,
        page,
        limit,
        total_pages: Math.ceil(totalResult.total / limit),
        source: "Directorio Empresarial Ceduverse",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] search error:", err);
      res.status(500).json({ error: "internal", message: "Error searching companies" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/nearby", "/api/v1/external/empresas/nearby"], authenticateApiKey, async (req, res) => {
    try {
      const { lat, lng, radius_km, limit: l, sector, risk_level } = req.query;
      if (!lat || !lng) {
        res.status(400).json({ error: "bad_request", message: "lat and lng params required" });
        logRequest(req, res);
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = Math.min(parseFloat(radius_km as string) || 2, 10);
      const maxResults = Math.min(parseInt(l as string) || 30, 100);

      const haversine = sql`(
        6371 * acos(
          cos(radians(${latitude})) * cos(radians(${empresasProspectos.latitud})) *
          cos(radians(${empresasProspectos.longitud}) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(${empresasProspectos.latitud}))
        )
      )`;

      const nearbyFilters = [
        isNotNull(empresasProspectos.latitud),
        isNotNull(empresasProspectos.longitud),
        sql`${haversine} <= ${radiusKm}`,
      ];
      if (sector) nearbyFilters.push(eq(empresasProspectos.grupoSector, sector as string));
      if (risk_level) nearbyFilters.push(eq(empresasProspectos.nivelRiesgo, risk_level as string));

      const results = await db.select({
        empresa: empresasProspectos,
        distance: haversine.as("distance_km"),
      }).from(empresasProspectos)
        .where(and(...nearbyFilters))
        .orderBy(sql`${haversine}`)
        .limit(maxResults);

      const nearbyNames = results.flatMap(r => [r.empresa.razonSocial, r.empresa.nombreComercial].filter((s): s is string => Boolean(s)));
      const nearbyMatches69b = await find69bMatches(nearbyNames);

      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({
        companies: results.map(r => {
          const match = nearbyMatches69b.get(normalizeCompanyName(r.empresa.razonSocial || "")) ||
                        nearbyMatches69b.get(normalizeCompanyName(r.empresa.nombreComercial || "")) || null;
          return {
            ...mapEmpresaToExternal(r.empresa, match),
            distance_km: Math.round((r.distance as number) * 100) / 100,
          };
        }),
        count: results.length,
        center: { latitude, longitude },
        radius_km: radiusKm,
        source: "Directorio Empresarial Ceduverse",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] nearby error:", err);
      res.status(500).json({ error: "internal", message: "Error fetching nearby companies" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/stats", "/api/v1/external/empresas/stats"], authenticateApiKey, async (req, res) => {
    try {
      const sectorFilter = req.query.sector as string | undefined;
      const municipalityFilter = req.query.municipality as string | undefined;

      const statsFilters: ReturnType<typeof eq>[] = [];
      if (sectorFilter) statsFilters.push(eq(empresasProspectos.grupoSector, sectorFilter));
      if (municipalityFilter) statsFilters.push(eq(empresasProspectos.municipio, municipalityFilter));

      const baseWhere = statsFilters.length > 0 ? and(...statsFilters) : undefined;

      const bySector = await db.select({
        sector: empresasProspectos.grupoSector,
        count: count(),
      }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.grupoSector), ...statsFilters))
        .groupBy(empresasProspectos.grupoSector)
        .orderBy(desc(count()))
        .limit(20);

      const byMunicipality = await db.select({
        municipality: empresasProspectos.municipio,
        state: empresasProspectos.estado,
        count: count(),
      }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.municipio), ...statsFilters))
        .groupBy(empresasProspectos.municipio, empresasProspectos.estado)
        .orderBy(desc(count()))
        .limit(20);

      const bySize = await db.select({
        size_range: empresasProspectos.estratoPersonal,
        count: count(),
      }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.estratoPersonal), ...statsFilters))
        .groupBy(empresasProspectos.estratoPersonal)
        .orderBy(desc(count()));

      const byRisk = await db.select({
        risk_level: empresasProspectos.nivelRiesgo,
        count: count(),
      }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.nivelRiesgo), ...statsFilters))
        .groupBy(empresasProspectos.nivelRiesgo)
        .orderBy(desc(count()));

      const [totalResult] = await db.select({ total: count() }).from(empresasProspectos)
        .where(baseWhere);

      const total = totalResult.total;
      const addPct = (arr: { count: number; [key: string]: unknown }[]) => arr.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 10000) / 100 : 0,
      }));

      const withPhoneCount = await db.select({ total: count() }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.telefono), ...statsFilters));
      const withEmailCount = await db.select({ total: count() }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.correoElectronico), ...statsFilters));
      const withWebsiteCount = await db.select({ total: count() }).from(empresasProspectos)
        .where(and(isNotNull(empresasProspectos.sitioWeb), ...statsFilters));

      const contactCoverage = {
        with_phone: withPhoneCount[0]?.total || 0,
        with_email: withEmailCount[0]?.total || 0,
        with_website: withWebsiteCount[0]?.total || 0,
        phone_percentage: total > 0 ? Math.round(((withPhoneCount[0]?.total || 0) / total) * 10000) / 100 : 0,
        email_percentage: total > 0 ? Math.round(((withEmailCount[0]?.total || 0) / total) * 10000) / 100 : 0,
        website_percentage: total > 0 ? Math.round(((withWebsiteCount[0]?.total || 0) / total) * 10000) / 100 : 0,
      };

      res.setHeader("Cache-Control", "public, max-age=600");
      res.json({
        total_companies: total,
        by_sector: addPct(bySector),
        by_municipality: addPct(byMunicipality),
        by_size: addPct(bySize),
        by_risk: addPct(byRisk),
        contact_coverage: contactCoverage,
        source: "Directorio Empresarial Ceduverse",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] stats error:", err);
      res.status(500).json({ error: "internal", message: "Error fetching stats" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/filters", "/api/v1/external/empresas/filters"], authenticateApiKey, async (req, res) => {
    try {
      const sectors = await db.execute(sql`
        SELECT DISTINCT grupo_sector as value FROM empresas_prospectos
        WHERE grupo_sector IS NOT NULL ORDER BY grupo_sector
      `);

      const municipalities = await db.execute(sql`
        SELECT DISTINCT municipio as value, estado as state FROM empresas_prospectos
        WHERE municipio IS NOT NULL ORDER BY municipio LIMIT 200
      `);

      const riskLevels = await db.execute(sql`
        SELECT DISTINCT nivel_riesgo as value FROM empresas_prospectos
        WHERE nivel_riesgo IS NOT NULL ORDER BY nivel_riesgo
      `);

      const sizeRanges = await db.execute(sql`
        SELECT DISTINCT estrato_personal as value FROM empresas_prospectos
        WHERE estrato_personal IS NOT NULL ORDER BY estrato_personal
      `);

      const toRows = (r: unknown): Record<string, unknown>[] => {
        if (Array.isArray(r)) return r;
        return (r as { rows?: Record<string, unknown>[] }).rows || [];
      };

      res.setHeader("Cache-Control", "public, max-age=3600");
      res.json({
        sectors: toRows(sectors).map(r => r.value as string),
        municipalities: toRows(municipalities).map(r => r.value as string),
        risk_levels: toRows(riskLevels).map(r => r.value as string),
        size_ranges: toRows(sizeRanges).map(r => r.value as string),
        source: "Directorio Empresarial Ceduverse",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] filters error:", err);
      res.status(500).json({ error: "internal", message: "Error fetching filters" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/69b/lookup", "/api/v1/external/empresas/69b/consulta"], authenticateApiKey, async (req, res) => {
    try {
      const { rfc, name, q } = req.query;

      if (!rfc && !name && !q) {
        res.status(400).json({ error: "bad_request", message: "Provide 'rfc', 'name', or 'q' parameter" });
        logRequest(req, res);
        return;
      }

      let results: any[] = [];

      if (rfc) {
        const rfcUpper = (rfc as string).toUpperCase().trim();
        results = await db.select().from(sat69b).where(eq(sat69b.rfc, rfcUpper));
      } else {
        const searchTerm = (name || q) as string;
        results = await db.select().from(sat69b)
          .where(ilike(sat69b.nombreContribuyente, `%${searchTerm}%`))
          .limit(50);
      }

      res.json({
        results: results.map(r => ({
          rfc: r.rfc,
          name: r.nombreContribuyente,
          status: r.situacion,
          publication_date_presuntos: r.fechaPublicacionPresuntos || null,
          publication_date_definitivos: r.fechaPublicacionDefinitivos || null,
          publication_date_desvirtuados: r.fechaPublicacionDesvirtuados || null,
          publication_date_sentencia: r.fechaPublicacionSentencia || null,
        })),
        count: results.length,
        source: "SAT Art. 69-B CFF vía Directorio Empresarial Ceduverse",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] 69b lookup error:", err);
      res.status(500).json({ error: "internal", message: "Error consulting 69-B list" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/69b/stats", "/api/v1/external/empresas/69b/estadisticas"], authenticateApiKey, async (req, res) => {
    try {
      const bySituacion = await db.select({
        situacion: sat69b.situacion,
        count: count(),
      }).from(sat69b)
        .groupBy(sat69b.situacion)
        .orderBy(desc(count()));

      const [totalResult] = await db.select({ total: count() }).from(sat69b);

      res.setHeader("Cache-Control", "public, max-age=3600");
      res.json({
        total: totalResult.total,
        by_status: bySituacion.map(r => ({
          status: r.situacion,
          count: r.count,
        })),
        source: "SAT Art. 69-B CFF vía Directorio Empresarial Ceduverse",
        last_update: "2025-12-31",
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] 69b stats error:", err);
      res.status(500).json({ error: "internal", message: "Error fetching 69-B stats" });
      logRequest(req, res);
    }
  });

  app.get(["/api/v1/external/companies/:id", "/api/v1/external/empresas/:id"], authenticateApiKey, async (req, res) => {
    try {
      const realId = deobfuscateId(String(req.params.id));
      if (!realId) {
        res.status(400).json({ error: "bad_request", message: "Invalid company ID format" });
        logRequest(req, res);
        return;
      }

      const [empresa] = await db.select().from(empresasProspectos)
        .where(eq(empresasProspectos.id, realId));

      if (!empresa) {
        res.status(404).json({ error: "not_found", message: "Company not found" });
        logRequest(req, res);
        return;
      }

      const sat69bMatch = await find69bForEmpresa(empresa);
      const external = mapEmpresaToExternal(empresa, sat69bMatch);

      const empEst = empresa.empleadosEstimados || 0;
      let laborRisk = "medio";
      if (empEst >= 51) laborRisk = "alto";
      else if (empEst >= 21) laborRisk = "medio-alto";
      else if (empEst >= 11) laborRisk = "medio";
      else laborRisk = "bajo";

      const actLower = (empresa.actividadEconomica || "").toLowerCase();
      const isConstruction = actLower.includes("construcc");
      const isManufacturing = actLower.includes("manufactur");

      const applicableNoms: string[] = ["NOM-035"];
      if (empEst >= 16) applicableNoms.push("NOM-030");
      if (isConstruction) applicableNoms.push("NOM-031");
      if (isManufacturing || isConstruction) applicableNoms.push("NOM-036");

      const laborContext = {
        labor_risk_estimate: laborRisk,
        nom035_applicable: empEst >= 16,
        nom036_applicable: isConstruction || isManufacturing,
        estimated_annual_training_hours: empEst >= 51 ? 40 : empEst >= 11 ? 24 : 8,
        compliance_complexity: empEst >= 51 ? "alta" : empEst >= 11 ? "media" : "baja",
      };

      const sectorDetail = {
        sector: empresa.grupoSector || null,
        economic_activity: empresa.actividadEconomica || null,
        establishment_type: empresa.tipoEstablecimiento || null,
      };

      const stpsDetail = {
        applicable_noms: applicableNoms,
        risk_level: empresa.nivelRiesgo || null,
        requires_safety_commission: empEst >= 16,
        requires_training_plan: empEst >= 51,
        dc3_required: true,
      };

      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({
        ...external,
        sector_detail: sectorDetail,
        stps_detail: stpsDetail,
        labor_context: laborContext,
      });
      logRequest(req, res);
    } catch (err: any) {
      console.error("[external-api] detail error:", err);
      res.status(500).json({ error: "internal", message: "Error fetching company" });
      logRequest(req, res);
    }
  });

  setInterval(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await db.delete(apiRequestLogs).where(lte(apiRequestLogs.createdAt, thirtyDaysAgo));
    } catch (err) {
      console.error("[external-api] Log cleanup error:", err);
    }
  }, 24 * 60 * 60 * 1000);
}

function getDocsHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Directorio Empresarial Ceduverse — API Documentation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6}
.container{max-width:900px;margin:0 auto;padding:2rem}
h1{font-size:2rem;color:#38bdf8;margin-bottom:.5rem}
h2{font-size:1.4rem;color:#38bdf8;margin-top:2.5rem;margin-bottom:1rem;border-bottom:1px solid #1e293b;padding-bottom:.5rem}
h3{font-size:1.1rem;color:#7dd3fc;margin-top:1.5rem;margin-bottom:.5rem}
p{margin-bottom:1rem;color:#94a3b8}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600;margin-right:.5rem}
.get{background:#065f46;color:#6ee7b7}
code{background:#1e293b;padding:2px 6px;border-radius:4px;font-size:.9rem;color:#f1f5f9}
pre{background:#1e293b;padding:1rem;border-radius:8px;overflow-x:auto;margin-bottom:1rem;font-size:.85rem;color:#e2e8f0}
.endpoint{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:1rem;margin-bottom:1rem}
.endpoint-url{font-family:monospace;color:#7dd3fc}
table{width:100%;border-collapse:collapse;margin-bottom:1rem}
th,td{text-align:left;padding:.5rem;border-bottom:1px solid #1e293b}
th{color:#38bdf8;font-weight:600}
.subtitle{color:#94a3b8;font-size:1rem;margin-bottom:2rem}
.section{margin-bottom:2rem}
a{color:#38bdf8;text-decoration:none}
a:hover{text-decoration:underline}
.error-code{color:#fbbf24}
</style>
</head>
<body>
<div class="container">
<h1>Directorio Empresarial Ceduverse</h1>
<p class="subtitle">API REST para consulta de empresas geolocalizadas del directorio empresarial</p>

<h2>Autenticación</h2>
<p>Todas las peticiones requieren un API key en el header Authorization:</p>
<pre>Authorization: Bearer &lt;tu_api_key&gt;</pre>

<h2>Rate Limits</h2>
<table>
<tr><th>Límite</th><th>Valor por defecto</th></tr>
<tr><td>Por minuto</td><td>120 requests</td></tr>
<tr><td>Por día</td><td>50,000 requests</td></tr>
</table>
<p>Los headers <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>, <code>X-RateLimit-Daily-Limit</code> y <code>X-RateLimit-Daily-Remaining</code> se incluyen en cada respuesta.</p>

<h2>Endpoints</h2>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/health</span></h3>
<p>Verifica estado del servicio y conteo de empresas.</p>
<pre>{
  "status": "ok",
  "service": "Directorio Empresarial Ceduverse",
  "companies_count": 45230,
  "timestamp": "2026-03-31T12:00:00.000Z"
}</pre>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/companies/viewport</span></h3>
<p>Empresas dentro de un bounding box geográfico (para carga de mapa).</p>
<table>
<tr><th>Parámetro</th><th>Tipo</th><th>Descripción</th></tr>
<tr><td>ne_lat*</td><td>float</td><td>Latitud noreste</td></tr>
<tr><td>ne_lng*</td><td>float</td><td>Longitud noreste</td></tr>
<tr><td>sw_lat*</td><td>float</td><td>Latitud suroeste</td></tr>
<tr><td>sw_lng*</td><td>float</td><td>Longitud suroeste</td></tr>
<tr><td>sector</td><td>string</td><td>Filtrar por sector</td></tr>
<tr><td>risk_level</td><td>string</td><td>Filtrar por nivel de riesgo</td></tr>
<tr><td>limit</td><td>int</td><td>Máximo resultados (default: 200, max: 500)</td></tr>
</table>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/companies/search</span></h3>
<p>Buscar empresas por texto con paginación. Se requiere el parámetro q (mínimo 3 caracteres).</p>
<table>
<tr><th>Parámetro</th><th>Tipo</th><th>Descripción</th></tr>
<tr><td>q*</td><td>string</td><td>Texto de búsqueda (requerido, mínimo 3 caracteres)</td></tr>
<tr><td>sector</td><td>string</td><td>Filtrar por sector</td></tr>
<tr><td>municipality</td><td>string</td><td>Filtrar por municipio</td></tr>
<tr><td>state</td><td>string</td><td>Filtrar por estado</td></tr>
<tr><td>risk_level</td><td>string</td><td>Filtrar por nivel de riesgo</td></tr>
<tr><td>page</td><td>int</td><td>Página (default: 1)</td></tr>
<tr><td>limit</td><td>int</td><td>Resultados por página (default: 50, max: 100)</td></tr>
</table>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/companies/nearby</span></h3>
<p>Empresas cercanas a un punto geográfico (Haversine).</p>
<table>
<tr><th>Parámetro</th><th>Tipo</th><th>Descripción</th></tr>
<tr><td>lat*</td><td>float</td><td>Latitud del punto central</td></tr>
<tr><td>lng*</td><td>float</td><td>Longitud del punto central</td></tr>
<tr><td>radius_km</td><td>float</td><td>Radio en km (default: 2, max: 10)</td></tr>
<tr><td>limit</td><td>int</td><td>Máximo resultados (default: 30, max: 100)</td></tr>
<tr><td>sector</td><td>string</td><td>Filtrar por sector</td></tr>
<tr><td>risk_level</td><td>string</td><td>Filtrar por nivel de riesgo</td></tr>
</table>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/companies/stats</span></h3>
<p>Estadísticas agregadas por sector, municipio, tamaño y nivel de riesgo.</p>
<table>
<tr><th>Parámetro</th><th>Tipo</th><th>Descripción</th></tr>
<tr><td>sector</td><td>string</td><td>Filtrar por sector (opcional)</td></tr>
<tr><td>municipality</td><td>string</td><td>Filtrar por municipio (opcional)</td></tr>
</table>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/companies/filters</span></h3>
<p>Catálogos de valores disponibles para filtros (sectores, municipios, niveles de riesgo, rangos de tamaño).</p>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/companies/:id</span></h3>
<p>Detalle de una empresa con contexto laboral estimado.</p>
<p>Los IDs tienen formato <code>ceduverse-&lt;uuid&gt;</code>.</p>
</div>

<h2>Lista 69-B del SAT (Art. 69-B CFF)</h2>
<p>Datos de los 14,000+ contribuyentes publicados por el SAT como EFOS (Empresas que Facturan Operaciones Simuladas). Todas las respuestas de empresas incluyen automáticamente el campo <code>sat_69b</code> con el cruce contra esta lista.</p>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/empresas/69b/consulta</span></h3>
<p>Consulta directa contra la lista 69-B por RFC o nombre.</p>
<table>
<tr><th>Parámetro</th><th>Tipo</th><th>Descripción</th></tr>
<tr><td>rfc</td><td>string</td><td>RFC del contribuyente (búsqueda exacta)</td></tr>
<tr><td>name / q</td><td>string</td><td>Nombre del contribuyente (búsqueda parcial)</td></tr>
</table>
<pre>{
  "results": [{
    "rfc": "AAA080808HL8",
    "name": "ASESORES EN AVALÚOS Y ACTIVOS, S.A. DE C.V.",
    "status": "Sentencia Favorable",
    "publication_date_presuntos": "01/06/2018",
    "publication_date_definitivos": "28/09/2018"
  }],
  "count": 1
}</pre>
</div>

<div class="endpoint">
<h3><span class="badge get">GET</span> <span class="endpoint-url">/api/v1/external/empresas/69b/estadisticas</span></h3>
<p>Estadísticas agregadas de la lista 69-B por estatus (Presunto, Definitivo, Desvirtuado, Sentencia Favorable).</p>
</div>

<h3>Campo sat_69b en respuestas de empresas</h3>
<p>Cada empresa del directorio incluye un campo <code>sat_69b</code> con el cruce automático:</p>
<pre>{
  "sat_69b": {
    "listed": true,
    "rfc": "XYZ123456AB1",
    "status": "Definitivo",
    "name_in_list": "EMPRESA EJEMPLO S.A. DE C.V.",
    "publication_date_presuntos": "15/03/2020",
    "publication_date_definitivos": "01/07/2020"
  }
}
// Si no está en la lista:
{ "sat_69b": { "listed": false } }</pre>

<h2>Códigos de Error</h2>
<table>
<tr><th>Código</th><th>Error</th><th>Descripción</th></tr>
<tr><td class="error-code">400</td><td>bad_request</td><td>Parámetros faltantes o inválidos</td></tr>
<tr><td class="error-code">401</td><td>unauthorized</td><td>API key ausente o inválida</td></tr>
<tr><td class="error-code">403</td><td>forbidden</td><td>Origin no autorizado</td></tr>
<tr><td class="error-code">404</td><td>not_found</td><td>Recurso no encontrado</td></tr>
<tr><td class="error-code">429</td><td>rate_limit_exceeded</td><td>Límite de requests excedido</td></tr>
<tr><td class="error-code">500</td><td>internal</td><td>Error interno del servidor</td></tr>
</table>

<h2>Contacto</h2>
<p>Para soporte técnico o solicitar un API key: <a href="mailto:api@ceduverse.org">api@ceduverse.org</a></p>

</div>
</body>
</html>`;
}
