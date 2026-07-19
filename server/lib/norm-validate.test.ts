import { describe, it, expect } from "vitest";
import { isAllowedNorm, pickAllowedNorm } from "./norm-validate";

// Cero invención de normas (spec §7): la IA solo puede escoger entre las
// referencias reales del curso. Esta es la puerta de validación que se
// interpone entre lo que el modelo "dice" y lo que se guarda. Deliberadamente
// EXACTA tras recortar espacios: aceptar coincidencias parciales o difusas
// dejaría que el modelo invente la precisión (el año, el numeral) que nadie
// verificó. Ver docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §7.

const ALLOWED = ["NOM-006-STPS-2014", "NOM-002-STPS-2010", "LFT Art. 153-A"];

describe("isAllowedNorm / pickAllowedNorm — coincidencia exacta, nunca parcial", () => {
  it("candidato exactamente igual a una entrada permitida → true / la devuelve", () => {
    expect(isAllowedNorm("NOM-006-STPS-2014", ALLOWED)).toBe(true);
    expect(pickAllowedNorm("NOM-006-STPS-2014", ALLOWED)).toBe("NOM-006-STPS-2014");
  });

  it("PROHIBIDO: coincidencia parcial/prefijo — 'NOM-006' no matchea 'NOM-006-STPS-2014'", () => {
    expect(isAllowedNorm("NOM-006", ALLOWED)).toBe(false);
    expect(pickAllowedNorm("NOM-006", ALLOWED)).toBeNull();
  });

  it("candidato que no está en la lista → false / null", () => {
    expect(isAllowedNorm("NOM-999-STPS-2099", ALLOWED)).toBe(false);
    expect(pickAllowedNorm("NOM-999-STPS-2099", ALLOWED)).toBeNull();
  });

  it("allowed vacío → false / null aunque el candidato sea razonable", () => {
    expect(isAllowedNorm("NOM-006-STPS-2014", [])).toBe(false);
    expect(pickAllowedNorm("NOM-006-STPS-2014", [])).toBeNull();
  });

  it("candidato null → false / null", () => {
    expect(isAllowedNorm(null, ALLOWED)).toBe(false);
    expect(pickAllowedNorm(null, ALLOWED)).toBeNull();
  });

  it("candidato undefined → false / null", () => {
    expect(isAllowedNorm(undefined, ALLOWED)).toBe(false);
    expect(pickAllowedNorm(undefined, ALLOWED)).toBeNull();
  });

  it("candidato vacío o solo espacios → false / null", () => {
    expect(isAllowedNorm("", ALLOWED)).toBe(false);
    expect(isAllowedNorm("   ", ALLOWED)).toBe(false);
    expect(pickAllowedNorm("", ALLOWED)).toBeNull();
    expect(pickAllowedNorm("   ", ALLOWED)).toBeNull();
  });

  it("coincidencia exacta con espacios alrededor del candidato → sí matchea (se recorta)", () => {
    expect(isAllowedNorm("  NOM-006-STPS-2014  ", ALLOWED)).toBe(true);
    expect(pickAllowedNorm("  NOM-006-STPS-2014  ", ALLOWED)).toBe("NOM-006-STPS-2014");
  });

  it("coincidencia exacta cuando la entrada permitida trae espacios alrededor → también se recorta", () => {
    const allowedWithSpaces = ["  NOM-006-STPS-2014  ", "NOM-002-STPS-2010"];
    expect(isAllowedNorm("NOM-006-STPS-2014", allowedWithSpaces)).toBe(true);
    expect(pickAllowedNorm("NOM-006-STPS-2014", allowedWithSpaces)).toBe("NOM-006-STPS-2014");
  });

  it("pickAllowedNorm devuelve la norma tal como está en `allowed` (verbatim), no el candidato crudo", () => {
    // Si el candidato trae espacios pero el valor permitido no, el resultado
    // debe ser el string verbatim de la lista de referencias del curso.
    const result = pickAllowedNorm("  NOM-002-STPS-2010  ", ALLOWED);
    expect(result).toBe("NOM-002-STPS-2010");
    expect(result).toBe(ALLOWED[1]);
  });

  it("sensible a mayúsculas/minúsculas: 'nom-006-stps-2014' en minúsculas NO matchea (más seguro que normalizar)", () => {
    // Decisión deliberada: normalizar mayúsculas/minúsculas abriría la puerta
    // a que el modelo "corrija" el formato exacto verbatim de la referencia.
    // La comparación exacta (solo trim, sin lowercase) es la más conservadora:
    // fuerza a que el candidato sea idéntico al texto real del curso.
    expect(isAllowedNorm("nom-006-stps-2014", ALLOWED)).toBe(false);
    expect(pickAllowedNorm("nom-006-stps-2014", ALLOWED)).toBeNull();
  });

  it("no hace fuzzy/substring match: una norma que contiene a otra como substring no cuenta", () => {
    const allowedSubset = ["NOM-006-STPS-2014 (parte general)"];
    expect(isAllowedNorm("NOM-006-STPS-2014", allowedSubset)).toBe(false);
    expect(pickAllowedNorm("NOM-006-STPS-2014", allowedSubset)).toBeNull();
  });
});
