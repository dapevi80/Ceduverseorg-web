// Pure helpers for the module-content generation pipeline (server/ai-engine.ts)
// and its cache layer (server/routes/courses.ts). Kept free of SDK/DB imports so
// they can be unit-tested without an API key or a database.

/** Techo duro de tokens de salida por respuesta. Sonnet 4.6 admite hasta 128K,
 *  pero pasar de aquí sólo encarece el reintento sin mejorar el resultado. */
export const MAX_OUTPUT_TOKENS = 64000;

/** Presupuesto inicial de la Call 1 (lectura 2.3-3k palabras + mindMap + fuentes,
 *  todo dentro de UN string JSON escapado del tool_use). Con la lectura acortada
 *  (antes 3-5k), 22000 deja margen de sobra sin esperar por un techo enorme; si
 *  aun así se trunca, el reintento sube el techo (nextMaxTokens). */
export const CALL1_MAX_TOKENS = 22000;

/** Presupuesto inicial de la Call 2 (quiz de 7 preguntas + guion de clase). */
export const CALL2_MAX_TOKENS = 12000;

/**
 * ¿La respuesta se cortó por el techo de tokens?
 *
 * Importa porque `tool_choice: { type: "tool" }` GARANTIZA un bloque `tool_use`:
 * aunque el modelo se corte a media emisión, el SDK entrega un `input` parcial
 * (objeto truthy, pero incompleto). Sin este chequeo ese parcial se devolvía
 * como éxito y aguas arriba caía al stub ("Contenido genérico") sin explicación.
 */
export function isTruncatedResponse(stopReason: string | null | undefined): boolean {
  return stopReason === "max_tokens";
}

/**
 * Techo de tokens para el siguiente intento tras un truncamiento. Duplica el
 * presupuesto (con tope) para que el reintento tenga margen real; devolver el
 * mismo valor haría que el retry fallara idéntico.
 */
export function nextMaxTokens(currentMaxTokens: number): number {
  return Math.min(currentMaxTokens * 2, MAX_OUTPUT_TOKENS);
}

/** ¿Vale la pena reintentar con más margen, o ya estamos en el tope? */
export function canRetryWithMoreTokens(currentMaxTokens: number, attempt: number, maxRetries: number): boolean {
  return attempt < maxRetries && nextMaxTokens(currentMaxTokens) > currentMaxTokens;
}

export type CachedGeneration = {
  generationStatus?: string | null;
  isStub?: boolean | null;
} | null | undefined;

// --- Backoff on regeneration after failure (fix/generacion-backoff) -------
//
// De-poisoning (isPoisonedGeneration/shouldServeCache above) was the correct
// fix for a *transient* failure being served forever. But without a floor on
// how often it may retry, a *persistent* failure (sustained 429, repeated
// truncation, bad key) regenerates on every client poll — every ~5s per the
// prod logs — and with a valid key each of those is a real, billable Claude
// call. This section adds the missing brake: exponential backoff between
// automatic retries, plus a ceiling that stops auto-regeneration entirely.

/** First automatic retry after a failure waits this long. Short on purpose:
 *  a single failure is very often a one-off blip (a dropped connection, one
 *  429), and the module should recover almost as fast as the old "no backoff
 *  at all" behavior for the common case, while still being long enough that a
 *  client's 5s poll interval can't cause more than one retry in this window. */
export const BACKOFF_BASE_MS = 30 * 1000; // 30s

/** Multiplier applied per additional consecutive failure. */
export const BACKOFF_FACTOR = 4;

/** Hard ceiling on the delay itself, independent of how many failures have
 *  piled up — otherwise the schedule keeps growing forever and a module that
 *  *does* eventually recover (key rotated, rate limit lifted) could be stuck
 *  waiting for hours. */
export const BACKOFF_CAP_MS = 60 * 60 * 1000; // 1h

/** After this many consecutive failures, stop auto-regenerating entirely —
 *  every subsequent automatic poll gets the honest failed state instead of
 *  triggering another paid attempt. 5 failures through the schedule below
 *  already represents 30s+2m+8m+32m+1h ≈ 1h42m of real attempts spread out;
 *  a 6th automatic attempt is very unlikely to succeed where 5 didn't and
 *  the user's explicit "Regenerar" remains available to try again anytime. */
export const MAX_CONSECUTIVE_FAILURES = 5;

/** Minimum time between two explicit ("Regenerar" button) attempts for the
 *  same module, regardless of backoff/ceiling — an explicit human action is
 *  allowed to bypass both, but the button itself must not be click-spammable
 *  into a billable retry storm. Matches BACKOFF_BASE_MS: long enough to kill
 *  a double-click or a bored refresh-mash, short enough that a genuine retry
 *  a few seconds later never feels artificially blocked. */
export const MANUAL_REGENERATE_MIN_INTERVAL_MS = 30 * 1000;

