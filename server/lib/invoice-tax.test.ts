import { describe, it, expect } from "vitest";
import { computeInvoiceTax, IVA_RATE, DEFAULT_PRODUCT_KEY, CONTRIBUTION_PRODUCT_KEY } from "./invoice-tax";

describe("computeInvoiceTax — IVA solo en certificaciones/productos, NUNCA en aportaciones", () => {
  it("aportación de empresa (contribution) => SIN IVA, exenta, clave 94101607", () => {
    const r = computeInvoiceTax({ invoiceType: "contribution", subtotal: 1000 });
    expect(r.taxMxn).toBe(0);
    expect(r.totalMxn).toBe(1000);
    expect(r.productKey).toBe(CONTRIBUTION_PRODUCT_KEY);
    expect(r.productKey).toBe("94101607");
    expect(r.exento).toBe(true);
  });

  it("aportación ignora cualquier productKey pasado por el caller — siempre 94101607", () => {
    const r = computeInvoiceTax({ invoiceType: "contribution", subtotal: 500, productKey: "80111500" });
    expect(r.productKey).toBe("94101607");
    expect(r.exento).toBe(true);
    expect(r.taxMxn).toBe(0);
  });

  it("certificación $1000 => 16% IVA = $160, total $1160, NO exenta", () => {
    const r = computeInvoiceTax({ invoiceType: "certification", subtotal: 1000 });
    expect(r.taxMxn).toBe(160);
    expect(r.totalMxn).toBe(1160);
    expect(r.exento).toBe(false);
  });

  it("certificación usa productKey pasado por el caller si se provee", () => {
    const r = computeInvoiceTax({ invoiceType: "certification", subtotal: 1000, productKey: "84111506" });
    expect(r.productKey).toBe("84111506");
  });

  it("certificación usa default 80111500 si no se pasa productKey", () => {
    const r = computeInvoiceTax({ invoiceType: "certification", subtotal: 1000 });
    expect(r.productKey).toBe(DEFAULT_PRODUCT_KEY);
    expect(r.productKey).toBe("80111500");
  });

  it("IVA_RATE es exactamente 0.16 (única fuente de verdad)", () => {
    expect(IVA_RATE).toBe(0.16);
  });

  it("redondeo: subtotal con decimales redondea el IVA a 2 decimales (certification)", () => {
    const r = computeInvoiceTax({ invoiceType: "certification", subtotal: 499 });
    // 499 * 0.16 = 79.84
    expect(r.taxMxn).toBe(79.84);
    expect(r.totalMxn).toBe(578.84);
  });

  it("redondeo: subtotal que produce IVA con más de 2 decimales se redondea correctamente", () => {
    const r = computeInvoiceTax({ invoiceType: "certification", subtotal: 33.33 });
    // 33.33 * 0.16 = 5.3328 => 5.33
    expect(r.taxMxn).toBe(5.33);
    expect(r.totalMxn).toBe(38.66);
  });

  it("aportación con subtotal decimal: total == subtotal exacto, sin redondeo espurio", () => {
    const r = computeInvoiceTax({ invoiceType: "contribution", subtotal: 1234.56 });
    expect(r.taxMxn).toBe(0);
    expect(r.totalMxn).toBe(1234.56);
  });

  it("subtotal 0 en certification produce IVA 0 y total 0 (caso límite, no negativo)", () => {
    const r = computeInvoiceTax({ invoiceType: "certification", subtotal: 0 });
    expect(r.taxMxn).toBe(0);
    expect(r.totalMxn).toBe(0);
    expect(r.exento).toBe(false);
  });
});
