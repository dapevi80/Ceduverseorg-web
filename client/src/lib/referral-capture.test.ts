import { describe, it, expect, beforeEach } from "vitest";
import { captureReferralFromUrl, CEDU_REF_KEY } from "./referral-capture";

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

describe("referral-capture", () => {
  beforeEach(() => { for (const k in store) delete store[k]; });

  it("captura ?ref= y lo persiste en localStorage bajo cedu_ref", () => {
    captureReferralFromUrl("?ref=P-1234");
    expect(store[CEDU_REF_KEY]).toBe("P-1234");
  });

  it("recorta espacios en blanco del valor", () => {
    captureReferralFromUrl("?ref=" + encodeURIComponent("  P-1234  "));
    expect(store[CEDU_REF_KEY]).toBe("P-1234");
  });

  it("ignora ?ref= vacío y no borra un valor ya guardado (no clobber)", () => {
    store[CEDU_REF_KEY] = "P-EXISTENTE";
    captureReferralFromUrl("?ref=");
    expect(store[CEDU_REF_KEY]).toBe("P-EXISTENTE");
  });

  it("ignora ?ref= solo con espacios y no borra un valor ya guardado", () => {
    store[CEDU_REF_KEY] = "P-EXISTENTE";
    captureReferralFromUrl("?ref=" + encodeURIComponent("   "));
    expect(store[CEDU_REF_KEY]).toBe("P-EXISTENTE");
  });

  it("no hace nada si no hay parámetro ref en absoluto", () => {
    captureReferralFromUrl("?otro=valor");
    expect(store[CEDU_REF_KEY]).toBeUndefined();
  });

  it("no hace nada con un search string vacío", () => {
    captureReferralFromUrl("");
    expect(store[CEDU_REF_KEY]).toBeUndefined();
  });

  it("last-touch: un nuevo ref válido sobreescribe el anterior", () => {
    store[CEDU_REF_KEY] = "P-VIEJO";
    captureReferralFromUrl("?ref=P-NUEVO");
    expect(store[CEDU_REF_KEY]).toBe("P-NUEVO");
  });

  it("funciona con otros parámetros presentes junto a ref", () => {
    captureReferralFromUrl("?invite=abc123&ref=P-9999&utm_source=x");
    expect(store[CEDU_REF_KEY]).toBe("P-9999");
  });

  it("acepta el search string sin el signo de interrogación inicial", () => {
    captureReferralFromUrl("ref=P-5555");
    expect(store[CEDU_REF_KEY]).toBe("P-5555");
  });
});
