// Decide si una solicitud de certificado duplicada existente debe BLOQUEAR
// (409) una nueva solicitud, o si puede reutilizarse (retry / re-checkout).
//
// Reusable (false): "rechazado" (comportamiento existente) y "pending_payment"
// (el usuario abandonó el checkout de Stripe y da clic en "Completar pago" —
// debe generar una checkout_url nueva sobre la MISMA fila, no un 409).
//
// Bloqueante (true): "solicitado", "en_proceso", "emitido" — ya hay una
// solicitud viva/terminada, no se debe crear ni reutilizar.
export function isBlockingDuplicateStatus(status: string): boolean {
  return status !== "rechazado" && status !== "pending_payment";
}
