import {
  evaluateCertEligibility,
  certMessage,
  type CertEligibilityState,
  type CertAttemptSummary,
} from "@shared/cert-eligibility";
import { isPaidCertType, resolveCertPriceMxn, type PaidCertType } from "@shared/cert-pricing";

// Puerta de entrada de los certificados de PAGO del Tutor IA (spec 2026-07-17,
// decisión 1+2). Vive fuera de la ruta y recibe sus dependencias inyectadas para
// que la regla —la única que separa un certificado federal de un `curl`— se pueda
// testear sin base de datos, igual que `studio-quiz-submit`.
//
// dc3 y sep comparten EXACTAMENTE la misma regla; lo único que cambia es qué flag
// del curso se mira (dc3_available vs sep_available). Ya NO se mira
// course_users.completed ni el quiz legacy: una conferencia del Aula Virtual no
// existe en studio_courses ni tiene intentos, así que no puede emitir DC-3 NI SEP.

/** Hechos del curso del Tutor IA que la puerta necesita. Estructural a StudioCourse. */
export interface StudioCourseFacts {
  title: string;
  category: string | null;
  dc3Available: boolean | null;
  sepAvailable: boolean | null;
}

export interface CertRequestGateDeps {
  /** Curso del catálogo del Tutor IA por slug, o null/undefined si no existe. */
  getStudioCourse(slug: string): Promise<StudioCourseFacts | null | undefined>;
  /** Intentos de quiz del socio para ESE curso (mismos que studio_quiz_attempts). */
  getAttempts(userId: string, courseSlug: string): Promise<CertAttemptSummary[]>;
}

export type CertRequestGateResult =
  | { ok: true; certType: PaidCertType; courseSlug: string; course: StudioCourseFacts; amountMxn: number }
  | { ok: false; kind: "bad_request"; message: string }
  | { ok: false; kind: "not_eligible"; state: CertEligibilityState; message: string }
  | { ok: false; kind: "error" };

/**
 * Extrae SOLO courseSlug + certType del body. Cualquier `amount`/`price`/`score`
 * del cliente se IGNORA a propósito: el precio se recalcula en el servidor.
 */
function parseBody(body: unknown): { courseSlug?: unknown; certType?: unknown } {
  const b = (body ?? {}) as Record<string, unknown>;
  return { courseSlug: b.courseSlug, certType: b.certType };
}

export async function evaluateCertRequest(
  deps: CertRequestGateDeps,
  input: { userId: string; body: unknown },
): Promise<CertRequestGateResult> {
  const { courseSlug, certType } = parseBody(input.body);
  if (typeof courseSlug !== "string" || !courseSlug || typeof certType !== "string" || !certType) {
    return { ok: false, kind: "bad_request", message: "courseSlug y certType son requeridos" };
  }
  if (!isPaidCertType(certType)) {
    return { ok: false, kind: "bad_request", message: "certType debe ser dc3 o sep" };
  }

  let course: StudioCourseFacts | null | undefined;
  let attempts: CertAttemptSummary[];
  try {
    course = await deps.getStudioCourse(courseSlug);
    attempts = await deps.getAttempts(input.userId, courseSlug);
  } catch (e: any) {
    // Sin degradación silenciosa: si no se pudo CALCULAR la elegibilidad, NO se
    // asume "no elegible" ni "elegible". Se grita y la ruta responde 503 explícito.
    console.error(
      `[certs] no se pudo calcular la elegibilidad (${certType}, user=${input.userId} course=${courseSlug}):`,
      e?.message ?? e,
    );
    return { ok: false, kind: "error" };
  }

  const decision = evaluateCertEligibility({
    certType,
    courseIdentifier: courseSlug,
    courseExists: Boolean(course),
    available: certType === "dc3" ? Boolean(course?.dc3Available) : Boolean(course?.sepAvailable),
    attempts,
  });
  if (!decision.eligible) {
    return { ok: false, kind: "not_eligible", state: decision.state, message: certMessage(decision.state, certType) };
  }

  // Elegible. El monto se resuelve SIEMPRE aquí (fuente única de verdad F0),
  // jamás desde el body. La ruta lo pasa tal cual a Stripe.
  return { ok: true, certType, courseSlug, course: course!, amountMxn: resolveCertPriceMxn(certType) };
}
