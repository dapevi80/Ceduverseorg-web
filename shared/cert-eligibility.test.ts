import { describe, it, expect } from "vitest";
import {
  evaluateCertEligibility,
  certMessage,
  resolveCertTabState,
  certTabMessage,
  type PaidCertType,
} from "./cert-eligibility";

const base = { courseIdentifier: "autoestima", courseExists: true, available: true };

describe("evaluateCertEligibility — dc3 y sep con la misma regla", () => {
  for (const certType of ["dc3", "sep"] as const) {
    it(`[${certType}] sin intentos → no elegible`, () => {
      expect(evaluateCertEligibility({ ...base, certType, attempts: [] }))
        .toEqual({ eligible: false, state: "sin_intento_aprobado" });
    });

    it(`[${certType}] intento reprobado → no elegible`, () => {
      expect(evaluateCertEligibility({ ...base, certType, attempts: [{ courseIdentifier: "autoestima", passed: false }] }))
        .toEqual({ eligible: false, state: "sin_intento_aprobado" });
    });

    it(`[${certType}] intento aprobado + curso marcado → elegible`, () => {
      expect(evaluateCertEligibility({ ...base, certType, attempts: [{ courseIdentifier: "autoestima", passed: true }] }))
        .toEqual({ eligible: true, state: "elegible" });
    });

    it(`[${certType}] curso NO marcado para este certificado + intento aprobado → no elegible`, () => {
      expect(evaluateCertEligibility({ ...base, certType, available: false, attempts: [{ courseIdentifier: "autoestima", passed: true }] }))
        .toEqual({ eligible: false, state: "curso_sin_certificado" });
    });

    it(`[${certType}] aprobado en OTRO curso → no elegible para este`, () => {
      expect(evaluateCertEligibility({ ...base, certType, attempts: [{ courseIdentifier: "relaciones-humanas", passed: true }] }))
        .toEqual({ eligible: false, state: "sin_intento_aprobado" });
    });

    it(`[${certType}] curso que no existe en el Tutor IA → no elegible`, () => {
      expect(evaluateCertEligibility({ ...base, certType, courseExists: false, attempts: [{ courseIdentifier: "autoestima", passed: true }] }))
        .toEqual({ eligible: false, state: "curso_no_encontrado" });
    });
  }

  it("basta UN intento aprobado entre varios reprobados", () => {
    expect(evaluateCertEligibility({ ...base, certType: "dc3", attempts: [
      { courseIdentifier: "autoestima", passed: false },
      { courseIdentifier: "autoestima", passed: true },
      { courseIdentifier: "autoestima", passed: false },
    ] })).toEqual({ eligible: true, state: "elegible" });
  });

  // GARANTÍA ESTRUCTURAL DEL DISEÑO (spec 2026-07-17), AHORA PARA AMBOS CERTIFICADOS:
  it("una conferencia del Aula Virtual al 100% NO produce elegibilidad — ni DC-3 ni SEP", () => {
    // Una conferencia no tiene quiz → jamás genera un intento. El 100% de
    // course_users.completed ni siquiera es un parámetro de esta función: no hay
    // forma de pasárselo. El Aula Virtual no puede emitir DC-3 NI SEP POR
    // CONSTRUCCIÓN, no por configuración. Aunque ambos flags estuvieran en true.
    const conferenciaAl100 = { courseIdentifier: "nom-035-stps-riesgo-psicosocial", courseExists: true, available: true, attempts: [] as const };
    expect(evaluateCertEligibility({ ...conferenciaAl100, certType: "dc3" }))
      .toEqual({ eligible: false, state: "sin_intento_aprobado" });
    expect(evaluateCertEligibility({ ...conferenciaAl100, certType: "sep" }))
      .toEqual({ eligible: false, state: "sin_intento_aprobado" });
  });

  it("cada estado tiene un mensaje que dice POR QUÉ, por tipo de certificado", () => {
    const states = ["elegible", "curso_no_encontrado", "curso_sin_certificado", "sin_intento_aprobado"] as const;
    for (const certType of ["dc3", "sep"] as PaidCertType[]) {
      for (const state of states) {
        expect(certMessage(state, certType).length).toBeGreaterThan(0);
      }
    }
    // El label distingue el certificado en el copy.
    expect(certMessage("elegible", "dc3")).toMatch(/DC-3/);
    expect(certMessage("elegible", "sep")).toMatch(/SEP/);
  });
});

const elegible = { eligible: true, state: "elegible" } as const;
const sinIntento = { eligible: false, state: "sin_intento_aprobado" } as const;

describe("resolveCertTabState", () => {
  it("elegible → elegible", () => {
    expect(resolveCertTabState(elegible, null)).toBe("elegible");
  });

  it("no elegible → conserva el POR QUÉ", () => {
    expect(resolveCertTabState(sinIntento, null)).toBe("sin_intento_aprobado");
  });

  it("solicitud pendiente de pago → pago_pendiente", () => {
    expect(resolveCertTabState(elegible, "pending_payment")).toBe("pago_pendiente");
  });

  it("solicitud pagada (solicitado / en_proceso) → ya_solicitado", () => {
    expect(resolveCertTabState(elegible, "solicitado")).toBe("ya_solicitado");
    expect(resolveCertTabState(elegible, "en_proceso")).toBe("ya_solicitado");
  });

  it("solicitud emitida → emitido", () => {
    expect(resolveCertTabState(elegible, "emitido")).toBe("emitido");
  });

  it("solicitud rechazada → vuelve a elegible (F0 reutiliza la fila)", () => {
    expect(resolveCertTabState(elegible, "rechazado")).toBe("elegible");
  });

  it("una solicitud viva gana sobre la elegibilidad: el estado no miente", () => {
    expect(resolveCertTabState(sinIntento, "solicitado")).toBe("ya_solicitado");
  });

  it("todo estado de pestaña tiene mensaje para ambos certificados", () => {
    const states = ["elegible", "curso_no_encontrado", "curso_sin_certificado", "sin_intento_aprobado", "pago_pendiente", "ya_solicitado", "emitido"] as const;
    for (const certType of ["dc3", "sep"] as const) {
      for (const s of states) expect(certTabMessage(s, certType).length).toBeGreaterThan(0);
    }
  });
});
