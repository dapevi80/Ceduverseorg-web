// Reglas de validación de evidencia del Playbook + dedupe del logro de finalización.
// Sin dependencias de DB/auth a propósito: server/routes/playbook.ts importa db.ts y
// auth.ts, que hacen process.exit(1) si faltan env vars (DB_URL/SESSION_SECRET) — eso
// rompe vitest al importar ese módulo directamente en tests. Esta lógica pura vive
// aparte para poder testearse sin un harness de DB (ver playbook-upload.test.ts).

export const EVIDENCE_MAX_MB = 8;

/** multer fileFilter predicate: solo imágenes se aceptan como evidencia. */
export function isImageMimetype(mimetype: string): boolean {
  return mimetype.startsWith("image/");
}

/** Chequeo post-upload (defensa en profundidad; multer's limits ya aplica el límite de
 * tamaño a nivel de stream, pero esto deja la regla expresable/testeable como un
 * predicado plano). */
export function validateEvidenceFile(file: { mimetype: string; size: number } | undefined | null): { ok: true } | { ok: false; message: string } {
  if (!file) return { ok: false, message: "Se requiere una foto" };
  if (!isImageMimetype(file.mimetype)) return { ok: false, message: "Solo se aceptan imágenes" };
  if (file.size > EVIDENCE_MAX_MB * 1024 * 1024) {
    return { ok: false, message: `La foto no puede pesar más de ${EVIDENCE_MAX_MB}MB` };
  }
  return { ok: true };
}

/** Decide si el bono de finalización del Playbook debe (re)otorgarse.
 * Regla de dedupe: a lo más una vez por usuario+curso — nunca se repite al volver a
 * subir evidencia. */
export function shouldAwardCompletionBonus(complete: boolean, alreadyAwarded: boolean): boolean {
  return complete && !alreadyAwarded;
}
