// Clasificador puro de fuentes citadas en un curso.
//
// Regla (David, 2026-07-19): en la pestaña de fuentes de un curso sólo se
// enlazan LEYES, NORMAS y DECRETOS OFICIALES ("oficial"). Los documentos
// propios del consorcio se marcan como internos ("interna") — nunca llevan
// link externo. Todo lo demás (libros, autores, conceptos) se muestra sin
// link como lectura de referencia ("lectura").
//
// Esta función SOLO clasifica el texto de la cita. NO decide si hay un link:
// eso lo decide, para las "oficial", el catálogo humano en
// server/data/fuentes-oficiales.ts (única fuente de verdad para URLs).
//
// Prioridad: "interna" gana sobre "oficial" cuando ambos patrones matchean
// (ej. "Reglamento Interno Ceduverse" contiene "Reglamento" Y "Ceduverse":
// es un documento interno, aunque tenga forma de reglamento).

export type SourceKind = "oficial" | "interna" | "lectura";

// Instrumentos propios del consorcio: nunca se enlazan externamente, sin
// importar qué otro patrón matcheen.
const INTERNA_PATTERNS: RegExp[] = [
  /\bceduverse\b/i,
  /\bbrainshield\b/i,
  /\bkakaw\b/i,
];

// Leyes, normas oficiales y decretos. Basado en los patrones reales
// encontrados en las 82 fuentes oficiales verificadas de studio_modules
// (NOM-, NMX-, LFT, Ley, Reglamento, Código, NIF, Constitución, Decreto,
// LGCG, RFSST) más "Acuerdo" (acuerdos administrativos STPS, presentes en
// el mismo catálogo).
const OFICIAL_PATTERNS: RegExp[] = [
  /\bNOM-/i,
  /\bNMX-/i,
  /\bLFT\b/i,
  /\bLGCG\b/i,
  /\bRFSST\b/i,
  /\bNIF\b/i,
  /\bLey\b/i,
  /\bReglamento\b/i,
  /\bC[oó]digo\b/i,
  /\bConstituci[oó]n\b/i,
  /\bDecreto\b/i,
  /\bAcuerdo\b/i,
];

/** Clasifica el texto de una cita. Cadena vacía o sólo espacios → "lectura". */
export function classifySource(cita: string): SourceKind {
  const text = cita ?? "";
  if (INTERNA_PATTERNS.some((p) => p.test(text))) return "interna";
  if (OFICIAL_PATTERNS.some((p) => p.test(text))) return "oficial";
  return "lectura";
}
