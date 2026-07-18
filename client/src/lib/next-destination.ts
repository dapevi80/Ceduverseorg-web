// A dónde volver después de iniciar sesión.
//
// Antes, /auth mandaba SIEMPRE a /dashboard: quien abría un link compartido de
// un curso (/tutor-ia/<curso>/onboarding?ref=...) y se registraba, terminaba en
// el dashboard sin ver nunca el curso que le compartieron.
//
// El destino viaja en ?next= y, además, se GUARDA (cedu_next). Guardarlo es
// necesario porque una cuenta nueva no va directo del login al destino: primero
// la desvían al alta (/welcome), y para cuando termina, la URL con ?next= ya
// quedó atrás. El alta lo consume al final y aterriza al usuario donde iba.
//
// `isInternalPath` es el guardia: ?next= viene de la URL, o sea de cualquiera,
// así que sólo se acepta una ruta INTERNA. Sin esto, un
// /auth?next=https://sitio-malo.com convertiría nuestro login en un trampolín
// para phishing (open redirect): el usuario ve el dominio de Ceduverse, se
// autentica de verdad, y sale disparado a otro lado.

export const CEDU_NEXT_KEY = "cedu_next";

/** ¿Es una ruta de ESTE sitio, segura para redirigir? */
export function isInternalPath(raw: string | null | undefined): raw is string {
  if (!raw) return false;

  // Debe ser una ruta absoluta de este sitio.
  if (!raw.startsWith("/")) return false;

  // "//host" es protocol-relative: el navegador lo resuelve a otro dominio.
  if (raw.startsWith("//")) return false;

  // Algunos navegadores normalizan "\" a "/", así que "/\evil.com" puede
  // terminar saliendo del sitio. No aceptamos backslashes.
  if (raw.includes("\\")) return false;

  // Volver al propio login sería un bucle.
  if (raw === "/auth" || raw.startsWith("/auth?") || raw.startsWith("/auth/")) return false;

  return true;
}

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
  return isInternalPath(raw) ? raw : null;
}

/**
 * Guarda el destino para que sobreviva el desvío al alta de cuenta. Ignora
 * silenciosamente cualquier destino que no sea una ruta interna.
 */
export function rememberNextDestination(path: string | null | undefined): void {
  if (!isInternalPath(path)) return;
  try {
    localStorage.setItem(CEDU_NEXT_KEY, path);
  } catch {
    /* no-op */
  }
}

/**
 * Devuelve el destino guardado y lo BORRA (de un solo uso: no queremos que un
 * link viejo siga secuestrando navegaciones futuras). Null si no hay o no es
 * una ruta interna válida.
 */
export function consumeNextDestination(): string | null {
  try {
    const raw = localStorage.getItem(CEDU_NEXT_KEY);
    localStorage.removeItem(CEDU_NEXT_KEY);
    return isInternalPath(raw) ? raw : null;
  } catch {
    return null;
  }
}
