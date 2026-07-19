import { describe, it, expect } from "vitest";
import {
  toCompanyView,
  findingPhotoKey,
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
    resolvedAt: null,
    resolutionNote: null,
    resolutionPhotoKey: null,
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

  it("no revela la identidad ni siquiera si el row trae un campo de identidad futuro con otro nombre (ej. createdByUserId)", () => {
    // Fila adversarial: alguien agregó una columna nueva que no está
    // declarada en FindingRow pero de todos modos trae el user id bajo otra
    // llave. Si toCompanyView alguna vez se reescribiera con un spread
    // (`{ ...row, ... }`), este campo se colaría al resultado sin que nadie
    // lo pidiera. Se castea a través de `unknown` porque el tipo declarado
    // de FindingRow no incluye esta columna a propósito.
    const row = { ...baseRow(), createdByUserId: USER_ID } as unknown as FindingRow;
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

  it("el user id NUNCA se expone a la empresa, ni identificado ni anónimo (CompanyFinding no declara userId)", () => {
    // El reporter identificado expone el NOMBRE a propósito (spec §6), pero
    // eso no es licencia para que el user_id crudo se cuele: la empresa
    // sigue sin necesitarlo para nada de su flujo.
    const row = baseRow({ anonymous: false });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(USER_ID);
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

describe("toCompanyView — photoRef opaco: nunca el photoKey crudo", () => {
  it('el resultado no tiene la propiedad "photoKey"', () => {
    const row = baseRow({ anonymous: true });
    const result = toCompanyView(row);
    expect("photoKey" in result).toBe(false);
  });

  it("el JSON serializado no contiene el photoKey crudo de la fila", () => {
    const row = baseRow({ anonymous: true, photoKey: "risk/finding-0001/muy-secreto-token.jpg" });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(row.photoKey);
  });

  it("photoRef es el id del hallazgo (el proxy autenticado resuelve id -> key en el servidor)", () => {
    const row = baseRow();
    const result = toCompanyView(row);
    expect(result.photoRef).toBe(row.id);
  });
});

describe("toCompanyView — historial de cumplimiento (spec §10): company-authored, no reporter-derived", () => {
  it("resolvedAt viaja truncado al día, igual que createdAt", () => {
    const row = baseRow({ resolvedAt: new Date("2026-07-20T23:59:59.999Z") });
    const result = toCompanyView(row);
    expect(result.resolvedAt).toBe("2026-07-20");
  });

  it("resolvedAt es null cuando el hallazgo no se ha cerrado", () => {
    const row = baseRow({ resolvedAt: null });
    const result = toCompanyView(row);
    expect(result.resolvedAt).toBeNull();
  });

  it("resolutionNote viaja tal cual (la escribió la empresa, no el reportante)", () => {
    const row = baseRow({ resolutionNote: "Se instaló la calza faltante y se capacitó al turno." });
    const result = toCompanyView(row);
    expect(result.resolutionNote).toBe("Se instaló la calza faltante y se capacitó al turno.");
  });

  it("resolutionNote es null cuando no hay nota", () => {
    const row = baseRow({ resolutionNote: null });
    expect(toCompanyView(row).resolutionNote).toBeNull();
  });

  it("hasSolutionPhoto es true cuando la fila trae una llave de foto de solución", () => {
    const row = baseRow({ resolutionPhotoKey: "risk/finding-0001/resolucion-secreta.jpg" });
    const result = toCompanyView(row);
    expect(result.hasSolutionPhoto).toBe(true);
  });

  it("hasSolutionPhoto es false cuando no hay foto de solución (null o cadena vacía)", () => {
    expect(toCompanyView(baseRow({ resolutionPhotoKey: null })).hasSolutionPhoto).toBe(false);
    expect(toCompanyView(baseRow({ resolutionPhotoKey: "" })).hasSolutionPhoto).toBe(false);
    expect(toCompanyView(baseRow({ resolutionPhotoKey: undefined })).hasSolutionPhoto).toBe(false);
  });

  it("la llave cruda de la foto de solución NUNCA aparece en el JSON serializado — solo el booleano", () => {
    const secretKey = "risk/finding-0001/resolucion-muy-secreta-token.jpg";
    const row = baseRow({ resolutionPhotoKey: secretKey });
    const result = toCompanyView(row);
    expect("resolutionPhotoKey" in result).toBe(false);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(secretKey);
    expect(serialized).not.toContain("resolucion-muy-secreta-token");
  });

  it("estos tres campos no dependen de anonymous: siguen presentes en un hallazgo anónimo", () => {
    const row = baseRow({
      anonymous: true,
      resolvedAt: new Date("2026-07-21T08:00:00Z"),
      resolutionNote: "Corregido conforme a NOM-006-STPS-2014.",
      resolutionPhotoKey: "risk/finding-0001/sol.jpg",
    });
    const result = toCompanyView(row);
    expect(result.reporter).toBeNull(); // identidad sigue oculta
    expect(result.resolvedAt).toBe("2026-07-21");
    expect(result.resolutionNote).toBe("Corregido conforme a NOM-006-STPS-2014.");
    expect(result.hasSolutionPhoto).toBe(true);
  });
});

describe("toCompanyView — createdAt se trunca al día en la vista de empresa", () => {
  it("un timestamp con hora se reduce a YYYY-MM-DD", () => {
    const row = baseRow({ createdAt: new Date("2026-07-18T23:59:59.999Z") });
    const result = toCompanyView(row);
    expect(result.createdAt).toBe("2026-07-18");
  });

  it("no deja rastro de la hora en el JSON serializado", () => {
    const row = baseRow({ createdAt: new Date("2026-07-18T05:07:03.000Z") });
    const result = toCompanyView(row);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("05:07:03");
    expect(result.createdAt).toBe("2026-07-18");
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

describe("findingPhotoKey — una sola llave que nunca puede identificar al reportante", () => {
  it("no contiene el user id, aunque exista uno en el contexto (la función ya no acepta ese parámetro)", () => {
    const key = findingPhotoKey("finding-0001", "jpg");
    expect(key).not.toContain(USER_ID);
  });

  it("contiene el id del hallazgo (trazabilidad sin identidad)", () => {
    const key = findingPhotoKey("finding-0001", "jpg");
    expect(key).toContain("finding-0001");
  });

  it("respeta una extensión permitida", () => {
    const key = findingPhotoKey("finding-0001", "png");
    expect(key.endsWith(".png")).toBe(true);
  });

  it("acepta jpg, jpeg, png y webp", () => {
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      const key = findingPhotoKey("finding-0001", ext);
      expect(key.endsWith(`.${ext}`)).toBe(true);
    }
  });

  it("dos llamadas para el mismo finding no colisionan (no determinístico/adivinable)", () => {
    const a = findingPhotoKey("finding-0001", "jpg");
    const b = findingPhotoKey("finding-0001", "jpg");
    expect(a).not.toBe(b);
  });

  it("una extensión maliciosa tipo path traversal se descarta y cae a un default seguro", () => {
    const key = findingPhotoKey("finding-0001", "../../x");
    expect(key).not.toContain("..");
    expect(key.endsWith(".jpg")).toBe(true);
  });

  it("una extensión desconocida (no imagen) cae a un default seguro", () => {
    const key = findingPhotoKey("finding-0001", "exe");
    expect(key.endsWith(".exe")).toBe(false);
    expect(key.endsWith(".jpg")).toBe(true);
  });

  it("es insensible a mayúsculas para la extensión permitida", () => {
    const key = findingPhotoKey("finding-0001", "PNG");
    expect(key.endsWith(".png")).toBe(true);
  });
});
