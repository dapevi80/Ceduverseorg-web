import { describe, it, expect } from "vitest";
import { EVIDENCE_MAX_MB, isImageMimetype, extensionForMimetype, validateEvidenceFile, shouldAwardCompletionBonus, isUniqueViolation } from "./playbook-upload";

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

describe("extensionForMimetype", () => {
  it("mapea jpeg/png/webp a su extensión real (no todo a .jpg)", () => {
    expect(extensionForMimetype("image/jpeg")).toBe("jpg");
    expect(extensionForMimetype("image/png")).toBe("png");
    expect(extensionForMimetype("image/webp")).toBe("webp");
  });

  it("es insensible a mayúsculas", () => {
    expect(extensionForMimetype("IMAGE/PNG")).toBe("png");
  });

  it("un image/* desconocido cae a jpg como default seguro", () => {
    expect(extensionForMimetype("image/x-made-up")).toBe("jpg");
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

describe("isUniqueViolation (tolerancia de carrera en awardAchievement/createAchievement)", () => {
  it("error de pg con code 23505 → true", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("Error real con code 23505 adjunto (forma típica del driver pg) → true", () => {
    const err = new Error("duplicate key value violates unique constraint");
    (err as unknown as { code: string }).code = "23505";
    expect(isUniqueViolation(err)).toBe(true);
  });

  it("otro código de error de pg (p.ej. FK violation 23503) → false, no se tolera", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });

  it("error sin code → false", () => {
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
  });

  it("valores no-error (null, undefined, string, number) → false", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation("boom")).toBe(false);
    expect(isUniqueViolation(42)).toBe(false);
  });
});
