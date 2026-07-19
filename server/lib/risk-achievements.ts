// Logro acumulado del detector de riesgos (spec
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §8):
// "Logro detector-riesgos-<n> por acumulado (primer hallazgo validado, 5,
// 10...)". PURO a propósito: sin DB. El llamador (server/routes/riesgos.ts)
// cuenta cuántos hallazgos de un trabajador ya están en "atendido"
// (incluido el que se acaba de cerrar) y le pasa ese número aquí.
//
// Esta función solo decide EN QUÉ conteo se cruza un umbral -- no decide si
// el logro ya se otorgó antes (eso lo resuelve el llamador contra
// achievement_users, con el mismo patrón tolerante a colisión única que el
// bono de finalización del Playbook en server/routes/playbook.ts).

export const RISK_ACHIEVEMENT_THRESHOLDS = [1, 5, 10, 25, 50, 100] as const;

/**
 * Si `validatedCount` coincide EXACTO con un umbral declarado, devuelve ese
 * umbral. Nunca "el umbral más cercano" ni "todos los que ya se pasaron": el
 * llamador solo debe considerar otorgar el logro del umbral que se cruza en
 * ESTA transición (el conteo avanza de uno en uno, así que los umbrales
 * anteriores ya se otorgaron cuando se cruzaron).
 */
export function riskAchievementThreshold(validatedCount: number): number | null {
  return (RISK_ACHIEVEMENT_THRESHOLDS as readonly number[]).includes(validatedCount)
    ? validatedCount
    : null;
}

/** Slug determinístico `detector-riesgos-<n>` para achievements.slug. */
export function riskAchievementSlug(threshold: number): string {
  return `detector-riesgos-${threshold}`;
}
