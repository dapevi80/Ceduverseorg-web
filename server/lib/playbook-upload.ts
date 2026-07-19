// Reglas de validación de foto compartidas por el detector de riesgos
// (server/routes/riesgos.ts). El nombre del archivo es histórico: nació para la
// evidencia del playbook (retirada en Task 10, ver
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §9 y §11 —
// "reúso de lo ya construido"), pero las reglas mismas (mimetypes, tamaño,
// unique-violation) siguen siendo las que usa el flujo real de hoy.
// Sin dependencias de DB/auth a propósito: los módulos de rutas importan db.ts y
// auth.ts, que hacen process.exit(1) si faltan env vars (DB_URL/SESSION_SECRET) — eso
// rompe vitest al importar esos módulos directamente en tests. Esta lógica pura vive
// aparte para poder testearse sin un harness de DB (ver playbook-upload.test.ts).

export const EVIDENCE_MAX_MB = 8;

/** Allowlist explícito de mimetypes de evidencia aceptados — solo formatos raster de
 * foto. image/svg+xml (y cualquier otro image/* no listado) queda deliberadamente
 * excluido: un SVG es XML capaz de traer <script>, y los proxies autenticados de foto
 * (hoy GET /api/riesgos/:id/foto y /api/riesgos/:id/foto-solucion) lo servirían
 * inline desde el propio origen de la app — el shape clásico de stored-XSS. Confiar
 * en el prefijo "image/" que manda el cliente (wildcard) no es suficiente; solo estos
 * 5 valores exactos se aceptan. */
export const ALLOWED_EVIDENCE_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** multer fileFilter predicate: solo el allowlist de imágenes raster se acepta como
 * evidencia (ver ALLOWED_EVIDENCE_MIMETYPES). */
export function isImageMimetype(mimetype: string): boolean {
  return (ALLOWED_EVIDENCE_MIMETYPES as readonly string[]).includes(mimetype?.toLowerCase());
}

/** Extensión de archivo a partir del mimetype subido — el key en R2 debe reflejar el
 * formato real (png/webp) en vez de asumir siempre .jpg, que rompe el Content-Type al
 * servir la foto de vuelta. El mapa refleja exactamente ALLOWED_EVIDENCE_MIMETYPES;
 * cualquier valor fuera del allowlist ya fue rechazado por isImageMimetype antes de
 * llegar aquí, así que "jpg" es solo un default seguro por si acaso. */
export function extensionForMimetype(mimetype: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return map[mimetype.toLowerCase()] || "jpg";
}

/** Content-Type seguro para servir de vuelta una foto ya subida por los proxies
 * autenticados (hoy GET /api/riesgos/:id/foto y /api/riesgos/:id/foto-solucion).
 * Defensa en profundidad: nunca refleja
 * ciegamente el valor guardado en DB como Content-Type de la respuesta — solo un
 * mimetype que esté en el mismo allowlist de subida se sirve tal cual; cualquier otro
 * valor (fila vieja, drift futuro en el filtro de subida, dato corrupto) cae a
 * application/octet-stream en vez de arriesgar que el navegador lo interprete como
 * HTML/SVG ejecutable. */
export function safeEvidenceContentType(storedMimetype: string | null | undefined): string {
  const normalized = storedMimetype?.toLowerCase();
  return normalized && (ALLOWED_EVIDENCE_MIMETYPES as readonly string[]).includes(normalized)
    ? normalized
    : "application/octet-stream";
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

/** Detecta un unique-violation de Postgres (código 23505) en un error lanzado por el
 * driver `pg`. Dos requests concurrentes pueden ambos leer "todavía no existe" y
 * colisionar en el INSERT (achievements.slug o uq_achievement_users_cert) — en ese
 * caso el resultado correcto ya quedó persistido por el request que ganó la carrera,
 * así que el perdedor no debe reportar un 500. Cualquier otro error (código distinto,
 * o sin código) sigue propagándose tal cual — nunca se silencia una falla real. */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "23505";
}
