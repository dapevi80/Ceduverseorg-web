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

// Compone la decisión de elegibilidad (evaluateCertEligibility) con cualquier
// solicitud viva de ESE curso, para UN certType. Compartido entre la versión
// por-curso (computeCertStatus) y la versión en bloque (computeCertEligibleCourses)
// para no tener dos copias del wiring alrededor de la misma regla.
function buildCertStatusEntry(
  certType: PaidCertType,
  slug: string,
  course: StudioCourseFacts | null | undefined,
  attempts: CertAttemptSummary[],
  requests: CertRequestFacts[],
): CertStatusEntry {
  const decision = evaluateCertEligibility({
    certType,
    courseIdentifier: slug,
    courseExists: Boolean(course),
    available: certType === "dc3" ? Boolean(course?.dc3Available) : Boolean(course?.sepAvailable),
    attempts,
  });
  const req = requests.find((r) => r.studioCourseSlug === slug && r.certType === certType);
  const state: CertTabState = resolveCertTabState(decision, req?.status ?? null);
  return {
    certType,
    state,
    message: certTabMessage(state, certType),
    eligible: state === "elegible",
    priceMxn: CERT_PRICES_MXN[certType],
    request: req ? { id: req.id, status: req.status, pdfUrl: req.pdfUrl, rejectReason: req.rejectReason } : null,
  };
}

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

  return {
    ok: true,
    certs: {
      dc3: buildCertStatusEntry("dc3", input.slug, course, attempts, requests),
      sep: buildCertStatusEntry("sep", input.slug, course, attempts, requests),
    },
  };
}

// ==================== BLOQUE: cursos con los que el socio se ha relacionado ====================
//
// Consumido por la pestaña Certificado (bug 2026-07-19): antes leía
// /api/me/courses, que es el Aula Virtual (tabla `courses` legacy) — de ahí
// los dos síntomas juntos: clases del Aula aparecían en la lista, y los cursos
// completados en el Tutor IA nunca aparecían, porque el Tutor IA vive en
// studio_courses/studio_enrollments/studio_quiz_attempts, una fuente de datos
// distinta que esa ruta nunca consultaba.
//
// "Relacionado" = unión de (a) inscripción en Studio, (b) al menos un intento
// de quiz, o (c) una solicitud de certificado ya existente — así un curso con
// historial pero sin enrollment activo (p.ej. se desinscribió) no desaparece
// de la vista del socio. Reutiliza EXACTAMENTE la misma regla de elegibilidad
// (evaluateCertEligibility) que la ruta por-curso arriba: nada de una segunda
// copia de la regla.

/** Hechos mínimos de una inscripción de Studio que el seam necesita. */
export interface StudioEnrollmentFacts {
  courseIdentifier: string;
}

/** Hechos de un curso de Studio con lo necesario para mostrarlo en la lista. */
export interface StudioCourseListFacts extends StudioCourseFacts {
  slug: string;
  icon: string | null;
}

export interface CertEligibleCoursesDeps {
  /** Inscripciones de Studio del socio (fuente (a) de "relacionado"). */
  getEnrollments(userId: string): Promise<StudioEnrollmentFacts[]>;
  /** TODOS los intentos de quiz del socio, de cualquier curso de Studio (fuente (b)). */
  getAllAttempts(userId: string): Promise<CertAttemptSummary[]>;
  /** TODAS las solicitudes de certificado del socio (fuente (c), y también el estado "ya_solicitado"/"emitido"). */
  getRequestsByUser(userId: string): Promise<CertRequestFacts[]>;
  /** Curso del catálogo del Tutor IA por slug, o null/undefined si no existe (p.ej. se borró). */
  getStudioCourse(slug: string): Promise<StudioCourseListFacts | null | undefined>;
}

export interface CertEligibleCourseEntry {
  slug: string;
  title: string;
  icon: string | null;
  certs: { dc3: CertStatusEntry; sep: CertStatusEntry };
}

export type CertEligibleCoursesResult =
  | { ok: true; courses: CertEligibleCourseEntry[] }
  | { ok: false };

export async function computeCertEligibleCourses(
  deps: CertEligibleCoursesDeps,
  input: { userId: string },
): Promise<CertEligibleCoursesResult> {
  let enrollments: StudioEnrollmentFacts[];
  let attempts: CertAttemptSummary[];
  let requests: CertRequestFacts[];
  try {
    enrollments = await deps.getEnrollments(input.userId);
    attempts = await deps.getAllAttempts(input.userId);
    requests = await deps.getRequestsByUser(input.userId);
  } catch (e: any) {
    // Sin degradación silenciosa: nunca "no tienes cursos" cuando en realidad
    // no se pudo CALCULAR la lista — la ruta responde 503 explícito.
    console.error(
      `[certs] no se pudo calcular la lista de cursos elegibles (user=${input.userId}):`,
      e?.message ?? e,
    );
    return { ok: false };
  }

  const slugs = new Set<string>();
  for (const e of enrollments) slugs.add(e.courseIdentifier);
  for (const a of attempts) slugs.add(a.courseIdentifier);
  for (const r of requests) slugs.add(r.studioCourseSlug);

  let courses: CertEligibleCourseEntry[];
  try {
    courses = await Promise.all(
      Array.from(slugs).map(async (slug) => {
        const course = await deps.getStudioCourse(slug);
        return {
          slug,
          title: course?.title ?? slug,
          icon: course?.icon ?? null,
          certs: {
            dc3: buildCertStatusEntry("dc3", slug, course, attempts, requests),
            sep: buildCertStatusEntry("sep", slug, course, attempts, requests),
          },
        };
      }),
    );
  } catch (e: any) {
    console.error(
      `[certs] no se pudo cargar el detalle de los cursos elegibles (user=${input.userId}):`,
      e?.message ?? e,
    );
    return { ok: false };
  }

  courses.sort((a, b) => a.title.localeCompare(b.title, "es"));
  return { ok: true, courses };
}
