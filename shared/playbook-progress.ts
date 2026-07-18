// Progreso del Playbook (spec 2026-07-18): un ejercicio de campo cuenta como
// "hecho" con >=1 evidencia subida (el álbum puede tener varias fotos del
// mismo ejercicio). El playbook está completo cuando TODOS los índices
// 0..exerciseCount-1 tienen al menos una evidencia.

export interface PlaybookProgress {
  done: number;
  total: number;
  complete: boolean;
}

export function isPlaybookComplete(exerciseCount: number, evidenceExerciseIndexes: number[]): boolean {
  if (exerciseCount <= 0) return false;
  const done = new Set(evidenceExerciseIndexes);
  for (let i = 0; i < exerciseCount; i++) {
    if (!done.has(i)) return false;
  }
  return true;
}

export function playbookProgress(exerciseCount: number, evidenceExerciseIndexes: number[]): PlaybookProgress {
  const uniqueInRange = new Set(evidenceExerciseIndexes.filter((i) => i >= 0 && i < exerciseCount));
  return {
    done: uniqueInRange.size,
    total: exerciseCount,
    complete: isPlaybookComplete(exerciseCount, evidenceExerciseIndexes),
  };
}
