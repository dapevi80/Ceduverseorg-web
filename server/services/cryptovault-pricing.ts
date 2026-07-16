// Motor de precio del CryptoVault 24k de Kakaw (oro Au 999.9).
//
// Fórmula (definida por el negocio, 2026-07-13):
//   valorOro   = spotPorGramo24k × gramos          (spot al momento de la compra)
//   feeOperativo = valorOro × 20%                   (cubre terminal + acuñación)
//   subtotal   = valorOro + feeOperativo
//   extras     = gasRed + envío                     (cotizados, los paga el comprador)
//   total      = subtotal + extras
//
// El gas de red (acuñar el NFT título 1:1 del lingote) y el envío de paquetería
// NO son ganancia: se cotizan aparte y los cubre el comprador. Ver gold-spot.ts
// para el origen del spot (goldapi.io, sin precios simulados).

export const OPERATIONAL_FEE_PCT = 0.20; // 20% fee operativo: terminal + acuñación.

export type EditionKey = "100" | "200";

export const CRYPTOVAULT_EDITIONS: Record<EditionKey, { grams: number; ozt: number; label: string; edition: string; year: number; purity: string }> = {
  "100": { grams: 100, ozt: 3.215, label: "100 g", edition: "1/320", year: 2026, purity: "Au 999.9" },
  "200": { grams: 200, ozt: 6.430, label: "200 g", edition: "1/320", year: 2026, purity: "Au 999.9" },
};

export type VaultQuoteInput = {
  editionKey: EditionKey;
  spotPerGram: number;       // spot de oro 24k por gramo, en la moneda de cobro
  currency: "MXN" | "USD";
  gasFee?: number;           // cotización de gas de red (acuñar NFT título) — la paga el comprador
  shippingFee?: number;      // cotización de paquetería — la paga el comprador
};

export type VaultQuoteBreakdown = {
  editionKey: EditionKey;
  grams: number;
  currency: "MXN" | "USD";
  spotPerGram: number;
  goldValue: number;
  operationalFeePct: number;
  operationalFee: number;
  subtotal: number;
  gasFee: number;
  shippingFee: number;
  extrasPaidByBuyer: number;
  total: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula el desglose de precio del CryptoVault para una edición y un spot dado.
 * Función pura y determinista: no lee red ni reloj. El endpoint le inyecta el spot
 * (de getGoldSpot) y las cotizaciones de gas/envío.
 */
export function quoteCryptoVault(input: VaultQuoteInput): VaultQuoteBreakdown {
  const ed = CRYPTOVAULT_EDITIONS[input.editionKey];
  if (!ed) throw new Error(`Edición de CryptoVault inválida: ${input.editionKey}`);
  if (!(input.spotPerGram > 0)) throw new Error("spotPerGram debe ser un número positivo");

  const grams = ed.grams;
  const goldValue = round2(input.spotPerGram * grams);
  const operationalFee = round2(goldValue * OPERATIONAL_FEE_PCT);
  const subtotal = round2(goldValue + operationalFee);
  const gasFee = round2(Math.max(0, input.gasFee ?? 0));
  const shippingFee = round2(Math.max(0, input.shippingFee ?? 0));
  const extrasPaidByBuyer = round2(gasFee + shippingFee);
  const total = round2(subtotal + extrasPaidByBuyer);

  return {
    editionKey: input.editionKey,
    grams,
    currency: input.currency,
    spotPerGram: round2(input.spotPerGram),
    goldValue,
    operationalFeePct: OPERATIONAL_FEE_PCT,
    operationalFee,
    subtotal,
    gasFee,
    shippingFee,
    extrasPaidByBuyer,
    total,
  };
}
