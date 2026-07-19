// Puntos totales del trabajador (spec 2026-07-18 §6, extendido para "Mis
// hallazgos" — docs/superpowers/plans/2026-07-18-detector-riesgos.md Task 9).
// Tres fuentes, todas expresadas ya como listas de números (la agregación en
// SQL/Drizzle vive en la ruta, nunca aquí):
// - findingsPoints: risk_findings.points_awarded del trabajador — 0 en cada
//   fila hasta que la empresa VALIDA el hallazgo (nunca al enviarlo, ver
//   server/lib/risk-status.ts RIESGO_VALIDADO_PUNTOS), así que sumarlas tal
//   cual ya excluye lo no validado sin que este módulo necesite saber de
//   estados.
// - evidencePoints: playbook_evidence.points — puntos por CADA evidencia
//   subida (una por ejercicio). PLAYBOOK_EVIDENCE_POINTS es el valor con el
//   que se generan esas filas.
// - achievementValues: achievements.value vía achievement_users — incluye el
//   bono de finalización del Playbook (PLAYBOOK_COMPLETION_BONUS) Y,
//   importante, los certificados/diplomas de curso ya otorgados por esta
//   misma tabla: no hay una fuente de puntos de certificado aparte, viven
//   aquí junto con cualquier otro achievement.
//
// totalPoints() agrega las tres — PURA, sin DB/I-O — para que la UI muestre
// un solo número acumulado sin perder el desglose por fuente (la ruta puede
// seguir exponiendo cada suma por separado para premiar fuentes distinto
// más adelante).

export const PLAYBOOK_EVIDENCE_POINTS = 100;
export const PLAYBOOK_COMPLETION_BONUS = 500;

export interface PointsInput {
  findingsPoints: number[];
  evidencePoints: number[];
  achievementValues: number[];
}

export function totalPoints(input: PointsInput): number {
  const findingsSum = input.findingsPoints.reduce((s, p) => s + p, 0);
  const evidenceSum = input.evidencePoints.reduce((s, p) => s + p, 0);
  const achievementSum = input.achievementValues.reduce((s, v) => s + v, 0);
  return findingsSum + evidenceSum + achievementSum;
}
