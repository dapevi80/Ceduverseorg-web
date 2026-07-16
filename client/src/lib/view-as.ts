// "Ver como ROL" — persistencia client-side del rol previsualizado por un
// superadmin/admin real. Debe coincidir EXACTAMENTE con VIEWABLE_ROLES en
// server/lib/effective-role.ts (nunca incluye admin/superadmin: esos son
// roles de staff, nunca un destino de preview).
export const VIEWABLE_ROLES = [
  "socio_comercial",
  "empresa",
  "empresa_rh",
  "socio_estudiante",
  "socio_instructor",
  "director",
] as const;

export type ViewableRole = (typeof VIEWABLE_ROLES)[number];

export const VIEW_AS_HEADER = "X-View-As";
export const VIEW_AS_STORAGE_KEY = "ceduverse:view-as-role";

export function isViewableRole(value: unknown): value is ViewableRole {
  return typeof value === "string" && (VIEWABLE_ROLES as readonly string[]).includes(value);
}

/**
 * Lee el rol previsualizado persistido en sessionStorage (no localStorage:
 * no debe pegarse entre sesiones/pestañas nuevas). Devuelve null si no hay
 * nada guardado, si el valor no es un rol viewable válido, o si
 * sessionStorage no está disponible (SSR, modo privado, etc).
 */
export function getStoredViewAsRole(): ViewableRole | null {
  try {
    const raw = sessionStorage.getItem(VIEW_AS_STORAGE_KEY);
    return isViewableRole(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Persiste (o limpia, con null) el rol previsualizado en sessionStorage.
 */
export function setStoredViewAsRole(role: ViewableRole | null): void {
  try {
    if (role) {
      sessionStorage.setItem(VIEW_AS_STORAGE_KEY, role);
    } else {
      sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
    }
  } catch {
    // sessionStorage no disponible — no-op, no hay nada que persistir.
  }
}
