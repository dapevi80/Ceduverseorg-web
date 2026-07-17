// Espera entre intentos REPROBADOS de quiz (spec 2026-07-17): 24 h. Corta el
// brute-force sin bloquear a quien sí sabe: intentos ilimitados, con espera.
// Un intento APROBADO nunca se bloquea — quien ya acreditó puede repetir el quiz
// cuando quiera. Se valida en el servidor: el cliente no es confiable.

export const QUIZ_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface CooldownAttempt {
  passed: boolean;
  createdAt: Date | string;
}

export interface CooldownDecision {
  blocked: boolean;
  /** Milisegundos que faltan para poder reintentar. 0 si no está bloqueado. */
  retryAfterMs: number;
}

export function evaluateQuizCooldown(attempts: CooldownAttempt[], now: Date): CooldownDecision {
  const libre: CooldownDecision = { blocked: false, retryAfterMs: 0 };
  if (attempts.some((a) => a.passed)) return libre;

  const ultimoReprobado = attempts
    .filter((a) => !a.passed)
    .map((a) => new Date(a.createdAt).getTime())
    .reduce((max, t) => (t > max ? t : max), -Infinity);

  if (ultimoReprobado === -Infinity) return libre;

  const transcurrido = now.getTime() - ultimoReprobado;
  if (transcurrido >= QUIZ_COOLDOWN_MS) return libre;
  return { blocked: true, retryAfterMs: QUIZ_COOLDOWN_MS - transcurrido };
}
