import type { Express } from "express";
import { requireAuth, requireAdmin, requireAdminOrPartner, requireSuperadmin } from "../auth";

// Mexican state -> commercial region. Module-level so admin.ts can import it.
export const ZONA_POR_ESTADO: Record<string, string> = {
  "Ciudad de México": "Centro", "México": "Centro", "Puebla": "Centro",
  "Tlaxcala": "Centro", "Morelos": "Centro", "Hidalgo": "Centro", "Querétaro": "Centro",
  "Nuevo León": "Norte", "Chihuahua": "Norte", "Coahuila de Zaragoza": "Norte",
  "Tamaulipas": "Norte", "Sonora": "Norte", "Baja California": "Norte",
  "Baja California Sur": "Norte", "Sinaloa": "Norte", "Durango": "Norte",
  "San Luis Potosí": "Norte", "Zacatecas": "Norte", "Nayarit": "Norte",
  "Jalisco": "Bajío", "Guanajuato": "Bajío", "Aguascalientes": "Bajío",
  "Colima": "Bajío", "Michoacán de Ocampo": "Bajío",
  "Veracruz de Ignacio de la Llave": "Sur-Sureste", "Oaxaca": "Sur-Sureste",
  "Chiapas": "Sur-Sureste", "Guerrero": "Sur-Sureste", "Tabasco": "Sur-Sureste",
  "Campeche": "Sur-Sureste", "Yucatán": "Sur-Sureste", "Quintana Roo": "Sur-Sureste",
};

import { storage } from "../storage";
import { db } from "../db";
import multer from "multer";
import {
  companyPayments,
  teams,
  partnerCommissions,
  profiles,
  accounts,
  prospects,
  companyWallets,
  walletTransactions,
  dispersions,
  empresasProspectos,
  contactosProspectos,
  interaccionesProspectos,
  enriquecimiento,
  contactGroups,
  savedFilters,
  users,
  teamUsers,
  referralCodes,
  type EmpresaProspecto,
} from "@shared/schema";
import { eq, and, sql, count, desc, asc, gte, lte, inArray, ilike, type SQL, type AnyColumn } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

