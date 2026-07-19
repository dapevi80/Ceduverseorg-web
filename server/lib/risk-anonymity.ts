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
  createdAt: Date;
  reporter: { name: string } | null; // null si anónimo
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
    createdAt: row.createdAt,
    reporter,
  };
}

/**
 * Llave R2 para la foto de un hallazgo ANÓNIMO. Nunca incluye el user id:
 * hoy la llave de evidencia del playbook lo incluye
 * (`evidence/${slug}/${userId}/...`), y si un hallazgo "anónimo" reutilizara
 * ese patrón, el nombre del propio archivo firmaría al reportante. En su
 * lugar usa el id del hallazgo (que ya es opaco y no identifica a nadie por
 * sí solo) más un token aleatorio para que la ruta no sea adivinable.
 */
export function anonymousPhotoKey(findingId: string, ext: string): string {
  const token = crypto.randomBytes(16).toString("hex");
  return `risk/anon/${findingId}/${token}.${ext}`;
}

/**
 * Llave R2 para la foto de un hallazgo FIRMADO (anonymous=false). Aquí sí
 * es correcto incluir el user id — el trabajador ya eligió que le
 * reconozcan el hallazgo — siguiendo el mismo patrón que
 * server/routes/playbook.ts usa para evidencia.
 */
export function identifiedPhotoKey(userId: string, findingId: string, ext: string): string {
  const token = crypto.randomBytes(16).toString("hex");
  return `risk/id/${userId}/${findingId}/${token}.${ext}`;
}
