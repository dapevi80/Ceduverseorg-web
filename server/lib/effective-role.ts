import type { Request } from "express";

// Roles a los que un superadmin/admin puede "bajar" temporalmente para previsualizar
// la experiencia de un socio, vía el header X-View-As. NO incluye admin/superadmin:
// esos son roles de staff, nunca un destino de preview (y nunca hay que poder
// "subir" a ellos a través del header — solo bajar).
export const VIEWABLE_ROLES = [
  "socio_comercial",
  "empresa",
  "empresa_rh",
  "socio_estudiante",
  "socio_instructor",
  "director",
] as const;

export type ViewableRole = (typeof VIEWABLE_ROLES)[number];

const VIEW_AS_HEADER = "x-view-as";

function isViewableRole(value: unknown): value is ViewableRole {
  return typeof value === "string" && (VIEWABLE_ROLES as readonly string[]).includes(value);
}

/**
 * Rol "efectivo" para decisiones de gating (paneles, nav, cursos, etc).
 *
 * Devuelve el rol pedido en el header `X-View-As` SOLO SI el rol REAL de la
 * cuenta autenticada (`account.userRole`) es `superadmin` o `admin` Y el valor
 * del header es uno de `VIEWABLE_ROLES`. En cualquier otro caso (usuario no es
 * staff, header ausente, o header inválido) devuelve el rol REAL sin modificar.
 *
 * Esto NUNCA escala privilegios: un usuario no-staff no puede usar el header
 * para obtener un rol distinto al suyo, y staff solo puede "bajar" a los roles
 * en VIEWABLE_ROLES (nunca a admin/superadmin vía el header).
 *
 * IMPORTANTE: no usar este helper en `requireSuperadmin`/`requireAdmin` — esos
 * guards deben seguir usando el rol REAL para que el switcher y el panel admin
 * sigan siempre accesibles, sin importar el "ver como" activo.
 */
export function getEffectiveRole(
  req: Request,
  account: { userRole: string } | null | undefined
): string {
  const realRole = account?.userRole ?? "";

  if (realRole !== "superadmin" && realRole !== "admin") {
    return realRole;
  }

  const headerValue = req.headers[VIEW_AS_HEADER];
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (isViewableRole(raw)) {
    return raw;
  }

  return realRole;
}
