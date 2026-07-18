// Puntos del Playbook (spec 2026-07-18 §6):
// - PLAYBOOK_EVIDENCE_POINTS: puntos por CADA evidencia subida (una por ejercicio).
// - PLAYBOOK_COMPLETION_BONUS: value del logro "Playbook <curso>" al completar
//   todos los ejercicios (se otorga vía achievements/achievementUsers, no aquí).
// totalPoints() agrega ambas fuentes: SUM(playbook_evidence.points) +
// SUM(achievements.value vía achievementUsers) — agregación de puntos totales del
// usuario, net-new (spec §4.2): hoy no existe UI de puntos totales.

export const PLAYBOOK_EVIDENCE_POINTS = 100;
export const PLAYBOOK_COMPLETION_BONUS = 500;

export interface PointsInput {
  evidencePoints: number[];
  achievementValues: number[];
}

export function totalPoints(input: PointsInput): number {
  const evidenceSum = input.evidencePoints.reduce((s, p) => s + p, 0);
  const achievementSum = input.achievementValues.reduce((s, v) => s + v, 0);
  return evidenceSum + achievementSum;
}
