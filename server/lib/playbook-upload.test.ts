import { describe, it, expect } from "vitest";
import { EVIDENCE_MAX_MB, isImageMimetype, validateEvidenceFile, shouldAwardCompletionBonus } from "./playbook-upload";

describe("EVIDENCE_MAX_MB", () => {
  it("es 8", () => {
    expect(EVIDENCE_MAX_MB).toBe(8);
  });
});

describe("isImageMimetype", () => {
  it("acepta jpeg/png/webp", () => {
    expect(isImageMimetype("image/jpeg")).toBe(true);
    expect(isImageMimetype("image/png")).toBe(true);
    expect(isImageMimetype("image/webp")).toBe(true);
  });

  it("rechaza pdf/video/texto", () => {
    expect(isImageMimetype("application/pdf")).toBe(false);
    expect(isImageMimetype("video/mp4")).toBe(false);
    expect(isImageMimetype("text/plain")).toBe(false);
  });
});

describe("validateEvidenceFile", () => {
  const MAX_BYTES = EVIDENCE_MAX_MB * 1024 * 1024;

  it("sin archivo → rechazo con mensaje claro", () => {
    const result = validateEvidenceFile(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/foto/i);
  });

  it("no-imagen → rechazo", () => {
    const result = validateEvidenceFile({ mimetype: "application/pdf", size: 1000 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/imágenes/i);
  });

  it("imagen dentro del límite → aceptado", () => {
    const result = validateEvidenceFile({ mimetype: "image/jpeg", size: MAX_BYTES - 1 });
    expect(result.ok).toBe(true);
  });

  it("imagen exactamente en el límite → aceptado", () => {
    const result = validateEvidenceFile({ mimetype: "image/jpeg", size: MAX_BYTES });
    expect(result.ok).toBe(true);
  });

  it("imagen que excede EVIDENCE_MAX_MB → rechazo con mensaje claro", () => {
    const result = validateEvidenceFile({ mimetype: "image/jpeg", size: MAX_BYTES + 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(new RegExp(`${EVIDENCE_MAX_MB}MB`));
  });
});

describe("shouldAwardCompletionBonus (dedupe del logro)", () => {
  it("completo + nunca otorgado → se otorga", () => {
    expect(shouldAwardCompletionBonus(true, false)).toBe(true);
  });

  it("completo + ya otorgado antes → NO se vuelve a otorgar (dedupe)", () => {
    expect(shouldAwardCompletionBonus(true, true)).toBe(false);
  });

  it("incompleto → nunca se otorga, sin importar el historial", () => {
    expect(shouldAwardCompletionBonus(false, false)).toBe(false);
    expect(shouldAwardCompletionBonus(false, true)).toBe(false);
  });
});
