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
