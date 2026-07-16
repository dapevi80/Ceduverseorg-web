import { describe, it, expect } from "vitest";
import { isBlockingDuplicateStatus } from "./cert-duplicate";

describe("cert-duplicate", () => {
  it("pending_payment no bloquea (reusable: retry de checkout abandonado)", () => {
    expect(isBlockingDuplicateStatus("pending_payment")).toBe(false);
  });
  it("rechazado no bloquea (reusable: comportamiento existente)", () => {
    expect(isBlockingDuplicateStatus("rechazado")).toBe(false);
  });
  it("solicitado bloquea", () => {
    expect(isBlockingDuplicateStatus("solicitado")).toBe(true);
  });
  it("en_proceso bloquea", () => {
    expect(isBlockingDuplicateStatus("en_proceso")).toBe(true);
  });
  it("emitido bloquea", () => {
    expect(isBlockingDuplicateStatus("emitido")).toBe(true);
  });
});
