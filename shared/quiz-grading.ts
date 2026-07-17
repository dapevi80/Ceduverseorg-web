// Calificar un intento de quiz es una función pura y vive AQUÍ, no en la ruta.
// Regla del spec 2026-07-17 (P1): la calificación se calcula SIEMPRE en el
// servidor contra el quiz almacenado; el `score` que manda el cliente se ignora
// por completo. Si no hay quiz que calificar, esto LANZA: nunca se auto-aprueba.

/** Default del schema: `studio_quizzes.passing_score` y `course_quizzes.passing_score` son `NOT NULL DEFAULT 70`. */
export const DEFAULT_PASSING_SCORE = 70;

export interface GradableQuestion {
  correctIndex: number;
}

export interface QuizGrade {
  score: number;
  total: number;
  scorePercent: number;
  passed: boolean;
}

export function gradeQuizAttempt(
  questions: GradableQuestion[],
  answers: number[],
  passingScore: number = DEFAULT_PASSING_SCORE,
): QuizGrade {
  if (!questions || questions.length === 0) {
    throw new Error("No hay quiz almacenado que calificar: el intento no se puede aprobar.");
  }
  const total = questions.length;
  let score = 0;
  for (let i = 0; i < total; i++) {
    if (answers[i] === questions[i].correctIndex) score++;
  }
  const scorePercent = Math.round((score / total) * 100);
  return { score, total, scorePercent, passed: scorePercent >= passingScore };
}
