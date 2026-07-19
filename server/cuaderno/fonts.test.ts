import fs from "node:fs";
import PDFDocument from "pdfkit";
import { describe, expect, it, vi } from "vitest";
import { FONT_FILES, registerCuadernoFonts } from "./fonts";

describe("FONT_FILES — rutas reales de las fuentes de marca", () => {
  it("resuelve las 4 variantes a rutas que existen en disco", () => {
    expect(FONT_FILES.serif).toBeTruthy();
    expect(FONT_FILES.serifItalic).toBeTruthy();
    expect(FONT_FILES.sans).toBeTruthy();
    expect(FONT_FILES.sansBold).toBeTruthy();

    for (const filePath of [
      FONT_FILES.serif,
      FONT_FILES.serifItalic,
      FONT_FILES.sans,
      FONT_FILES.sansBold,
    ]) {
      expect(fs.existsSync(filePath as string)).toBe(true);
    }
  });

  it("apunta a DM Serif Display y Plus Jakarta Sans, no a otra tipografía", () => {
    expect(FONT_FILES.serif).toMatch(/dm-serif-display/i);
    expect(FONT_FILES.serifItalic).toMatch(/dm-serif-display.*italic/i);
    expect(FONT_FILES.sans).toMatch(/plus-jakarta-sans/i);
    expect(FONT_FILES.sansBold).toMatch(/plus-jakarta-sans.*700/i);
  });
});

describe("registerCuadernoFonts — incrustación en un PDFDocument real", () => {
  it("registra las 4 fuentes reales sin lanzar y devuelve nombres usables en doc.font()", () => {
    const doc = new PDFDocument();
    let names: ReturnType<typeof registerCuadernoFonts> | undefined;

    expect(() => {
      names = registerCuadernoFonts(doc);
    }).not.toThrow();

    expect(names).toBeDefined();
    expect(names!.serif.length).toBeGreaterThan(0);
    expect(names!.serifItalic.length).toBeGreaterThan(0);
    expect(names!.sans.length).toBeGreaterThan(0);
    expect(names!.sansBold.length).toBeGreaterThan(0);

    // Los nombres devueltos deben ser aceptados por doc.font() sin lanzar,
    // que es el contrato real que consumen los renderizadores del cuaderno.
    // Se usa texto con acentos a propósito: @fontsource ships .woff2 files
    // that make fontkit's TTF subsetter throw on accented latin glyphs
    // ("Offset is outside the bounds of the DataView") — this guards against
    // regressing back to .woff2.
    expect(() => {
      doc.font(names!.serif).fontSize(20).text("Ceduverse — Cuaderno de estudio: año, mañana");
      doc.font(names!.serifItalic).fontSize(12).text("subtítulo en cursiva: José, acción");
      doc.font(names!.sans).fontSize(10).text("cuerpo de texto en Plus Jakarta Sans: día, código");
      doc.font(names!.sansBold).fontSize(10).text("texto en negritas: información, política");
    }).not.toThrow();

    // El fallo real ocurre al finalizar/incrustar el subset de la fuente,
    // no sólo al llamar .text() — por eso el gate exige que doc.end() no lance.
    expect(() => doc.end()).not.toThrow();
  });

  it("cuando faltan los archivos reales, no lanza, produce el PDF, y usa Helvetica (nunca fuera de marca en silencio)", () => {
    const doc = new PDFDocument();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const names = registerCuadernoFonts(doc, {
      serif: "/ruta/inexistente/dm-serif-display.woff2",
      serifItalic: null,
      sans: FONT_FILES.sans,
      sansBold: FONT_FILES.sansBold,
    });

    // Respaldo honesto: nombre Helvetica real, no un nombre de marca roto.
    expect(names.serif).toBe("Helvetica");
    expect(names.serifItalic).toBe("Helvetica-Oblique");
    // Las que sí existen se siguen registrando con su nombre de marca.
    expect(names.sans).not.toBe("Helvetica");
    expect(names.sansBold).not.toBe("Helvetica-Bold");

    // El respaldo debe quedar registrado explícitamente, no en silencio.
    expect(errorSpy).toHaveBeenCalled();
    const loggedText = errorSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(loggedText).toMatch(/serif/i);
    expect(loggedText).toMatch(/Helvetica/);

    expect(() => {
      doc.font(names.serif).fontSize(14).text("respaldo Helvetica");
    }).not.toThrow();

    errorSpy.mockRestore();
    doc.end();
  });
});
