// Captura app-wide del código de referido (?ref=) para que cualquier link compartido
// (panel de socio -> /empresas?ref=, cursos compartidos, etc.) no pierda la atribución,
// no solo los links que apuntan directo a /auth?ref=.
//
// Política: "last-touch" — si llega un ?ref= nuevo y válido, sobreescribe el que hubiera
// guardado antes. Se eligió last-touch (no first-touch) porque no hay evidencia en el
// código de que se necesite preservar el primer referido visto (no hay lógica de
// "ya tiene referido, ignorar nuevos"), y es el comportamiento más simple e intuitivo:
// el último link que la empresa usó para llegar es el que se le acredita al socio.
export const CEDU_REF_KEY = "cedu_ref";

/**
 * Extrae el valor de `ref` de un search string (con o sin `?` inicial),
 * recortando espacios. Devuelve null si no hay valor utilizable.
 */
export function extractRef(search: string): string | null {
  const params = new URLSearchParams(search);
  const ref = params.get("ref");
  if (!ref) return null;
  const trimmed = ref.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Lee `?ref=` del search string dado y lo persiste en localStorage bajo la
 * misma clave que ya consume onboarding.tsx (`cedu_ref`). No hace nada si el
 * parámetro está ausente o vacío, para no borrar un valor ya capturado.
 */
export function captureReferralFromUrl(search: string): void {
  const ref = extractRef(search);
  if (!ref) return;
  try {
    localStorage.setItem(CEDU_REF_KEY, ref);
  } catch {
    /* no-op */
  }
}
