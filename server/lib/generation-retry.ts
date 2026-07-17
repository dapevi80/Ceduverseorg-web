// Pure helpers for the module-content generation pipeline (server/ai-engine.ts)
// and its cache layer (server/routes/courses.ts). Kept free of SDK/DB imports so
// they can be unit-tested without an API key or a database.

/** Techo duro de tokens de salida por respuesta. Sonnet 4.6 admite hasta 128K,
 *  pero pasar de aquí sólo encarece el reintento sin mejorar el resultado. */
export const MAX_OUTPUT_TOKENS = 64000;

/** Presupuesto inicial de la Call 1 (lectura 3-5k palabras + mindMap + fuentes,
 *  todo dentro de UN string JSON escapado del tool_use). 16000 truncaba. */
export const CALL1_MAX_TOKENS = 32000;

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
