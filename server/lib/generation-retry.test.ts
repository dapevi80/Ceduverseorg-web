import { describe, it, expect } from "vitest";
import {
  MAX_OUTPUT_TOKENS,
  CALL1_MAX_TOKENS,
  isTruncatedResponse,
  nextMaxTokens,
  canRetryWithMoreTokens,
  isPoisonedGeneration,
  shouldServeCache,
  resolveGenerationStatus,
  BACKOFF_BASE_MS,
  BACKOFF_CAP_MS,
  MAX_CONSECUTIVE_FAILURES,
  MANUAL_REGENERATE_MIN_INTERVAL_MS,
  backoffDelayMs,
  hasReachedFailureCeiling,
  canAutoRetry,
  nextRetryAt,
  canManualRegenerate,
  manualRegenerateWaitMs,
} from "./generation-retry";

describe("isTruncatedResponse", () => {
  it("max_tokens -> truncada (el caso que devolvía tool_use parcial como éxito)", () => {
    expect(isTruncatedResponse("max_tokens")).toBe(true);
  });

  it("end_turn / tool_use / stop_sequence -> no truncada", () => {
    expect(isTruncatedResponse("end_turn")).toBe(false);
    expect(isTruncatedResponse("tool_use")).toBe(false);
    expect(isTruncatedResponse("stop_sequence")).toBe(false);
  });

  it("null / undefined -> no truncada", () => {
    expect(isTruncatedResponse(null)).toBe(false);
    expect(isTruncatedResponse(undefined)).toBe(false);
  });
});

describe("nextMaxTokens", () => {
  it("duplica el presupuesto para que el reintento tenga margen real", () => {
    expect(nextMaxTokens(16000)).toBe(32000);
    expect(nextMaxTokens(CALL1_MAX_TOKENS)).toBe(64000);
  });

  it("no rebasa el techo duro", () => {
    expect(nextMaxTokens(MAX_OUTPUT_TOKENS)).toBe(MAX_OUTPUT_TOKENS);
    expect(nextMaxTokens(MAX_OUTPUT_TOKENS - 1000)).toBe(MAX_OUTPUT_TOKENS);
  });
});

describe("canRetryWithMoreTokens", () => {
  it("primer intento con margen disponible -> reintenta", () => {
    expect(canRetryWithMoreTokens(CALL1_MAX_TOKENS, 0, 1)).toBe(true);
  });

  it("sin reintentos restantes -> no", () => {
    expect(canRetryWithMoreTokens(CALL1_MAX_TOKENS, 1, 1)).toBe(false);
  });

  it("ya en el techo -> no reintenta (el retry saldría idéntico)", () => {
    expect(canRetryWithMoreTokens(MAX_OUTPUT_TOKENS, 0, 1)).toBe(false);
  });
});

describe("isPoisonedGeneration", () => {
  it("status failed -> envenenada", () => {
    expect(isPoisonedGeneration({ generationStatus: "failed", isStub: false })).toBe(true);
  });

  it("isStub true -> envenenada aunque el status diga complete", () => {
    expect(isPoisonedGeneration({ generationStatus: "complete", isStub: true })).toBe(true);
  });

  it("contenido real -> no envenenada", () => {
    expect(isPoisonedGeneration({ generationStatus: "complete", isStub: false })).toBe(false);
    expect(isPoisonedGeneration({ generationStatus: "partial", isStub: false })).toBe(false);
  });

  it("sin fila -> no envenenada", () => {
    expect(isPoisonedGeneration(null)).toBe(false);
    expect(isPoisonedGeneration(undefined)).toBe(false);
  });
});

