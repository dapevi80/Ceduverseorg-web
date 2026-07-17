// Fuente ÚNICA de verdad del cálculo fiscal de facturas admin (FacturAPI).
//
// Decisión firme del dueño (2026-07): las APORTACIONES de empresa (aportación
// mensual/anual de la cooperativa) son contribuciones educativas y se
// facturan SIN IVA (exentas), con la clave de producto SAT 94101607
// (Aportaciones a la asociación). Las CERTIFICACIONES/cursos/productos/
// asesorías sí llevan el 16% de IVA como cualquier venta gravada normal.
//
// El servidor SIEMPRE recalcula desde aquí; nunca confiar en un tax/total
// enviado por el cliente.

export const IVA_RATE = 0.16;

export const DEFAULT_PRODUCT_KEY = "80111500"; // Servicios de Capacitación de Personal (certificaciones/cursos) — CON IVA
export const CONTRIBUTION_PRODUCT_KEY = "94101607"; // Aportaciones a la asociación — SIN IVA

export type InvoiceType = "contribution" | "certification";

export interface ComputeInvoiceTaxInput {
  invoiceType: InvoiceType;
  subtotal: number;
  /** Solo aplica a certification; una aportación siempre usa CONTRIBUTION_PRODUCT_KEY. */
  productKey?: string;
}

export interface ComputeInvoiceTaxResult {
  taxMxn: number;
  totalMxn: number;
  productKey: string;
  exento: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeInvoiceTax(input: ComputeInvoiceTaxInput): ComputeInvoiceTaxResult {
  const { invoiceType, subtotal } = input;

  if (invoiceType === "contribution") {
    // Aportación de empresa: SIN IVA (exento/no objeto de impuesto), clave fija.
    return {
      taxMxn: 0,
      totalMxn: round2(subtotal),
      productKey: CONTRIBUTION_PRODUCT_KEY,
      exento: true,
    };
  }

  // certification (y cualquier otro producto/servicio pagado): IVA normal 16%.
  const taxMxn = round2(subtotal * IVA_RATE);
  const totalMxn = round2(subtotal + taxMxn);
  return {
    taxMxn,
    totalMxn,
    productKey: input.productKey || DEFAULT_PRODUCT_KEY,
    exento: false,
  };
}
