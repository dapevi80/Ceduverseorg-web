// A dónde volver después de iniciar sesión.
//
// Antes, /auth mandaba SIEMPRE a /dashboard: quien abría un link compartido de
// un curso (/tutor-ia/<curso>/onboarding?ref=...) y se registraba, terminaba en
// el dashboard sin ver nunca el curso que le compartieron. Estas dos funciones
// llevan el destino en ?next= y lo devuelven al terminar.
//
// `safeNextDestination` es el guardia: ?next= viene de la URL, o sea de
// cualquiera, así que sólo se acepta una ruta INTERNA. Sin esto, un
// /auth?next=https://sitio-malo.com convertiría nuestro login en un trampolín
// para phishing (open redirect): el usuario ve el dominio de Ceduverse, se
// autentica de verdad, y sale disparado a otro lado.

/** Construye la URL de login que recuerda a dónde iba el usuario. */
export function authUrlWithNext(pathWithSearch: string): string {
  return `/auth?next=${encodeURIComponent(pathWithSearch)}`;
}

/**
 * Lee ?next= de un query string y lo devuelve SÓLO si es una ruta interna
 * segura. Devuelve null (=> usar el destino por defecto) en cualquier otro caso.
 */
export function safeNextDestination(search: string): string | null {
  let raw: string | null;
  try {
    raw = new URLSearchParams(search).get("next");
  } catch {
    return null;
  }
  if (!raw) return null;

  // Debe ser una ruta absoluta de ESTE sitio.
  if (!raw.startsWith("/")) return null;

  // "//host" es protocol-relative: el navegador lo resuelve a otro dominio.
  if (raw.startsWith("//")) return null;

  // Algunos navegadores normalizan "\" a "/", así que "/\evil.com" puede
  // terminar saliendo del sitio. No aceptamos backslashes.
  if (raw.includes("\\")) return null;

  // Volver al propio login sería un bucle.
  if (raw === "/auth" || raw.startsWith("/auth?") || raw.startsWith("/auth/")) return null;

  return raw;
}
