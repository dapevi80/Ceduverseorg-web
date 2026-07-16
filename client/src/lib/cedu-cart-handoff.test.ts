import { describe, it, expect, beforeEach } from "vitest";
import { writeCeduCart, readCeduCart, CEDU_CART_KEY } from "./cedu-cart-handoff";

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

describe("cedu-cart-handoff", () => {
  beforeEach(() => { for (const k in store) delete store[k]; });
  it("escribe y lee el carrito con el mismo shape", () => {
    writeCeduCart({ vault: 1, tangem2: 2, tangem3: 0 });
    expect(readCeduCart()).toEqual({ vault: 1, tangem2: 2, tangem3: 0 });
  });
  it("readCeduCart borra la clave tras leer (one-shot)", () => {
    writeCeduCart({ vault: 1, tangem2: 0, tangem3: 0 });
    readCeduCart();
    expect(readCeduCart()).toBeNull();
    expect(store[CEDU_CART_KEY]).toBeUndefined();
  });
  it("readCeduCart devuelve null si no hay nada", () => {
    expect(readCeduCart()).toBeNull();
  });
});
