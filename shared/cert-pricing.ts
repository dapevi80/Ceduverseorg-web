// Fuente ÚNICA de verdad del precio de certificados. El servidor recalcula
// siempre desde aquí; el cliente solo lo muestra. NUNCA confiar en un monto
// enviado por el cliente.
export const CERT_PRICES_MXN = { dc3: 499, sep: 1999 } as const;

export type PaidCertType = keyof typeof CERT_PRICES_MXN;

export function isPaidCertType(t: string): t is PaidCertType {
  return t === "dc3" || t === "sep";
}

export function resolveCertPriceMxn(t: string): number {
  if (!isPaidCertType(t)) {
    throw new Error(`certType sin precio de pago: ${t}`);
  }
  return CERT_PRICES_MXN[t];
}
