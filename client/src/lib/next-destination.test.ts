import { describe, it, expect } from "vitest";
import { authUrlWithNext, safeNextDestination } from "./next-destination";

describe("authUrlWithNext", () => {
  it("lleva la ruta (con su query) codificada", () => {
    expect(authUrlWithNext("/tutor-ia/nom-035/onboarding?ref=P-1234"))
      .toBe("/auth?next=%2Ftutor-ia%2Fnom-035%2Fonboarding%3Fref%3DP-1234");
  });

  it("ida y vuelta: lo que se codifica es lo que se recupera", () => {
    const destino = "/tutor-ia/nom-035/onboarding?ref=P-1234";
    const search = authUrlWithNext(destino).slice("/auth".length);
    expect(safeNextDestination(search)).toBe(destino);
  });
});

describe("safeNextDestination", () => {
  it("ruta interna -> se acepta", () => {
    expect(safeNextDestination("?next=%2Ftutor-ia%2Fnom-035")).toBe("/tutor-ia/nom-035");
  });

  it("sin next -> null (usar destino por defecto)", () => {
    expect(safeNextDestination("")).toBeNull();
    expect(safeNextDestination("?otra=cosa")).toBeNull();
  });

  it("next vacío -> null", () => {
    expect(safeNextDestination("?next=")).toBeNull();
  });

  it("SEGURIDAD: URL absoluta a otro dominio -> rechazada (open redirect)", () => {
    expect(safeNextDestination("?next=https%3A%2F%2Fsitio-malo.com")).toBeNull();
    expect(safeNextDestination("?next=http%3A%2F%2Fsitio-malo.com")).toBeNull();
  });

  it("SEGURIDAD: protocol-relative //host -> rechazada", () => {
    expect(safeNextDestination("?next=%2F%2Fsitio-malo.com")).toBeNull();
  });

  it("SEGURIDAD: backslash (algunos navegadores lo normalizan a /) -> rechazada", () => {
    expect(safeNextDestination("?next=%2F%5Csitio-malo.com")).toBeNull();
    expect(safeNextDestination("?next=%5C%5Csitio-malo.com")).toBeNull();
  });

  it("SEGURIDAD: ruta relativa sin / inicial -> rechazada", () => {
    expect(safeNextDestination("?next=sitio-malo.com")).toBeNull();
  });

  it("volver a /auth -> null (evita el bucle de login)", () => {
    expect(safeNextDestination("?next=%2Fauth")).toBeNull();
    expect(safeNextDestination("?next=%2Fauth%3Fnext%3D%2Fx")).toBeNull();
    expect(safeNextDestination("?next=%2Fauth%2Falgo")).toBeNull();
  });

  it("conserva la query del destino (el ?ref= del link compartido no se pierde)", () => {
    expect(safeNextDestination("?next=%2Ftutor-ia%2Fnom-035%2Fonboarding%3Fref%3DP-1234"))
      .toBe("/tutor-ia/nom-035/onboarding?ref=P-1234");
  });
});
