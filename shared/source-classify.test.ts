import { describe, it, expect } from "vitest";
import { classifySource } from "./source-classify";

describe("classifySource", () => {
  it("clasifica NOM- como oficial", () => {
    expect(classifySource("NOM-035-STPS-2018")).toBe("oficial");
  });

  it("LFT con artículos es oficial", () => {
    expect(classifySource("LFT Art. 153-I a 153-K")).toBe("oficial");
  });

  it("libro/autor sin patrón oficial ni interno es lectura", () => {
    expect(classifySource("Covey, S. - Los 7 hábitos")).toBe("lectura");
  });

  it("interna gana sobre oficial cuando matchean ambos patrones", () => {
    // "Reglamento Interno Ceduverse" matchea /Reglamento/ (oficial) Y
    // /Ceduverse/ (interna): es un documento del consorcio, debe ganar interna.
    expect(classifySource("Reglamento Interno Ceduverse")).toBe("interna");
  });

  it("clasifica variantes de instrumentos oficiales", () => {
    expect(classifySource("NMX-R-025-SCFI-2015")).toBe("oficial");
    expect(classifySource("Constitución Política de los Estados Unidos Mexicanos Art. 1")).toBe("oficial");
    expect(classifySource("Decreto por el que se reforma...")).toBe("oficial");
    expect(classifySource("Código de Comercio")).toBe("oficial");
    expect(classifySource("NIF C-8 — Norma de Información Financiera (activos intangibles)")).toBe("oficial");
    expect(classifySource("LGCG Postulados básicos")).toBe("oficial");
    expect(classifySource("RFSST Título Segundo")).toBe("oficial");
    expect(classifySource("Ley Federal del Derecho de Autor")).toBe("oficial");
    expect(classifySource("Acuerdo de criterios administrativos STPS")).toBe("oficial");
  });

  it("clasifica documentos internos del consorcio (Ceduverse / BrainShield / Kakaw)", () => {
    expect(classifySource("Manual Interno de BrainShield")).toBe("interna");
    expect(classifySource("Política de privacidad Kakaw")).toBe("interna");
    expect(classifySource("Ceduverse - Código de conducta")).toBe("interna");
  });

  it("clasifica libros, autores y conceptos como lectura", () => {
    expect(classifySource("Frankl, V. - El hombre en busca de sentido")).toBe("lectura");
    expect(classifySource("Rosenberg, M. - Comunicación No Violenta")).toBe("lectura");
    expect(classifySource("EC0038 - CONOCER")).toBe("lectura");
    expect(classifySource("Goleman, D. - Inteligencia Emocional")).toBe("lectura");
  });

  it("cadena vacía o sólo espacios es lectura, no truena", () => {
    expect(classifySource("")).toBe("lectura");
    expect(classifySource("   ")).toBe("lectura");
  });

  // Muestra real tomada del catálogo verificado (server/data/fuentes-oficiales.ts,
  // 82 instrumentos generados desde studio_modules) — todas deben salir oficial.
  const CATALOGO_REAL_OFICIAL = [
    "NOM-030-STPS-2009",
    "NOM-002-STPS-2010",
    "NOM-251-SSA1-2009",
    "Constitución Art. 123",
    "Ley General de Sociedades Cooperativas",
    "LFT Art. 132",
    "LFT - Título Cuarto",
    "LFT Art. 509 y 510",
    "NOM-004-STPS-1999 Maquinaria y equipo",
    "NOM-009-ENER-2014",
    "NOM-036-1-STPS-2018 (Ergonomía)",
    "Acuerdo de criterios administrativos",
    "Ley de la Propiedad Industrial",
    "Ley Fintech México (2018)",
    "Ley General de Derechos de NNA",
    "Reglamento de Construcciones",
    "Reglamento Federal de SST",
    "NOM-087-SEMARNAT-SSA1 RPBI",
    "NOM-127-SSA1-2021 (Agua potable)",
  ];

  it.each(CATALOGO_REAL_OFICIAL)("cita real del catálogo '%s' clasifica oficial", (cita) => {
    expect(classifySource(cita)).toBe("oficial");
  });
});
