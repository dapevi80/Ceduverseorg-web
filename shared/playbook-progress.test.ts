import { describe, it, expect } from "vitest";
import { isPlaybookComplete, playbookProgress } from "./playbook-progress";

describe("isPlaybookComplete", () => {
  it("sin evidencia → no completo", () => {
    expect(isPlaybookComplete(3, [])).toBe(false);
  });

  it("evidencia parcial → no completo", () => {
    expect(isPlaybookComplete(3, [0, 1])).toBe(false);
  });

  it("evidencia de todos los índices → completo", () => {
    expect(isPlaybookComplete(3, [0, 1, 2])).toBe(true);
  });

  it("varias fotos del mismo ejercicio no bastan si falta otro índice", () => {
    expect(isPlaybookComplete(3, [0, 0, 0, 1])).toBe(false);
  });

  it("duplicados + todos los índices → completo", () => {
    expect(isPlaybookComplete(3, [0, 1, 1, 2, 2, 2])).toBe(true);
  });

  it("el orden de los índices no importa", () => {
    expect(isPlaybookComplete(4, [3, 1, 0, 2])).toBe(true);
  });

  it("0 ejercicios nunca está completo (curso mal configurado)", () => {
    expect(isPlaybookComplete(0, [])).toBe(false);
  });

  it("índices fuera de rango no cuentan como progreso válido", () => {
    expect(isPlaybookComplete(3, [0, 1, 99])).toBe(false);
  });
});

describe("playbookProgress", () => {
  it("cuenta done/total y arma el flag complete", () => {
    expect(playbookProgress(4, [0, 2])).toEqual({ done: 2, total: 4, complete: false });
  });

  it("done nunca cuenta duplicados", () => {
    expect(playbookProgress(3, [0, 0, 1])).toEqual({ done: 2, total: 3, complete: false });
  });

  it("done ignora índices fuera de rango", () => {
    expect(playbookProgress(2, [0, 1, 7])).toEqual({ done: 2, total: 2, complete: true });
  });

  it("completo cuando done == total", () => {
    expect(playbookProgress(2, [0, 1])).toEqual({ done: 2, total: 2, complete: true });
  });
});
