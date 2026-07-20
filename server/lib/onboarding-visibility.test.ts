import { describe, it, expect } from "vitest";
import {
  allowedOnboardingSubcategories,
  shouldExcludeOnboarding,
  filterOnboardingByRole,
} from "./onboarding-visibility";

/** Muestra mínima del catálogo real de producción (categoría Onboarding). */
const ONBOARDING = [
  { slug: "bienvenido-ceduverse", category: "Onboarding", subcategory: "Para Todos" },
  { slug: "que-es-un-rwa", category: "Onboarding", subcategory: "Para Todos" },
  { slug: "guia-empresas", category: "Onboarding", subcategory: "Empresas" },
  { slug: "guia-socios", category: "Onboarding", subcategory: "Socios" },
  { slug: "programa-elite", category: "Onboarding", subcategory: "Socios" },
  { slug: "modelo-cooperativo-comercial", category: "Onboarding", subcategory: "Comercial" },
];
const CAPACITACION = [
  { slug: "nom-035-stps-medina", category: "Normatividad", subcategory: null },
  { slug: "autoestima", category: "Desarrollo Humano", subcategory: null },
];

describe("shouldExcludeOnboarding", () => {
  it("vista por defecto (sin categoría ni búsqueda) -> excluye: la franja ya los pinta", () => {
    expect(shouldExcludeOnboarding(undefined, undefined)).toBe(true);
  });

  it("la franja pide category=Onboarding -> NO excluye, o vendría vacía", () => {
    expect(shouldExcludeOnboarding("Onboarding", undefined)).toBe(false);
  });

  it("otra categoría -> no aplica (el filtro de categoría ya los deja fuera)", () => {
    expect(shouldExcludeOnboarding("Normatividad", undefined)).toBe(false);
  });

  it("búsqueda -> NO excluye: 'bienvenido' debe seguir siendo encontrable", () => {
    expect(shouldExcludeOnboarding(undefined, "bienvenido")).toBe(false);
  });
});

describe("allowedOnboardingSubcategories", () => {
  it("sin sesión -> sólo 'Para Todos'", () => {
    expect(allowedOnboardingSubcategories(null, false)).toEqual(["Para Todos"]);
  });

  it("socio estudiante -> sólo 'Para Todos' (no ve Empresas ni Socios)", () => {
    expect(allowedOnboardingSubcategories("socio_estudiante", false)).toEqual(["Para Todos"]);
  });

  it("admin -> ve todo", () => {
    expect(allowedOnboardingSubcategories("admin", false)).toEqual(
      ["Para Todos", "Empresas", "Socios", "Comercial"]
    );
  });

  it("socio comercial -> Socios + Comercial, nunca Empresas", () => {
    const allowed = allowedOnboardingSubcategories("socio_comercial", false);
    expect(allowed).toContain("Socios");
    expect(allowed).toContain("Comercial");
    expect(allowed).not.toContain("Empresas");
  });

  it("empresa_rh -> Empresas + Comercial, nunca Socios", () => {
    const allowed = allowedOnboardingSubcategories("empresa_rh", false);
    expect(allowed).toContain("Empresas");
    expect(allowed).not.toContain("Socios");
  });

  it("admin de equipo sin rol empresa -> Empresas, pero NO Comercial (capa legal-fiscal)", () => {
    expect(allowedOnboardingSubcategories("socio_estudiante", true)).toEqual(
      ["Para Todos", "Empresas"]
    );
  });
});

describe("filterOnboardingByRole", () => {
  it("nunca toca los cursos de capacitación: sólo gatea Onboarding", () => {
    const allowed = ["Para Todos"];
    const out = filterOnboardingByRole(CAPACITACION, allowed);
    expect(out.map(c => c.slug)).toEqual(["nom-035-stps-medina", "autoestima"]);
  });

  it("socio estudiante en una búsqueda mixta -> no se le cuela guia-empresas ni guia-socios", () => {
    const mixed = [...CAPACITACION, ...ONBOARDING];
    const out = filterOnboardingByRole(mixed, allowedOnboardingSubcategories("socio_estudiante", false));
    expect(out.map(c => c.slug)).toEqual([
      "nom-035-stps-medina",
      "autoestima",
      "bienvenido-ceduverse",
      "que-es-un-rwa",
    ]);
  });

  it("admin -> ve los 6 de Onboarding", () => {
    const out = filterOnboardingByRole(ONBOARDING, allowedOnboardingSubcategories("admin", false));
    expect(out).toHaveLength(6);
  });

  it("un curso de Onboarding SIN subcategoría no se muestra (no hay gateo que aplicarle)", () => {
    const huerfano = [{ slug: "sin-subcat", category: "Onboarding", subcategory: null }];
    expect(filterOnboardingByRole(huerfano, ["Para Todos"])).toEqual([]);
  });
});
