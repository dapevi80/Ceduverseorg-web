import { describe, it, expect } from "vitest";
import { assembleReferences, hasValidExerciseCount, PLAYBOOK_EXERCISES_MIN, PLAYBOOK_EXERCISES_MAX } from "./playbook-assemble";
import type { PlaybookExercise } from "./playbook-assemble";

describe("assembleReferences", () => {
  it("sin módulos → sin referencias", () => {
    expect(assembleReferences([])).toEqual([]);
  });

  it("une las referencias de todos los módulos, verbatim", () => {
    const modules = [
      { references: ["NOM-035-STPS-2018", "LFT Art. 132"] },
      { references: ["NOM-002-STPS-2010"] },
    ];
    expect(assembleReferences(modules)).toEqual([
      "NOM-035-STPS-2018",
      "LFT Art. 132",
      "NOM-002-STPS-2010",
    ]);
  });

  it("dedupea manteniendo el primer orden de aparición", () => {
    const modules = [
      { references: ["NOM-035-STPS-2018"] },
      { references: ["NOM-035-STPS-2018", "LFT Art. 132"] },
    ];
    expect(assembleReferences(modules)).toEqual(["NOM-035-STPS-2018", "LFT Art. 132"]);
  });

  it("módulos sin references (null) no rompen ni inventan nada", () => {
    const modules = [{ references: null }, { references: ["LFT Art. 132"] }];
    expect(assembleReferences(modules)).toEqual(["LFT Art. 132"]);
  });

  it("nunca agrega texto que no estaba en los módulos", () => {
    const modules = [{ references: ["Fuente real única"] }];
    const result = assembleReferences(modules);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Fuente real única");
  });
});

describe("hasValidExerciseCount", () => {
  const ex = (n: number): PlaybookExercise[] =>
    Array.from({ length: n }, (_, i) => ({ index: i, title: `E${i}`, instruction: "..." }));

  it(`${PLAYBOOK_EXERCISES_MIN - 1} ejercicios → inválido (menos del mínimo)`, () => {
    expect(hasValidExerciseCount(ex(PLAYBOOK_EXERCISES_MIN - 1))).toBe(false);
  });

  it(`${PLAYBOOK_EXERCISES_MIN} ejercicios → válido (mínimo)`, () => {
    expect(hasValidExerciseCount(ex(PLAYBOOK_EXERCISES_MIN))).toBe(true);
  });

  it(`${PLAYBOOK_EXERCISES_MAX} ejercicios → válido (máximo)`, () => {
    expect(hasValidExerciseCount(ex(PLAYBOOK_EXERCISES_MAX))).toBe(true);
  });

  it(`${PLAYBOOK_EXERCISES_MAX + 1} ejercicios → inválido (más del máximo)`, () => {
    expect(hasValidExerciseCount(ex(PLAYBOOK_EXERCISES_MAX + 1))).toBe(false);
  });

  it("0 ejercicios → inválido", () => {
    expect(hasValidExerciseCount([])).toBe(false);
  });
});
