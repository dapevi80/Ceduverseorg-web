import { describe, it, expect } from "vitest";
import { CERT_PRICES_MXN, isPaidCertType, resolveCertPriceMxn } from "./cert-pricing";

describe("cert-pricing", () => {
  it("precios exactos dc3=499, sep=1999", () => {
    expect(CERT_PRICES_MXN.dc3).toBe(499);
    expect(CERT_PRICES_MXN.sep).toBe(1999);
  });
  it("isPaidCertType reconoce dc3/sep y rechaza diploma/otros", () => {
    expect(isPaidCertType("dc3")).toBe(true);
    expect(isPaidCertType("sep")).toBe(true);
    expect(isPaidCertType("diploma")).toBe(false);
    expect(isPaidCertType("otro")).toBe(false);
  });
  it("resolveCertPriceMxn devuelve el monto de dc3/sep", () => {
    expect(resolveCertPriceMxn("dc3")).toBe(499);
    expect(resolveCertPriceMxn("sep")).toBe(1999);
  });
  it("resolveCertPriceMxn lanza para diploma o desconocido", () => {
    expect(() => resolveCertPriceMxn("diploma")).toThrow();
    expect(() => resolveCertPriceMxn("xxx")).toThrow();
  });
});