function toMs(value: Date | string | number | null | undefined): number {
  if (value == null) return NaN;
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * Delay before the (consecutiveFailures + 1)-th automatic attempt, given
 * `consecutiveFailures` failures have already happened in a row.
 * 0 failures -> 0 (nothing has failed yet, nothing to back off from).
 * 1 -> 30s, 2 -> 2m, 3 -> 8m, 4 -> 32m, 5+ -> capped at 1h.
 */
export function backoffDelayMs(consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return 0;
  const raw = BACKOFF_BASE_MS * Math.pow(BACKOFF_FACTOR, consecutiveFailures - 1);
  return Math.min(raw, BACKOFF_CAP_MS);
}

/** Has this module failed enough times in a row that auto-regeneration
 *  should stop entirely (leaving only the manual "Regenerar" bypass)? */
export function hasReachedFailureCeiling(
  consecutiveFailures: number,
  maxConsecutiveFailures: number = MAX_CONSECUTIVE_FAILURES,
): boolean {
  return consecutiveFailures >= maxConsecutiveFailures;
}

/**
 * Should an *automatic* poll (no explicit "Regenerar") be allowed to trigger
 * another generation attempt right now? False while backing off, and false
 * forever (until a manual attempt succeeds) once the ceiling is reached.
 */
export function canAutoRetry(input: {
  consecutiveFailures: number;
  lastAttemptAt: Date | string | number;
  now?: number;
}): boolean {
  const { consecutiveFailures } = input;
  if (hasReachedFailureCeiling(consecutiveFailures)) return false;
  const last = toMs(input.lastAttemptAt);
  if (Number.isNaN(last)) return true; // no known last attempt -> nothing to back off from
  const now = input.now ?? Date.now();
  return now - last >= backoffDelayMs(consecutiveFailures);
}

/** ISO timestamp of the next automatic retry, for the client to display
 *  ("reintentando a las..."). Null once the ceiling has been reached, since
 *  there is no next automatic attempt to announce. */
export function nextRetryAt(input: {
  consecutiveFailures: number;
  lastAttemptAt: Date | string | number;
}): string | null {
  if (hasReachedFailureCeiling(input.consecutiveFailures)) return null;
  const last = toMs(input.lastAttemptAt);
  const at = Number.isNaN(last) ? Date.now() : last + backoffDelayMs(input.consecutiveFailures);
  return new Date(at).toISOString();
}

/**
 * Rate limit for the explicit "Regenerar" button, independent of the
 * automatic backoff/ceiling above. `lastAttemptAt` is the row's last write
 * time (`generatedAt`), whatever its status.
 */
export function canManualRegenerate(input: {
  lastAttemptAt: Date | string | number | null | undefined;
  now?: number;
}): boolean {
  const last = toMs(input.lastAttemptAt);
  if (Number.isNaN(last)) return true;
  const now = input.now ?? Date.now();
  return now - last >= MANUAL_REGENERATE_MIN_INTERVAL_MS;
}

/** Milliseconds until the manual button unlocks again — for a 429 response's
 *  `retryAfterMs` so the client can disable the button intelligently instead
 *  of letting the user hammer it into more 429s. */
export function manualRegenerateWaitMs(input: {
  lastAttemptAt: Date | string | number | null | undefined;
  now?: number;
}): number {
  const last = toMs(input.lastAttemptAt);
  if (Number.isNaN(last)) return 0;
  const now = input.now ?? Date.now();
  const elapsed = now - last;
  return Math.max(0, MANUAL_REGENERATE_MIN_INTERVAL_MS - elapsed);
}

/**
 * Una fila "envenenada": un fallo transitorio (truncamiento, 429, timeout) que
 * quedó persistido como resultado final. Servirla para siempre es lo que hacía
 * que el banner no se curara solo aunque la causa ya no existiera.
 */
export function isPoisonedGeneration(cached: CachedGeneration): boolean {
  if (!cached) return false;
  return cached.generationStatus === "failed" || cached.isStub === true;
}

/**
 * ¿Se puede servir la fila cacheada tal cual?
 *
 * No, si: no hay fila; el usuario pidió regenerar; hay una generación en vuelo
 * (el caller decide 202 + poll); o la fila está envenenada (dejar que regenere).
 */
export function shouldServeCache(cached: CachedGeneration, regenerate: boolean): boolean {
  if (!cached) return false;
  if (regenerate) return false;
  if (cached.generationStatus === "generating") return false;
  // 'content_ready' es un estado INTERMEDIO (lectura lista, quiz/audio en curso),
  // nunca un final servible. Uno fresco ya se maneja aguas arriba (202, sigue en
  // curso); si llega aquí es porque quedó viejo (proceso caído a medio Call 2),
  // y entonces hay que regenerar, no servir una fila a medias como definitiva.
  if (cached.generationStatus === "content_ready") return false;
  if (isPoisonedGeneration(cached)) return false;
  return true;
}

/**
 * Estado real a persistir tras una generación. `classScript` importa: sin él la
 * ruta /audio responde 404 `no_script`, así que "complete" sin guion es mentira.
 */
export function resolveGenerationStatus(input: {
  isStub: boolean;
  quizCount: number;
  hasClassScript: boolean;
}): "failed" | "partial" | "complete" {
  if (input.isStub) return "failed";
  if (input.quizCount > 0 && input.hasClassScript) return "complete";
  return "partial";
}
