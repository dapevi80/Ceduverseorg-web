import { describe, it, expect } from "vitest";
import { splitHtmlBySections } from "./split-html-by-heading";

describe("splitHtmlBySections", () => {
  it("html vacío → []", () => {
    expect(splitHtmlBySections("", "h2")).toEqual([]);
    expect(splitHtmlBySections("   \n  ", "h2")).toEqual([]);
  });

  it("sin headings del tag → una sola sección con todo el html sin cambios", () => {
    const html = "<p>Solo texto</p><p>Más texto</p>";
    expect(splitHtmlBySections(html, "h2")).toEqual([{ title: "", contentHtml: html }]);
  });

  it("dos secciones h2 → 2 resultados con títulos correctos", () => {
    const a = "<p>" + "a".repeat(1300) + "</p>";
    const b = "<p>" + "b".repeat(1300) + "</p>";
    const html = `<h2>Primera Sección</h2>${a}<h2>Segunda Sección</h2>${b}`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Primera Sección");
    expect(result[0].contentHtml).toBe(`<h2>Primera Sección</h2>${a}`);
    expect(result[1].title).toBe("Segunda Sección");
    expect(result[1].contentHtml).toBe(`<h2>Segunda Sección</h2>${b}`);
  });

  it("contenido intro antes del primer heading se fusiona en la primera sección (no se pierde)", () => {
    const intro = "<p>" + "i".repeat(1300) + "</p>";
    const bodyA = "<p>" + "a".repeat(1300) + "</p>";
    const bodyB = "<p>" + "b".repeat(1300) + "</p>";
    const html = `${intro}<h2>Riesgos</h2>${bodyA}<h2>Conclusión</h2>${bodyB}`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Riesgos");
    expect(result[0].contentHtml).toBe(`${intro}<h2>Riesgos</h2>${bodyA}`);
    expect(result[1].title).toBe("Conclusión");
    expect(result[1].contentHtml).toBe(`<h2>Conclusión</h2>${bodyB}`);
  });

  it("sección final diminuta (< minChars) se fusiona en la anterior", () => {
    const bodyA = "<p>" + "a".repeat(1300) + "</p>";
    const html = `<h2>Grande</h2>${bodyA}<h2>Chiquita</h2><p>corto</p>`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Grande");
    expect(result[0].contentHtml).toBe(`<h2>Grande</h2>${bodyA}<h2>Chiquita</h2><p>corto</p>`);
  });

  it("primera sección diminuta (< minChars) se fusiona en la siguiente, no queda huérfana", () => {
    const bodyB = "<p>" + "b".repeat(1300) + "</p>";
    const html = `<h2>Chiquita</h2><p>corto</p><h2>Grande</h2>${bodyB}`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Grande");
    expect(result[0].contentHtml).toBe(`<h2>Chiquita</h2><p>corto</p><h2>Grande</h2>${bodyB}`);
  });

  it("modo h3 funciona igual que h2", () => {
    const a = "<p>" + "a".repeat(1300) + "</p>";
    const b = "<p>" + "b".repeat(1300) + "</p>";
    const html = `<h3>Uno</h3>${a}<h3>Dos</h3>${b}`;
    const result = splitHtmlBySections(html, "h3");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Uno");
    expect(result[1].title).toBe("Dos");
  });

  it("no confunde h2 con h3 al buscar boundaries (ignora el otro tag)", () => {
    const a = "<p>" + "a".repeat(1300) + "</p>";
    const html = `<h2>Título</h2><h3>Sub</h3>${a}`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Título");
    expect(result[0].contentHtml).toBe(html);
  });

  it("heading con atributos (id, class) se reconoce igual", () => {
    const a = "<p>" + "a".repeat(1300) + "</p>";
    const b = "<p>" + "b".repeat(1300) + "</p>";
    const html = `<h2 id="riesgos" class="foo bar">Riesgos</h2>${a}<h2 data-x="1">Cierre</h2>${b}`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Riesgos");
    expect(result[1].title).toBe("Cierre");
    expect(result[0].contentHtml).toBe(`<h2 id="riesgos" class="foo bar">Riesgos</h2>${a}`);
  });

  it("title quita tags internos y colapsa espacios (<h2><strong>Riesgos</strong></h2> → 'Riesgos')", () => {
    const a = "<p>" + "a".repeat(1300) + "</p>";
    const html = `<h2><strong>Riesgos</strong>  y\n  <em>Retos</em></h2>${a}`;
    const result = splitHtmlBySections(html, "h2");
    expect(result[0].title).toBe("Riesgos y Retos");
  });

  it("un solo heading pequeño y contenido total < minChars → una sola sección, nada huérfano", () => {
    const html = `<h2>Todo</h2><p>corto</p>`;
    const result = splitHtmlBySections(html, "h2");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Todo");
    expect(result[0].contentHtml).toBe(html);
  });

  it("respeta opts.minChars personalizado", () => {
    const html = `<h2>A</h2><p>${"x".repeat(50)}</p><h2>B</h2><p>${"y".repeat(50)}</p>`;
    const result = splitHtmlBySections(html, "h2", { minChars: 10 });
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("A");
    expect(result[1].title).toBe("B");
  });
});
