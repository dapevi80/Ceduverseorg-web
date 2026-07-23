import { describe, it, expect } from "vitest";
import { canPublish } from "./course-publish";

describe("canPublish", () => {
  it("permite publicar sin bibliografia", () => {
    expect(canPublish([])).toEqual({ ok: true });
  });

  it("permite publicar con todas verificadas", () => {
    expect(canPublish([
      { id: "r1", title: "NOM-035", verifiedByInstructor: true },
      { id: "r2", title: "LFT art. 153", verifiedByInstructor: true },
    ])).toEqual({ ok: true });
  });

  it("bloquea y nombra las no verificadas", () => {
    expect(canPublish([
      { id: "r1", title: "NOM-035", verifiedByInstructor: true },
      { id: "r2", title: "Fuente dudosa", verifiedByInstructor: false },
    ])).toEqual({ ok: false, unverified: [{ id: "r2", title: "Fuente dudosa" }] });
  });

  it("bloquea cuando ninguna esta verificada", () => {
    expect(canPublish([
      { id: "r1", title: "A", verifiedByInstructor: false },
      { id: "r2", title: "B", verifiedByInstructor: false },
    ])).toEqual({ ok: false, unverified: [{ id: "r1", title: "A" }, { id: "r2", title: "B" }] });
  });
});
