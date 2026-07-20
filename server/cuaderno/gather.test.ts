import { describe, it, expect } from "vitest";
import { pickModuleContent } from "./gather";

describe("pickModuleContent", () => {
  const baseHtml = "<h2>Contenido base del curso</h2><p>Texto base.</p>";

  it("sin fila de generated_content -> base, personalizado false", () => {
    expect(pickModuleContent(undefined, baseHtml)).toEqual({
      lectureHtml: baseHtml,
      personalizado: false,
    });
  });

  it("fila con isStub true -> base, personalizado false (aunque traiga lectureHtml)", () => {
    const result = pickModuleContent(
      { lectureHtml: "<p>Relleno de stub, no es contenido real.</p>", isStub: true },
      baseHtml,
    );
    expect(result).toEqual({ lectureHtml: baseHtml, personalizado: false });
  });

  it("fila con lectureHtml vacío -> base, personalizado false", () => {
    const result = pickModuleContent({ lectureHtml: "", isStub: false }, baseHtml);
    expect(result).toEqual({ lectureHtml: baseHtml, personalizado: false });
  });

  it("fila con lectureHtml sólo espacios -> base, personalizado false", () => {
    const result = pickModuleContent({ lectureHtml: "   \n\t  ", isStub: false }, baseHtml);
    expect(result).toEqual({ lectureHtml: baseHtml, personalizado: false });
  });

  it("fila con lectureHtml null -> base, personalizado false", () => {
    const result = pickModuleContent({ lectureHtml: null, isStub: false }, baseHtml);
    expect(result).toEqual({ lectureHtml: baseHtml, personalizado: false });
  });

  it("fila buena (no stub, con contenido real) -> personalizado, personalizado true", () => {
    const personal = "<h2>Tu clase personalizada</h2><p>Escrita para tu puesto.</p>";
    const result = pickModuleContent({ lectureHtml: personal, isStub: false }, baseHtml);
    expect(result).toEqual({ lectureHtml: personal, personalizado: true });
  });

  it("fila buena con isStub null (columna nullable, nunca se marcó) -> personalizado true", () => {
    const personal = "<p>Clase real.</p>";
    const result = pickModuleContent({ lectureHtml: personal, isStub: null }, baseHtml);
    expect(result).toEqual({ lectureHtml: personal, personalizado: true });
  });
});
