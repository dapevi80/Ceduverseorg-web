import { describe, it, expect } from "vitest";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import {
  evaluateCertRequest,
  type CertRequestGateDeps,
  type StudioCourseFacts,
} from "./cert-request-gate";

// Un curso del Tutor IA marcado para AMBOS certificados.
const CURSO: StudioCourseFacts = {
  title: "Autoestima laboral",
  category: "STPS",
  dc3Available: true,
  sepAvailable: true,
};

function deps(overrides: Partial<CertRequestGateDeps> = {}): CertRequestGateDeps {
  return {
    getStudioCourse: async () => CURSO,
    getAttempts: async () => [{ courseIdentifier: "autoestima", passed: true }],
    ...overrides,
  };
}

const USER = "u1";

describe("evaluateCertRequest — puerta Studio (dc3 y sep)", () => {
  it("intento APROBADO en el Tutor IA => elegible dc3, precio del servidor", async () => {
    const r = await evaluateCertRequest(deps(), { userId: USER, body: { courseSlug: "autoestima", certType: "dc3" } });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certType).toBe("dc3");
    expect(r.courseSlug).toBe("autoestima");
    expect(r.amountMxn).toBe(CERT_PRICES_MXN.dc3);
    expect(r.course.title).toBe("Autoestima laboral");
  });

  it("intento APROBADO en el Tutor IA => elegible sep, precio del servidor", async () => {
    const r = await evaluateCertRequest(deps(), { userId: USER, body: { courseSlug: "autoestima", certType: "sep" } });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.certType).toBe("sep");
    expect(r.amountMxn).toBe(CERT_PRICES_MXN.sep);
  });

  it("sin intento aprobado => NO elegible, no se procede (ni dc3 ni sep)", async () => {
    for (const certType of ["dc3", "sep"] as const) {
      const r = await evaluateCertRequest(
        deps({ getAttempts: async () => [{ courseIdentifier: "autoestima", passed: false }] }),
        { userId: USER, body: { courseSlug: "autoestima", certType } },
      );
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error("unreachable");
      expect(r.kind).toBe("not_eligible");
      if (r.kind !== "not_eligible") throw new Error("unreachable");
      expect(r.state).toBe("sin_intento_aprobado");
    }
  });

  it("curso del Aula Virtual (no existe en Studio, sin intentos) => rechazado para dc3 Y sep", async () => {
    for (const certType of ["dc3", "sep"] as const) {
      const r = await evaluateCertRequest(
        deps({ getStudioCourse: async () => undefined, getAttempts: async () => [] }),
        { userId: USER, body: { courseSlug: "conferencia-aula", certType } },
      );
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error("unreachable");
      expect(r.kind).toBe("not_eligible");
      if (r.kind !== "not_eligible") throw new Error("unreachable");
      expect(r.state).toBe("curso_no_encontrado");
    }
  });

  it("curso con el flag del certificado en false => rechazado (curso_sin_certificado)", async () => {
    const rDc3 = await evaluateCertRequest(
      deps({ getStudioCourse: async () => ({ ...CURSO, dc3Available: false }) }),
      { userId: USER, body: { courseSlug: "autoestima", certType: "dc3" } },
    );
    expect(rDc3.ok).toBe(false);
    if (rDc3.ok) throw new Error("unreachable");
    expect(rDc3.kind === "not_eligible" && rDc3.state).toBe("curso_sin_certificado");

    const rSep = await evaluateCertRequest(
      deps({ getStudioCourse: async () => ({ ...CURSO, sepAvailable: false }) }),
      { userId: USER, body: { courseSlug: "autoestima", certType: "sep" } },
    );
    expect(rSep.ok).toBe(false);
    if (rSep.ok) throw new Error("unreachable");
    expect(rSep.kind === "not_eligible" && rSep.state).toBe("curso_sin_certificado");
  });

  it("el precio SIEMPRE es el del servidor: un amount/score del cliente se IGNORA", async () => {
    const r = await evaluateCertRequest(deps(), {
      userId: USER,
      body: { courseSlug: "autoestima", certType: "dc3", amountMxn: 1, amount: 1, score: 100, price: 0 },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("unreachable");
    expect(r.amountMxn).toBe(CERT_PRICES_MXN.dc3);
    expect(r.amountMxn).not.toBe(1);
  });

  it("SIN degradación silenciosa: si el storage truena => error explícito, NO 'no elegible'", async () => {
    const r = await evaluateCertRequest(
      deps({ getStudioCourse: async () => { throw new Error("db down"); } }),
      { userId: USER, body: { courseSlug: "autoestima", certType: "dc3" } },
    );
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.kind).toBe("error");
  });

  it("rechaza body sin courseSlug o sin certType (400)", async () => {
    const r1 = await evaluateCertRequest(deps(), { userId: USER, body: { certType: "dc3" } });
    expect(r1.ok === false && r1.kind).toBe("bad_request");
    const r2 = await evaluateCertRequest(deps(), { userId: USER, body: { courseSlug: "autoestima" } });
    expect(r2.ok === false && r2.kind).toBe("bad_request");
  });

  it("rechaza un certType que no es de pago (p.ej. diploma) sin tocar el storage", async () => {
    let toco = false;
    const r = await evaluateCertRequest(
      deps({ getStudioCourse: async () => { toco = true; return CURSO; } }),
      { userId: USER, body: { courseSlug: "autoestima", certType: "diploma" } },
    );
    expect(r.ok === false && r.kind).toBe("bad_request");
    expect(toco).toBe(false);
  });
});
