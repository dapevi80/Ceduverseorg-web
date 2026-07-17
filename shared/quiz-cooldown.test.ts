import { describe, it, expect } from "vitest";
import { evaluateQuizCooldown, QUIZ_COOLDOWN_MS } from "./quiz-cooldown";

const NOW = new Date("2026-07-17T12:00:00Z");
const hace = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);

describe("evaluateQuizCooldown", () => {
  it("son 24 horas", () => {
    expect(QUIZ_COOLDOWN_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("nunca ha intentado → permitido", () => {
    expect(evaluateQuizCooldown([], NOW)).toEqual({ blocked: false, retryAfterMs: 0 });
  });

  it("reprobado hace 1 h → bloqueado, faltan 23 h", () => {
    const r = evaluateQuizCooldown([{ passed: false, createdAt: hace(1) }], NOW);
    expect(r.blocked).toBe(true);
    expect(r.retryAfterMs).toBe(23 * 60 * 60 * 1000);
  });

  it("reprobado hace 25 h → permitido", () => {
    expect(evaluateQuizCooldown([{ passed: false, createdAt: hace(25) }], NOW))
      .toEqual({ blocked: false, retryAfterMs: 0 });
  });

  it("reprobado hace exactamente 24 h → permitido", () => {
    expect(evaluateQuizCooldown([{ passed: false, createdAt: hace(24) }], NOW))
      .toEqual({ blocked: false, retryAfterMs: 0 });
  });

  it("APROBADO → el cooldown no aplica, aunque haya reprobado hace 1 minuto", () => {
    const r = evaluateQuizCooldown([
      { passed: true, createdAt: hace(72) },
      { passed: false, createdAt: new Date(NOW.getTime() - 60_000) },
    ], NOW);
    expect(r).toEqual({ blocked: false, retryAfterMs: 0 });
  });

  it("toma el intento reprobado MÁS RECIENTE, venga en el orden que venga", () => {
    const r = evaluateQuizCooldown([
      { passed: false, createdAt: hace(30) },
      { passed: false, createdAt: hace(2) },
      { passed: false, createdAt: hace(50) },
    ], NOW);
    expect(r).toEqual({ blocked: true, retryAfterMs: 22 * 60 * 60 * 1000 });
  });

  it("acepta timestamps como string (lo que devuelve el driver en JSON)", () => {
    const r = evaluateQuizCooldown([{ passed: false, createdAt: hace(1).toISOString() }], NOW);
    expect(r.blocked).toBe(true);
  });
});