describe("shouldServeCache", () => {
  const good = { generationStatus: "complete", isStub: false };

  it("contenido bueno sin regenerate -> se sirve", () => {
    expect(shouldServeCache(good, false)).toBe(true);
  });

  it("regenerate=true -> nunca sirve cache", () => {
    expect(shouldServeCache(good, true)).toBe(false);
  });

  it("sin fila -> no sirve cache", () => {
    expect(shouldServeCache(null, false)).toBe(false);
  });

  it("generando -> no sirve (el caller devuelve 202 y el cliente hace poll)", () => {
    expect(shouldServeCache({ generationStatus: "generating", isStub: false }, false)).toBe(false);
  });

  it("REGRESION: fila envenenada NO se sirve para siempre -> deja regenerar", () => {
    expect(shouldServeCache({ generationStatus: "failed", isStub: true }, false)).toBe(false);
    expect(shouldServeCache({ generationStatus: "failed", isStub: false }, false)).toBe(false);
    expect(shouldServeCache({ generationStatus: "complete", isStub: true }, false)).toBe(false);
  });

  it("parcial no es veneno -> sí se sirve (hay lectura real, falta quiz/guion)", () => {
    expect(shouldServeCache({ generationStatus: "partial", isStub: false }, false)).toBe(true);
  });
});

describe("resolveGenerationStatus", () => {
  it("stub -> failed", () => {
    expect(resolveGenerationStatus({ isStub: true, quizCount: 0, hasClassScript: false })).toBe("failed");
  });

  it("quiz + guion -> complete", () => {
    expect(resolveGenerationStatus({ isStub: false, quizCount: 7, hasClassScript: true })).toBe("complete");
  });

  it("quiz sin guion -> partial (sin guion el /audio responde 404 no_script)", () => {
    expect(resolveGenerationStatus({ isStub: false, quizCount: 7, hasClassScript: false })).toBe("partial");
  });

  it("guion sin quiz -> partial", () => {
    expect(resolveGenerationStatus({ isStub: false, quizCount: 0, hasClassScript: true })).toBe("partial");
  });
});

describe("backoffDelayMs", () => {
  it("0 fallas -> 0 (nada que esperar, aún no ha fallado nada)", () => {
    expect(backoffDelayMs(0)).toBe(0);
  });

  it("negativo (defensivo) -> 0", () => {
    expect(backoffDelayMs(-1)).toBe(0);
  });

  it("curva: 30s, 2m, 8m, 32m, luego tope de 1h", () => {
    expect(backoffDelayMs(1)).toBe(BACKOFF_BASE_MS); // 30s
    expect(backoffDelayMs(2)).toBe(120_000); // 2m
    expect(backoffDelayMs(3)).toBe(480_000); // 8m
    expect(backoffDelayMs(4)).toBe(1_920_000); // 32m
    expect(backoffDelayMs(5)).toBe(BACKOFF_CAP_MS); // 7680s crudo -> tope 1h
  });

  it("nunca rebasa el tope aunque sigan acumulándose fallas", () => {
    expect(backoffDelayMs(6)).toBe(BACKOFF_CAP_MS);
    expect(backoffDelayMs(20)).toBe(BACKOFF_CAP_MS);
  });
});

describe("hasReachedFailureCeiling", () => {
  it("por debajo del techo -> no", () => {
    expect(hasReachedFailureCeiling(MAX_CONSECUTIVE_FAILURES - 1)).toBe(false);
  });

  it("exactamente en el techo -> sí (boundary)", () => {
    expect(hasReachedFailureCeiling(MAX_CONSECUTIVE_FAILURES)).toBe(true);
  });

  it("por encima del techo -> sí", () => {
    expect(hasReachedFailureCeiling(MAX_CONSECUTIVE_FAILURES + 1)).toBe(true);
  });

  it("techo custom", () => {
    expect(hasReachedFailureCeiling(2, 2)).toBe(true);
    expect(hasReachedFailureCeiling(1, 2)).toBe(false);
  });
});

