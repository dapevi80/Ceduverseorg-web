/**
 * Qué cursos de Onboarding ve cada quien en el Tutor IA, y cuándo la reja
 * general debe dejarlos fuera.
 *
 * Los cursos de Onboarding se pintan en DOS lugares de `studio.tsx`: la franja
 * "Aprende Ceduverse" (consulta propia con `category=Onboarding`) y la reja
 * general. En la vista por defecto la reja iba sin categoría, así que traía
 * Onboarding también: cada curso salía dos veces en pantalla y la copia de la
 * reja no pasaba por el gateo de rol. Ese gateo vive aquí para poder probarlo
 * sin base de datos.
 */

/** Curso, en lo mínimo que hace falta para decidir si se muestra. */
export interface GateableCourse {
  category: string;
  subcategory: string | null;
}

const SOLO_PUBLICOS = ["Para Todos"];

/**
 * La reja general excluye Onboarding sólo en la vista por defecto. Con
 * `category=Onboarding` vendría vacía, y en una búsqueda el usuario espera
 * encontrar "Bienvenido a Ceduverse" (ahí el gateo lo hace
 * `filterOnboardingByRole`).
 */
export function shouldExcludeOnboarding(
  category: string | undefined,
  search: string | undefined,
): boolean {
  return !category && !search;
}

/**
 * Subcategorías de Onboarding visibles para un rol.
 *
 * `isTeamAdmin` es el fallback preexistente: quien administra un equipo ve los
 * cursos de "Empresas" aunque su `user_role` no sea empresa — el frontend
 * cuenta con esto (ver `getOnboardingSlugsForUser` en `dashboard.tsx`). No
 * recibe "Comercial": esa subcategoría lleva la capa legal-fiscal y se reserva
 * a roles comerciales/empresa explícitos.
 */
export function allowedOnboardingSubcategories(
  role: string | null | undefined,
  isTeamAdmin: boolean,
): string[] {
  if (!role) return [...SOLO_PUBLICOS];

  if (role === "admin" || role === "superadmin") {
    return ["Para Todos", "Empresas", "Socios", "Comercial"];
  }
  if (role === "socio_comercial" || role === "partner" || role === "director") {
    return ["Para Todos", "Socios", "Comercial"];
  }
  if (role === "empresa" || role === "empresa_rh") {
    return ["Para Todos", "Empresas", "Comercial"];
  }
  return isTeamAdmin ? ["Para Todos", "Empresas"] : [...SOLO_PUBLICOS];
}

/**
 * Deja pasar todo lo que no sea Onboarding y gatea lo que sí. Un curso de
 * Onboarding sin subcategoría no se muestra: no hay contra qué gatearlo y
 * mostrarlo sería abrirlo a todos por descuido.
 */
export function filterOnboardingByRole<T extends GateableCourse>(
  courses: T[],
  allowedSubcategories: string[],
): T[] {
  return courses.filter(c =>
    c.category !== "Onboarding" ||
    (!!c.subcategory && allowedSubcategories.includes(c.subcategory))
  );
}
