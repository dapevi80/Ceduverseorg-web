import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { empresasProspectos } from "@shared/schema";
import { sql, eq, gte, and, isNotNull, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

type DbRow = Record<string, unknown>;
type QueryResultLike = { rows: DbRow[] } | DbRow[];

function rows(result: QueryResultLike): DbRow[] {
  if (Array.isArray(result)) return result;
  return result?.rows || [];
}
function firstRow(result: QueryResultLike): DbRow {
  const r = rows(result);
  return r[0] || {};
}

const UMA = 113.14;
const PLAN_UMAS: Record<string, number> = { Impulsa: 6, Transforma: 10, Lidera: 20 };
const PLAN_FEE: Record<string, number> = { Impulsa: 0.20, Transforma: 0.13, Lidera: 0.10 };
const COSTO_OPS_MENSUAL = 94857;

const DC3_PRECIO_DTO = 399;
const DC3_COSTO_ACE = 200;
const DC3_MARGEN = 199;
const SEP_PRECIO = 1999;
const SEP_COSTO_INEC = 800;
const SEP_MARGEN = 1199;
const COMISION_DC3_PCT = 0.40;
const COMISION_SEP_PCT = 0.10;
const COMISION_DC3 = Math.round(DC3_PRECIO_DTO * COMISION_DC3_PCT);
const COMISION_SEP = Math.round(SEP_PRECIO * COMISION_SEP_PCT);
const DC3_OVERRIDE_DIRECTOR = Math.round(DC3_PRECIO_DTO * 0.10);
const SEP_OVERRIDE_DIRECTOR = Math.round(SEP_PRECIO * 0.05);
const REFERRAL_PER_COMPANY = 500;

const ZONE_STATES: Record<string, string[]> = {
  Sureste: ["Quintana Roo", "Yucatán", "Campeche"],
  Sur: ["Veracruz", "Tabasco", "Chiapas", "Oaxaca"],
  Centro: ["Ciudad de México", "México", "Puebla", "Tlaxcala", "Hidalgo", "Morelos"],
  Bajío: ["Querétaro", "Guanajuato", "Aguascalientes", "Zacatecas", "San Luis Potosí"],
  Norte: ["Tamaulipas", "Nuevo León", "Coahuila", "Coahuila de Zaragoza", "Durango"],
  Pacífico: ["Guerrero", "Michoacán", "Michoacán de Ocampo", "Colima", "Jalisco", "Nayarit", "Sinaloa"],
  Noroeste: ["Baja California", "Baja California Sur", "Sonora", "Chihuahua"],
};

function getComisionPct(tier: string) {
  if (tier === "35") return 0.35;
  if (tier === "30") return 0.30;
  return 0.25;
}

function calcSimulation(params: {
  empresas: number;
  plan: string;
  avgCols: number;
  tasaDc3: number;
  tasaSep: number;
  numConsultores: number;
  numDirectores: number;
  tierComision: string;
}) {
  const { empresas, plan, avgCols, tasaDc3, tasaSep, numConsultores, numDirectores, tierComision } = params;
  const umas = PLAN_UMAS[plan] || 10;
  const feePct = PLAN_FEE[plan] || 0.13;
  const comPct = getComisionPct(tierComision);

  const aportMensual = empresas * avgCols * umas * UMA;
  const aportAnual = aportMensual * 12;
  const feeMensual = aportMensual * feePct;
  const feeAnual = feeMensual * 12;

  const totalCols = empresas * avgCols;
  const cantDc3 = Math.floor(totalCols * tasaDc3);
  const cantSep = Math.floor(totalCols * tasaSep);
  const ingresoDc3Anual = cantDc3 * DC3_PRECIO_DTO;
  const margenDc3Anual = cantDc3 * DC3_MARGEN;
  const ingresoSepAnual = cantSep * SEP_PRECIO;
  const margenSepAnual = cantSep * SEP_MARGEN;

  const ingresoTotalMes = feeMensual + (margenDc3Anual + margenSepAnual) / 12;
  const ingresoTotalAnual = feeAnual + margenDc3Anual + margenSepAnual;

  const costoOpsMensual = COSTO_OPS_MENSUAL;
  const costoOpsAnual = costoOpsMensual * 12;
  const comisionConsultoresMes = numConsultores > 0 ? feeMensual * comPct : 0;
  const overrideDirectoresMes = numDirectores > 0 ? feeMensual * 0.05 * numDirectores : 0;
  const nuevasEmpresasMes = Math.ceil(empresas / 12);
  const comisionCierreMes = nuevasEmpresasMes * feeMensual / empresas * 0.50;
  const comDc3Mes = (cantDc3 * COMISION_DC3) / 12;
  const comSepMes = (cantSep * COMISION_SEP) / 12;
  const overDc3Mes = numDirectores > 0 ? (cantDc3 * DC3_OVERRIDE_DIRECTOR) / 12 : 0;
  const overSepMes = numDirectores > 0 ? (cantSep * SEP_OVERRIDE_DIRECTOR) / 12 : 0;

  const costoTotalMes = costoOpsMensual + comisionConsultoresMes + overrideDirectoresMes + comisionCierreMes + comDc3Mes + comSepMes + overDc3Mes + overSepMes;
  const costoTotalAnual = costoTotalMes * 12;

  const margenBrutoMes = ingresoTotalMes - costoTotalMes;
  const margenBrutoAnual = margenBrutoMes * 12;
  const pctMargen = ingresoTotalMes > 0 ? (margenBrutoMes / ingresoTotalMes) * 100 : 0;
  const margenBonosMes = margenBrutoMes * 0.50;
  const margenBonosAnual = margenBonosMes * 12;

  let semaforo: "rojo" | "amarillo" | "verde" | "azul" = "rojo";
  if (pctMargen >= 40) semaforo = "azul";
  else if (pctMargen >= 25) semaforo = "verde";
  else if (pctMargen >= 10) semaforo = "amarillo";

  return {
    ingresos: {
      aportMensual, aportAnual, feeMensual, feeAnual,
      ingresoDc3Anual, margenDc3Anual, ingresoSepAnual, margenSepAnual,
      cantDc3, cantSep,
      ingresoTotalMes, ingresoTotalAnual,
    },
    costos: {
      costoOpsMensual, costoOpsAnual,
      comisionConsultoresMes, overrideDirectoresMes, comisionCierreMes,
      comDc3Mes, comSepMes, overDc3Mes, overSepMes,
      costoTotalMes, costoTotalAnual,
    },
    margen: {
      margenBrutoMes, margenBrutoAnual, pctMargen,
      margenBonosMes, margenBonosAnual,
      semaforo,
    },
  };
}

export function registerFinancieroRoutes(app: Express) {
  app.post("/api/admin/financiero/simular", requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const p = req.body;
      const result = calcSimulation({
        empresas: p.empresas || 32,
        plan: p.plan || "Transforma",
        avgCols: p.avgCols || 30,
        tasaDc3: p.tasaDc3 || 0.40,
        tasaSep: p.tasaSep || 0.05,
        numConsultores: p.numConsultores || 7,
        numDirectores: p.numDirectores || 1,
        tierComision: p.tierComision || "25",
      });
      res.json(result);
    } catch (e) { next(e); }
  });

  app.get("/api/admin/financiero/escenarios", requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const breakEvenEmpresas = Math.ceil(COSTO_OPS_MENSUAL / (30 * 10 * UMA * 0.13));

      const scenarios = [
        { name: "Break-even", empresas: breakEvenEmpresas, avgCols: 30, plan: "Transforma" },
        { name: "Objetivo 1 (32 emp)", empresas: 32, avgCols: 30, plan: "Transforma" },
        { name: "Objetivo 2 (64 emp)", empresas: 64, avgCols: 30, plan: "Transforma" },
        { name: "Objetivo 3 (96 emp)", empresas: 96, avgCols: 30, plan: "Transforma" },
      ];

      const results = scenarios.map(s => ({
        name: s.name,
        empresas: s.empresas,
        avgCols: s.avgCols,
        plan: s.plan,
        ...calcSimulation({
          empresas: s.empresas,
          plan: s.plan,
          avgCols: s.avgCols,
          tasaDc3: 0.40,
          tasaSep: 0.05,
          numConsultores: Math.ceil(s.empresas / 5),
          numDirectores: Math.ceil(s.empresas / 32),
          tierComision: s.empresas <= 24 ? "25" : s.empresas <= 56 ? "30" : "35",
        }),
      }));

      const norteStates = ZONE_STATES.Norte;
      const norteStats = firstRow(await db.execute(sql`
        SELECT count(*) as total,
               count(*) FILTER (WHERE lead_score >= 70) as alta_prioridad,
               coalesce(avg(empleados_estimados), 30) as avg_empleados,
               coalesce(sum(potencial_aportacion_mensual), 0) as potencial_mensual
        FROM empresas_prospectos
        WHERE estado = ANY(${norteStates})
      `));

      const norteAlta = Number(norteStats.alta_prioridad || 0);
      const norteAvg = Math.round(Number(norteStats.avg_empleados || 30));

      if (norteAlta > 0) {
        results.push({
          name: `Potencial Norte (Alta prioridad)`,
          empresas: norteAlta,
          avgCols: norteAvg,
          plan: "Transforma",
          ...calcSimulation({
            empresas: norteAlta,
            plan: "Transforma",
            avgCols: norteAvg,
            tasaDc3: 0.40,
            tasaSep: 0.05,
            numConsultores: Math.ceil(norteAlta / 5),
            numDirectores: Math.ceil(norteAlta / 32),
            tierComision: "30",
          }),
        });
      }

      const totalDb = firstRow(await db.execute(sql`SELECT count(*) as total FROM empresas_prospectos`));
      const totalEmpresas = Number(totalDb.total || 0);

      for (const pct of [1, 5]) {
        const n = Math.ceil(totalEmpresas * pct / 100);
        if (n > 0) {
          results.push({
            name: `Nacional ${pct}% (${n.toLocaleString()} emp)`,
            empresas: n,
            avgCols: 30,
            plan: "Transforma",
            ...calcSimulation({
              empresas: n,
              plan: "Transforma",
              avgCols: 30,
              tasaDc3: 0.40,
              tasaSep: 0.05,
              numConsultores: Math.ceil(n / 5),
              numDirectores: Math.ceil(n / 32),
              tierComision: "35",
            }),
          });
        }
      }

      res.json({ scenarios: results, breakEvenEmpresas, totalEmpresas });
    } catch (e) { next(e); }
  });

  app.get("/api/admin/financiero/potencial", requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totals = firstRow(await db.execute(sql`
        SELECT
          count(*) as total,
          count(*) FILTER (WHERE empleados_estimados >= 11) as con_11_plus,
          count(*) FILTER (WHERE lead_score >= 70) as alta_prioridad,
          coalesce(sum(potencial_aportacion_mensual), 0) as potencial_mensual,
          coalesce(avg(empleados_estimados), 30) as avg_empleados
        FROM empresas_prospectos
      `));

      const total = Number(totals.total || 0);
      const potencialMensual = Number(totals.potencial_mensual || 0);

      const feeByPlan = await db.execute(sql`
        SELECT plan_recomendado as plan, count(*) as count,
               coalesce(sum(potencial_aportacion_mensual), 0) as potencial
        FROM empresas_prospectos
        WHERE plan_recomendado IS NOT NULL
        GROUP BY plan_recomendado
      `);

      let feePotencialMensual = 0;
      for (const row of rows(feeByPlan)) {
        const p = String(row.plan || "Transforma");
        const pct = PLAN_FEE[p] || 0.13;
        feePotencialMensual += Number(row.potencial || 0) * pct;
      }

      const captureAnalysis = [0.5, 1, 2, 5, 10].map(pct => {
        const n = Math.ceil(total * pct / 100);
        const sim = calcSimulation({
          empresas: n,
          plan: "Transforma",
          avgCols: Math.round(Number(totals.avg_empleados || 30)),
          tasaDc3: 0.40,
          tasaSep: 0.05,
          numConsultores: Math.ceil(n / 5),
          numDirectores: Math.ceil(n / 32),
          tierComision: n <= 24 ? "25" : n <= 56 ? "30" : "35",
        });
        return {
          pct,
          empresas: n,
          ...sim,
        };
      });

      const breakEvenOps = Math.ceil(COSTO_OPS_MENSUAL / (30 * 10 * UMA * 0.13));
      const breakEvenOpsComisiones = Math.ceil(
        (COSTO_OPS_MENSUAL + 7 * 30 * 10 * UMA * 0.13 * 0.25) / (30 * 10 * UMA * 0.13)
      );

      const zonalStats = await db.execute(sql`
        SELECT estado,
               count(*) as total,
               count(*) FILTER (WHERE lead_score >= 70) as alta_prioridad,
               coalesce(sum(potencial_aportacion_mensual), 0) as potencial,
               coalesce(avg(empleados_estimados), 30) as avg_empleados
        FROM empresas_prospectos
        WHERE estado IS NOT NULL
        GROUP BY estado ORDER BY sum(potencial_aportacion_mensual) DESC NULLS LAST LIMIT 10
      `);

      const topSectors = await db.execute(sql`
        SELECT grupo_sector as sector, count(*) as count,
               coalesce(sum(potencial_aportacion_mensual), 0) as potencial
        FROM empresas_prospectos
        WHERE grupo_sector IS NOT NULL
        GROUP BY grupo_sector ORDER BY sum(potencial_aportacion_mensual) DESC NULLS LAST LIMIT 10
      `);

      const topMunicipios = await db.execute(sql`
        SELECT municipio, count(*) as count,
               count(*) FILTER (WHERE lead_score >= 70) as alta_prioridad
        FROM empresas_prospectos
        WHERE municipio IS NOT NULL AND lead_score >= 70
        GROUP BY municipio ORDER BY count(*) DESC LIMIT 10
      `);

      res.json({
        mercado: {
          total: Number(totals.total || 0),
          con11Plus: Number(totals.con_11_plus || 0),
          altaPrioridad: Number(totals.alta_prioridad || 0),
          potencialAnual: potencialMensual * 12,
          feePotencialAnual: feePotencialMensual * 12,
          avgEmpleados: Math.round(Number(totals.avg_empleados || 30)),
        },
        captureAnalysis,
        breakEven: { ops: breakEvenOps, opsComisiones: breakEvenOpsComisiones },
        zonalStats: rows(zonalStats),
        topSectors: rows(topSectors),
        topMunicipios: rows(topMunicipios),
      });
    } catch (e) { next(e); }
  });
}
