// Reglas puras de estado y puntos del detector de riesgos (Task 2).
//
// Un trabajador capacitado reporta un incumplimiento real (nuevo); la
// empresa lo revisa (en_revision) y lo cierra como atendido (documentando
// la corrección con una foto) o descartado (documentando el motivo). Este
// módulo NO toca base de datos ni I/O: es el árbitro puro que las rutas
// consultan antes de escribir. Ver
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §6.

export type RiskStatus = "nuevo" | "en_revision" | "atendido" | "descartado";

/** Puntos que gana el trabajador cuando su hallazgo se VALIDA (entra a "atendido"). */
export const RIESGO_VALIDADO_PUNTOS = 150;

// Grafo de transiciones permitidas. El flujo normal es
// nuevo -> en_revision -> {atendido, descartado}; ambos estados de cierre
// pueden reabrirse hacia en_revision (p. ej. la empresa se equivocó al
// cerrar), pero nada retrocede hasta "nuevo": ese estado sólo existe al
// crear el hallazgo.
const TRANSITIONS: Record<RiskStatus, readonly RiskStatus[]> = {
  nuevo: ["en_revision"],
  en_revision: ["atendido", "descartado"],
  atendido: ["en_revision"],
  descartado: ["en_revision"],
};

export function canTransition(from: RiskStatus, to: RiskStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Valida que el estado DESTINO traiga la evidencia que exige, sin la cual el
 * historial "detectado -> corregido" que le vendemos a la empresa quedaría
 * hueco (atendido) o el trabajador aprendería que el canal es teatro
 * (descartado sin motivo).
 */
export function validateTransition(
  to: RiskStatus,
  input: { resolutionPhotoKey?: string | null; resolutionNote?: string | null },
): { ok: true } | { ok: false; message: string } {
  if (to === "atendido" && isBlank(input.resolutionPhotoKey)) {
    return {
      ok: false,
      message: "Para marcar el hallazgo como atendido se necesita la foto de la corrección.",
    };
  }
  if (to === "descartado" && isBlank(input.resolutionNote)) {
    return {
      ok: false,
      message: "Para descartar el hallazgo se necesita explicar el motivo.",
    };
  }
  return { ok: true };
}

/**
 * Puntos a acreditar por ESTA transición. Sólo paga al entrar a "atendido",
 * y sólo si nada se había acreditado antes: un hallazgo reabierto y vuelto a
 * cerrar no debe pagarle dos veces al trabajador.
 */
export function pointsForTransition(
  from: RiskStatus,
  to: RiskStatus,
  alreadyAwarded: number,
): number {
  if (to !== "atendido") return 0;
  if (alreadyAwarded > 0) return 0;
  return RIESGO_VALIDADO_PUNTOS;
}
