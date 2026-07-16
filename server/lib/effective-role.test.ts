import { describe, it, expect } from "vitest";
import { getEffectiveRole, VIEWABLE_ROLES } from "./effective-role";

function reqWithHeader(value?: string) {
  return {
    headers: value === undefined ? {} : { "x-view-as": value },
  } as any;
}

describe("getEffectiveRole", () => {
  it("real superadmin + header válido -> devuelve el rol del header", () => {
    const req = reqWithHeader("socio_estudiante");
    const account = { userRole: "superadmin" };
    expect(getEffectiveRole(req, account)).toBe("socio_estudiante");
  });

  it("real admin + header válido -> devuelve el rol del header", () => {
    const req = reqWithHeader("empresa");
    const account = { userRole: "admin" };
    expect(getEffectiveRole(req, account)).toBe("empresa");
  });

  it("real superadmin + header inválido -> devuelve el rol real", () => {
    const req = reqWithHeader("rol_que_no_existe");
    const account = { userRole: "superadmin" };
    expect(getEffectiveRole(req, account)).toBe("superadmin");
  });

  it("no-superadmin/no-admin + header -> IGNORA el header, devuelve el rol real (nunca escala)", () => {
    const req = reqWithHeader("superadmin");
    const account = { userRole: "socio_estudiante" };
    expect(getEffectiveRole(req, account)).toBe("socio_estudiante");
  });

  it("sin header -> devuelve el rol real", () => {
    const req = reqWithHeader(undefined);
    const account = { userRole: "superadmin" };
    expect(getEffectiveRole(req, account)).toBe("superadmin");
  });

  it("header no puede ser 'admin' ni 'superadmin' (no son roles viewables) -> rol real", () => {
    const req = reqWithHeader("admin");
    const account = { userRole: "superadmin" };
    expect(getEffectiveRole(req, account)).toBe("superadmin");
  });

  it("account sin userRole (undefined) -> string vacío, no explota", () => {
    const req = reqWithHeader("empresa");
    expect(getEffectiveRole(req, undefined)).toBe("");
  });

  it("VIEWABLE_ROLES contiene exactamente los 6 roles esperados", () => {
    expect(VIEWABLE_ROLES).toEqual([
      "socio_comercial",
      "empresa",
      "empresa_rh",
      "socio_estudiante",
      "socio_instructor",
      "director",
    ]);
  });
});
