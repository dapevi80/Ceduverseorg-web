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

  it("lista desordenada y ordenada", () => {
    expect(htmlToBlocks("<ul><li>a</li><li>b</li></ul>")[0]).toMatchObject({ kind: "list", ordered: false });
    expect(htmlToBlocks("<ol><li>a</li></ol>")[0]).toMatchObject({ kind: "list", ordered: true });
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
