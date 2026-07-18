import { describe, it, expect } from "vitest";
import { shouldRetryFallbackPlaybook, PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS } from "./playbook-retry";

const NOW = new Date("2026-07-18T12:00:00Z").getTime();

describe("shouldRetryFallbackPlaybook", () => {
  it("sin fila (aún no generado) → false, no es un caso de reintento", () => {
    expect(shouldRetryFallbackPlaybook(null, NOW)).toBe(false);
    expect(shouldRetryFallbackPlaybook(undefined, NOW)).toBe(false);
  });

  it("fila source 'ai' → nunca se reintenta, sin importar la antigüedad", () => {
    const veryOld = new Date(NOW - 365 * 24 * 60 * 60 * 1000);
    expect(shouldRetryFallbackPlaybook({ source: "ai", generatedAt: veryOld }, NOW)).toBe(false);
  });

  it("fila 'fallback' recién escrita (dentro del cooldown) → NO reintenta todavía", () => {
    const recent = new Date(NOW - 1000);
    expect(shouldRetryFallbackPlaybook({ source: "fallback", generatedAt: recent }, NOW)).toBe(false);
  });

  it("fila 'fallback' justo en el borde del cooldown (exactamente igual) → reintenta", () => {
    const atEdge = new Date(NOW - PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS);
    expect(shouldRetryFallbackPlaybook({ source: "fallback", generatedAt: atEdge }, NOW)).toBe(true);
  });

  it("fila 'fallback' más vieja que el cooldown → reintenta", () => {
    const old = new Date(NOW - PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS - 1000);
    expect(shouldRetryFallbackPlaybook({ source: "fallback", generatedAt: old }, NOW)).toBe(true);
  });

  it("fila 'fallback' con generatedAt como string ISO → funciona igual que Date", () => {
    const old = new Date(NOW - PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS - 1000).toISOString();
    expect(shouldRetryFallbackPlaybook({ source: "fallback", generatedAt: old }, NOW)).toBe(true);
  });

  it("fila 'fallback' con generatedAt inválido → reintenta (no puede back off de una fecha desconocida)", () => {
    expect(shouldRetryFallbackPlaybook({ source: "fallback", generatedAt: "not-a-date" }, NOW)).toBe(true);
  });

  it("usa Date.now() por defecto cuando no se pasa `now`", () => {
    // Solo verifica que la firma con default no explota y da un booleano.
    const result = shouldRetryFallbackPlaybook({ source: "fallback", generatedAt: new Date() });
    expect(typeof result).toBe("boolean");
  });
});
