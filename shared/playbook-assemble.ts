// Piezas puras del generador del Playbook (spec 2026-07-18 §3, §6):
// - Las referencias del playbook son SIEMPRE las del curso, verbatim, nunca
//   inventadas por la IA ([[feedback_no_claims_falsos_contenido]]).
// - Los ejercicios de campo generados deben ser 3-5 (PLAYBOOK_EXERCISES_PER_COURSE).
// server/playbook-generator.ts (I/O, llama a Claude) usa estas dos funciones para
// separar la parte confiable/testeable-sin-red de la llamada al LLM: el LLM NUNCA
// controla `references` directamente.

export interface ModuleForPlaybook {
  references: string[] | null;
}

export interface PlaybookExercise {
  index: number;
  title: string;
  instruction: string;
}

/** Referencias verbatim del curso: unión de las de todos los módulos, sin
 * duplicados, en el orden en que aparecen. Nunca inventa ni reescribe texto. */
export function assembleReferences(modules: ModuleForPlaybook[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const mod of modules) {
    for (const ref of mod.references || []) {
      if (!seen.has(ref)) {
        seen.add(ref);
        out.push(ref);
      }
    }
  }
  return out;
}

export const PLAYBOOK_EXERCISES_MIN = 3;
export const PLAYBOOK_EXERCISES_MAX = 5;

/** true si el número de ejercicios cae dentro de PLAYBOOK_EXERCISES_PER_COURSE (3-5). */
export function hasValidExerciseCount(exercises: PlaybookExercise[]): boolean {
  return exercises.length >= PLAYBOOK_EXERCISES_MIN && exercises.length <= PLAYBOOK_EXERCISES_MAX;
}
