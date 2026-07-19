// Proyección anónima del detector de riesgos — la pieza de seguridad.
//
// Es lo único que se interpone entre un reportante anónimo y su empresa
// (ver docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §3, §6).
// Regla dura: si anonymous=true, la identidad NO sale del servidor — ni
// user_id, ni nombre, ni correo, "para uso interno del cliente" tampoco
// cuenta, porque cualquiera abre las herramientas del navegador y lo lee.
//
// PURO a propósito: sin DB, sin R2/pdfkit, sin imports de rutas. Las rutas
// llaman a toCompanyView() después de leer la fila; nunca deben construir
// la respuesta de la empresa a mano ni con un spread del row.

import crypto from "crypto";

export interface FindingRow {
  id: string;
  userId: string;
  anonymous: boolean;
  description: string;
  normRef: string | null;
  status: string;
  photoKey: string;
  createdAt: Date;
  reporterName?: string | null;
  reporterEmail?: string | null;
  // resto de columnas de risk_findings (team_id, resolution_*, points_awarded,
  // etc.) deliberadamente NO forman parte de este tipo: toCompanyView solo
  // conoce y copia los campos que declara explícitamente abajo.
}

export interface CompanyFinding {
  id: string;
  anonymous: boolean;
  description: string;
  normRef: string | null;
  status: string;
  // Solo fecha (YYYY-MM-DD), truncada al día. En un taller de ocho personas
  // una hora exacta + el rol de turno acota al reportante casi tanto como
  // el nombre; el spec solo promete "fecha". La marca de tiempo completa
  // vive en la vista propia del trabajador, que no es esta función.
  createdAt: string;
  reporter: { name: string } | null; // null si anónimo
  // Referencia opaca a la foto: es el finding id, NUNCA row.photoKey. Un
  // proxy autenticado (fuera de este módulo) resuelve id -> photoKey en el
  // servidor. Sin este campo, un autor de ruta razonablemente adjuntaría
  // row.photoKey a mano para que el cliente pueda pedir la foto, y eso
  // reintroduciría la fuga una línea fuera de este módulo.
  photoRef: string;
}

/**
 * Construye la vista que ve la empresa a partir de la fila cruda de la
 * base. Deliberadamente NO usa spread (`...row`): un spread copiaría
 * automáticamente cualquier campo de identidad que alguien agregue después
 * a FindingRow (userId, reporterEmail, o uno nuevo todavía sin escribir).
 * Cada campo del resultado se nombra a mano, así que un campo nuevo en
 * FindingRow simplemente no aparece en CompanyFinding hasta que alguien lo
 * agregue aquí de forma explícita y consciente.
 */
export function toCompanyView(row: FindingRow): CompanyFinding {
  const reporterName = row.reporterName;
  const reporter =
    !row.anonymous && typeof reporterName === "string" && reporterName.trim().length > 0
      ? { name: reporterName }
      : null;

  return {
    id: row.id,
    anonymous: row.anonymous,
    description: row.description,
    normRef: row.normRef ?? null,
    status: row.status,
    createdAt: toDateOnly(row.createdAt),
    reporter,
    photoRef: row.id,
  };
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const ALLOWED_PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const DEFAULT_PHOTO_EXTENSION = "jpg";

/**
 * `ext` normalmente viene del nombre de archivo que sube el cliente, así
 * que no es de confianza: algo como "../../x" escaparía el prefijo de la
 * llave. Solo se permiten extensiones de imagen conocidas; cualquier otra
 * cosa cae a una extensión segura por default.
 */
function safePhotoExtension(ext: string): string {
  const normalized = ext.toLowerCase();
  return ALLOWED_PHOTO_EXTENSIONS.has(normalized) ? normalized : DEFAULT_PHOTO_EXTENSION;
}

/**
 * Llave R2 para la foto de un hallazgo. Siempre se construye a partir del
 * id del hallazgo (ya opaco, no identifica a nadie por sí solo) más
 * aleatoriedad CSPRNG — NUNCA a partir del user id.
 *
 * Antes existían dos funciones (`anonymousPhotoKey` / `identifiedPhotoKey`).
 * El flujo de reporte sube la foto ANTES de que el worker elija anonimato,
 * así que una ruta de subida con sesión llamaría naturalmente a la variante
 * identificada; si luego el worker marcaba el hallazgo como anónimo, el
 * nombre del propio archivo delataba al reportante. La columna `user_id` en
 * la base es el único vínculo que el sistema necesita entre un hallazgo y
 * su autor; la llave de storage nunca debe ser ese vínculo, así que ahora
 * hay una sola función que no puede identificar a nadie ni por accidente.
 */
export function findingPhotoKey(findingId: string, ext: string): string {
  const token = crypto.randomBytes(16).toString("hex");
  return `risk/${findingId}/${token}.${safePhotoExtension(ext)}`;
}
