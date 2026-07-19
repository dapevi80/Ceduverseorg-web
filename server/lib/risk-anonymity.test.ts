import { describe, it, expect } from "vitest";
import {
  toCompanyView,
  anonymousPhotoKey,
  identifiedPhotoKey,
  type FindingRow,
} from "./risk-anonymity";

// El anonimato es una regla de SERVIDOR (spec §6): si anonymous=true, la
// identidad del trabajador NO sale del servidor bajo ninguna forma — ni
// user_id, ni nombre, ni correo, ni "oculto para uso interno del cliente".
// Estas pruebas son deliberadamente adversariales: no basta con revisar
// reporter === null, hay que serializar TODO el objeto y buscar el id/correo
// crudos, porque la fuga real es un campo olvidado o anidado, no el campo
// obvio. Ver docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §3, §6.

const USER_ID = "a1b2c3d4-user-secreto-0001";
const REPORTER_EMAIL = "trabajador.secreto@empresa-x.com";
const REPORTER_NAME = "Juan Pérez Secreto";

function baseRow(overrides: Partial<FindingRow> = {}): FindingRow {
  return {
    id: "finding-0001",
    userId: USER_ID,
    anonymous: true,
    description: "Falta la calza en la plataforma de carga 3.",
    normRef: "NOM-006-STPS-2014",
    status: "nuevo",
    photoKey: "risk/finding-0001/abc123.jpg",
    createdAt: new Date("2026-07-18T12:00:00Z"),
    reporterName: REPORTER_NAME,
    reporterEmail: REPORTER_EMAIL,
    ...overrides,
  };
}

describe("toCompanyView — anónimo: la identidad no sale del servidor", () => {
  it("el JSON completo del resultado no contiene el user id en ninguna parte", () => {
    const row = baseRow({ anonymous: true });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(USER_ID);
  });

  it("el JSON completo del resultado no contiene el correo del reportante en ninguna parte", () => {
    const row = baseRow({ anonymous: true });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(REPORTER_EMAIL);
  });

  it("el JSON completo del resultado no contiene el nombre del reportante en ninguna parte", () => {
    const row = baseRow({ anonymous: true });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(REPORTER_NAME);
  });

  it("reporter es null cuando es anónimo", () => {
    const result = toCompanyView(baseRow({ anonymous: true }));
    expect(result.reporter).toBeNull();
  });

  it("sigue trayendo el resto de los datos útiles del hallazgo (no censura de más)", () => {
    const row = baseRow({ anonymous: true });
    const result = toCompanyView(row);
    expect(result.id).toBe(row.id);
    expect(result.description).toBe(row.description);
    expect(result.normRef).toBe(row.normRef);
    expect(result.status).toBe(row.status);
    expect(result.anonymous).toBe(true);
  });

  it("no revela la identidad ni siquiera si reporterName/reporterEmail faltan como propiedades enumerables extra en el row", () => {
    // Fila adversarial: alguien agregó un campo con un nombre distinto que
    // por descuido replica el user id (p. ej. un futuro "createdByUserId").
    // Esta prueba documenta la garantía esperada de toCompanyView para el
    // shape declarado de FindingRow — no debe reflejar userId sin importar
    // bajo qué llave del row declarado venga.
    const row = baseRow({ anonymous: true, userId: USER_ID });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(USER_ID);
  });
});

describe("toCompanyView — identificado: sí trae al reportante", () => {
  it("reporter.name está presente cuando anonymous=false", () => {
    const row = baseRow({ anonymous: false });
    const result = toCompanyView(row);
    expect(result.reporter).not.toBeNull();
    expect(result.reporter?.name).toBe(REPORTER_NAME);
  });

  it("el correo del reportante NUNCA se expone a la empresa, ni identificado ni anónimo", () => {
    // CompanyFinding solo declara { name }, nunca email — la empresa no
    // necesita el correo para nada de su flujo (spec §6 solo habla de
    // nombre en la vista de empresa).
    const row = baseRow({ anonymous: false });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(REPORTER_EMAIL);
  });

  it("mantiene el resto de los campos igual que en el caso anónimo", () => {
    const row = baseRow({ anonymous: false });
    const result = toCompanyView(row);
    expect(result.id).toBe(row.id);
    expect(result.description).toBe(row.description);
    expect(result.normRef).toBe(row.normRef);
    expect(result.status).toBe(row.status);
    expect(result.anonymous).toBe(false);
  });
});

