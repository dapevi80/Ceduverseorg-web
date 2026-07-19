// Puerta de validación de la sugerencia de norma del detector de riesgos.
//
// Cero invención de normas (spec §7): la IA solo puede elegir entre las
// referencias reales del curso (`studio_modules.references`, verbatim).
// Esta es la ÚNICA pieza que decide si una respuesta del modelo se guarda.
// El punto de aplicación es aquí, no el prompt — un prompt es una petición,
// el validador es la garantía. Ver server/risk-norm-suggest.ts, que SIEMPRE
// pasa la respuesta del modelo por pickAllowedNorm antes de devolverla.
//
// PURO a propósito: sin red, sin DB, sin cliente Anthropic. Solo comparación
// de strings, para que la regla de "exacto, nunca parcial" sea trivial de
// auditar y de probar exhaustivamente.
//
// Regla de comparación: EXACTA tras recortar espacios (trim). Nada de
// prefijo, substring, ni normalización de mayúsculas/minúsculas:
// - Prefijo/substring: si la IA devuelve "NOM-006" y la lista dice
//   "NOM-006-STPS-2014", eso NO es un match — aceptar el prefijo dejaría
//   que el modelo invente la precisión (el año, el numeral) que nadie
//   verificó.
// - Mayúsculas/minúsculas: NO se normaliza. "nom-006-stps-2014" no matchea
//   "NOM-006-STPS-2014". Es la opción más conservadora: fuerza a que el
//   candidato sea idéntico, carácter por carácter (salvo espacios externos),
//   al texto verbatim de la referencia real del curso. Normalizar case
//   abriría la puerta a "correcciones" de formato que nadie pidió.

function normalize(value: string): string {
  return value.trim();
}

/** True solo si `candidate` (recortado) es EXACTAMENTE igual a alguna entrada de `allowed` (recortada). */
export function isAllowedNorm(candidate: string | null | undefined, allowed: string[]): boolean {
  if (candidate == null) return false;
  const trimmedCandidate = normalize(candidate);
  if (trimmedCandidate.length === 0) return false;
  if (!allowed || allowed.length === 0) return false;

  return allowed.some((entry) => normalize(entry) === trimmedCandidate);
}

/**
 * Devuelve la norma tal como está escrita en `allowed` (verbatim de la
 * referencia real del curso), no el candidato crudo que mandó la IA — así
 * cualquier diferencia de espacios en el candidato desaparece y lo que se
 * guarda es siempre, carácter por carácter, el texto real del curso.
 * Sin coincidencia exacta → null (nunca se inventa ni se "arregla" nada).
 */
export function pickAllowedNorm(candidate: string | null | undefined, allowed: string[]): string | null {
  if (candidate == null) return null;
  const trimmedCandidate = normalize(candidate);
  if (trimmedCandidate.length === 0) return null;
  if (!allowed || allowed.length === 0) return null;

  const match = allowed.find((entry) => normalize(entry) === trimmedCandidate);
  return match !== undefined ? normalize(match) : null;
}
