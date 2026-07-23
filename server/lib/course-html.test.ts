import { describe, it, expect } from "vitest";
import { sanitizeCourseHtml } from "./course-html";

const A = "11111111-1111-4111-8111-111111111111";

describe("sanitizeCourseHtml", () => {
  it("conserva el formato permitido", () => {
    const html = "<p>Hola <strong>mundo</strong> y <em>algo</em></p><ul><li>uno</li></ul>";
    expect(sanitizeCourseHtml(html)).toBe(html);
  });

  it("elimina script", () => {
    expect(sanitizeCourseHtml('<p>ok</p><script>alert(1)</script>')).toBe("<p>ok</p>");
  });

  it("elimina manejadores de eventos", () => {
    expect(sanitizeCourseHtml('<p onclick="alert(1)">texto</p>')).toBe("<p>texto</p>");
  });

  it("elimina javascript: en enlaces", () => {
    const out = sanitizeCourseHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("conserva enlaces http y https", () => {
    expect(sanitizeCourseHtml('<a href="https://stps.gob.mx">STPS</a>'))
      .toContain('href="https://stps.gob.mx"');
  });

  it("conserva las marcas de cita intactas", () => {
    expect(sanitizeCourseHtml(`<p>Segun [[ref:${A}]] baja.</p>`)).toBe(`<p>Segun [[ref:${A}]] baja.</p>`);
  });

  it("tolera cadena vacia", () => {
    expect(sanitizeCourseHtml("")).toBe("");
  });
});
