// Normaliza las fotos del detector de riesgos a un formato que TODO lo que
// las consume después sabe pintar: pdfkit (server/riesgos-historial-pdf.ts,
// el "Historial de cumplimiento" que la empresa le enseña a un inspector de
// la STPS) y los navegadores del panel de la empresa.
//
// El problema concreto: el allowlist de subida (ALLOWED_EVIDENCE_MIMETYPES en
// ./playbook-upload.ts) acepta jpeg/png/webp/heic/heif, pero:
//   - pdfkit SOLO decodifica JPEG y PNG de forma nativa (drawPhotoBox en
//     riesgos-historial-pdf.ts hoy cae a un aviso de texto para el resto).
//   - Los navegadores tampoco renderizan HEIC.
//   - HEIC es el formato por default del iPhone — así que sin esto, buena
//     parte de las fotos reales de un reporte serían inservibles justo en el
//     documento que la empresa está comprando.
//
// Decisión del dueño del producto: convertir a JPEG EN LA SUBIDA, para que
// PDF/navegador/miniaturas simplemente funcionen y lo que se guarda en R2
// sea más chico. jpeg/png se dejan tal cual — reencodearlos no gana nada y
// sí pierde calidad.
//
// Trampa verificada empíricamente antes de construir sobre ella (no se
// asumió): el binario prebuilt de libvips que trae `sharp` NO incluye el
// decodificador HEVC por licenciamiento de patentes, así que `sharp` solo
// resuelve el caso webp. Con un HEIC real (descargado de
// nokiatech/heif, formato ftyp "heic" genuino, NO un avif con extensión
// cambiada), `sharp(buf).jpeg()` falla con:
//   "heif: Error while loading plugin: Support for this compression format
//   has not been built in (11.6003)"
// `sharp.format.heif` SÍ reporta input soportado, pero ese entry es en
// realidad el contenedor AVIF (fileSuffix: [".avif"]) — mismo contenedor
// HEIF, códec AV1 (royalty-free, sí viene compilado) en vez de HEVC
// (patentado, el que usa el iPhone). Por eso el fallback real para
// heic/heif es `heic-convert` (WASM vía libheif-js, sin build nativo), que sí
// decodificó ese mismo archivo real de prueba.

import sharp from "sharp";
// heic-convert no publica ESM ni tipos propios; @types/heic-convert cubre la
// forma del default export (función), interop de CJS vía esModuleInterop.
import convertHeic from "heic-convert";

/** Falla honesta de conversión: la ruta que la use debe responder 4xx con un
 * mensaje claro para el trabajador, NUNCA guardar el original sin convertir
 * (eso solo mueve la foto rota río abajo, al PDF/panel) ni fingir éxito. */
export class ImageConversionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ImageConversionError";
  }
}

export interface NormalizedImage {
  /** Bytes ya listos para subir a R2 tal cual — nunca los del archivo original
   * cuando hubo conversión. */
  buffer: Buffer;
  /** Content-Type real de `buffer`. Debe ser el que se persiste en R2/DB —
   * nunca el mimetype original del archivo subido cuando se convirtió. */
  mimetype: string;
  /** Extensión real de `buffer`, sin punto — debe ser la que arma la llave de
   * R2 (findingPhotoKey en server/lib/risk-anonymity.ts). Igual que
   * mimetype: un archivo ".heic" con bytes JPEG adentro es exactamente la
   * mentira que este módulo existe para evitar. */
  extension: string;
}

const JPEG_QUALITY = 85;
const JPEG_MIMETYPE = "image/jpeg";
const JPEG_EXTENSION = "jpg";

/**
 * Convierte (o deja pasar) una foto ya validada contra el allowlist de
 * subida (ver isImageMimetype en ./playbook-upload.ts — este módulo asume
 * que esa validación ya ocurrió; no vuelve a checar el allowlist).
 *
 * - jpeg/png: passthrough, mismos bytes/mimetype/extensión — reencodear no
 *   compra nada y sí pierde calidad.
 * - webp/heic/heif: se reencodan a JPEG. El resultado siempre reporta
 *   mimetype "image/jpeg" y extensión "jpg", nunca los originales.
 *
 * Nunca lanza silenciosamente ni degrada a "guarda el original de todos
 * modos": si la conversión falla, lanza ImageConversionError y el llamador
 * debe responder 4xx (ver server/routes/riesgos.ts).
 */
export async function normalizeImageForStorage(
  buffer: Buffer,
  mimetype: string
): Promise<NormalizedImage> {
  const mt = mimetype.toLowerCase();

  if (mt === "image/jpeg") {
    return { buffer, mimetype: "image/jpeg", extension: "jpg" };
  }
  if (mt === "image/png") {
    return { buffer, mimetype: "image/png", extension: "png" };
  }

  if (mt === "image/webp") {
    try {
      const out = await sharp(buffer).rotate().jpeg({ quality: JPEG_QUALITY }).toBuffer();
      return { buffer: out, mimetype: JPEG_MIMETYPE, extension: JPEG_EXTENSION };
    } catch (err) {
      throw new ImageConversionError(
        "No se pudo procesar la foto (formato webp inválido o corrupto)",
        { cause: err }
      );
    }
  }

  if (mt === "image/heic" || mt === "image/heif") {
    try {
      const out = await convertHeic({ buffer, format: "JPEG", quality: JPEG_QUALITY / 100 });
      return { buffer: Buffer.from(out), mimetype: JPEG_MIMETYPE, extension: JPEG_EXTENSION };
    } catch (err) {
      throw new ImageConversionError(
        "No se pudo procesar la foto (formato heic/heif inválido o corrupto)",
        { cause: err }
      );
    }
  }

  // No debería alcanzarse: isImageMimetype() ya restringe a los 5 mimetypes
  // de arriba antes de que el archivo llegue aquí. Si llega, es un drift
  // entre el allowlist y este switch — falla honesta, no un passthrough
  // silencioso de un formato no contemplado.
  throw new ImageConversionError(`Formato de imagen no soportado: ${mimetype}`);
}