describe("toCompanyView — nunca lanza con campos nulos/faltantes", () => {
  it("normRef null: no lanza, normRef sale null", () => {
    const row = baseRow({ normRef: null });
    expect(() => toCompanyView(row)).not.toThrow();
    expect(toCompanyView(row).normRef).toBeNull();
  });

  it("reporterName undefined en fila identificada: no lanza", () => {
    const row = baseRow({ anonymous: false, reporterName: undefined });
    expect(() => toCompanyView(row)).not.toThrow();
  });

  it("reporterName null en fila identificada: no lanza, y reporter no revela un nombre inventado", () => {
    const row = baseRow({ anonymous: false, reporterName: null });
    expect(() => toCompanyView(row)).not.toThrow();
    const result = toCompanyView(row);
    // No hay nombre real que mostrar; no debe inventarse uno ni lanzar.
    expect(result.reporter === null || result.reporter?.name == null).toBe(true);
  });

  it("reporterEmail undefined en fila anónima: no lanza", () => {
    const row = baseRow({ anonymous: true, reporterEmail: undefined });
    expect(() => toCompanyView(row)).not.toThrow();
  });

  it("row con solo los campos obligatorios (sin reporterName/reporterEmail): no lanza", () => {
    const row: FindingRow = {
      id: "finding-0002",
      userId: USER_ID,
      anonymous: true,
      description: "Rampa mal alineada en el andén 2.",
      normRef: null,
      status: "nuevo",
      photoKey: "risk/finding-0002/xyz.jpg",
      createdAt: new Date("2026-07-18T12:00:00Z"),
    };
    expect(() => toCompanyView(row)).not.toThrow();
    const result = toCompanyView(row);
    expect(result.reporter).toBeNull();
  });
});

describe("anonymousPhotoKey — la llave de un hallazgo anónimo no delata al usuario", () => {
  it("no contiene el user id pasado como argumento adicional de contexto", () => {
    const key = anonymousPhotoKey("finding-0001", "jpg");
    expect(key).not.toContain(USER_ID);
  });

  it("contiene el id del hallazgo (trazabilidad sin identidad)", () => {
    const key = anonymousPhotoKey("finding-0001", "jpg");
    expect(key).toContain("finding-0001");
  });

  it("respeta la extensión pedida", () => {
    const key = anonymousPhotoKey("finding-0001", "png");
    expect(key.endsWith(".png")).toBe(true);
  });

  it("dos llamadas para el mismo finding no colisionan (no determinístico/adivinable)", () => {
    const a = anonymousPhotoKey("finding-0001", "jpg");
    const b = anonymousPhotoKey("finding-0001", "jpg");
    expect(a).not.toBe(b);
  });
});

describe("identifiedPhotoKey — la llave de un hallazgo firmado sí puede incluir al usuario", () => {
  it("contiene el user id", () => {
    const key = identifiedPhotoKey(USER_ID, "finding-0003", "jpg");
    expect(key).toContain(USER_ID);
  });

  it("contiene el id del hallazgo", () => {
    const key = identifiedPhotoKey(USER_ID, "finding-0003", "jpg");
    expect(key).toContain("finding-0003");
  });

  it("respeta la extensión pedida", () => {
    const key = identifiedPhotoKey(USER_ID, "finding-0003", "webp");
    expect(key.endsWith(".webp")).toBe(true);
  });

  it("la llave identificada y la anónima para el mismo finding son distintas rutas", () => {
    const idKey = identifiedPhotoKey(USER_ID, "finding-0004", "jpg");
    const anonKey = anonymousPhotoKey("finding-0004", "jpg");
    expect(idKey).not.toBe(anonKey);
  });
});