describe("canAutoRetry", () => {
  const now = Date.parse("2026-07-17T12:00:00.000Z");

  it("1a falla, todavía dentro de los 30s de espera -> no", () => {
    expect(canAutoRetry({
      consecutiveFailures: 1,
      lastAttemptAt: now - 29_000,
      now,
    })).toBe(false);
  });

  it("1a falla, justo en el boundary de 30s -> sí", () => {
    expect(canAutoRetry({
      consecutiveFailures: 1,
      lastAttemptAt: now - 30_000,
      now,
    })).toBe(true);
  });

  it("1a falla, ya pasaron los 30s -> sí", () => {
    expect(canAutoRetry({
      consecutiveFailures: 1,
      lastAttemptAt: now - 31_000,
      now,
    })).toBe(true);
  });

  it("2a falla, sólo pasaron 30s (hace falta 2m) -> no", () => {
    expect(canAutoRetry({
      consecutiveFailures: 2,
      lastAttemptAt: now - 30_000,
      now,
    })).toBe(false);
  });

  it("2a falla, pasaron los 2m completos -> sí", () => {
    expect(canAutoRetry({
      consecutiveFailures: 2,
      lastAttemptAt: now - 120_000,
      now,
    })).toBe(true);
  });

  it("en el techo de fallas -> no, sin importar cuánto tiempo pasó", () => {
    expect(canAutoRetry({
      consecutiveFailures: MAX_CONSECUTIVE_FAILURES,
      lastAttemptAt: now - 10 * 60 * 60 * 1000,
      now,
    })).toBe(false);
  });

  it("sin lastAttemptAt válido -> no hay nada que esperar, permite reintentar", () => {
    expect(canAutoRetry({
      consecutiveFailures: 3,
      lastAttemptAt: "not-a-date",
      now,
    })).toBe(true);
  });

  it("0 fallas -> siempre sí (nada que esperar)", () => {
    expect(canAutoRetry({ consecutiveFailures: 0, lastAttemptAt: now, now })).toBe(true);
  });
});

describe("nextRetryAt", () => {
  const now = Date.parse("2026-07-17T12:00:00.000Z");

  it("1a falla -> 30s después del último intento", () => {
    const result = nextRetryAt({ consecutiveFailures: 1, lastAttemptAt: now });
    expect(Date.parse(result!)).toBe(now + 30_000);
  });

  it("en el techo -> null (no hay próximo intento automático)", () => {
    expect(nextRetryAt({ consecutiveFailures: MAX_CONSECUTIVE_FAILURES, lastAttemptAt: now })).toBeNull();
  });
});

describe("canManualRegenerate", () => {
  const now = Date.parse("2026-07-17T12:00:00.000Z");

  it("sin intento previo -> sí (primera vez)", () => {
    expect(canManualRegenerate({ lastAttemptAt: null, now })).toBe(true);
    expect(canManualRegenerate({ lastAttemptAt: undefined, now })).toBe(true);
  });

  it("click-spam: menos de 30s desde el último intento -> no", () => {
    expect(canManualRegenerate({ lastAttemptAt: now - 5_000, now })).toBe(false);
  });

  it("justo en el boundary de 30s -> sí", () => {
    expect(canManualRegenerate({ lastAttemptAt: now - MANUAL_REGENERATE_MIN_INTERVAL_MS, now })).toBe(true);
  });

  it("bastante después de los 30s -> sí", () => {
    expect(canManualRegenerate({ lastAttemptAt: now - 60_000, now })).toBe(true);
  });

  it("REGRESION: el techo automático NO bloquea el botón manual (bypass explícito)", () => {
    // canManualRegenerate no recibe consecutiveFailures a propósito: el botón
    // ignora el techo/backoff automático, sólo se autolimita a sí mismo.
    expect(canManualRegenerate({ lastAttemptAt: now - 60_000, now })).toBe(true);
  });
});

describe("manualRegenerateWaitMs", () => {
  const now = Date.parse("2026-07-17T12:00:00.000Z");

  it("sin intento previo -> 0", () => {
    expect(manualRegenerateWaitMs({ lastAttemptAt: null, now })).toBe(0);
  });

  it("a mitad del intervalo -> falta la mitad", () => {
    expect(manualRegenerateWaitMs({ lastAttemptAt: now - 15_000, now })).toBe(15_000);
  });

  it("ya se puede -> 0, nunca negativo", () => {
    expect(manualRegenerateWaitMs({ lastAttemptAt: now - 60_000, now })).toBe(0);
  });
});
