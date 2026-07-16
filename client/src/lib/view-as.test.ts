import { describe, it, expect, beforeEach } from "vitest";
import {
  VIEW_AS_STORAGE_KEY,
  VIEWABLE_ROLES,
  isViewableRole,
  getStoredViewAsRole,
  setStoredViewAsRole,
} from "./view-as";

const store: Record<string, string> = {};
(globalThis as any).sessionStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

describe("view-as", () => {
  beforeEach(() => { for (const k in store) delete store[k]; });

  it("isViewableRole acepta exactamente los roles de VIEWABLE_ROLES", () => {
    for (const role of VIEWABLE_ROLES) {
      expect(isViewableRole(role)).toBe(true);
    }
    expect(isViewableRole("superadmin")).toBe(false);
    expect(isViewableRole("admin")).toBe(false);
    expect(isViewableRole("cualquier-otra-cosa")).toBe(false);
    expect(isViewableRole(undefined)).toBe(false);
  });

  it("getStoredViewAsRole devuelve null si no hay nada guardado", () => {
    expect(getStoredViewAsRole()).toBeNull();
  });

  it("setStoredViewAsRole persiste un rol viewable y getStoredViewAsRole lo lee", () => {
    setStoredViewAsRole("socio_estudiante");
    expect(store[VIEW_AS_STORAGE_KEY]).toBe("socio_estudiante");
    expect(getStoredViewAsRole()).toBe("socio_estudiante");
  });

  it("setStoredViewAsRole(null) limpia la clave", () => {
    setStoredViewAsRole("empresa");
    setStoredViewAsRole(null);
    expect(store[VIEW_AS_STORAGE_KEY]).toBeUndefined();
    expect(getStoredViewAsRole()).toBeNull();
  });

  it("getStoredViewAsRole ignora un valor corrupto/no viewable en storage", () => {
    store[VIEW_AS_STORAGE_KEY] = "superadmin";
    expect(getStoredViewAsRole()).toBeNull();
  });
});
