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
  it("las tres fuentes vacías → 0", () => {
    expect(totalPoints({ findingsPoints: [], evidencePoints: [], achievementValues: [] })).toBe(0);
  });

  it("suma solo hallazgos validados (risk_findings.points_awarded)", () => {
    expect(totalPoints({ findingsPoints: [150, 150], evidencePoints: [], achievementValues: [] })).toBe(300);
  });

  it("suma solo evidencia", () => {
    expect(totalPoints({ findingsPoints: [], evidencePoints: [100, 100, 100], achievementValues: [] })).toBe(300);
  });

  it("suma solo logros (incluye certificados/diplomas de curso, misma tabla)", () => {
    expect(totalPoints({ findingsPoints: [], evidencePoints: [], achievementValues: [1000, 500] })).toBe(1500);
  });

  it("cada fuente contribuye: hallazgos + evidencia + logros", () => {
    expect(
      totalPoints({
        findingsPoints: [150, 0], // el 0 es un hallazgo aún no validado — no debe restar ni tronar
        evidencePoints: [PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_EVIDENCE_POINTS],
        achievementValues: [PLAYBOOK_COMPLETION_BONUS],
      }),
    ).toBe(150 + 0 + 100 + 100 + 500);
  });

  it("suma evidencia + logros (caso típico: playbook completo)", () => {
    const evidencePoints = [PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_EVIDENCE_POINTS];
    const achievementValues = [PLAYBOOK_COMPLETION_BONUS];
    expect(totalPoints({ findingsPoints: [], evidencePoints, achievementValues })).toBe(800);
  });
});
