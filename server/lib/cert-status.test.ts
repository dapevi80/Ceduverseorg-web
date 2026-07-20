import { describe, it, expect } from "vitest";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import {
  computeCertStatus,
  computeCertEligibleCourses,
  type CertStatusDeps,
  type CertRequestFacts,
  type CertEligibleCoursesDeps,
  type StudioCourseListFacts,
} from "./cert-status";
import type { StudioCourseFacts } from "./cert-request-gate";

// Curso del Tutor IA marcado para AMBOS certificados.
const CURSO: StudioCourseFacts = {
  title: "Autoestima laboral",
  category: "STPS",
  dc3Available: true,
  sepAvailable: true,
};

function deps(overrides: Partial<CertStatusDeps> = {}): CertStatusDeps {
  return {
    getStudioCourse: async () => CURSO,
    getAttempts: async () => [],
    getRequestsByUser: async () => [],
    ...overrides,
  };
}

const USER = "u1";
const SLUG = "autoestima";

describe("computeCertStatus — estado real de dc3+sep para la pestaña Certificado", () => {
  it("sin intentos => no elegible CON RAZÓN (ambos certificados)", async () => {
    const r = await computeCertStatus(deps(), { userId: USER, slug: SLUG });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.dc3.state).toBe("sin_intento_aprobado");
    expect(r.certs.dc3.eligible).toBe(false);
    expect(r.certs.dc3.message.length).toBeGreaterThan(0);
    expect(r.certs.sep.state).toBe("sin_intento_aprobado");
    expect(r.certs.sep.eligible).toBe(false);
    expect(r.certs.sep.message.length).toBeGreaterThan(0);
  });

  it("intento aprobado + flag disponible => elegible (ambos certificados)", async () => {
    const r = await computeCertStatus(
      deps({ getAttempts: async () => [{ courseIdentifier: SLUG, passed: true }] }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.dc3.state).toBe("elegible");
    expect(r.certs.dc3.eligible).toBe(true);
    expect(r.certs.dc3.priceMxn).toBe(CERT_PRICES_MXN.dc3);
    expect(r.certs.sep.state).toBe("elegible");
    expect(r.certs.sep.eligible).toBe(true);
    expect(r.certs.sep.priceMxn).toBe(CERT_PRICES_MXN.sep);
  });

  it("flag del certificado en false => curso_sin_certificado, aunque haya intento aprobado", async () => {
    const r = await computeCertStatus(
      deps({
        getStudioCourse: async () => ({ ...CURSO, dc3Available: false, sepAvailable: false }),
        getAttempts: async () => [{ courseIdentifier: SLUG, passed: true }],
      }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.dc3.state).toBe("curso_sin_certificado");
    expect(r.certs.dc3.eligible).toBe(false);
    expect(r.certs.sep.state).toBe("curso_sin_certificado");
    expect(r.certs.sep.eligible).toBe(false);
  });

  it("curso que no existe en el Tutor IA => curso_no_encontrado (ambos)", async () => {
    const r = await computeCertStatus(
      deps({ getStudioCourse: async () => undefined }),
      { userId: USER, slug: "no-existe" },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.dc3.state).toBe("curso_no_encontrado");
    expect(r.certs.sep.state).toBe("curso_no_encontrado");
  });

  it("solicitud existente pending_payment => pago_pendiente, no elegible-para-solicitar de nuevo", async () => {
    const existing: CertRequestFacts = {
      id: "req-1",
      studioCourseSlug: SLUG,
      certType: "dc3",
      status: "pending_payment",
      pdfUrl: null,
      rejectReason: null,
    };
    const r = await computeCertStatus(
      deps({
        getAttempts: async () => [{ courseIdentifier: SLUG, passed: true }],
        getRequestsByUser: async () => [existing],
      }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.dc3.state).toBe("pago_pendiente");
    expect(r.certs.dc3.eligible).toBe(false);
    expect(r.certs.dc3.request?.id).toBe("req-1");
    // sep no tiene solicitud propia: sigue elegible de forma independiente.
    expect(r.certs.sep.state).toBe("elegible");
    expect(r.certs.sep.request).toBeNull();
  });

  it("solicitud existente solicitado/en_proceso => ya_solicitado", async () => {
    const existing: CertRequestFacts = {
      id: "req-2",
      studioCourseSlug: SLUG,
      certType: "sep",
      status: "solicitado",
      pdfUrl: null,
      rejectReason: null,
    };
    const r = await computeCertStatus(
      deps({
        getAttempts: async () => [{ courseIdentifier: SLUG, passed: true }],
        getRequestsByUser: async () => [existing],
      }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.sep.state).toBe("ya_solicitado");
    expect(r.certs.sep.request?.status).toBe("solicitado");
  });

  it("una solicitud de OTRO curso no contamina el estado de este curso", async () => {
    const existing: CertRequestFacts = {
      id: "req-3",
      studioCourseSlug: "otro-curso",
      certType: "dc3",
      status: "pending_payment",
      pdfUrl: null,
      rejectReason: null,
    };
    const r = await computeCertStatus(
      deps({
        getAttempts: async () => [{ courseIdentifier: SLUG, passed: true }],
        getRequestsByUser: async () => [existing],
      }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certs.dc3.state).toBe("elegible");
    expect(r.certs.dc3.request).toBeNull();
  });

  it("SIN degradación silenciosa: si el storage truena => { ok: false }, NUNCA 'no elegible'", async () => {
    const r = await computeCertStatus(
      deps({ getStudioCourse: async () => { throw new Error("db down"); } }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(false);
  });

  it("SIN degradación silenciosa: getAttempts truena => { ok: false }", async () => {
    const r = await computeCertStatus(
      deps({ getAttempts: async () => { throw new Error("db down"); } }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(false);
  });

  it("SIN degradación silenciosa: getRequestsByUser truena => { ok: false }", async () => {
    const r = await computeCertStatus(
      deps({ getRequestsByUser: async () => { throw new Error("db down"); } }),
      { userId: USER, slug: SLUG },
    );
    expect(r.ok).toBe(false);
  });
});

// Bug 2026-07-19: la pestaña Certificado leía /api/me/courses (Aula Virtual,
// tabla `courses` legacy) en vez del Tutor IA (studio_courses/studio_enrollments/
// studio_quiz_attempts) — por eso las clases del Aula aparecían y los cursos
// completados del Tutor IA nunca. computeCertEligibleCourses arma la lista
// correcta, reutilizando EXACTAMENTE la misma regla (evaluateCertEligibility).
const COURSE_FACTS: StudioCourseListFacts = { ...CURSO, slug: SLUG, icon: "brain" };

function bulkDeps(overrides: Partial<CertEligibleCoursesDeps> = {}): CertEligibleCoursesDeps {
  return {
    getEnrollments: async () => [],
    getAllAttempts: async () => [],
    getRequestsByUser: async () => [],
    getStudioCourse: async () => COURSE_FACTS,
    ...overrides,
  };
}

describe("computeCertEligibleCourses — lista de cursos del Tutor IA para la pestaña Certificado", () => {
  it("sin inscripción, sin intentos, sin solicitudes => lista vacía (nunca inventa cursos)", async () => {
    const r = await computeCertEligibleCourses(bulkDeps(), { userId: USER });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses).toEqual([]);
  });

  it("inscrito en Studio => aparece en la lista aunque no haya intentado el quiz", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({ getEnrollments: async () => [{ courseIdentifier: SLUG }] }),
      { userId: USER },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses).toHaveLength(1);
    expect(r.courses[0].slug).toBe(SLUG);
    expect(r.courses[0].title).toBe(CURSO.title);
    expect(r.courses[0].certs.dc3.state).toBe("sin_intento_aprobado");
    expect(r.courses[0].certs.sep.state).toBe("sin_intento_aprobado");
  });

  it("intento de quiz sin inscripción activa => igual aparece (unión, no solo enrollment)", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({ getAllAttempts: async () => [{ courseIdentifier: SLUG, passed: true }] }),
      { userId: USER },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses).toHaveLength(1);
    expect(r.courses[0].certs.dc3.state).toBe("elegible");
    expect(r.courses[0].certs.sep.state).toBe("elegible");
  });

  it("solicitud existente sin inscripción ni intento => igual aparece", async () => {
    const existing: CertRequestFacts = {
      id: "req-9", studioCourseSlug: SLUG, certType: "dc3",
      status: "emitido", pdfUrl: "https://x/cert.pdf", rejectReason: null,
    };
    const r = await computeCertEligibleCourses(
      bulkDeps({ getRequestsByUser: async () => [existing] }),
      { userId: USER },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses).toHaveLength(1);
    expect(r.courses[0].certs.dc3.state).toBe("emitido");
    expect(r.courses[0].certs.dc3.request?.pdfUrl).toBe("https://x/cert.pdf");
  });

  it("un mismo curso relacionado por varias fuentes NO se duplica", async () => {
    const existing: CertRequestFacts = {
      id: "req-9", studioCourseSlug: SLUG, certType: "dc3",
      status: "solicitado", pdfUrl: null, rejectReason: null,
    };
    const r = await computeCertEligibleCourses(
      bulkDeps({
        getEnrollments: async () => [{ courseIdentifier: SLUG }],
        getAllAttempts: async () => [{ courseIdentifier: SLUG, passed: true }],
        getRequestsByUser: async () => [existing],
      }),
      { userId: USER },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses).toHaveLength(1);
  });

  it("curso relacionado que ya no existe en studio_courses => curso_no_encontrado, no se cae", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({
        getEnrollments: async () => [{ courseIdentifier: "curso-borrado" }],
        getStudioCourse: async () => undefined,
      }),
      { userId: USER },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses).toHaveLength(1);
    expect(r.courses[0].title).toBe("curso-borrado"); // fallback: el slug, no un título inventado
    expect(r.courses[0].certs.dc3.state).toBe("curso_no_encontrado");
    expect(r.courses[0].certs.sep.state).toBe("curso_no_encontrado");
  });

  it("curso que no ofrece ningún certificado => aparece con curso_sin_certificado en ambos", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({
        getEnrollments: async () => [{ courseIdentifier: SLUG }],
        getStudioCourse: async () => ({ ...COURSE_FACTS, dc3Available: false, sepAvailable: false }),
      }),
      { userId: USER },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.courses[0].certs.dc3.state).toBe("curso_sin_certificado");
    expect(r.courses[0].certs.sep.state).toBe("curso_sin_certificado");
  });

  it("SIN degradación silenciosa: getEnrollments truena => { ok: false }, NUNCA lista vacía", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({ getEnrollments: async () => { throw new Error("db down"); } }),
      { userId: USER },
    );
    expect(r.ok).toBe(false);
  });

  it("SIN degradación silenciosa: getAllAttempts truena => { ok: false }", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({ getAllAttempts: async () => { throw new Error("db down"); } }),
      { userId: USER },
    );
    expect(r.ok).toBe(false);
  });

  it("SIN degradación silenciosa: getRequestsByUser truena => { ok: false }", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({ getRequestsByUser: async () => { throw new Error("db down"); } }),
      { userId: USER },
    );
    expect(r.ok).toBe(false);
  });

  it("SIN degradación silenciosa: getStudioCourse truena para un curso => { ok: false }", async () => {
    const r = await computeCertEligibleCourses(
      bulkDeps({
        getEnrollments: async () => [{ courseIdentifier: SLUG }],
        getStudioCourse: async () => { throw new Error("db down"); },
      }),
      { userId: USER },
    );
    expect(r.ok).toBe(false);
  });
});
