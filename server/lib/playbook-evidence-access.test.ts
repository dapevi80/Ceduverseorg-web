import { describe, it, expect } from "vitest";
import { canViewEvidence } from "./playbook-evidence-access";

const OWNER = "11111111-1111-1111-1111-111111111111";
const TEAMMATE_ADMIN = "22222222-2222-2222-2222-222222222222";
const OTHER_TEAM_ADMIN = "33333333-3333-3333-3333-333333333333";
const STRANGER = "44444444-4444-4444-4444-444444444444";

describe("canViewEvidence", () => {
  it("el dueño ve su propia evidencia (sin importar el equipo)", () => {
    expect(canViewEvidence({ requesterId: OWNER, ownerId: OWNER, requesterTeamMemberIds: null })).toBe(true);
    expect(canViewEvidence({ requesterId: OWNER, ownerId: OWNER, requesterTeamMemberIds: [] })).toBe(true);
  });

  it("empresa/admin ve la evidencia de un miembro de su propio equipo", () => {
    expect(canViewEvidence({
      requesterId: TEAMMATE_ADMIN,
      ownerId: OWNER,
      requesterTeamMemberIds: [TEAMMATE_ADMIN, OWNER],
    })).toBe(true);
  });

  it("un usuario de un equipo DIFERENTE es negado, aunque tenga rol admin", () => {
    expect(canViewEvidence({
      requesterId: OTHER_TEAM_ADMIN,
      ownerId: OWNER,
      requesterTeamMemberIds: [OTHER_TEAM_ADMIN, STRANGER],
    })).toBe(false);
  });

  it("requesterTeamMemberIds vacío NUNCA otorga acceso (no es un comodín)", () => {
    expect(canViewEvidence({
      requesterId: TEAMMATE_ADMIN,
      ownerId: OWNER,
      requesterTeamMemberIds: [],
    })).toBe(false);
  });

  it("requesterTeamMemberIds ausente (null/undefined) NUNCA otorga acceso", () => {
    expect(canViewEvidence({ requesterId: TEAMMATE_ADMIN, ownerId: OWNER, requesterTeamMemberIds: null })).toBe(false);
    expect(canViewEvidence({ requesterId: TEAMMATE_ADMIN, ownerId: OWNER, requesterTeamMemberIds: undefined })).toBe(false);
  });

  it("un desconocido sin ninguna relación es negado", () => {
    expect(canViewEvidence({ requesterId: STRANGER, ownerId: OWNER, requesterTeamMemberIds: null })).toBe(false);
    expect(canViewEvidence({ requesterId: STRANGER, ownerId: OWNER, requesterTeamMemberIds: [STRANGER] })).toBe(false);
  });
});
