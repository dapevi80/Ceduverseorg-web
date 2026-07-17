import { gradeQuizAttempt, type GradableQuestion, type QuizGrade } from "@shared/quiz-grading";
import { evaluateQuizCooldown, type CooldownAttempt } from "@shared/quiz-cooldown";

// Orquestador del submit de quiz del Tutor IA. Vive fuera de la ruta y recibe
// sus dependencias inyectadas para que la regla —la única que separa un
// certificado federal de un `curl`— se pueda testear sin base de datos.
//
// Spec 2026-07-17, P1: el `score` del cliente NO se lee. Ni como sugerencia.

export interface StoredQuiz {
  questions: GradableQuestion[];
  passingScore: number;
}

export interface NewStudioQuizAttemptInput {
  userId: string;
  courseIdentifier: string;
  moduleIndex: number;
  /** Porcentaje 0-100 calculado por el servidor. */
  score: number;
  passed: boolean;
}

export interface StudioQuizSubmitDeps {
  /** Devuelve el quiz almacenado en el servidor, o null si no hay ninguno que calificar. */
  getStoredQuiz(userId: string, courseIdentifier: string, moduleIndex: number): Promise<StoredQuiz | null>;
  /** Inserta un renglón nuevo. Append-only: jamás actualiza el intento anterior. */
  recordAttempt(attempt: NewStudioQuizAttemptInput): Promise<void>;
  /** Intentos previos del socio para ESE curso (todos los módulos). */
  listAttempts(userId: string, courseIdentifier: string): Promise<CooldownAttempt[]>;
  /** Inyectable para testear el cooldown sin esperar 24 h. */
  now?(): Date;
}

export interface StudioQuizSubmitInput {
  userId: string;
  courseIdentifier: string;
  moduleIndex: number;
  /** El body crudo del request. Se parsea aquí a propósito: aquí estaba el hoyo. */
  body: unknown;
}

export type StudioQuizSubmitError = "respuestas_invalidas" | "sin_quiz_almacenado" | "cooldown";

export type StudioQuizSubmitResult =
  | { ok: true; grade: QuizGrade }
  | { ok: false; error: StudioQuizSubmitError; message: string; retryAfterMs?: number };

/** Extrae SOLO las respuestas del body. `score` no se lee jamás. */
export function parseAnswers(body: unknown): number[] | null {
  const answers = (body as { answers?: unknown } | null | undefined)?.answers;
  if (!Array.isArray(answers)) return null;
  if (!answers.every((a) => Number.isInteger(a))) return null;
  return answers as number[];
}

export async function submitStudioQuiz(
  deps: StudioQuizSubmitDeps,
  input: StudioQuizSubmitInput,
): Promise<StudioQuizSubmitResult> {
  const answers = parseAnswers(input.body);
  if (!answers) {
    return { ok: false, error: "respuestas_invalidas", message: "Respuestas requeridas" };
  }

  const stored = await deps.getStoredQuiz(input.userId, input.courseIdentifier, input.moduleIndex);
  if (!stored || stored.questions.length === 0) {
    console.error(
      `[studio-quiz] ${input.courseIdentifier}#${input.moduleIndex} (user=${input.userId}): ` +
      `sin quiz almacenado que calificar; intento RECHAZADO (nunca se auto-aprueba).`,
    );
    return {
      ok: false,
      error: "sin_quiz_almacenado",
      message: "No hay un quiz almacenado para este módulo, así que no podemos calificar tu intento. Genera el contenido del módulo e inténtalo de nuevo.",
    };
  }

  const previos = await deps.listAttempts(input.userId, input.courseIdentifier);
  const cooldown = evaluateQuizCooldown(previos, deps.now ? deps.now() : new Date());
  if (cooldown.blocked) {
    const horas = Math.ceil(cooldown.retryAfterMs / (60 * 60 * 1000));
    return {
      ok: false,
      error: "cooldown",
      message: `Ya reprobaste este quiz hace poco. Hay que esperar 24 horas entre intentos: vuelve en ${horas} h.`,
      retryAfterMs: cooldown.retryAfterMs,
    };
  }

  const grade = gradeQuizAttempt(stored.questions, answers, stored.passingScore);

  await deps.recordAttempt({
    userId: input.userId,
    courseIdentifier: input.courseIdentifier,
    moduleIndex: input.moduleIndex,
    score: grade.scorePercent,
    passed: grade.passed,
  });

  return { ok: true, grade };
}
