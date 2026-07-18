import { describe, it, expect } from "vitest";
import { PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_COMPLETION_BONUS, totalPoints } from "./playbook-points";

describe("parámetros", () => {
  it("PLAYBOOK_EVIDENCE_POINTS es 100", () => {
    expect(PLAYBOOK_EVIDENCE_POINTS).toBe(100);
  });

  it("PLAYBOOK_COMPLETION_BONUS es 500", () => {
    expect(PLAYBOOK_COMPLETION_BONUS).toBe(500);
  });
});

describe("totalPoints", () => {
  it("sin evidencia ni logros → 0", () => {
    expect(totalPoints({ evidencePoints: [], achievementValues: [] })).toBe(0);
  });

  it("suma solo evidencia", () => {
    expect(totalPoints({ evidencePoints: [100, 100, 100], achievementValues: [] })).toBe(300);
  });

  it("suma solo logros", () => {
    expect(totalPoints({ evidencePoints: [], achievementValues: [1000, 500] })).toBe(1500);
  });

  it("suma evidencia + logros (caso típico: playbook completo)", () => {
    const evidencePoints = [PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_EVIDENCE_POINTS];
    const achievementValues = [PLAYBOOK_COMPLETION_BONUS];
    expect(totalPoints({ evidencePoints, achievementValues })).toBe(800);
  });
});
