import { describe, it, expect } from "vitest";
import { decideInvitation, type InvitationFacts } from "./invitation-decision";

function facts(overrides: Partial<InvitationFacts> = {}): InvitationFacts {
  return {
    tieneCuentaEnCeduverse: false,
    yaEsMiembroDelEquipo: false,
    yaTieneInvitacionPendiente: false,
    ...overrides,
  };
}

describe("decideInvitation", () => {
  it("invita a un correo que no tiene cuenta", () => {
    expect(decideInvitation(facts())).toEqual({ accion: "invitar" });
  });

  // ESTE es el bug: antes, tener cuenta hacía que el endpoint insertara la
  // membresía directo, sin token ni aviso. Tener cuenta NO puede cambiar el
  // desenlace — la persona sigue teniendo que aceptar.
  it("invita igual a un correo que YA tiene cuenta, en vez de anexarlo", () => {
    expect(decideInvitation(facts({ tieneCuentaEnCeduverse: true }))).toEqual({ accion: "invitar" });
  });

  it("rechaza a quien ya es miembro del equipo", () => {
    const d = decideInvitation(facts({ tieneCuentaEnCeduverse: true, yaEsMiembroDelEquipo: true }));
    expect(d).toEqual({ accion: "ya_es_miembro" });
  });

  it("señala la invitación pendiente y permite reenviarla", () => {
    const d = decideInvitation(facts({ yaTieneInvitacionPendiente: true }));
    expect(d).toEqual({ accion: "ya_invitado", puedeReenviar: true });
  });

  it("ser miembro pesa más que tener invitación pendiente", () => {
    const d = decideInvitation(
      facts({ yaEsMiembroDelEquipo: true, yaTieneInvitacionPendiente: true }),
    );
    expect(d).toEqual({ accion: "ya_es_miembro" });
  });

  // Garantía estructural: ninguna combinación de hechos puede producir un alta
  // de membresía. Si alguien reintroduce esa rama, este test truena.
  it("ninguna combinación de hechos produce un alta directa de membresía", () => {
    for (const cuenta of [false, true]) {
      for (const miembro of [false, true]) {
        for (const pendiente of [false, true]) {
          const d = decideInvitation(
            facts({
              tieneCuentaEnCeduverse: cuenta,
              yaEsMiembroDelEquipo: miembro,
              yaTieneInvitacionPendiente: pendiente,
            }),
          );
          expect(["invitar", "ya_es_miembro", "ya_invitado"]).toContain(d.accion);
        }
      }
    }
  });
});
