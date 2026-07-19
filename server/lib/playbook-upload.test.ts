import { describe, it, expect } from "vitest";
import { EVIDENCE_MAX_MB, ALLOWED_EVIDENCE_MIMETYPES, isImageMimetype, extensionForMimetype, safeEvidenceContentType, validateEvidenceFile, isUniqueViolation } from "./playbook-upload";

describe("EVIDENCE_MAX_MB", () => {
  it("es 8", () => {
    expect(EVIDENCE_MAX_MB).toBe(8);
  });
});

describe("isImageMimetype", () => {
  it("acepta cada mimetype del allowlist (jpeg/png/webp/heic/heif)", () => {
    for (const mt of ALLOWED_EVIDENCE_MIMETYPES) {
      expect(isImageMimetype(mt)).toBe(true);
    }
  });

  it("rechaza pdf/video/texto", () => {
    expect(isImageMimetype("application/pdf")).toBe(false);
    expect(isImageMimetype("video/mp4")).toBe(false);
    expect(isImageMimetype("text/plain")).toBe(false);
  });

  it("rechaza image/svg+xml (stored-XSS: SVG puede traer <script> y se sirve inline)", () => {
    expect(isImageMimetype("image/svg+xml")).toBe(false);
  });

  it("rechaza otros image/* fuera del allowlist explícito (gif, wildcard genérico)", () => {
    expect(isImageMimetype("image/gif")).toBe(false);
    expect(isImageMimetype("image/x-made-up")).toBe(false);
  });

  it("es insensible a mayúsculas", () => {
    expect(isImageMimetype("IMAGE/PNG")).toBe(true);
    expect(isImageMimetype("IMAGE/SVG+XML")).toBe(false);
  });
});

describe("extensionForMimetype", () => {
  it("mapea cada mimetype del allowlist a su extensión real (no todo a .jpg)", () => {
    expect(extensionForMimetype("image/jpeg")).toBe("jpg");
    expect(extensionForMimetype("image/png")).toBe("png");
    expect(extensionForMimetype("image/webp")).toBe("webp");
    expect(extensionForMimetype("image/heic")).toBe("heic");
    expect(extensionForMimetype("image/heif")).toBe("heif");
  });

  it("es insensible a mayúsculas", () => {
    expect(extensionForMimetype("IMAGE/PNG")).toBe("png");
  });

  it("un mimetype fuera del allowlist cae a jpg como default seguro", () => {
    expect(extensionForMimetype("image/x-made-up")).toBe("jpg");
    expect(extensionForMimetype("image/svg+xml")).toBe("jpg");
  });
});

describe("safeEvidenceContentType (Content-Type servido de vuelta al proxy de foto)", () => {
  it("sirve cada mimetype del allowlist tal cual", () => {
    for (const mt of ALLOWED_EVIDENCE_MIMETYPES) {
      expect(safeEvidenceContentType(mt)).toBe(mt);
    }
  });

  it("normaliza mayúsculas a la forma del allowlist", () => {
    expect(safeEvidenceContentType("IMAGE/PNG")).toBe("image/png");
  });

  it("image/svg+xml guardado (dato viejo/corrupto) NUNCA se refleja tal cual → octet-stream", () => {
    expect(safeEvidenceContentType("image/svg+xml")).toBe("application/octet-stream");
  });

  it("cualquier valor fuera del allowlist cae a application/octet-stream", () => {
    expect(safeEvidenceContentType("text/html")).toBe("application/octet-stream");
    expect(safeEvidenceContentType("application/javascript")).toBe("application/octet-stream");
    expect(safeEvidenceContentType(null)).toBe("application/octet-stream");
    expect(safeEvidenceContentType(undefined)).toBe("application/octet-stream");
    expect(safeEvidenceContentType("")).toBe("application/octet-stream");
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

  it("image/svg+xml → rechazo explícito (stored-XSS: no basta con el prefijo image/*)", () => {
    const result = validateEvidenceFile({ mimetype: "image/svg+xml", size: 1000 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/imágenes/i);
  });

  it("cada mimetype del allowlist, dentro del límite → aceptado", () => {
    for (const mt of ALLOWED_EVIDENCE_MIMETYPES) {
      const result = validateEvidenceFile({ mimetype: mt, size: MAX_BYTES - 1 });
      expect(result.ok).toBe(true);
    }
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
