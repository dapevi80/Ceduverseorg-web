import { describe, it, expect } from "vitest";
import { PLAYBOOK_COMPLETION_BONUS, totalPoints } from "./playbook-points";

describe("parámetros", () => {
  it("PLAYBOOK_COMPLETION_BONUS es 500", () => {
    expect(PLAYBOOK_COMPLETION_BONUS).toBe(500);
  });
});

describe("totalPoints", () => {
  it("las dos fuentes vacías → 0", () => {
    expect(totalPoints({ findingsPoints: [], achievementValues: [] })).toBe(0);
  });

  it("suma solo hallazgos validados (risk_findings.points_awarded)", () => {
    expect(totalPoints({ findingsPoints: [150, 150], achievementValues: [] })).toBe(300);
  });

  it("suma solo logros (incluye certificados/diplomas de curso, misma tabla)", () => {
    expect(totalPoints({ findingsPoints: [], achievementValues: [1000, 500] })).toBe(1500);
  });

  it("cada fuente contribuye: hallazgos + logros", () => {
    expect(
      totalPoints({
        findingsPoints: [150, 0], // el 0 es un hallazgo aún no validado — no debe restar ni tronar
        achievementValues: [PLAYBOOK_COMPLETION_BONUS],
      }),
    ).toBe(150 + 0 + 500);
  });
});
