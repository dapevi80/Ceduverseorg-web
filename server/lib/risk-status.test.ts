import { describe, it, expect } from "vitest";
import {
  canTransition,
  validateTransition,
  pointsForTransition,
  isRiskStatus,
  RIESGO_VALIDADO_PUNTOS,
  type RiskStatus,
} from "./risk-status";

// Reglas puras de estado y puntos del detector de riesgos. El trabajador
// reporta (nuevo), la empresa revisa (en_revision) y cierra el hallazgo
// como atendido (con foto de corrección) o descartado (con motivo). Los
// puntos del trabajador SOLO se acreditan al validar (entrar a "atendido"),
// nunca al enviar, y nunca dos veces si el hallazgo se reabre y se vuelve a
// cerrar. Ver docs/superpowers/specs/2026-07-18-detector-riesgos-design.md.

describe("canTransition — grafo de estados del detector de riesgos", () => {
  it("nuevo -> en_revision: permitido", () => {
    expect(canTransition("nuevo", "en_revision")).toBe(true);
  });

  it("en_revision -> atendido: permitido", () => {
    expect(canTransition("en_revision", "atendido")).toBe(true);
  });

  it("en_revision -> descartado: permitido", () => {
    expect(canTransition("en_revision", "descartado")).toBe(true);
  });

  it("atendido -> en_revision: permitido (reabrir un hallazgo cerrado)", () => {
    expect(canTransition("atendido", "en_revision")).toBe(true);
  });

  it("descartado -> en_revision: permitido (reabrir un hallazgo descartado)", () => {
    expect(canTransition("descartado", "en_revision")).toBe(true);
  });

  it("atendido -> nuevo: NO permitido (no se retrocede hasta el inicio)", () => {
    expect(canTransition("atendido", "nuevo")).toBe(false);
  });

  it("descartado -> nuevo: NO permitido", () => {
    expect(canTransition("descartado", "nuevo")).toBe(false);
  });

  it("en_revision -> nuevo: NO permitido (no se retrocede)", () => {
    expect(canTransition("en_revision", "nuevo")).toBe(false);
  });

  it("nuevo -> atendido: NO permitido (no se puede saltar la revisión)", () => {
    expect(canTransition("nuevo", "atendido")).toBe(false);
  });

  it("nuevo -> descartado: NO permitido (no se puede saltar la revisión)", () => {
    expect(canTransition("nuevo", "descartado")).toBe(false);
  });

  it("atendido -> descartado: NO permitido (un estado terminal no salta al otro)", () => {
    expect(canTransition("atendido", "descartado")).toBe(false);
  });

  it("descartado -> atendido: NO permitido", () => {
    expect(canTransition("descartado", "atendido")).toBe(false);
  });

  it("mismo estado -> mismo estado: NO es una transición", () => {
    const estados: RiskStatus[] = ["nuevo", "en_revision", "atendido", "descartado"];
    for (const s of estados) expect(canTransition(s, s)).toBe(false);
  });
});

describe("validateTransition — reglas de cierre honesto", () => {
  it("atendido CON resolutionPhotoKey: ok", () => {
    const r = validateTransition("atendido", { resolutionPhotoKey: "riesgos/abc/solucion.jpg" });
    expect(r.ok).toBe(true);
  });

  it("atendido SIN resolutionPhotoKey: ok:false con mensaje claro en español", () => {
    const r = validateTransition("atendido", {});
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.message.length).toBeGreaterThan(0);
    expect(r.message).toMatch(/foto/i);
  });

  it("atendido con resolutionPhotoKey null: ok:false", () => {
    const r = validateTransition("atendido", { resolutionPhotoKey: null });
    expect(r.ok).toBe(false);
  });

  it("atendido con resolutionPhotoKey vacío: ok:false", () => {
    const r = validateTransition("atendido", { resolutionPhotoKey: "   " });
    expect(r.ok).toBe(false);
  });

  it("descartado CON resolutionNote: ok", () => {
    const r = validateTransition("descartado", { resolutionNote: "Duplicado del hallazgo #12" });
    expect(r.ok).toBe(true);
  });

  it("descartado SIN resolutionNote: ok:false con mensaje claro en español", () => {
    const r = validateTransition("descartado", {});
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.message.length).toBeGreaterThan(0);
    expect(r.message).toMatch(/motivo|raz[oó]n/i);
  });

  it("descartado con resolutionNote vacío: ok:false", () => {
    const r = validateTransition("descartado", { resolutionNote: "   " });
    expect(r.ok).toBe(false);
  });

  it("nuevo: no requiere nada, ok", () => {
    const r = validateTransition("nuevo", {});
    expect(r.ok).toBe(true);
  });

  it("en_revision: no requiere nada, ok", () => {
    const r = validateTransition("en_revision", {});
    expect(r.ok).toBe(true);
  });
});

describe("pointsForTransition — los puntos se acreditan al validar, nunca dos veces", () => {
  it("entrar a atendido desde en_revision, nada acreditado antes: paga RIESGO_VALIDADO_PUNTOS", () => {
    expect(pointsForTransition("en_revision", "atendido", 0)).toBe(RIESGO_VALIDADO_PUNTOS);
  });

  it("entrar a atendido cuando ya se había acreditado (reabrir y volver a cerrar): 0, no duplica", () => {
    expect(pointsForTransition("en_revision", "atendido", RIESGO_VALIDADO_PUNTOS)).toBe(0);
  });

  it("entrar a descartado: 0 puntos, sin importar el historial", () => {
    expect(pointsForTransition("en_revision", "descartado", 0)).toBe(0);
    expect(pointsForTransition("en_revision", "descartado", RIESGO_VALIDADO_PUNTOS)).toBe(0);
  });

  it("reabrir (salir de atendido hacia en_revision): 0 puntos, no es una validación", () => {
    expect(pointsForTransition("atendido", "en_revision", RIESGO_VALIDADO_PUNTOS)).toBe(0);
  });

  it("nuevo -> en_revision: 0 puntos", () => {
    expect(pointsForTransition("nuevo", "en_revision", 0)).toBe(0);
  });
});

describe("isRiskStatus — guarda de tipo para el status que manda el cliente", () => {
  it("acepta los 4 estados válidos", () => {
    for (const s of ["nuevo", "en_revision", "atendido", "descartado"]) {
      expect(isRiskStatus(s)).toBe(true);
    }
  });

  it("rechaza un string que no es un estado", () => {
    expect(isRiskStatus("aprobado")).toBe(false);
  });

  it("rechaza undefined, null, número, objeto", () => {
    expect(isRiskStatus(undefined)).toBe(false);
    expect(isRiskStatus(null)).toBe(false);
    expect(isRiskStatus(1)).toBe(false);
    expect(isRiskStatus({ status: "atendido" })).toBe(false);
  });

  it("es sensible a mayúsculas (no normaliza silenciosamente)", () => {
    expect(isRiskStatus("Atendido")).toBe(false);
  });
});
