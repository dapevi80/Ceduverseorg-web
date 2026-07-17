import {
  evaluateCertEligibility,
  resolveCertTabState,
  certTabMessage,
  type CertAttemptSummary,
  type CertTabState,
} from "@shared/cert-eligibility";
import { CERT_PRICES_MXN, type PaidCertType } from "@shared/cert-pricing";
import type { StudioCourseFacts } from "./cert-request-gate";

// Estado real de los certificados de PAGO (DC-3 y SEP) del Tutor IA para
// (socio, curso), consumido por la pestaña Certificado (Task 11). Vive fuera de
// la ruta y recibe sus dependencias inyectadas para poder testear sin base de
// datos, igual que `cert-request-gate` (la puerta del POST). Este seam es
// SOLO LECTURA: nunca crea ni modifica una solicitud, y no toca la plomería F0
// (pay-first) — únicamente compone la decisión de elegibilidad (Task 7) con
// cualquier solicitud viva para describir la realidad del socio, nunca una
// "próximamente" hueca.

/** Hechos mínimos de una solicitud de certificado que el seam necesita. */
export interface CertRequestFacts {
  id: string;
  studioCourseSlug: string;
  certType: string;
  status: string;
  pdfUrl: string | null;
  rejectReason: string | null;
}

export interface CertStatusDeps {
  /** Curso del catálogo del Tutor IA por slug, o null/undefined si no existe. */
  getStudioCourse(slug: string): Promise<StudioCourseFacts | null | undefined>;
  /** Intentos de quiz del socio (pueden venir de varios cursos: aquí se filtran). */
  getAttempts(userId: string, courseSlug: string): Promise<CertAttemptSummary[]>;
  /** TODAS las solicitudes de certificado del socio (de cualquier curso). */
  getRequestsByUser(userId: string): Promise<CertRequestFacts[]>;
}

export interface CertStatusEntry {
  certType: PaidCertType;
  state: CertTabState;
  message: string;
  eligible: boolean;
  priceMxn: number;
  request: { id: string; status: string; pdfUrl: string | null; rejectReason: string | null } | null;
}

export type CertStatusResult =
  | { ok: true; certs: { dc3: CertStatusEntry; sep: CertStatusEntry } }
  | { ok: false };

export async function computeCertStatus(
  deps: CertStatusDeps,
  input: { userId: string; slug: string },
): Promise<CertStatusResult> {
  let course: StudioCourseFacts | null | undefined;
  let attempts: CertAttemptSummary[];
  let requests: CertRequestFacts[];
  try {
    course = await deps.getStudioCourse(input.slug);
    attempts = await deps.getAttempts(input.userId, input.slug);
    requests = await deps.getRequestsByUser(input.userId);
  } catch (e: any) {
    // Sin degradación silenciosa: si no se pudo CALCULAR el estado, no se
    // responde "no elegible" — se grita y la ruta devuelve un 503 explícito.
    console.error(
      `[certs] no se pudo calcular el estado de certificados (user=${input.userId} course=${input.slug}):`,
      e?.message ?? e,
    );
    return { ok: false };
  }

  const build = (certType: PaidCertType): CertStatusEntry => {
    const decision = evaluateCertEligibility({
      certType,
      courseIdentifier: input.slug,
      courseExists: Boolean(course),
      available: certType === "dc3" ? Boolean(course?.dc3Available) : Boolean(course?.sepAvailable),
      attempts,
    });
    const req = requests.find((r) => r.studioCourseSlug === input.slug && r.certType === certType);
    const state: CertTabState = resolveCertTabState(decision, req?.status ?? null);
    return {
      certType,
      state,
      message: certTabMessage(state, certType),
      eligible: state === "elegible",
      priceMxn: CERT_PRICES_MXN[certType],
      request: req ? { id: req.id, status: req.status, pdfUrl: req.pdfUrl, rejectReason: req.rejectReason } : null,
    };
  };

  return { ok: true, certs: { dc3: build("dc3"), sep: build("sep") } };
}
