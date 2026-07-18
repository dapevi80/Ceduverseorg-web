import { describe, it, expect, beforeEach } from "vitest";
import {
  authUrlWithNext,
  safeNextDestination,
  rememberNextDestination,
  consumeNextDestination,
  CEDU_NEXT_KEY,
} from "./next-destination";

// localStorage mínimo en memoria: estas pruebas corren en Node, no en el navegador.
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
});

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

describe("rememberNextDestination / consumeNextDestination", () => {
  it("guarda y devuelve el destino (sobrevive el desvío al alta)", () => {
    rememberNextDestination("/tutor-ia/nom-035/onboarding?ref=P-1234");
    expect(consumeNextDestination()).toBe("/tutor-ia/nom-035/onboarding?ref=P-1234");
  });

  it("es de un solo uso: la segunda vez ya no hay nada", () => {
    rememberNextDestination("/tutor-ia/nom-035");
    expect(consumeNextDestination()).toBe("/tutor-ia/nom-035");
    expect(consumeNextDestination()).toBeNull();
  });

  it("sin nada guardado -> null (se usa el destino por defecto)", () => {
    expect(consumeNextDestination()).toBeNull();
  });

  it("SEGURIDAD: no guarda destinos externos", () => {
    rememberNextDestination("https://sitio-malo.com");
    rememberNextDestination("//sitio-malo.com");
    expect(consumeNextDestination()).toBeNull();
  });

  it("SEGURIDAD: si alguien mete a mano un destino externo en storage, no se usa", () => {
    localStorage.setItem(CEDU_NEXT_KEY, "https://sitio-malo.com");
    expect(consumeNextDestination()).toBeNull();
  });

  it("aun rechazándolo, limpia lo guardado (no queda basura pegada)", () => {
    localStorage.setItem(CEDU_NEXT_KEY, "https://sitio-malo.com");
    consumeNextDestination();
    expect(localStorage.getItem(CEDU_NEXT_KEY)).toBeNull();
  });
});
