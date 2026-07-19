// Partes puras/decidibles de server/generate-playbooks.ts, separadas para
// poder testearlas sin tocar storage/db (ver generate-playbooks-logic.test.ts).

/** Slug del logro de "Playbook completado" para un curso: mismo patrón que
 * usa el endpoint de evidencia (server/routes/playbook.ts) al crearlo al vuelo. */
export function achievementSlugFor(courseSlug: string): string {
  return `playbook-${courseSlug}`;
}

/** Decide qué cursos son elegibles para esta corrida del script:
 * - con onlySlug: solo ese curso, si storage.getStudioCourse lo encontró (singleCourse).
 *   Si no lo encontró (undefined), no inventa nada: arreglo vacío.
 * - sin onlySlug: todos los cursos que trajo storage.getStudioCourses. */
export function selectEligibleCourses<T>(
  onlySlug: string | undefined,
  singleCourse: T | undefined,
  allCourses: T[],
): T[] {
  return onlySlug
    ? [singleCourse].filter((c): c is NonNullable<T> => !!c)
    : allCourses;
}
