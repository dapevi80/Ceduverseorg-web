import { describe, it, expect } from "vitest";
import { resolveTeamSelection } from "./team-selection";

const TEAM_A = "team-a";
const TEAM_B = "team-b";
const FOREIGN_TEAM = "team-not-mine";

describe("resolveTeamSelection", () => {
  it("una sola membresía → esa, sin importar lo que mande el cliente", () => {
    expect(resolveTeamSelection([TEAM_A], undefined)).toEqual({ ok: true, teamId: TEAM_A });
    expect(resolveTeamSelection([TEAM_A], null)).toEqual({ ok: true, teamId: TEAM_A });
    expect(resolveTeamSelection([TEAM_A], "")).toEqual({ ok: true, teamId: TEAM_A });
  });

  it("una sola membresía y el cliente manda un teamId ajeno → igual gana la única membresía real", () => {
    // El cliente no puede desviar el reporte a un equipo distinto del suyo
    // aunque mande explícitamente otro id: con una sola membresía no hay
    // ambigüedad que resolver, así que el id del cliente ni se consulta.
    expect(resolveTeamSelection([TEAM_A], FOREIGN_TEAM)).toEqual({ ok: true, teamId: TEAM_A });
  });

  it("cero membresías → error no_membership, nunca escoge nada", () => {
    expect(resolveTeamSelection([], undefined)).toEqual({ ok: false, error: "no_membership" });
    expect(resolveTeamSelection([], "cualquier-id")).toEqual({ ok: false, error: "no_membership" });
  });

  it("varias membresías + teamId explícito válido → esa, no la primera ni la que ordene primero", () => {
    expect(resolveTeamSelection([TEAM_A, TEAM_B], TEAM_B)).toEqual({ ok: true, teamId: TEAM_B });
    expect(resolveTeamSelection([TEAM_B, TEAM_A], TEAM_A)).toEqual({ ok: true, teamId: TEAM_A });
  });

  it("varias membresías + teamId ausente → ambiguous, nunca elige en silencio", () => {
    expect(resolveTeamSelection([TEAM_A, TEAM_B], undefined)).toEqual({ ok: false, error: "ambiguous" });
    expect(resolveTeamSelection([TEAM_A, TEAM_B], null)).toEqual({ ok: false, error: "ambiguous" });
    expect(resolveTeamSelection([TEAM_A, TEAM_B], "")).toEqual({ ok: false, error: "ambiguous" });
  });

  it("varias membresías + teamId ajeno (no está en la lista real) → ambiguous, el id del cliente no se confía", () => {
    expect(resolveTeamSelection([TEAM_A, TEAM_B], FOREIGN_TEAM)).toEqual({ ok: false, error: "ambiguous" });
  });

  it("tres o más membresías siguen exigiendo elección explícita", () => {
    const teamC = "team-c";
    expect(resolveTeamSelection([TEAM_A, TEAM_B, teamC], undefined)).toEqual({ ok: false, error: "ambiguous" });
    expect(resolveTeamSelection([TEAM_A, TEAM_B, teamC], teamC)).toEqual({ ok: true, teamId: teamC });
  });
});
