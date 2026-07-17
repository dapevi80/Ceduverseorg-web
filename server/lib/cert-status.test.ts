import { describe, it, expect } from "vitest";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import {
  computeCertStatus,
  type CertStatusDeps,
  type CertRequestFacts,
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
