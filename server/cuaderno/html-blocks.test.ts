import { describe, it, expect } from "vitest";
import { htmlToBlocks } from "./html-blocks";

describe("htmlToBlocks", () => {
  it("vacío -> sin bloques", () => {
    expect(htmlToBlocks("")).toEqual([]);
  });

  it("h2 y h3 conservan su nivel", () => {
    const b = htmlToBlocks("<h2>Uno</h2><h3>Dos</h3>");
    expect(b).toEqual([
      { kind: "heading", level: 2, text: "Uno" },
      { kind: "heading", level: 3, text: "Dos" },
    ]);
  });

  it("párrafo con negrita y cursiva se parte en runs", () => {
    const b = htmlToBlocks("<p>Hola <strong>mundo</strong> y <em>algo</em></p>");
    expect(b[0]).toMatchObject({ kind: "paragraph" });
    const runs = (b[0] as any).runs;
    expect(runs.map((r: any) => r.text.trim()).filter(Boolean)).toEqual(["Hola", "mundo", "y", "algo"]);
    expect(runs.find((r: any) => r.text.includes("mundo")).bold).toBe(true);
    expect(runs.find((r: any) => r.text.includes("algo")).italic).toBe(true);
  });

  it("lista desordenada y ordenada: items son ListItem[] con level 0", () => {
    const ul = htmlToBlocks("<ul><li>a</li><li>b</li></ul>")[0] as any;
    expect(ul).toMatchObject({ kind: "list", ordered: false });
    expect(ul.items).toEqual([
      { runs: [{ text: "a" }], level: 0 },
      { runs: [{ text: "b" }], level: 0 },
    ]);

    const ol = htmlToBlocks("<ol><li>a</li></ol>")[0] as any;
    expect(ol).toMatchObject({ kind: "list", ordered: true });
    expect(ol.items).toEqual([{ runs: [{ text: "a" }], level: 0 }]);
  });

  it("lista anidada: los items de la sublista se aplanan con level incrementado (finding 4)", () => {
    const b = htmlToBlocks("<ul><li>a<ul><li>a1</li></ul></li><li>b</li></ul>")[0] as any;
    expect(b.kind).toBe("list");
    expect(b.items).toEqual([
      { runs: [{ text: "a" }], level: 0 },
      { runs: [{ text: "a1" }], level: 1 },
      { runs: [{ text: "b" }], level: 0 },
    ]);
  });

  it("<br> separa palabras en vez de fusionarlas (finding 1)", () => {
    const b = htmlToBlocks("<p>linea1<br>linea2</p>") as any;
    const joined = b[0].runs.map((r: any) => r.text).join("");
    expect(joined).not.toBe("linea1linea2");
    expect(joined.replace(/\s+/g, " ").trim()).toBe("linea1 linea2");
  });

  it("negrita+cursiva anidada conserva ambos flags: strong>em (finding 2)", () => {
    const b = htmlToBlocks("<p><strong>bold <em>emph</em></strong></p>") as any;
    const runs = b[0].runs;
    const boldOnly = runs.find((r: any) => r.text.trim() === "bold");
    const boldItalic = runs.find((r: any) => r.text.trim() === "emph");
    expect(boldOnly.bold).toBe(true);
    expect(boldOnly.italic).toBeUndefined();
    expect(boldItalic.bold).toBe(true);
    expect(boldItalic.italic).toBe(true);
  });

  it("negrita+cursiva anidada conserva ambos flags: em>strong (finding 2, orden simétrico)", () => {
    const b = htmlToBlocks("<p><em>ital <strong>both</strong></em></p>") as any;
    const runs = b[0].runs;
    const italicOnly = runs.find((r: any) => r.text.trim() === "ital");
    const both = runs.find((r: any) => r.text.trim() === "both");
    expect(italicOnly.italic).toBe(true);
    expect(italicOnly.bold).toBeUndefined();
    expect(both.bold).toBe(true);
    expect(both.italic).toBe(true);
  });

  it("colspan mantiene headers y filas alineados (finding 3)", () => {
    const b = htmlToBlocks(
      '<table><tr><th colspan="2">A</th></tr><tr><td>1</td><td>2</td></tr></table>'
    )[0] as any;
    expect(b.kind).toBe("table");
    const maxRowLen = b.rows.reduce((m: number, r: string[]) => Math.max(m, r.length), 0);
    expect(b.headers.length === 0 || b.headers.length === maxRowLen).toBe(true);
    expect(b.headers).toEqual(["A", "A"]);
    expect(b.rows).toEqual([["1", "2"]]);
  });

  it("tabla con encabezados y filas", () => {
    const b = htmlToBlocks("<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>");
    expect(b[0]).toEqual({ kind: "table", headers: ["A", "B"], rows: [["1", "2"]] });
  });

  it("tabla sin th: la primera fila NO se asume encabezado", () => {
    const b = htmlToBlocks("<table><tr><td>1</td><td>2</td></tr></table>") as any;
    expect(b[0].headers).toEqual([]);
    expect(b[0].rows).toEqual([["1", "2"]]);
  });

  it("blockquote", () => {
    expect(htmlToBlocks("<blockquote>cita</blockquote>")[0]).toMatchObject({ kind: "quote" });
  });

  it("etiquetas desconocidas no pierden su texto", () => {
    const b = htmlToBlocks("<section><p>visible</p></section>");
    expect(JSON.stringify(b)).toContain("visible");
  });

  it("entidades HTML se decodifican", () => {
    const b = htmlToBlocks("<p>caf&eacute; &amp; m&aacute;s</p>") as any;
    expect(b[0].runs.map((r: any) => r.text).join("")).toContain("café & más");
  });

  it("HTML roto no lanza", () => {
    expect(() => htmlToBlocks("<p>sin cerrar <strong>nada")).not.toThrow();
  });
});
