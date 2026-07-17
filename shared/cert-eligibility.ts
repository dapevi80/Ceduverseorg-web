// Regla de elegibilidad de los certificados de PAGO del Tutor IA (spec 2026-07-17,
// decisión 1). Función pura, genérica por tipo: recibe los hechos, devuelve la
// decisión y el POR QUÉ. DC-3 y SEP comparten EXACTAMENTE la misma regla; lo único
// que cambia es qué flag del curso se mira (dc3_available vs sep_available) y el
// label en el copy.
//
// Un certificado se puede solicitar si y solo si:
//   1. el curso del Tutor IA está marcado disponible para ESE certificado, y
//   2. existe un intento de quiz APROBADO, calificado por el servidor, de ese
//      socio para ESE curso.
//
// No mira inscripciones. No mira módulos. No mira progreso: `completed >= 100`
// de course_users no es —ni puede ser— un parámetro de esta función. Por eso el
// Aula Virtual (conferencias, sin quiz) no puede emitir DC-3 NI SEP por construcción.

import type { PaidCertType } from "./cert-pricing";

export type { PaidCertType };

export type CertEligibilityState =
  | "elegible"
  | "curso_no_encontrado"
  | "curso_sin_certificado"
  | "sin_intento_aprobado";

export interface CertAttemptSummary {
  courseIdentifier: string;
  passed: boolean;
}

export interface CertEligibilityInput {
  certType: PaidCertType;
  courseIdentifier: string;
  /** ¿Existe el curso en el catálogo del Tutor IA (studio_courses)? */
  courseExists: boolean;
  /** El flag del curso para ESTE certificado: dc3_available o sep_available. */
  available: boolean;
  /** Intentos del socio (pueden venir de varios cursos: aquí se filtran). */
  attempts: CertAttemptSummary[];
}

export interface CertEligibilityDecision {
  eligible: boolean;
  state: CertEligibilityState;
}

export const CERT_LABEL: Record<PaidCertType, string> = {
  dc3: "constancia DC-3 STPS",
  sep: "constancia SEP",
};

const STATE_TEMPLATE: Record<CertEligibilityState, (label: string) => string> = {
  elegible: (l) => `Puedes solicitar tu ${l} de este curso.`,
  curso_no_encontrado: (l) => `Este curso no existe en el Tutor IA, así que no puede emitir ${l}.`,
  curso_sin_certificado: (l) => `Este curso no ofrece ${l}.`,
  sin_intento_aprobado: (l) => `Aprueba el quiz del curso en el Tutor IA para poder solicitar tu ${l}.`,
};

export function certMessage(state: CertEligibilityState, certType: PaidCertType): string {
  return STATE_TEMPLATE[state](CERT_LABEL[certType]);
}

export function evaluateCertEligibility(input: CertEligibilityInput): CertEligibilityDecision {
  if (!input.courseExists) return { eligible: false, state: "curso_no_encontrado" };
  if (!input.available) return { eligible: false, state: "curso_sin_certificado" };
  const aprobado = input.attempts.some(
    (a) => a.passed && a.courseIdentifier === input.courseIdentifier,
  );
  if (!aprobado) return { eligible: false, state: "sin_intento_aprobado" };
  return { eligible: true, state: "elegible" };
}

// Estado que ve el socio en la pestaña Certificado. Cuando no se puede solicitar,
// dice POR QUÉ: nada de "próximamente". Una solicitud viva manda sobre la
// elegibilidad, para que el estado describa la realidad del socio, no la teoría.
export type CertTabState =
  | CertEligibilityState
  | "pago_pendiente"
  | "ya_solicitado"
  | "emitido";

const TAB_TEMPLATE: Record<CertTabState, (label: string) => string> = {
  ...STATE_TEMPLATE,
  pago_pendiente: (l) => `Tu ${l} está esperando el pago. Complétalo para que la procesemos.`,
  ya_solicitado: (l) => `Ya solicitaste tu ${l}. Está en proceso de emisión.`,
  emitido: (l) => `Tu ${l} ya fue emitida.`,
};

export function certTabMessage(state: CertTabState, certType: PaidCertType): string {
  return TAB_TEMPLATE[state](CERT_LABEL[certType]);
}

export function resolveCertTabState(
  decision: CertEligibilityDecision,
  requestStatus: string | null,
): CertTabState {
  if (requestStatus === "emitido") return "emitido";
  if (requestStatus === "solicitado" || requestStatus === "en_proceso") return "ya_solicitado";
  if (requestStatus === "pending_payment") return "pago_pendiente";
  // "rechazado" cae aquí a propósito: F0 reutiliza esa fila, así que puede volver a solicitar.
  if (!decision.eligible) return decision.state;
  return "elegible";
}
