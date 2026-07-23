import { describe, it, expect } from "vitest";
import { extractCitationRefIds, validateCitations, findModulesCiting } from "./course-citations";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

describe("extractCitationRefIds", () => {
  it("devuelve vacio sin marcas", () => {
    expect(extractCitationRefIds("<p>Sin citas</p>")).toEqual([]);
    expect(extractCitationRefIds("")).toEqual([]);
  });

  it("encuentra una marca", () => {
    expect(extractCitationRefIds(`<p>Segun [[ref:${A}]] el riesgo baja.</p>`)).toEqual([A]);
  });

  it("encuentra varias en orden de aparicion", () => {
    expect(extractCitationRefIds(`<p>[[ref:${B}]] y luego [[ref:${A}]]</p>`)).toEqual([B, A]);
  });

  it("no duplica la misma marca repetida", () => {
    expect(extractCitationRefIds(`<p>[[ref:${A}]] ... [[ref:${A}]]</p>`)).toEqual([A]);
  });

  it("ignora marcas malformadas", () => {
    expect(extractCitationRefIds("<p>[[ref:no-es-uuid]] [[ref:]] [[ref]]</p>")).toEqual([]);
  });
});

describe("validateCitations", () => {
  it("pasa cuando todas las referencias existen", () => {
    expect(validateCitations(`<p>[[ref:${A}]]</p>`, [A, B])).toEqual({ ok: true });
  });

  it("pasa cuando no hay citas", () => {
    expect(validateCitations("<p>nada</p>", [])).toEqual({ ok: true });
  });

  it("falla y nombra las que faltan", () => {
    expect(validateCitations(`<p>[[ref:${A}]] [[ref:${C}]]</p>`, [A])).toEqual({ ok: false, missing: [C] });
  });
});

describe("findModulesCiting", () => {
  it("lista los modulos que citan la referencia", () => {
    const modules = [
      { id: "m1", title: "Uno", contentHtml: `<p>[[ref:${A}]]</p>` },
      { id: "m2", title: "Dos", contentHtml: `<p>sin citas</p>` },
      { id: "m3", title: "Tres", contentHtml: `<p>[[ref:${A}]] [[ref:${B}]]</p>` },
    ];
    expect(findModulesCiting(A, modules)).toEqual([
      { id: "m1", title: "Uno" },
      { id: "m3", title: "Tres" },
    ]);
  });

  it("tolera contentHtml nulo", () => {
    expect(findModulesCiting(A, [{ id: "m1", title: "Uno", contentHtml: null }])).toEqual([]);
  });
});
