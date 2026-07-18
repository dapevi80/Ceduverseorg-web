// Decisión pura de reintento para el Playbook (C1). Un `course_playbooks` con
// source = 'fallback' es un resultado degradado (server/playbook-generator.ts
// cayó a fallbackPlaybook() por falta de API key, cero módulos, error de la
// API, conteo de ejercicios inválido o cuerpo pedagógico vacío). Servirlo para
// siempre — como hacía el código antes de este fix — permite que UNA falla
// transitoria de Anthropic fije un curso a contenido genérico de forma
// permanente, servido a alumnos, exportado a PDF e impreso en QRs, sin señal
// para nadie ([[feedback_no_silent_degradation]], [[feedback_no_claims_falsos_contenido]]).
//
// Este módulo decide SOLO el throttle (cuándo vale la pena reintentar una
// generación real, billable), separado de server/playbook-generator.ts (I/O,
// llama a Claude) para poder testearse sin DB/SDK — mismo patrón que
// server/lib/generation-retry.ts (backoffDelayMs/canAutoRetry), cuya idea de
// "no reintentar en cada request" se reusa aquí en su forma más simple: un
// solo cooldown fijo, no backoff exponencial (el playbook se genera una vez
// por curso, no por request de un alumno con reintentos automáticos frecuentes
// como los módulos del Studio).

/** Tiempo mínimo entre reintentos automáticos de un playbook en fallback.
 *  Sin este piso, una falla persistente (API key mala, outage sostenido de
 *  Anthropic) dispararía una llamada billable a Claude en CADA
 *  GET /api/playbook/:slug — en un curso popular eso es una llamada por cada
 *  vista de página. 10 minutos absorbe ráfagas de tráfico y sigue siendo
 *  corto para que una falla transitoria se autocure dentro de la misma clase. */
export const PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS = 10 * 60 * 1000; // 10 min

export type PlaybookProvenanceRow = {
  source: string;
  generatedAt: Date | string | number;
} | null | undefined;

/** ¿Debe este request disparar un reintento de generación real?
 * - Sin fila: no aplica (el caller genera desde cero, no es un reintento).
 * - Fila con source 'ai': nunca se reintenta solo por leerla.
 * - Fila 'fallback' más reciente que el cooldown: se sirve tal cual, todavía
 *   no toca reintentar (evita el reintento en cada request).
 * - Fila 'fallback' más vieja que el cooldown (o con generatedAt inválido):
 *   toca reintentar. Si el reintento vuelve a caer en fallback,
 *   buildPlaybook() reescribe generatedAt igual, reiniciando el cooldown. */
export function shouldRetryFallbackPlaybook(row: PlaybookProvenanceRow, now: number = Date.now()): boolean {
  if (!row) return false;
  if (row.source !== "fallback") return false;
  const last = row.generatedAt instanceof Date ? row.generatedAt.getTime() : new Date(row.generatedAt).getTime();
  if (Number.isNaN(last)) return true;
  return now - last >= PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS;
}
