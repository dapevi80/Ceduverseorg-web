// Puntos totales del trabajador (spec 2026-07-18 §6, extendido para "Mis
// hallazgos" — docs/superpowers/plans/2026-07-18-detector-riesgos.md Task 9).
// Dos fuentes, ambas expresadas ya como listas de números (la agregación en
// SQL/Drizzle vive en la ruta, nunca aquí):
// - findingsPoints: risk_findings.points_awarded del trabajador — 0 en cada
//   fila hasta que la empresa VALIDA el hallazgo (nunca al enviarlo, ver
//   server/lib/risk-status.ts RIESGO_VALIDADO_PUNTOS), así que sumarlas tal
//   cual ya excluye lo no validado sin que este módulo necesite saber de
//   estados.
// - achievementValues: achievements.value vía achievement_users — los
//   certificados/diplomas de curso ya otorgados viven aquí: no hay una fuente
//   de puntos de certificado aparte, viven junto con cualquier otro achievement.
//
// Task 10 (docs/superpowers/plans/2026-07-18-detector-riesgos.md): la
// actividad de campo del playbook (evidencia por ejercicio) se retiró — ya no
// hay una tercera fuente `evidencePoints`. Las filas históricas de
// `playbook_evidence` (si las hubiera; el operador decide si se conservan,
// ver migrations/2026-07-19_risk_findings.sql) ya no se suman al total: se
// dejó de leer esa tabla, no se borró su contenido.
//
// totalPoints() agrega las dos — PURA, sin DB/I-O — para que la UI muestre
// un solo número acumulado sin perder el desglose por fuente (la ruta puede
// seguir exponiendo cada suma por separado para premiar fuentes distinto
// más adelante).

export const PLAYBOOK_COMPLETION_BONUS = 500;

export interface PointsInput {
  findingsPoints: number[];
  achievementValues: number[];
}

export function totalPoints(input: PointsInput): number {
  const findingsSum = input.findingsPoints.reduce((s, p) => s + p, 0);
  const achievementSum = input.achievementValues.reduce((s, v) => s + v, 0);
  return findingsSum + achievementSum;
}
