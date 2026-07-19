import { describe, it, expect } from "vitest";
import {
  RISK_ACHIEVEMENT_THRESHOLDS,
  riskAchievementThreshold,
  riskAchievementSlug,
} from "./risk-achievements";

describe("riskAchievementThreshold — logro acumulado por hallazgos validados", () => {
  it("el primer hallazgo validado (1) cruza un umbral", () => {
    expect(riskAchievementThreshold(1)).toBe(1);
  });

  it("todos los umbrales declarados se detectan exacto", () => {
    for (const t of RISK_ACHIEVEMENT_THRESHOLDS) {
      expect(riskAchievementThreshold(t)).toBe(t);
    }
  });

  it("un conteo que no es umbral: null (no 'el más cercano')", () => {
    expect(riskAchievementThreshold(2)).toBeNull();
    expect(riskAchievementThreshold(7)).toBeNull();
    expect(riskAchievementThreshold(99)).toBeNull();
  });

  it("0 hallazgos validados: null", () => {
    expect(riskAchievementThreshold(0)).toBeNull();
  });

  it("un conteo mayor al último umbral declarado, sin coincidir: null", () => {
    expect(riskAchievementThreshold(101)).toBeNull();
  });
});

describe("riskAchievementSlug", () => {
  it("construye el slug con el prefijo del spec §8", () => {
    expect(riskAchievementSlug(1)).toBe("detector-riesgos-1");
    expect(riskAchievementSlug(5)).toBe("detector-riesgos-5");
    expect(riskAchievementSlug(100)).toBe("detector-riesgos-100");
  });
});
