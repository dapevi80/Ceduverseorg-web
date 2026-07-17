import { describe, it, expect } from "vitest";
import { gradeQuizAttempt, DEFAULT_PASSING_SCORE, type GradableQuestion } from "./quiz-grading";

const QUIZ: GradableQuestion[] = [
  { correctIndex: 1 },
  { correctIndex: 0 },
  { correctIndex: 3 },
  { correctIndex: 2 },
];

describe("gradeQuizAttempt", () => {
  it("califica 100% cuando todas las respuestas son correctas", () => {
    expect(gradeQuizAttempt(QUIZ, [1, 0, 3, 2], 70)).toEqual({
      score: 4, total: 4, scorePercent: 100, passed: true,
    });
  });

  it("reprueba con 0% cuando todas las respuestas son incorrectas", () => {
    expect(gradeQuizAttempt(QUIZ, [0, 1, 0, 0], 70)).toEqual({
      score: 0, total: 4, scorePercent: 0, passed: false,
    });
  });

  it("cuenta como incorrectas las preguntas sin responder (answers más corto que el quiz)", () => {
    expect(gradeQuizAttempt(QUIZ, [1, 0], 70)).toEqual({
      score: 2, total: 4, scorePercent: 50, passed: false,
    });
  });

  it("ignora respuestas de más (answers más largo que el quiz)", () => {
    expect(gradeQuizAttempt(QUIZ, [1, 0, 3, 2, 9, 9], 70)).toEqual({
      score: 4, total: 4, scorePercent: 100, passed: true,
    });
  });

  it("respeta el passingScore del quiz en vez de un 70 hardcodeado", () => {
    // 3/4 = 75%: aprueba con 70, reprueba con 80.
    expect(gradeQuizAttempt(QUIZ, [1, 0, 3, 0], 70).passed).toBe(true);
    expect(gradeQuizAttempt(QUIZ, [1, 0, 3, 0], 80).passed).toBe(false);
  });

  it("aprueba cuando la calificación es exactamente el passingScore", () => {
    expect(gradeQuizAttempt(QUIZ, [1, 0, 3, 0], 75).passed).toBe(true);
  });

  it("usa 70 como default documentado del schema", () => {
    expect(DEFAULT_PASSING_SCORE).toBe(70);
    expect(gradeQuizAttempt(QUIZ, [1, 0, 3, 0]).passed).toBe(true);
  });

  it("LANZA si no hay quiz que calificar: un intento sin quiz jamás se aprueba", () => {
    expect(() => gradeQuizAttempt([], [1, 2, 3], 70)).toThrow(/no hay quiz/i);
  });
});