export function registerCrmRoutes(app: Express) {
  app.get("/api/crm/payments", requireAdmin, async (req, res, next) => {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const m = month ? Number(month) : now.getMonth() + 1;
      const y = year ? Number(year) : now.getFullYear();
      const payments = await db.select({
        payment: companyPayments,
        teamName: teams.name,
        teamPlan: teams.plan,
      }).from(companyPayments)
        .leftJoin(teams, eq(companyPayments.teamId, teams.id))
        .where(and(eq(companyPayments.periodMonth, m), eq(companyPayments.periodYear, y)))
        .orderBy(desc(companyPayments.createdAt));
      res.json(payments);
    } catch (err) { next(err); }
  });

  app.post("/api/crm/payments", requireAdmin, async (req, res, next) => {
    try {
      const data = req.body;
      const [payment] = await db.insert(companyPayments).values({
        teamId: data.teamId,
        amount: data.amount,
        expectedAmount: data.expectedAmount,
        paymentMethod: data.paymentMethod || "spei",
        reference: data.reference,
        status: data.status || "pending",
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
        confirmedBy: req.supabaseUserId!,
        notes: data.notes,
      }).returning();
      res.json(payment);
    } catch (err) { next(err); }
  });

  app.patch("/api/crm/payments/:id", requireAdmin, async (req, res, next) => {
    try {
      const { status, reference, notes, paidAt } = req.body;
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (reference !== undefined) updates.reference = reference;
      if (notes !== undefined) updates.notes = notes;
      if (paidAt) updates.paidAt = new Date(paidAt);
      if (status === "confirmed") updates.confirmedBy = req.supabaseUserId!;
      const [updated] = await db.update(companyPayments).set(updates).where(eq(companyPayments.id, (req.params.id as string))).returning();
      if (!updated) return res.status(404).json({ message: "Pago no encontrado" });
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/crm/payments/summary", requireAdmin, async (req, res, next) => {
    try {
      const now = new Date();
      const m = Number(req.query.month) || now.getMonth() + 1;
      const y = Number(req.query.year) || now.getFullYear();
      const result = await db.select({
        status: companyPayments.status,
        total: sql<number>`COALESCE(SUM(${companyPayments.amount}), 0)::int`,
        cnt: sql<number>`COUNT(*)::int`,
      }).from(companyPayments)
        .where(and(eq(companyPayments.periodMonth, m), eq(companyPayments.periodYear, y)))
        .groupBy(companyPayments.status);
      res.json({ month: m, year: y, breakdown: result });
    } catch (err) { next(err); }
  });

  app.get("/api/crm/commissions", requireAdmin, async (req, res, next) => {
    try {
      const now = new Date();
      const m = Number(req.query.month) || now.getMonth() + 1;
      const y = Number(req.query.year) || now.getFullYear();
      const commissions = await db.select({
        commission: partnerCommissions,
        partnerName: profiles.fullName,
        partnerEmail: users.email,
        teamName: teams.name,
      }).from(partnerCommissions)
        .leftJoin(profiles, eq(partnerCommissions.partnerId, profiles.id))
        .leftJoin(users, eq(partnerCommissions.partnerId, users.id))
        .leftJoin(teams, eq(partnerCommissions.teamId, teams.id))
        .where(and(eq(partnerCommissions.periodMonth, m), eq(partnerCommissions.periodYear, y)))
        .orderBy(desc(partnerCommissions.createdAt));
      res.json(commissions);
    } catch (err) { next(err); }
  });

  app.post("/api/crm/commissions/generate", requireAdmin, async (req, res, next) => {
    try {
      const { month, year } = req.body;
      const UMA_VALUE = 113.14;
      const PLAN_CONFIG: Record<string, { umas: number; fee: number; commPct: number }> = {
        impulsa: { umas: 6, fee: 30, commPct: 15 },
        transforma: { umas: 10, fee: 30, commPct: 8 },
        lidera: { umas: 20, fee: 30, commPct: 5 },
      };

      const confirmedPayments = await db.select({
        payment: companyPayments,
        teamPlan: teams.plan,
        partnerId: teams.partnerId,
      }).from(companyPayments)
        .leftJoin(teams, eq(companyPayments.teamId, teams.id))
        .where(and(
          eq(companyPayments.periodMonth, month),
          eq(companyPayments.periodYear, year),
          eq(companyPayments.status, "confirmed"),
        ));

      const generated: { partnerId: string; teamId: string; amount: number }[] = [];
      for (const row of confirmedPayments) {
        if (!row.partnerId) continue;
        const planKey = (row.teamPlan || "transforma").toLowerCase();
        const config = PLAN_CONFIG[planKey] || PLAN_CONFIG.transforma;
        const feeAmount = Math.round(row.payment.amount * config.fee / 100);
        const commissionAmount = Math.round(feeAmount * config.commPct / 100);
        if (commissionAmount <= 0) continue;

        const existing = await db.select().from(partnerCommissions).where(and(
          eq(partnerCommissions.partnerId, row.partnerId),
          eq(partnerCommissions.teamId, row.payment.teamId),
          eq(partnerCommissions.periodMonth, month),
          eq(partnerCommissions.periodYear, year),
        )).limit(1);
        if (existing.length > 0) continue;

        await db.insert(partnerCommissions).values({
          partnerId: row.partnerId,
          teamId: row.payment.teamId,
          paymentId: row.payment.id,
          amount: commissionAmount,
          feePercent: config.fee,
          commissionPercent: config.commPct,
          periodMonth: month,
          periodYear: year,
        });
        generated.push({ partnerId: row.partnerId, teamId: row.payment.teamId, amount: commissionAmount });
      }
      res.json({ generated: generated.length, details: generated });
    } catch (err) { next(err); }
  });

  app.patch("/api/crm/commissions/:id", requireAdmin, async (req, res, next) => {
    try {
      const { status } = req.body;
      const updates: Record<string, unknown> = { status };
      if (status === "paid") updates.paidAt = new Date();
      const [updated] = await db.update(partnerCommissions).set(updates).where(eq(partnerCommissions.id, (req.params.id as string))).returning();
      if (!updated) return res.status(404).json({ message: "Comisión no encontrada" });
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/crm/prospects", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId)).limit(1);
      const role = acct[0]?.userRole;
      const isAdminOrPartner = role === "admin" || role === "superadmin" || role === "socio_comercial" || role === "partner" || role === "director";
      if (!isAdminOrPartner) return res.status(403).json({ message: "No autorizado" });
      const isAdmin = role === "admin" || role === "superadmin";
      const where = isAdmin ? undefined : eq(prospects.partnerId, userId);
      const list = await db.select().from(prospects).where(where).orderBy(desc(prospects.createdAt));
      res.json(list);
    } catch (err) { next(err); }
  });

  app.post("/api/crm/prospects", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId)).limit(1);
      const role = acct[0]?.userRole;
      if (role !== "admin" && role !== "superadmin" && role !== "socio_comercial" && role !== "partner" && role !== "director") {
        return res.status(403).json({ message: "No autorizado" });
      }
      const { companyName, contactName, contactEmail, contactPhone, collaborators, plan, stage, notes, nextFollowUp } = req.body;
      if (!companyName || typeof companyName !== "string") return res.status(400).json({ message: "Nombre de empresa requerido" });
      const validStages = ["contact", "demo", "proposal", "negotiation", "closed", "active", "lost"];
      const validPlans = ["impulsa", "transforma", "lidera"];
      const [prospect] = await db.insert(prospects).values({
        partnerId: userId,
        companyName,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        collaborators: collaborators ? Number(collaborators) : null,
        plan: validPlans.includes(plan) ? plan : "transforma",
        stage: validStages.includes(stage) ? stage : "contact",
        notes: notes || null,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      }).returning();
      res.json(prospect);
    } catch (err) { next(err); }
  });

  app.patch("/api/crm/prospects/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId)).limit(1);
      const role = acct[0]?.userRole;
      const isAdmin = role === "admin" || role === "superadmin";
      const existing = await db.select().from(prospects).where(eq(prospects.id, (req.params.id as string))).limit(1);
      if (!existing[0]) return res.status(404).json({ message: "Prospecto no encontrado" });
      if (!isAdmin && existing[0].partnerId !== userId) return res.status(403).json({ message: "No autorizado" });

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      const allowed = ["companyName", "contactName", "contactEmail", "contactPhone", "collaborators", "plan", "stage", "notes"];
      for (const k of allowed) {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
      if (req.body.nextFollowUp) updates.nextFollowUp = new Date(req.body.nextFollowUp);
      const [updated] = await db.update(prospects).set(updates).where(eq(prospects.id, (req.params.id as string))).returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/crm/prospects/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId)).limit(1);
      const role = acct[0]?.userRole;
      const isAdmin = role === "admin" || role === "superadmin";
      const existing = await db.select().from(prospects).where(eq(prospects.id, (req.params.id as string))).limit(1);
      if (!existing[0]) return res.status(404).json({ message: "Prospecto no encontrado" });
      if (!isAdmin && existing[0].partnerId !== userId) return res.status(403).json({ message: "No autorizado" });
      await db.delete(prospects).where(eq(prospects.id, (req.params.id as string)));
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.get("/api/crm/wallets", requireAdmin, async (req, res, next) => {
    try {
      const wallets = await db.select({
        wallet: companyWallets,
        teamName: teams.name,
      }).from(companyWallets)
        .leftJoin(teams, eq(companyWallets.teamId, teams.id))
        .orderBy(asc(teams.name));
      res.json(wallets);
    } catch (err) { next(err); }
  });

  app.get("/api/crm/wallets/:teamId/transactions", requireAdmin, async (req, res, next) => {
    try {
      const teamWallets = await db.select().from(companyWallets).where(eq(companyWallets.teamId, (req.params.teamId as string)));
      const walletIds = teamWallets.map(w => w.id);
      if (walletIds.length === 0) return res.json([]);
      const txns = await db.select().from(walletTransactions)
        .where(sql`${walletTransactions.walletId} = ANY(${walletIds})`)
        .orderBy(desc(walletTransactions.createdAt));
      res.json(txns);
    } catch (err) { next(err); }
  });

  app.get("/api/crm/dispersions", requireAdmin, async (req, res, next) => {
    try {
      const list = await db.select().from(dispersions).orderBy(desc(dispersions.createdAt));
      res.json(list);
    } catch (err) { next(err); }
  });

  app.post("/api/crm/dispersions", requireAdmin, async (req, res, next) => {
    try {
      const [d] = await db.insert(dispersions).values({
        periodMonth: req.body.periodMonth,
        periodYear: req.body.periodYear,
        totalAmount: req.body.totalAmount || 0,
        companiesIncluded: req.body.companiesIncluded || 0,
        details: req.body.details,
        status: "draft",
        createdBy: req.supabaseUserId!,
      }).returning();
      res.json(d);
    } catch (err) { next(err); }
  });

  app.patch("/api/crm/dispersions/:id", requireAdmin, async (req, res, next) => {
    try {
      const updates: Record<string, unknown> = {};
      if (req.body.status) {
        updates.status = req.body.status;
        if (req.body.status === "applied") updates.appliedAt = new Date();
      }
      if (req.body.details) updates.details = req.body.details;
      const [updated] = await db.update(dispersions).set(updates).where(eq(dispersions.id, (req.params.id as string))).returning();
      if (!updated) return res.status(404).json({ message: "Dispersión no encontrada" });
      res.json(updated);
    } catch (err) { next(err); }
  });
  const STPS_HIGH_RISK_SCIAN = [
    "31", "32", "33", "21", "23", "48", "49", "11",
  ];

  const NOM_MAP: Record<string, string[]> = {
    "31": ["NOM-035", "NOM-006", "NOM-004"],
    "32": ["NOM-035", "NOM-010", "NOM-005"],
    "33": ["NOM-035", "NOM-004", "NOM-011"],
    "21": ["NOM-035", "NOM-023", "NOM-032"],
    "23": ["NOM-035", "NOM-009", "NOM-002"],
    "48": ["NOM-035", "NOM-087", "NOM-006"],
    "49": ["NOM-035", "NOM-006"],
    "11": ["NOM-035", "NOM-003", "NOM-007"],
    "43": ["NOM-035", "NOM-030"],
    "46": ["NOM-035", "NOM-001"],
    "51": ["NOM-035", "NOM-036"],
    "52": ["NOM-035"],
    "53": ["NOM-035"],
    "54": ["NOM-035", "NOM-036"],
    "56": ["NOM-035"],
    "61": ["NOM-035"],
    "62": ["NOM-035", "NOM-010"],
    "71": ["NOM-035"],
    "72": ["NOM-035"],
    "81": ["NOM-035"],
  };

  function calculateLeadScore(row: {
    empleadosMin?: number;
    empleadosMax?: number;
    codigoScian?: string;
    sitioWeb?: string;
    correoElectronico?: string;
    estratoPersonal?: string;
  }) {
    let sizeScore = 10;
    const avg = ((row.empleadosMin || 0) + (row.empleadosMax || 0)) / 2;
    if (avg >= 251) sizeScore = 25;
    else if (avg >= 101) sizeScore = 22;
    else if (avg >= 51) sizeScore = 18;
    else if (avg >= 11) sizeScore = 14;

    let stpsRisk = 8;
    const scian2 = (row.codigoScian || "").substring(0, 2);
    if (STPS_HIGH_RISK_SCIAN.includes(scian2)) stpsRisk = 25;
    else if (["43", "46", "62"].includes(scian2)) stpsRisk = 18;
    else if (["51", "52", "53", "54"].includes(scian2)) stpsRisk = 12;

    let digitalPresence = 0;
    if (row.sitioWeb && row.sitioWeb.trim().length > 0) digitalPresence += 8;
    if (row.correoElectronico && row.correoElectronico.trim().length > 0) digitalPresence += 7;

    let economicPotential = 0;
    if (avg >= 251) economicPotential = 15;
    else if (avg >= 101) economicPotential = 12;
    else if (avg >= 51) economicPotential = 10;
    else if (avg >= 11) economicPotential = 7;
    else if (avg >= 1) economicPotential = 3;

    return {
      total: Math.min(80, sizeScore + stpsRisk + digitalPresence + economicPotential),
      desglose: { tamaño: sizeScore, riesgoSTPS: stpsRisk, presenciaDigital: digitalPresence, potencialEconomico: economicPotential },
    };
  }

  function parseEmployeeRange(estrato: string): { min: number; max: number } {
    if (!estrato) return { min: 0, max: 0 };
    const s = estrato.toLowerCase().trim();
    if (s.includes("251") && s.includes("más")) return { min: 251, max: 500 };
    const match = s.match(/(\d+)\s*a\s*(\d+)/);
    if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
    if (s.includes("0 a 5") || s === "0 a 5 personas") return { min: 0, max: 5 };
    if (s.includes("6 a 10")) return { min: 6, max: 10 };
    if (s.includes("11 a 30")) return { min: 11, max: 30 };
    if (s.includes("31 a 50")) return { min: 31, max: 50 };
    if (s.includes("51 a 100")) return { min: 51, max: 100 };
    if (s.includes("101 a 250")) return { min: 101, max: 250 };
    return { min: 0, max: 0 };
  }

  function normalizeName(name: string): string {
    return name.replace(/\s+/g, " ").trim()
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\bS\.?a\.?\s*de\s*c\.?v\.?/gi, "S.A. de C.V.")
      .replace(/\bS\.?c\.?\s*/gi, "S.C. ")
      .replace(/\bS\.?p\.?r\.?\s*de\s*r\.?l\.?/gi, "S.P.R. de R.L.");
  }

  const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

  app.post("/api/denue/import", requireAdminOrPartner, csvUpload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Se requiere un archivo CSV" });

      const filterMunicipios = req.body.municipios ? String(req.body.municipios).split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [];
      const filterEmpleadosMin = req.body.empleadosMin ? parseInt(req.body.empleadosMin) : 0;
      const filterEmpleadosMax = req.body.empleadosMax ? parseInt(req.body.empleadosMax) : Infinity;
      const filterScianCodes = req.body.scianCodes ? String(req.body.scianCodes).split(",").map(s => s.trim()).filter(Boolean) : [];

      let csvText = req.file.buffer.toString("utf-8");
      if (csvText.includes("�") || csvText.includes("\ufffd")) {
        const iconv = require("iconv-lite");
        csvText = iconv.decode(req.file.buffer, "latin1");
      }
      const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return res.status(400).json({ message: "CSV vacío o sin datos" });

      const headerLine = lines[0];
      const sep = headerLine.includes("\t") ? "\t" : ",";
      const headers = headerLine.split(sep).map(h => h.replace(/"/g, "").trim().toLowerCase());

      const fieldMap: Record<string, string[]> = {
        denueId: ["id", "clee", "id_denue", "denue_id"],
        nombreComercial: ["nom_estab", "nombre_comercial", "nombre", "establecimiento", "nombre_del_establecimiento"],
        razonSocial: ["raz_social", "razon_social"],
        actividadEconomica: ["nombre_act", "actividad_economica", "actividad", "nombre_de_la_actividad"],
        codigoScian: ["codigo_act", "codigo_scian", "codigo", "codigo_de_la_clase_de_la_actividad"],
        tipoEstablecimiento: ["tipo_estab", "per_ocu", "tipo_establecimiento"],
        estratoPersonal: ["estrato", "per_ocu", "estrato_personal", "estrato_de_personal_ocupado", "personal_ocupado"],
        telefono: ["telefono", "tel", "numero_de_telefono"],
        correoElectronico: ["correoelec", "correo_e", "correo", "email", "correo_electronico"],
        sitioWeb: ["www", "sitio_web", "pagina_web", "sitio_internet"],
        tipoVialidad: ["tipo_vial", "tipo_v_e_1", "tipo_vialidad", "tipo_de_vialidad"],
        calle: ["nom_vial", "nom_v_e_1", "calle", "nombre_de_la_vialidad"],
        numExterior: ["numero_ext", "num_exterior", "numero_exterior"],
        numInterior: ["numero_int", "letra_ext", "num_interior"],
        colonia: ["nomb_asent", "e_tipo_asent", "colonia", "nombre_del_asentamiento"],
        codigoPostal: ["cod_postal", "codigo_postal"],
        municipio: ["municipio", "nom_mun", "nombre_del_municipio"],
        estado: ["entidad_federativa", "entidad", "estado", "nombre_de_la_entidad_federativa"],
        latitud: ["latitud", "lat", "y"],
        longitud: ["longitud", "lng", "lon", "x"],
        fechaAlta: ["fecha_alta", "fecha_incorporacion_al_denue"],
      };

      function findCol(field: string): number {
        const aliases = fieldMap[field] || [field];
        for (const alias of aliases) {
          const idx = headers.indexOf(alias);
          if (idx >= 0) return idx;
        }
        return -1;
      }

      function parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') { inQuotes = !inQuotes; continue; }
          if (c === sep && !inQuotes) { result.push(current.trim()); current = ""; continue; }
          current += c;
        }
        result.push(current.trim());
        return result;
      }

      const batchId = `import-${Date.now()}`;
      let imported = 0;
      let skipped = 0;
      let duplicates = 0;

      const existingDenueIds = new Set<string>();
      const existing = await db.select({ denueId: empresasProspectos.denueId }).from(empresasProspectos);
      existing.forEach(e => { if (e.denueId) existingDenueIds.add(e.denueId); });

      type DenueInsertRow = typeof empresasProspectos.$inferInsert;
      const batchInserts: DenueInsertRow[] = [];
      let filtered = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 3) { skipped++; continue; }

        const getVal = (field: string) => {
          const idx = findCol(field);
          return idx >= 0 && idx < cols.length ? cols[idx] : "";
        };

        const denueId = getVal("denueId");
        if (denueId && existingDenueIds.has(denueId)) { duplicates++; continue; }

        const nombreComercial = getVal("nombreComercial");
        if (!nombreComercial || nombreComercial.trim().length === 0) { skipped++; continue; }

        const estratoStr = getVal("estratoPersonal");
        const { min: empleadosMin, max: empleadosMax } = parseEmployeeRange(estratoStr);
        const avgEmployees = (empleadosMin + empleadosMax) / 2;

        const municipioVal = getVal("municipio");
        if (filterMunicipios.length > 0 && (!municipioVal || !filterMunicipios.includes(municipioVal.toLowerCase()))) { filtered++; continue; }

        if (filterEmpleadosMin > 0 || filterEmpleadosMax < Infinity) {
          if (avgEmployees < filterEmpleadosMin || avgEmployees > filterEmpleadosMax) { filtered++; continue; }
        }

        const codigoScian = getVal("codigoScian");
        if (filterScianCodes.length > 0 && (!codigoScian || !filterScianCodes.some(f => codigoScian.startsWith(f)))) { filtered++; continue; }
        const sitioWeb = getVal("sitioWeb");
        const correoElectronico = getVal("correoElectronico");

        const score = calculateLeadScore({
          empleadosMin,
          empleadosMax,
          codigoScian,
          sitioWeb,
          correoElectronico,
          estratoPersonal: estratoStr,
        });

        const scian2 = (codigoScian || "").substring(0, 2);
        const noms = NOM_MAP[scian2] || ["NOM-035"];

        const lat = parseFloat(getVal("latitud"));
        const lon = parseFloat(getVal("longitud"));

        const record = {
          denueId: denueId || null,
          nombreComercial: normalizeName(nombreComercial),
          razonSocial: getVal("razonSocial") ? normalizeName(getVal("razonSocial")) : null,
          actividadEconomica: getVal("actividadEconomica") || null,
          codigoScian: codigoScian || null,
          tipoEstablecimiento: getVal("tipoEstablecimiento") || null,
          estratoPersonal: estratoStr || null,
          empleadosMin,
          empleadosMax,
          telefono: getVal("telefono") || null,
          correoElectronico: correoElectronico || null,
          sitioWeb: sitioWeb || null,
          tipoVialidad: getVal("tipoVialidad") || null,
          calle: getVal("calle") || null,
          numExterior: getVal("numExterior") || null,
          numInterior: getVal("numInterior") || null,
          colonia: getVal("colonia") || null,
          codigoPostal: getVal("codigoPostal") || null,
          municipio: getVal("municipio") || null,
          estado: getVal("estado") || null,
          latitud: isNaN(lat) ? null : lat,
          longitud: isNaN(lon) ? null : lon,
          leadScore: score.total,
          scoreDesglose: score.desglose,
          nomsAplicables: noms,
          importBatchId: batchId,
          fechaAlta: null,
        };

        batchInserts.push(record);
        if (denueId) existingDenueIds.add(denueId);

        if (batchInserts.length >= 200) {
          await db.insert(empresasProspectos).values(batchInserts);
          imported += batchInserts.length;
          batchInserts.length = 0;
        }
      }

      if (batchInserts.length > 0) {
        await db.insert(empresasProspectos).values(batchInserts);
        imported += batchInserts.length;
      }

      prospectStatsCacheMap.clear();
      mapCache.clear();
      res.json({
        imported,
        skipped,
        duplicates,
        filtered,
        batchId,
        total: imported + skipped + duplicates + filtered,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/denue/prospectos", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { municipio, estado, zona, scian, scoreMin, scoreMax, stage, partnerId, search, enrichment, page = "1", limit = "50", sortField = "leadScore", sortDir = "desc" } = req.query as Record<string, string>;

      const validStages = ["nuevo", "contactado", "demo", "propuesta", "negociacion", "cliente"] as const;
      const conditions: SQL[] = [];

      const efos = (req.query as Record<string, string>).efos;
      const isEfosOnly = efos === "only";

      if (zona && ZONA_POR_ESTADO) {
        const estadosDeZona = Object.entries(ZONA_POR_ESTADO).filter(([, z]) => z === zona).map(([e]) => e);
        if (estadosDeZona.length > 0) {
          if (isEfosOnly) {
            conditions.push(sql`(${inArray(empresasProspectos.estado, estadosDeZona)} OR ${empresasProspectos.estado} IS NULL)`);
          } else {
            conditions.push(inArray(empresasProspectos.estado, estadosDeZona));
          }
        }
      }
      if (estado) {
        if (isEfosOnly) {
          conditions.push(sql`(${eq(empresasProspectos.estado, estado)} OR ${empresasProspectos.estado} IS NULL)`);
        } else {
          conditions.push(eq(empresasProspectos.estado, estado));
        }
      }
      if (municipio) {
        if (isEfosOnly) {
          conditions.push(sql`(${eq(empresasProspectos.municipio, municipio)} OR ${empresasProspectos.municipio} IS NULL)`);
        } else {
          conditions.push(eq(empresasProspectos.municipio, municipio));
        }
      }

      if (enrichment === "enriched") {
        conditions.push(sql`${empresasProspectos.planRecomendado} IS NOT NULL`);
      } else if (enrichment === "pending") {
        conditions.push(sql`${empresasProspectos.planRecomendado} IS NULL`);
      }

      if (scian) conditions.push(eq(empresasProspectos.codigoScian, scian));
      if (scoreMin) conditions.push(gte(empresasProspectos.leadScore, parseInt(scoreMin)));
      if (scoreMax) conditions.push(lte(empresasProspectos.leadScore, parseInt(scoreMax)));
      if (stage && validStages.includes(stage as typeof validStages[number])) {
        conditions.push(sql`${empresasProspectos.stage} = ${stage}`);
      }
      if (partnerId) conditions.push(eq(empresasProspectos.partnerId, partnerId));
      if (search) conditions.push(ilike(empresasProspectos.nombreComercial, `%${search}%`));

      if (isEfosOnly) {
        conditions.push(sql`is_efos = true`);
      } else if (efos === "exclude") {
        conditions.push(sql`(is_efos IS NULL OR is_efos = false)`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const pageNum = Math.max(1, parseInt(page));
      const lim = Math.min(200, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * lim;

      let total = 0;
      if (conditions.length === 0) {
        try {
          const mvResult = await db.execute(sql`SELECT total FROM mv_prospectos_global_stats LIMIT 1`);
          const mvRows = (mvResult as unknown as { rows: { total: string }[] }).rows;
          total = mvRows?.length > 0 ? Number(mvRows[0].total) : 0;
        } catch {
          const [totalRow] = await db.select({ count: count() }).from(empresasProspectos);
          total = totalRow?.count ?? 0;
        }
      } else {
        const [totalRow] = await db.select({ count: count() }).from(empresasProspectos).where(whereClause);
        total = totalRow?.count ?? 0;
      }

      const sortColumns: Record<string, AnyColumn> = {
        leadScore: empresasProspectos.leadScore,
        nombreComercial: empresasProspectos.nombreComercial,
        stage: empresasProspectos.stage,
        createdAt: empresasProspectos.createdAt,
        municipio: empresasProspectos.municipio,
        estado: empresasProspectos.estado,
        grupoSector: empresasProspectos.grupoSector,
        actividadEconomica: empresasProspectos.actividadEconomica,
        estratoPersonal: empresasProspectos.estratoPersonal,
        empleadosEstimados: empresasProspectos.empleadosEstimados,
        potencialAportacionMensual: empresasProspectos.potencialAportacionMensual,
        prioridad: empresasProspectos.prioridad,
        zonaComercial: empresasProspectos.zonaComercial,
        nivelRiesgo: empresasProspectos.nivelRiesgo,
        planRecomendado: empresasProspectos.planRecomendado,
        codigoScian: empresasProspectos.codigoScian,
      };
      const sortCol = sortColumns[sortField] || empresasProspectos.leadScore;
      const orderFn = sortDir === "asc" ? asc : desc;

      const rows = await db.select().from(empresasProspectos).where(whereClause).orderBy(orderFn(sortCol)).limit(lim).offset(offset);

      const rowIds = rows.map(r => r.id);
      let efosMatchMap = new Map<string, { rfc: string; situacion: string; nombre: string }>();
      if (rowIds.length > 0) {
        const efosMatches = await db.execute(sql`SELECT prospecto_id::text, efos_rfc, efos_situacion, efos_nombre FROM efos_prospectos_match WHERE prospecto_id IN (${sql.join(rowIds.map(id => sql`${id}::uuid`), sql`, `)})`);
        const efosRows = (efosMatches as unknown as { rows: { prospecto_id: string; efos_rfc: string; efos_situacion: string; efos_nombre: string }[] }).rows || [];
        for (const em of efosRows) {
          efosMatchMap.set(em.prospecto_id, { rfc: em.efos_rfc, situacion: em.efos_situacion, nombre: em.efos_nombre });
        }
      }
      const enriched = rows.map(r => ({ ...r, efos69b: efosMatchMap.get(r.id) || null }));

      res.json({ data: enriched, total, page: pageNum, limit: lim, totalPages: Math.ceil(total / lim) });
    } catch (err) { next(err); }
  });

  type SatOficinaRow = { estado: string; municipio: string | null; latitud: number; longitud: number };

  const mapCache = new Map<string, { data: unknown; ts: number }>();
  const MAP_CACHE_TTL = 3 * 60 * 1000;
  const MAP_CACHE_MAX = 20;

  app.get("/api/denue/prospectos/map", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { municipio, estado, zona, scian, scoreMin, scoreMax, stage, partnerId, search, enrichment, efos } = req.query as Record<string, string>;

      const mapCacheKey = JSON.stringify({ municipio, estado, zona, scian, scoreMin, scoreMax, stage, partnerId, search, enrichment, efos });
      const cachedMap = mapCache.get(mapCacheKey);
      if (cachedMap && Date.now() - cachedMap.ts < MAP_CACHE_TTL) {
        return res.json(cachedMap.data);
      }

      const validStages = ["nuevo", "contactado", "demo", "propuesta", "negociacion", "cliente"] as const;
      const conditions: SQL[] = [];
      const isEfosOnly = efos === "only";

      if (zona && ZONA_POR_ESTADO) {
        const estadosDeZona = Object.entries(ZONA_POR_ESTADO).filter(([, z]) => z === zona).map(([e]) => e);
        if (estadosDeZona.length > 0) {
          if (isEfosOnly) {
            conditions.push(sql`(${inArray(empresasProspectos.estado, estadosDeZona)} OR ${empresasProspectos.estado} IS NULL)`);
          } else {
            conditions.push(inArray(empresasProspectos.estado, estadosDeZona));
          }
        }
      }
      if (estado) {
        if (isEfosOnly) {
          conditions.push(sql`(${eq(empresasProspectos.estado, estado)} OR ${empresasProspectos.estado} IS NULL)`);
        } else {
          conditions.push(eq(empresasProspectos.estado, estado));
        }
      }
      if (municipio) {
        if (isEfosOnly) {
          conditions.push(sql`(${eq(empresasProspectos.municipio, municipio)} OR ${empresasProspectos.municipio} IS NULL)`);
        } else {
          conditions.push(eq(empresasProspectos.municipio, municipio));
        }
      }

      if (enrichment === "enriched") {
        conditions.push(sql`${empresasProspectos.planRecomendado} IS NOT NULL`);
      } else if (enrichment === "pending") {
        conditions.push(sql`${empresasProspectos.planRecomendado} IS NULL`);
      }

      const geoConditions = [...conditions];
      geoConditions.push(sql`${empresasProspectos.latitud} IS NOT NULL AND ${empresasProspectos.longitud} IS NOT NULL`);

      if (scian) { conditions.push(eq(empresasProspectos.codigoScian, scian)); geoConditions.push(eq(empresasProspectos.codigoScian, scian)); }
      if (scoreMin) {
        conditions.push(gte(empresasProspectos.leadScore, parseInt(scoreMin)));
        geoConditions.push(gte(empresasProspectos.leadScore, parseInt(scoreMin)));
      } else if (!estado && !municipio && !zona && !search && !partnerId && !stage && !isEfosOnly) {
        conditions.push(gte(empresasProspectos.leadScore, 40));
        geoConditions.push(gte(empresasProspectos.leadScore, 40));
      }
      if (scoreMax) { conditions.push(lte(empresasProspectos.leadScore, parseInt(scoreMax))); geoConditions.push(lte(empresasProspectos.leadScore, parseInt(scoreMax))); }
      if (stage && validStages.includes(stage as typeof validStages[number])) {
        conditions.push(sql`${empresasProspectos.stage} = ${stage}`);
        geoConditions.push(sql`${empresasProspectos.stage} = ${stage}`);
      }
      if (partnerId) { conditions.push(eq(empresasProspectos.partnerId, partnerId)); geoConditions.push(eq(empresasProspectos.partnerId, partnerId)); }
      if (search) { conditions.push(ilike(empresasProspectos.nombreComercial, `%${search}%`)); geoConditions.push(ilike(empresasProspectos.nombreComercial, `%${search}%`)); }

      if (isEfosOnly) {
        conditions.push(sql`is_efos = true`);
        geoConditions.push(sql`is_efos = true`);
      }

      const geoWhereClause = geoConditions.length > 0 ? and(...geoConditions) : undefined;

      const rows = await db.select({
        id: empresasProspectos.id,
        nombreComercial: empresasProspectos.nombreComercial,
        razonSocial: empresasProspectos.razonSocial,
        latitud: empresasProspectos.latitud,
        longitud: empresasProspectos.longitud,
        leadScore: empresasProspectos.leadScore,
        stage: empresasProspectos.stage,
        municipio: empresasProspectos.municipio,
        estado: empresasProspectos.estado,
        actividadEconomica: empresasProspectos.actividadEconomica,
        empleadosEstimados: empresasProspectos.empleadosEstimados,
        calle: empresasProspectos.calle,
        colonia: empresasProspectos.colonia,
        direccionCompleta: empresasProspectos.direccionCompleta,
      }).from(empresasProspectos).where(geoWhereClause).orderBy(desc(empresasProspectos.leadScore)).limit(5001);

      let fallbackRows: typeof rows = [];
      if (efos === "only") {
        const noGeoConditions = [...conditions];
        noGeoConditions.push(sql`(${empresasProspectos.latitud} IS NULL OR ${empresasProspectos.longitud} IS NULL)`);
        const noGeoWhere = noGeoConditions.length > 0 ? and(...noGeoConditions) : undefined;
        fallbackRows = await db.select({
          id: empresasProspectos.id,
          nombreComercial: empresasProspectos.nombreComercial,
          razonSocial: empresasProspectos.razonSocial,
          latitud: empresasProspectos.latitud,
          longitud: empresasProspectos.longitud,
          leadScore: empresasProspectos.leadScore,
          stage: empresasProspectos.stage,
          municipio: empresasProspectos.municipio,
          estado: empresasProspectos.estado,
          actividadEconomica: empresasProspectos.actividadEconomica,
          empleadosEstimados: empresasProspectos.empleadosEstimados,
          calle: empresasProspectos.calle,
          colonia: empresasProspectos.colonia,
          direccionCompleta: empresasProspectos.direccionCompleta,
        }).from(empresasProspectos).where(noGeoWhere).orderBy(desc(empresasProspectos.leadScore)).limit(Math.max(5000, 15001 - rows.length));
      }

      let satOficinas: SatOficinaRow[] = [];
      if (fallbackRows.length > 0) {
        const oficResult = await db.execute(sql`SELECT estado, municipio, latitud, longitud FROM sat_oficinas`);
        satOficinas = (oficResult as unknown as { rows: SatOficinaRow[] }).rows || [];
      }

      const allRows = [...rows];
      for (const fr of fallbackRows) {
        let bestOficina = satOficinas.find(o => o.municipio && fr.municipio && o.municipio.toLowerCase() === fr.municipio.toLowerCase() && o.estado === fr.estado);
        if (!bestOficina && fr.estado) bestOficina = satOficinas.find(o => o.estado === fr.estado);
        if (bestOficina) {
          const jitterLat = (Math.random() - 0.5) * 0.3;
          const jitterLng = (Math.random() - 0.5) * 0.3;
          allRows.push({ ...fr, latitud: bestOficina.latitud + jitterLat, longitud: bestOficina.longitud + jitterLng });
        }
      }

      const hasMore = allRows.length > 5000;
      const sliced = hasMore ? allRows.slice(0, 5000) : allRows;
      const fallbackIds = new Set(fallbackRows.map(r => r.id));

      const mapEfosMatchMap = new Map<string, { rfc: string; situacion: string; nombre: string }>();
      const slicedIds = sliced.map(r => r.id);
      if (slicedIds.length > 0) {
        const efosResult = await db.execute(sql`SELECT prospecto_id::text, efos_rfc, efos_situacion, efos_nombre FROM efos_prospectos_match WHERE prospecto_id IN (${sql.join(slicedIds.map(id => sql`${id}::uuid`), sql`, `)})`);
        const efosRows = (efosResult as unknown as { rows: { prospecto_id: string; efos_rfc: string; efos_situacion: string; efos_nombre: string }[] }).rows || [];
        for (const em of efosRows) {
          mapEfosMatchMap.set(em.prospecto_id, { rfc: em.efos_rfc, situacion: em.efos_situacion, nombre: em.efos_nombre });
        }
      }
      const data = sliced.map(r => ({
        id: r.id,
        nombreComercial: r.nombreComercial,
        razonSocial: r.razonSocial,
        latitud: r.latitud,
        longitud: r.longitud,
        leadScore: r.leadScore,
        stage: r.stage,
        municipio: r.municipio,
        estado: r.estado,
        actividadEconomica: r.actividadEconomica,
        empleadosEstimados: r.empleadosEstimados,
        calle: r.calle,
        colonia: r.colonia,
        direccionCompleta: r.direccionCompleta,
        efos69b: mapEfosMatchMap.get(r.id) || null,
        isFallbackLocation: fallbackIds.has(r.id),
      }));

      const efosCount = data.filter(d => d.efos69b).length;
      const result = { data, total: data.length, hasMore, efosCount };
      if (mapCache.size >= MAP_CACHE_MAX) {
        const oldest = mapCache.keys().next().value;
        if (oldest) mapCache.delete(oldest);
      }
      mapCache.set(mapCacheKey, { data: result, ts: Date.now() });
      res.json(result);
    } catch (err) { next(err); }
  });

  const prospectStatsCacheMap = new Map<string, { data: any; ts: number }>();
  const STATS_CACHE_TTL = 5 * 60 * 1000;

  app.get("/api/denue/prospectos/stats", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { municipio, estado, zona, scian, scoreMin, stage, partnerId, search, enrichment, efos } = req.query as Record<string, string>;
      const hasFilters = !!(municipio || estado || zona || scian || scoreMin || stage || partnerId || search || enrichment || efos);
      const cacheKey = hasFilters ? JSON.stringify({ municipio, estado, zona, scian, scoreMin, stage, partnerId, search, enrichment, efos }) : "__global__";
      const cached = prospectStatsCacheMap.get(cacheKey);
      if (cached && Date.now() - cached.ts < STATS_CACHE_TTL) {
        return res.json(cached.data);
      }

      if (!hasFilters) {
        try {
          const globalResult = await db.execute(sql`SELECT * FROM mv_prospectos_global_stats LIMIT 1`);
          const gRows = (globalResult as unknown as { rows: any[] }).rows;
          if (gRows && gRows.length > 0) {
            const g = gRows[0];
            const topMunicipios = await db.select({
              municipio: empresasProspectos.municipio,
              count: count(),
            }).from(empresasProspectos)
              .where(sql`${empresasProspectos.municipio} IS NOT NULL AND ${empresasProspectos.planRecomendado} IS NOT NULL`)
              .groupBy(empresasProspectos.municipio)
              .orderBy(desc(count()))
              .limit(10);

            const globalPayload = {
              total: Number(g.total) || 0,
              avgEmpleados: Number(g.avg_empleados) || 0,
              conCorreo: Number(g.con_correo) || 0,
              conTelefono: Number(g.con_telefono) || 0,
              valorMercado: Number(g.valor_mercado) || 0,
              trabajados: Number(g.trabajados) || 0,
              enriquecidas: Number(g.enriquecidas) || 0,
              stages: {
                nuevo: Number(g.stage_nuevo) || 0,
                contactado: Number(g.stage_contactado) || 0,
                demo: Number(g.stage_demo) || 0,
                propuesta: Number(g.stage_propuesta) || 0,
                negociacion: Number(g.stage_negociacion) || 0,
                cliente: Number(g.stage_cliente) || 0,
              },
              avgScore: Number(g.avg_score) || 0,
              topMunicipios: topMunicipios.map((m) => ({ municipio: m.municipio, count: Number(m.count) })),
              prioridades: {
                alta: Number(g.prio_alta) || 0,
                media: Number(g.prio_media) || 0,
                baja: Number(g.prio_baja) || 0,
              },
            };
            prospectStatsCacheMap.set(cacheKey, { data: globalPayload, ts: Date.now() });
            return res.json(globalPayload);
          }
        } catch (mvErr: any) {
          console.log("[stats] MV fallback:", mvErr.message);
        }
      }

      const conditions: SQL[] = [];
      const isEfosOnly = efos === "only";

      if (zona && ZONA_POR_ESTADO) {
        const estadosDeZona = Object.entries(ZONA_POR_ESTADO).filter(([, z]) => z === zona).map(([e]) => e);
        if (estadosDeZona.length > 0) {
          if (isEfosOnly) {
            conditions.push(sql`(${inArray(empresasProspectos.estado, estadosDeZona)} OR ${empresasProspectos.estado} IS NULL)`);
          } else {
            conditions.push(inArray(empresasProspectos.estado, estadosDeZona));
          }
        }
      }
      if (estado) {
        if (isEfosOnly) {
          conditions.push(sql`(${eq(empresasProspectos.estado, estado)} OR ${empresasProspectos.estado} IS NULL)`);
        } else {
          conditions.push(eq(empresasProspectos.estado, estado));
        }
      }
      if (municipio) {
        if (isEfosOnly) {
          conditions.push(sql`(${eq(empresasProspectos.municipio, municipio)} OR ${empresasProspectos.municipio} IS NULL)`);
        } else {
          conditions.push(eq(empresasProspectos.municipio, municipio));
        }
      }
      if (enrichment === "enriched") {
        conditions.push(sql`${empresasProspectos.planRecomendado} IS NOT NULL`);
      } else if (enrichment === "pending") {
        conditions.push(sql`${empresasProspectos.planRecomendado} IS NULL`);
      }
      if (scian) conditions.push(eq(empresasProspectos.codigoScian, scian));
      if (scoreMin) conditions.push(gte(empresasProspectos.leadScore, parseInt(scoreMin)));
      if (stage) conditions.push(sql`${empresasProspectos.stage} = ${stage}`);
      if (partnerId) conditions.push(eq(empresasProspectos.partnerId, partnerId));
      if (search) conditions.push(ilike(empresasProspectos.nombreComercial, `%${search}%`));
      if (isEfosOnly) {
        conditions.push(sql`is_efos = true`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db.select({
        total: count(),
        avgScore: sql<number>`ROUND(AVG(${empresasProspectos.leadScore}))`,
        avgEmpleados: sql<number>`ROUND(AVG(${empresasProspectos.empleadosEstimados}))`,
        conCorreo: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.correoElectronico} IS NOT NULL AND ${empresasProspectos.correoElectronico} != '')`,
        conTelefono: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.telefono} IS NOT NULL AND ${empresasProspectos.telefono} != '')`,
        valorMercado: sql<number>`ROUND(COALESCE(SUM(${empresasProspectos.potencialAportacionMensual}), 0)::numeric, 0)`,
        stageNuevo: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} = 'nuevo')`,
        stageContactado: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} = 'contactado')`,
        stageDemo: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} = 'demo')`,
        stagePropuesta: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} = 'propuesta')`,
        stageNegociacion: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} = 'negociacion')`,
        stageCliente: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} = 'cliente')`,
        trabajados: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.stage} != 'nuevo')`,
        prioAlta: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.prioridad} = 'alta')`,
        prioMedia: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.prioridad} = 'media')`,
        prioBaja: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.prioridad} = 'baja')`,
        enriquecidas: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.planRecomendado} IS NOT NULL)`,
      }).from(empresasProspectos).where(whereClause);

      const r = result[0];

      const topMunicipiosConditions = [...conditions];
      topMunicipiosConditions.push(sql`${empresasProspectos.municipio} IS NOT NULL`);
      const topMunicipios = await db.select({
        municipio: empresasProspectos.municipio,
        count: count(),
      }).from(empresasProspectos)
        .where(and(...topMunicipiosConditions))
        .groupBy(empresasProspectos.municipio)
        .orderBy(desc(count()))
        .limit(10);

      const payload = {
        total: Number(r.total) || 0,
        avgEmpleados: Number(r.avgEmpleados) || 0,
        conCorreo: Number(r.conCorreo) || 0,
        conTelefono: Number(r.conTelefono) || 0,
        valorMercado: Number(r.valorMercado) || 0,
        trabajados: Number(r.trabajados) || 0,
        enriquecidas: Number(r.enriquecidas) || 0,
        stages: {
          nuevo: Number(r.stageNuevo) || 0,
          contactado: Number(r.stageContactado) || 0,
          demo: Number(r.stageDemo) || 0,
          propuesta: Number(r.stagePropuesta) || 0,
          negociacion: Number(r.stageNegociacion) || 0,
          cliente: Number(r.stageCliente) || 0,
        },
        avgScore: Number(r.avgScore) || 0,
        topMunicipios: topMunicipios.map((m) => ({ municipio: m.municipio, count: Number(m.count) })),
        prioridades: {
          alta: Number(r.prioAlta) || 0,
          media: Number(r.prioMedia) || 0,
          baja: Number(r.prioBaja) || 0,
        },
      };
      prospectStatsCacheMap.set(cacheKey, { data: payload, ts: Date.now() });
      if (prospectStatsCacheMap.size > 100) {
        const oldest = [...prospectStatsCacheMap.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
        if (oldest) prospectStatsCacheMap.delete(oldest[0]);
      }
      res.json(payload);
    } catch (err) { next(err); }
  });

  const filtersCache = new Map<string, { data: any; ts: number }>();
  const FILTERS_CACHE_TTL = 5 * 60 * 1000;

  app.get("/api/denue/prospectos/filters", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { estado, zona } = req.query as Record<string, string>;
      const cacheKey = `${zona || ''}|${estado || ''}`;
      const cached = filtersCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < FILTERS_CACHE_TTL) {
        return res.json(cached.data);
      }

      let municipiosQuery: any;
      if (zona && ZONA_POR_ESTADO) {
        const estadosDeZona = Object.entries(ZONA_POR_ESTADO).filter(([, z]) => z === zona).map(([e]) => e);
        if (estadosDeZona.length > 0) {
          const estadosStr = estadosDeZona.map(e => `'${e.replace(/'/g, "''")}'`).join(",");
          municipiosQuery = db.execute(sql.raw(`SELECT DISTINCT municipio FROM mv_prosp_municipios WHERE estado IN (${estadosStr}) ORDER BY municipio`));
        }
      }
      if (estado) {
        municipiosQuery = db.execute(sql`SELECT municipio FROM mv_prosp_municipios WHERE estado = ${estado} ORDER BY municipio`);
      }
      if (!municipiosQuery) {
        municipiosQuery = db.execute(sql`SELECT DISTINCT municipio FROM mv_prosp_municipios ORDER BY municipio LIMIT 500`);
      }

      const [municipiosRes, sectoresRes] = await Promise.all([
        municipiosQuery,
        db.execute(sql`SELECT codigo_scian, actividad_economica FROM mv_prosp_sectores ORDER BY codigo_scian`),
      ]);

      const result = {
        estados: [],
        municipios: (municipiosRes as any).rows.map((m: any) => m.municipio).filter(Boolean),
        sectores: (sectoresRes as any).rows.map((s: any) => ({ codigo: s.codigo_scian, actividad: s.actividad_economica })),
      };

      filtersCache.set(cacheKey, { data: result, ts: Date.now() });
      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/denue/prospectos/:id", requireAdminOrPartner, async (req, res, next) => {
    try {
      const [row] = await db.select().from(empresasProspectos).where(eq(empresasProspectos.id, (req.params.id as string))).limit(1);
      if (!row) return res.status(404).json({ message: "Prospecto no encontrado" });

      const detailEfosResult = await db.execute(sql`SELECT efos_rfc, efos_situacion, efos_nombre FROM efos_prospectos_match WHERE prospecto_id = ${row.id} LIMIT 1`);
      const detailEfosRows = (detailEfosResult as unknown as { rows: { efos_rfc: string; efos_situacion: string; efos_nombre: string }[] }).rows || [];
      const efos69b = detailEfosRows.length > 0 ? { rfc: detailEfosRows[0].efos_rfc, situacion: detailEfosRows[0].efos_situacion, nombre: detailEfosRows[0].efos_nombre } : null;
      res.json({ ...row, efos69b });
    } catch (err) { next(err); }
  });

  app.patch("/api/denue/prospectos/:id/stage", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { stage } = req.body;
      const validStages = ["nuevo", "contactado", "demo", "propuesta", "negociacion", "cliente"];
      if (!validStages.includes(stage)) return res.status(400).json({ message: "Etapa inválida" });

      const [updated] = await db.update(empresasProspectos)
        .set({ stage, updatedAt: new Date() })
        .where(eq(empresasProspectos.id, (req.params.id as string)))
        .returning();
      if (!updated) return res.status(404).json({ message: "Prospecto no encontrado" });

      await db.insert(interaccionesProspectos).values({
        empresaId: updated.id,
        userId: req.supabaseUserId!,
        tipo: "cambio_etapa",
        notas: `Cambio a etapa: ${stage}`,
      });

      prospectStatsCacheMap.clear();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.patch("/api/denue/prospectos/:id/assign", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { partnerId } = req.body;
      if (partnerId) {
        const partnerAccount = await storage.getAccount(partnerId);
        if (!partnerAccount || (partnerAccount.userRole !== "socio_comercial" && partnerAccount.userRole !== "partner" && partnerAccount.userRole !== "director")) {
          return res.status(400).json({ message: "El usuario seleccionado no tiene rol de socio" });
        }
      }
      const [updated] = await db.update(empresasProspectos)
        .set({ partnerId: partnerId || null, updatedAt: new Date() })
        .where(eq(empresasProspectos.id, (req.params.id as string)))
        .returning();
      if (!updated) return res.status(404).json({ message: "Prospecto no encontrado" });
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.post("/api/denue/prospectos/:id/interaccion", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { tipo, notas } = req.body;
      if (!tipo) return res.status(400).json({ message: "Se requiere tipo de interacción" });

      const [empresa] = await db.select().from(empresasProspectos).where(eq(empresasProspectos.id, (req.params.id as string)));
      if (!empresa) return res.status(404).json({ message: "Prospecto no encontrado" });

      const [record] = await db.insert(interaccionesProspectos).values({
        empresaId: empresa.id,
        userId: req.supabaseUserId!,
        tipo,
        notas: notas || null,
      }).returning();
      res.json(record);
    } catch (err) { next(err); }
  });

  app.get("/api/denue/prospectos/:id/interacciones", requireAdminOrPartner, async (req, res, next) => {
    try {
      const rows = await db.select().from(interaccionesProspectos)
        .where(eq(interaccionesProspectos.empresaId, (req.params.id as string)))
        .orderBy(desc(interaccionesProspectos.createdAt));
      res.json(rows);
    } catch (err) { next(err); }
  });

  app.get("/api/denue/export", requireAdminOrPartner, async (req, res, next) => {
    try {
      const ExcelJS = await import("exceljs");
      const { municipio, estado, zona, scian, scoreMin, scoreMax, stage, partnerId } = req.query as Record<string, string>;

      const exportValidStages = ["nuevo", "contactado", "demo", "propuesta", "negociacion", "cliente"] as const;
      const exportConditions: SQL[] = [];
      if (zona && ZONA_POR_ESTADO) {
        const estadosDeZona = Object.entries(ZONA_POR_ESTADO).filter(([, z]) => z === zona).map(([e]) => e);
        if (estadosDeZona.length > 0) exportConditions.push(inArray(empresasProspectos.estado, estadosDeZona));
      }
      if (municipio) exportConditions.push(eq(empresasProspectos.municipio, municipio));
      if (estado) exportConditions.push(eq(empresasProspectos.estado, estado));
      if (scian) exportConditions.push(eq(empresasProspectos.codigoScian, scian));
      if (scoreMin) exportConditions.push(gte(empresasProspectos.leadScore, parseInt(scoreMin)));
      if (scoreMax) exportConditions.push(lte(empresasProspectos.leadScore, parseInt(scoreMax)));
      if (stage && exportValidStages.includes(stage as typeof exportValidStages[number])) {
        exportConditions.push(sql`${empresasProspectos.stage} = ${stage}`);
      }
      if (partnerId) exportConditions.push(eq(empresasProspectos.partnerId, partnerId));

      const where = exportConditions.length > 0 ? and(...exportConditions) : undefined;
      const rows = await db.select().from(empresasProspectos).where(where).orderBy(desc(empresasProspectos.leadScore)).limit(5000);

      const data = rows.map(r => ({
        "Nombre Comercial": r.nombreComercial,
        "Razón Social": r.razonSocial || "",
        "Actividad Económica": r.actividadEconomica || "",
        "SCIAN": r.codigoScian || "",
        "Empleados": r.estratoPersonal || "",
        "Teléfono": r.telefono || "",
        "Email": r.correoElectronico || "",
        "Sitio Web": r.sitioWeb || "",
        "Calle": r.calle || "",
        "Colonia": r.colonia || "",
        "CP": r.codigoPostal || "",
        "Municipio": r.municipio || "",
        "Estado": r.estado || "",
        "Score": r.leadScore,
        "Etapa": r.stage,
        "NOMs Aplicables": (r.nomsAplicables || []).join(", "),
      }));

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Prospectos DENUE");
      if (data.length > 0) {
        const headers = Object.keys(data[0]) as (keyof typeof data[0])[];
        ws.addRow(headers);
        data.forEach(row => ws.addRow(headers.map(h => row[h])));
      }
      const buf = await wb.xlsx.writeBuffer();

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="prospectos-denue-${Date.now()}.xlsx"`);
      res.send(Buffer.from(buf as ArrayBuffer));
    } catch (err) { next(err); }
  });

  app.delete("/api/denue/prospectos", requireSuperadmin, async (req, res, next) => {
    try {
      const { batchId } = req.query as Record<string, string>;
      if (batchId) {
        const result = await db.delete(empresasProspectos).where(eq(empresasProspectos.importBatchId, batchId)).returning();
        return res.json({ deleted: result.length });
      }
      return res.status(400).json({ message: "Se requiere batchId para eliminar" });
    } catch (err) { next(err); }
  });

  app.post("/api/denue/enrich", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { ids, batchSize = 5 } = req.body as { ids?: string[]; batchSize?: number };

      let prospects;
      if (ids && ids.length > 0) {
        prospects = await db.select().from(empresasProspectos).where(sql`${empresasProspectos.id} = ANY(${ids})`).limit(50);
      } else {
        const already = db.select({ empresaId: enriquecimiento.empresaId }).from(enriquecimiento);
        prospects = await db.select().from(empresasProspectos)
          .where(sql`${empresasProspectos.id} NOT IN (${already})`)
          .orderBy(desc(empresasProspectos.leadScore))
          .limit(Math.min(batchSize, 20));
      }

      if (prospects.length === 0) {
        return res.json({ enriched: 0, results: [], message: "No hay prospectos pendientes de enriquecer" });
      }

      const results: Array<{ id: string; nombre: string; phone?: string; website?: string; googleRating?: number; status: string }> = [];

      for (const p of prospects) {
        try {
          const searchName = p.nombreComercial.replace(/\s+/g, " ").trim();
          const searchLocation = [p.municipio, p.estado].filter(Boolean).join(" ");
          const searchQuery = `${searchName} ${searchLocation} México`;

          let phone: string | null = null;
          let website: string | null = null;
          let googleRating: number | null = null;
          let googleReviews: number | null = null;
          let facebookUrl: string | null = null;
          let linkedinUrl: string | null = null;

          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
          const ddgRes = await fetch(ddgUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html",
            },
          }).catch(() => null);

          if (ddgRes && ddgRes.ok) {
            const html = await ddgRes.text();

            const hrefMatches = html.match(/href="(https?:\/\/[^"]+)"/g);
            if (hrefMatches) {
              const skipDomains = ["duckduckgo.", "google.", "bing.", "yahoo.", "gstatic.", "youtube.", "schema.org", "w3.org", "googleapis.", "wikipedia.", "amazon.", "twitter.", "instagram.", "tiktok."];
              for (const m of hrefMatches) {
                const url = m.replace(/^href="/, "").replace(/"$/, "");
                if (skipDomains.some(d => url.includes(d))) continue;
                if (url.includes("facebook.com/") && !facebookUrl) { facebookUrl = url; continue; }
                if (url.includes("linkedin.com/") && !linkedinUrl) { linkedinUrl = url; continue; }
                if (!website && !url.includes("duckduckgo") && url.startsWith("http")) { website = url; }
              }
            }

          }

          if (website && !website.includes("facebook.") && !website.includes("linkedin.")) {
            try {
              const pageRes = await fetch(website, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
                signal: AbortSignal.timeout(8000),
              }).catch(() => null);

              if (pageRes && pageRes.ok) {
                const pageHtml = await pageRes.text();

                if (!phone) {
                  const telMatches = pageHtml.match(/(?:tel:|href="tel:)(\+?\d[\d\s.-]{8,15})/g);
                  if (telMatches) {
                    const cleaned = telMatches[0].replace(/.*?(\+?\d[\d\s.-]{8,15}).*/, "$1").replace(/[\s.-]/g, "");
                    if (cleaned.length >= 10) phone = cleaned;
                  }
                  if (!phone) {
                    const mxPhones = pageHtml.match(/(?:\+52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{4})/g);
                    if (mxPhones) {
                      for (const mp of mxPhones) {
                        const cleaned = mp.replace(/[^\d+]/g, "");
                        if (cleaned.length >= 10 && cleaned.length <= 15) { phone = cleaned; break; }
                      }
                    }
                  }
                }

                if (!facebookUrl) {
                  const fbMatch = pageHtml.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+/);
                  if (fbMatch) facebookUrl = fbMatch[0];
                }
              }
            } catch {}
          }

          const updates: Record<string, string | null> = {};
          if (phone && !p.telefono) updates.telefono = phone;
          if (website && !p.sitioWeb) updates.sitioWeb = website;

          if (Object.keys(updates).length > 0) {
            if (updates.telefono) {
              await db.update(empresasProspectos).set({ telefono: updates.telefono }).where(eq(empresasProspectos.id, p.id));
            }
            if (updates.sitioWeb) {
              await db.update(empresasProspectos).set({ sitioWeb: updates.sitioWeb }).where(eq(empresasProspectos.id, p.id));
            }
          }

          await db.insert(enriquecimiento).values({
            empresaId: p.id,
            fuente: "web-search",
            googleRating: googleRating,
            googleReviews: googleReviews,
            linkedinUrl: linkedinUrl,
            facebookUrl: facebookUrl,
            datosExtra: {
              phoneFound: phone,
              websiteFound: website,
              searchQuery,
              enrichedAt: new Date().toISOString(),
            },
          });

          if (phone || website) {
            const score = calculateLeadScore({
              empleadosMin: p.empleadosMin || 0,
              empleadosMax: p.empleadosMax || 0,
              codigoScian: p.codigoScian || "",
              sitioWeb: p.sitioWeb || website || "",
              correoElectronico: p.correoElectronico || "",
              estratoPersonal: p.estratoPersonal || "",
            });
            await db.update(empresasProspectos)
              .set({ leadScore: score.total, scoreDesglose: score.desglose })
              .where(eq(empresasProspectos.id, p.id));
          }

          results.push({
            id: p.id,
            nombre: p.nombreComercial,
            phone: phone || undefined,
            website: website || undefined,
            googleRating: googleRating || undefined,
            status: (phone || website) ? "enriched" : "no-new-data",
          });

          await new Promise(r => setTimeout(r, 1500));
        } catch (enrichErr) {
          results.push({ id: p.id, nombre: p.nombreComercial, status: "error" });
        }
      }

      const enrichedCount = results.filter(r => r.status === "enriched").length;
      prospectStatsCacheMap.clear();
      mapCache.clear();
      res.json({ enriched: enrichedCount, total: results.length, results });
    } catch (err) { next(err); }
  });

  const bulkEnrichState = {
    running: false,
    processed: 0,
    total: 0,
    enriched: 0,
    errors: 0,
    startedAt: null as string | null,
    lastUpdate: null as string | null,
    currentBatch: "",
    stopped: false,
  };

  async function enrichOneProspect(p: typeof empresasProspectos.$inferSelect) {
    let phone: string | null = null;
    let website: string | null = null;
    let googleRating: number | null = null;
    let googleReviews: number | null = null;
    let facebookUrl: string | null = null;
    let linkedinUrl: string | null = null;

    const searchName = p.nombreComercial.replace(/\s+/g, " ").trim();
    const searchLocation = [p.municipio, p.estado].filter(Boolean).join(" ");
    const searchQuery = `${searchName} ${searchLocation} México`;

    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const ddgRes = await fetch(ddgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
    }).catch(() => null);

    if (ddgRes && ddgRes.ok) {
      const html = await ddgRes.text();
      const hrefMatches = html.match(/href="(https?:\/\/[^"]+)"/g);
      if (hrefMatches) {
        const skipDomains = ["duckduckgo.", "google.", "bing.", "yahoo.", "gstatic.", "youtube.", "schema.org", "w3.org", "googleapis.", "wikipedia.", "amazon.", "twitter.", "instagram.", "tiktok."];
        for (const m of hrefMatches) {
          const url = m.replace(/^href="/, "").replace(/"$/, "");
          if (skipDomains.some(d => url.includes(d))) continue;
          if (url.includes("facebook.com/") && !facebookUrl) { facebookUrl = url; continue; }
          if (url.includes("linkedin.com/") && !linkedinUrl) { linkedinUrl = url; continue; }
          if (!website && !url.includes("duckduckgo") && url.startsWith("http")) { website = url; }
        }
      }
    }

    if (website && !website.includes("facebook.") && !website.includes("linkedin.")) {
      try {
        const pageRes = await fetch(website, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          signal: AbortSignal.timeout(8000),
        }).catch(() => null);

        if (pageRes && pageRes.ok) {
          const pageHtml = await pageRes.text();
          if (!phone) {
            const telMatches = pageHtml.match(/(?:tel:|href="tel:)(\+?\d[\d\s.-]{8,15})/g);
            if (telMatches) {
              const cleaned = telMatches[0].replace(/.*?(\+?\d[\d\s.-]{8,15}).*/, "$1").replace(/[\s.-]/g, "");
              if (cleaned.length >= 10) phone = cleaned;
            }
            if (!phone) {
              const mxPhones = pageHtml.match(/(?:\+52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{4})/g);
              if (mxPhones) {
                for (const mp of mxPhones) {
                  const cleaned = mp.replace(/[^\d+]/g, "");
                  if (cleaned.length >= 10 && cleaned.length <= 15) { phone = cleaned; break; }
                }
              }
            }
          }
          if (!facebookUrl) {
            const fbMatch = pageHtml.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+/);
            if (fbMatch) facebookUrl = fbMatch[0];
          }
        }
      } catch {}
    }

    const updates: Record<string, string | null> = {};
    if (phone && !p.telefono) updates.telefono = phone;
    if (website && !p.sitioWeb) updates.sitioWeb = website;

    if (updates.telefono) {
      await db.update(empresasProspectos).set({ telefono: updates.telefono }).where(eq(empresasProspectos.id, p.id));
    }
    if (updates.sitioWeb) {
      await db.update(empresasProspectos).set({ sitioWeb: updates.sitioWeb }).where(eq(empresasProspectos.id, p.id));
    }

    await db.insert(enriquecimiento).values({
      empresaId: p.id,
      fuente: "web-search",
      googleRating,
      googleReviews,
      linkedinUrl,
      facebookUrl,
      datosExtra: {
        phoneFound: phone,
        websiteFound: website,
        searchQuery,
        enrichedAt: new Date().toISOString(),
      },
    });

    if (phone || website) {
      const score = calculateLeadScore({
        empleadosMin: p.empleadosMin || 0,
        empleadosMax: p.empleadosMax || 0,
        codigoScian: p.codigoScian || "",
        sitioWeb: p.sitioWeb || website || "",
        correoElectronico: p.correoElectronico || "",
        estratoPersonal: p.estratoPersonal || "",
      });
      await db.update(empresasProspectos)
        .set({ leadScore: score.total, scoreDesglose: score.desglose })
        .where(eq(empresasProspectos.id, p.id));
    }

    return !!(phone || website);
  }

  app.post("/api/denue/enrich/bulk", requireAdminOrPartner, async (req, res) => {
    if (bulkEnrichState.running) {
      return res.json({ message: "Ya hay un proceso de enriquecimiento en curso", ...bulkEnrichState });
    }

    const { municipio, estado, zona, stage, scian, scoreMin, partnerId, enrichment } = req.body as Record<string, string>;
    const filterConditions: string[] = [];
    if (zona && ZONA_POR_ESTADO) {
      const estadosDeZona = Object.entries(ZONA_POR_ESTADO).filter(([, z]) => z === zona).map(([e]) => `'${e.replace(/'/g, "''")}'`).join(",");
      filterConditions.push(`estado IN (${estadosDeZona})`);
    }
    if (estado) {
      filterConditions.push(`estado = '${estado.replace(/'/g, "''")}'`);
    }
    if (enrichment === "enriched") {
      filterConditions.push("plan_recomendado IS NOT NULL");
    } else if (enrichment === "pending") {
      filterConditions.push("plan_recomendado IS NULL");
    }
    if (municipio) filterConditions.push(`municipio = '${municipio.replace(/'/g, "''")}'`);
    if (stage) filterConditions.push(`stage = '${stage.replace(/'/g, "''")}'`);
    if (scian) filterConditions.push(`codigo_scian = '${scian.replace(/'/g, "''")}'`);
    if (scoreMin) filterConditions.push(`lead_score >= ${parseInt(scoreMin) || 0}`);
    if (partnerId) filterConditions.push(`partner_id = '${partnerId.replace(/'/g, "''")}'`);
    const filterSql = filterConditions.length > 0 ? filterConditions.join(" AND ") : "TRUE";

    bulkEnrichState.running = true;
    bulkEnrichState.processed = 0;
    bulkEnrichState.enriched = 0;
    bulkEnrichState.errors = 0;
    bulkEnrichState.startedAt = new Date().toISOString();
    bulkEnrichState.lastUpdate = new Date().toISOString();
    bulkEnrichState.stopped = false;
    bulkEnrichState.currentBatch = "Iniciando...";

    res.json({ message: "Enriquecimiento iniciado", status: "started" });

    (async () => {
      try {
        const alreadyDone = await db.select({ empresaId: enriquecimiento.empresaId }).from(enriquecimiento);
        const doneIds = new Set(alreadyDone.map(r => r.empresaId));

        const BATCH_SIZE = 100;
        let offset = 0;
        let hasMore = true;

        while (hasMore && !bulkEnrichState.stopped) {
          const batch = await db.select().from(empresasProspectos)
            .where(sql.raw(filterSql))
            .orderBy(desc(empresasProspectos.leadScore))
            .limit(BATCH_SIZE)
            .offset(offset);

          if (batch.length === 0) { hasMore = false; break; }

          if (bulkEnrichState.total === 0) {
            const countRes = await db.select({ count: sql<number>`count(*)` }).from(empresasProspectos)
              .where(sql.raw(filterSql));
            bulkEnrichState.total = countRes[0].count - doneIds.size;
          }

          for (const p of batch) {
            if (bulkEnrichState.stopped) break;

            if (doneIds.has(p.id)) {
              offset++;
              continue;
            }

            bulkEnrichState.currentBatch = p.nombreComercial;
            try {
              const found = await enrichOneProspect(p);
              if (found) bulkEnrichState.enriched++;
              bulkEnrichState.processed++;
              doneIds.add(p.id);
            } catch (err) {
              bulkEnrichState.errors++;
              bulkEnrichState.processed++;
              doneIds.add(p.id);
            }
            bulkEnrichState.lastUpdate = new Date().toISOString();

            await new Promise(r => setTimeout(r, 1200));
          }

          offset += BATCH_SIZE;
        }
      } catch (err) {
        console.error("Bulk enrich error:", err);
      } finally {
        bulkEnrichState.running = false;
        bulkEnrichState.currentBatch = "Completado";
        bulkEnrichState.lastUpdate = new Date().toISOString();
        prospectStatsCacheMap.clear();
        mapCache.clear();
      }
    })();
  });

  app.post("/api/denue/enrich/stop", requireAdminOrPartner, async (_req, res) => {
    bulkEnrichState.stopped = true;
    res.json({ message: "Deteniendo proceso de enriquecimiento..." });
  });

  app.get("/api/denue/enrich/status", requireAdminOrPartner, async (_req, res, next) => {
    try {
      const enrichedCount = await db.select({ count: sql<number>`count(distinct ${enriquecimiento.empresaId})` }).from(enriquecimiento);

      res.json({
        enrichedCount: enrichedCount[0].count,
        bulk: { ...bulkEnrichState },
      });
    } catch (err) { next(err); }
  });

  app.get("/api/denue/partners", requireAdminOrPartner, async (_req, res, next) => {
    try {
      const partnerUsersRaw = await db.select()
        .from(users)
        .innerJoin(accounts, eq(users.id, accounts.id))
        .leftJoin(profiles, eq(users.id, profiles.id))
        .where(inArray(accounts.userRole, ["socio_comercial", "partner", "director"]));

      res.json(partnerUsersRaw.map(u => ({
        id: u.users.id,
        email: u.users.email,
        fullName: u.profiles?.fullName || null,
      })));
    } catch (err) { next(err); }
  });

  app.post("/api/denue/prospectos/bulk-stage", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { ids, stage } = req.body;
      if (!ids?.length || !stage) return res.status(400).json({ message: "ids y stage requeridos" });
      await db.update(empresasProspectos).set({ stage, updatedAt: new Date() }).where(inArray(empresasProspectos.id, ids));
      res.json({ updated: ids.length });
    } catch (err) { next(err); }
  });

  app.post("/api/denue/prospectos/bulk-assign", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { ids, partnerId } = req.body;
      if (!ids?.length) return res.status(400).json({ message: "ids requeridos" });
      await db.update(empresasProspectos).set({ partnerId: partnerId || null, updatedAt: new Date() }).where(inArray(empresasProspectos.id, ids));
      res.json({ updated: ids.length });
    } catch (err) { next(err); }
  });

  app.post("/api/denue/prospectos/bulk-group", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { ids, contactGroupId } = req.body;
      if (!ids?.length) return res.status(400).json({ message: "ids requeridos" });
      const oldGroups = await db.select({ contactGroupId: empresasProspectos.contactGroupId }).from(empresasProspectos).where(inArray(empresasProspectos.id, ids));
      const affectedGroupIds = new Set(oldGroups.map(r => r.contactGroupId).filter(Boolean) as string[]);
      if (contactGroupId) affectedGroupIds.add(contactGroupId);
      await db.update(empresasProspectos).set({ contactGroupId: contactGroupId || null, updatedAt: new Date() }).where(inArray(empresasProspectos.id, ids));
      for (const gid of affectedGroupIds) {
        const [cnt] = await db.select({ count: sql<number>`count(*)` }).from(empresasProspectos).where(eq(empresasProspectos.contactGroupId, gid));
        await db.update(contactGroups).set({ prospectCount: cnt.count, updatedAt: new Date() }).where(eq(contactGroups.id, gid));
      }
      res.json({ updated: ids.length });
    } catch (err) { next(err); }
  });

  app.post("/api/denue/prospectos/bulk-delete", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { ids } = req.body;
      if (!ids?.length) return res.status(400).json({ message: "ids requeridos" });
      const affectedRows = await db.select({ contactGroupId: empresasProspectos.contactGroupId }).from(empresasProspectos).where(inArray(empresasProspectos.id, ids));
      const affectedGroupIds = new Set(affectedRows.map(r => r.contactGroupId).filter(Boolean) as string[]);
      await db.delete(empresasProspectos).where(inArray(empresasProspectos.id, ids));
      for (const gid of affectedGroupIds) {
        const [cnt] = await db.select({ count: sql<number>`count(*)` }).from(empresasProspectos).where(eq(empresasProspectos.contactGroupId, gid));
        await db.update(contactGroups).set({ prospectCount: cnt.count, updatedAt: new Date() }).where(eq(contactGroups.id, gid));
      }
      res.json({ deleted: ids.length });
    } catch (err) { next(err); }
  });

  app.patch("/api/denue/prospectos/:id", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const allowedFields = ["stage", "partnerId", "contactGroupId", "notas", "lastContactedAt", "planRecomendado", "nombreContacto", "rfc", "telefono", "correoElectronico", "sitioWeb"];
      const updates: Record<string, any> = { updatedAt: new Date() };
      for (const f of allowedFields) {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      }
      const [old] = await db.select({ contactGroupId: empresasProspectos.contactGroupId }).from(empresasProspectos).where(eq(empresasProspectos.id, id));
      const [updated] = await db.update(empresasProspectos).set(updates).where(eq(empresasProspectos.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Prospecto no encontrado" });
      if (req.body.contactGroupId !== undefined) {
        const groupsToUpdate = new Set([old?.contactGroupId, req.body.contactGroupId].filter(Boolean) as string[]);
        for (const gid of groupsToUpdate) {
          const [cnt] = await db.select({ count: sql<number>`count(*)` }).from(empresasProspectos).where(eq(empresasProspectos.contactGroupId, gid));
          await db.update(contactGroups).set({ prospectCount: cnt.count, updatedAt: new Date() }).where(eq(contactGroups.id, gid));
        }
      }
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/denue/contact-groups", requireAdminOrPartner, async (_req, res, next) => {
    try {
      const groups = await db.select().from(contactGroups).orderBy(desc(contactGroups.createdAt));
      res.json(groups);
    } catch (err) { next(err); }
  });

  app.post("/api/denue/contact-groups", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { name, description, filterCriteria, assignedSocioId } = req.body;
      if (!name) return res.status(400).json({ message: "Nombre requerido" });
      const [group] = await db.insert(contactGroups).values({ name, description, filterCriteria, assignedSocioId }).returning();
      res.json(group);
    } catch (err) { next(err); }
  });

  app.patch("/api/denue/contact-groups/:id", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { name, description, filterCriteria, assignedSocioId } = req.body;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (filterCriteria !== undefined) updates.filterCriteria = filterCriteria;
      if (assignedSocioId !== undefined) updates.assignedSocioId = assignedSocioId;
      const [updated] = await db.update(contactGroups).set(updates).where(eq(contactGroups.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Grupo no encontrado" });
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/denue/contact-groups/:id", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      await db.update(empresasProspectos).set({ contactGroupId: null }).where(eq(empresasProspectos.contactGroupId, id));
      await db.delete(contactGroups).where(eq(contactGroups.id, id));
      res.json({ deleted: true });
    } catch (err) { next(err); }
  });

  app.get("/api/denue/saved-filters", requireAdminOrPartner, async (_req, res, next) => {
    try {
      const filters = await db.select().from(savedFilters).orderBy(desc(savedFilters.createdAt));
      res.json(filters);
    } catch (err) { next(err); }
  });

  app.post("/api/denue/saved-filters", requireAdminOrPartner, async (req, res, next) => {
    try {
      const { name, filterConfig } = req.body;
      if (!name || !filterConfig) return res.status(400).json({ message: "Nombre y configuración requeridos" });
      const userId = req.supabaseUserId || null;
      const [filter] = await db.insert(savedFilters).values({ name, filterConfig, createdBy: userId }).returning();
      res.json(filter);
    } catch (err) { next(err); }
  });

  app.delete("/api/denue/saved-filters/:id", requireAdminOrPartner, async (req, res, next) => {
    try {
      await db.delete(savedFilters).where(eq(savedFilters.id, (req.params.id as string)));
      res.json({ deleted: true });
    } catch (err) { next(err); }
  });
}
