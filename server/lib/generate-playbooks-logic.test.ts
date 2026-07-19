import { describe, it, expect } from "vitest";
import { achievementSlugFor, selectEligibleCourses } from "./generate-playbooks-logic";

describe("achievementSlugFor", () => {
  it("construye el slug del logro como playbook-<courseSlug>", () => {
    expect(achievementSlugFor("seguridad-nom-035")).toBe("playbook-seguridad-nom-035");
  });

  it("no transforma ni normaliza el slug del curso", () => {
    expect(achievementSlugFor("Curso-Con-Mayus_123")).toBe("playbook-Curso-Con-Mayus_123");
  });
});

describe("selectEligibleCourses", () => {
  type Course = { slug: string };
  const all: Course[] = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

  it("sin onlySlug: devuelve todos los cursos", () => {
    expect(selectEligibleCourses(undefined, undefined, all)).toEqual(all);
  });

  it("con onlySlug y curso encontrado: devuelve solo ese curso, ignora allCourses", () => {
    const single: Course = { slug: "b" };
    expect(selectEligibleCourses("b", single, all)).toEqual([single]);
  });

  it("con onlySlug pero curso no encontrado (undefined): devuelve arreglo vacío, no revienta", () => {
    expect(selectEligibleCourses("no-existe", undefined, all)).toEqual([]);
  });

  it("nunca inventa cursos que no vinieron de storage", () => {
    const result = selectEligibleCourses("x", { slug: "x" }, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ slug: "x" });
  });
});
