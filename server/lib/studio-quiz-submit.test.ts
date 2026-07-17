import { describe, it, expect } from "vitest";
import { submitStudioQuiz, type NewStudioQuizAttemptInput, type StoredQuiz, type StudioQuizSubmitDeps } from "./studio-quiz-submit";

const QUIZ: StoredQuiz = {
  questions: [{ correctIndex: 1 }, { correctIndex: 0 }, { correctIndex: 3 }, { correctIndex: 2 }],
  passingScore: 70,
};

function depsWith(quiz: StoredQuiz | null): StudioQuizSubmitDeps {
  return { getStoredQuiz: async () => quiz, recordAttempt: async () => {}, listAttempts: async () => [] };
}

const INPUT = { userId: "u1", courseIdentifier: "autoestima", moduleIndex: 0 };

describe("submitStudioQuiz — P1", () => {
  it("IGNORA el score del cliente: {score:100} con respuestas incorrectas REPRUEBA", async () => {
    const result = await submitStudioQuiz(depsWith(QUIZ), {
      ...INPUT,
      body: { answers: [0, 1, 0, 0], score: 100 },
    });
    expect(result).toEqual({ ok: true, grade: { score: 0, total: 4, scorePercent: 0, passed: false } });
  });

  it("califica contra el quiz almacenado, no contra lo que diga el cliente", async () => {
    const result = await submitStudioQuiz(depsWith(QUIZ), {
      ...INPUT,
      body: { answers: [1, 0, 3, 2], score: 0 },
    });
    expect(result).toEqual({ ok: true, grade: { score: 4, total: 4, scorePercent: 100, passed: true } });
  });

  it("FALLA con error explícito si no hay quiz almacenado (jamás auto-aprueba)", async () => {
    const result = await submitStudioQuiz(depsWith(null), {
      ...INPUT,
      body: { answers: [1, 0, 3, 2], score: 100 },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("sin_quiz_almacenado");
    expect(result.message).toMatch(/no hay un quiz/i);
  });

  it("usa el passingScore del quiz almacenado, no un 70 hardcodeado", async () => {
    const strict: StoredQuiz = { ...QUIZ, passingScore: 80 };
    const result = await submitStudioQuiz(depsWith(strict), { ...INPUT, body: { answers: [1, 0, 3, 0] } });
    expect(result).toEqual({ ok: true, grade: { score: 3, total: 4, scorePercent: 75, passed: false } });
  });

  it("rechaza un body sin arreglo de respuestas", async () => {
    const result = await submitStudioQuiz(depsWith(QUIZ), { ...INPUT, body: { score: 100 } });
    expect(result).toEqual({ ok: false, error: "respuestas_invalidas", message: "Respuestas requeridas" });
  });

  it("rechaza respuestas que no son enteros", async () => {
    const result = await submitStudioQuiz(depsWith(QUIZ), { ...INPUT, body: { answers: ["1", null] } });
    expect(result).toEqual({ ok: false, error: "respuestas_invalidas", message: "Respuestas requeridas" });
  });
});

function fakeDeps(quiz: StoredQuiz | null) {
  const recorded: NewStudioQuizAttemptInput[] = [];
  const deps: StudioQuizSubmitDeps = {
    getStoredQuiz: async () => quiz,
    recordAttempt: async (a) => { recorded.push(a); },
    listAttempts: async () => [],
  };
  return { deps, recorded };
}

describe("submitStudioQuiz — P2: historial append-only", () => {
  it("dos intentos dejan DOS renglones, no uno", async () => {
    const { deps, recorded } = fakeDeps(QUIZ);
    await submitStudioQuiz(deps, { ...INPUT, body: { answers: [0, 1, 0, 0] } });
    await submitStudioQuiz(deps, { ...INPUT, body: { answers: [1, 0, 3, 2] } });
    expect(recorded).toHaveLength(2);
    expect(recorded[0]).toEqual({ userId: "u1", courseIdentifier: "autoestima", moduleIndex: 0, score: 0, passed: false });
    expect(recorded[1]).toEqual({ userId: "u1", courseIdentifier: "autoestima", moduleIndex: 0, score: 100, passed: true });
  });

  it("también registra los intentos reprobados", async () => {
    const { deps, recorded } = fakeDeps(QUIZ);
    await submitStudioQuiz(deps, { ...INPUT, body: { answers: [0, 1, 0, 0] } });
    expect(recorded).toEqual([{ userId: "u1", courseIdentifier: "autoestima", moduleIndex: 0, score: 0, passed: false }]);
  });

  it("NO registra intento cuando no hay quiz almacenado", async () => {
    const { deps, recorded } = fakeDeps(null);
    await submitStudioQuiz(deps, { ...INPUT, body: { answers: [1, 0, 3, 2], score: 100 } });
    expect(recorded).toEqual([]);
  });

  it("NO registra intento cuando el body es inválido", async () => {
    const { deps, recorded } = fakeDeps(QUIZ);
    await submitStudioQuiz(deps, { ...INPUT, body: { score: 100 } });
    expect(recorded).toEqual([]);
  });
});

describe("submitStudioQuiz — cooldown de 24 h", () => {
  const NOW = new Date("2026-07-17T12:00:00Z");
  const hace = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);

  function depsConIntentos(previos: { passed: boolean; createdAt: Date }[]) {
    const recorded: NewStudioQuizAttemptInput[] = [];
    const deps: StudioQuizSubmitDeps = {
      getStoredQuiz: async () => QUIZ,
      recordAttempt: async (a) => { recorded.push(a); },
      listAttempts: async () => previos,
      now: () => NOW,
    };
    return { deps, recorded };
  }

  it("bloquea un intento nuevo si reprobó hace 1 h y NO lo registra", async () => {
    const { deps, recorded } = depsConIntentos([{ passed: false, createdAt: hace(1) }]);
    const result = await submitStudioQuiz(deps, { ...INPUT, body: { answers: [1, 0, 3, 2] } });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("cooldown");
    expect(result.retryAfterMs).toBe(23 * 60 * 60 * 1000);
    expect(result.message).toMatch(/24 horas/i);
    expect(recorded).toEqual([]);
  });

  it("permite el intento si reprobó hace 25 h", async () => {
    const { deps, recorded } = depsConIntentos([{ passed: false, createdAt: hace(25) }]);
    const result = await submitStudioQuiz(deps, { ...INPUT, body: { answers: [1, 0, 3, 2] } });
    expect(result.ok).toBe(true);
    expect(recorded).toHaveLength(1);
  });

  it("un intento APROBADO nunca es bloqueado por cooldown", async () => {
    const { deps } = depsConIntentos([
      { passed: true, createdAt: hace(48) },
      { passed: false, createdAt: hace(1) },
    ]);
    const result = await submitStudioQuiz(deps, { ...INPUT, body: { answers: [0, 1, 0, 0] } });
    expect(result.ok).toBe(true);
  });

  it("el cooldown se evalúa contra los intentos de ESE curso", async () => {
    const { deps } = depsConIntentos([]);
    const result = await submitStudioQuiz(deps, { ...INPUT, body: { answers: [1, 0, 3, 2] } });
    expect(result.ok).toBe(true);
  });
});
