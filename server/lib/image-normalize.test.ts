import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { normalizeImageForStorage, ImageConversionError } from "./image-normalize";

// Verificación empírica, no de nombre de mimetype: para jpeg/png/webp usamos
// bytes reales generados por sharp (no fixtures fabricados a mano) y
// checamos los magic bytes reales del resultado. Un HEIC real de iPhone no
// se puede generar aquí sin un decodificador HEVC (esa es justo la
// limitación que este módulo existe para rodear) — la conversión real de un
// HEIC genuino se verificó por separado con un archivo descargado de
// nokiatech/heif (ver reporte de la tarea); aquí se prueba la ruta de
// heic/heif con bytes inválidos para confirmar la falla honesta (nunca un
// passthrough silencioso del original).

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

function startsWith(buf: Buffer, bytes: number[]): boolean {
  return bytes.every((b, i) => buf[i] === b);
}

async function makeWebp(): Promise<Buffer> {
  return sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 10, g: 200, b: 90 } },
  }).webp().toBuffer();
}

async function makeJpeg(): Promise<Buffer> {
  return sharp({
    create: { width: 16, height: 16, channels: 3, background: { r: 200, g: 10, b: 10 } },
  }).jpeg().toBuffer();
}

async function makePng(): Promise<Buffer> {
  return sharp({
    create: { width: 16, height: 16, channels: 4, background: { r: 10, g: 10, b: 200, alpha: 1 } },
  }).png().toBuffer();
}

describe("normalizeImageForStorage", () => {
  it("deja pasar jpeg tal cual (mismos bytes, mismo mimetype/extension)", async () => {
    const buf = await makeJpeg();
    const out = await normalizeImageForStorage(buf, "image/jpeg");
    expect(out.buffer).toBe(buf); // literalmente el mismo Buffer, sin reencodear
    expect(out.mimetype).toBe("image/jpeg");
    expect(out.extension).toBe("jpg");
    expect(startsWith(out.buffer, JPEG_MAGIC)).toBe(true);
  });

  it("deja pasar png tal cual (mismos bytes, mismo mimetype/extension)", async () => {
    const buf = await makePng();
    const out = await normalizeImageForStorage(buf, "image/png");
    expect(out.buffer).toBe(buf);
    expect(out.mimetype).toBe("image/png");
    expect(out.extension).toBe("png");
    expect(startsWith(out.buffer, PNG_MAGIC)).toBe(true);
  });

  it("convierte webp real a jpeg real (magic bytes FF D8 FF del resultado)", async () => {
    const webpBuf = await makeWebp();
    // Confirma que el input de verdad es webp (RIFF....WEBP), no jpeg/png
    // disfrazado — si esto fallara, la prueba de abajo no probaría nada.
    expect(webpBuf.slice(0, 4).toString("ascii")).toBe("RIFF");
    expect(webpBuf.slice(8, 12).toString("ascii")).toBe("WEBP");

    const out = await normalizeImageForStorage(webpBuf, "image/webp");
    expect(out.mimetype).toBe("image/jpeg");
    expect(out.extension).toBe("jpg");
    expect(startsWith(out.buffer, JPEG_MAGIC)).toBe(true);
    // Bytes distintos del original: sí hubo reencode, no un passthrough con
    // mimetype mentiroso.
    expect(out.buffer.equals(webpBuf)).toBe(false);
  });

  it("heic/heif con bytes inválidos falla honesto (ImageConversionError), nunca passthrough del original", async () => {
    const garbage = Buffer.from("no soy un heic de verdad, solo texto");
    await expect(normalizeImageForStorage(garbage, "image/heic")).rejects.toBeInstanceOf(ImageConversionError);
    await expect(normalizeImageForStorage(garbage, "image/heif")).rejects.toBeInstanceOf(ImageConversionError);
  });

  it("webp con bytes inválidos falla honesto (ImageConversionError), nunca passthrough del original", async () => {
    const garbage = Buffer.from("no soy un webp de verdad, solo texto");
    await expect(normalizeImageForStorage(garbage, "image/webp")).rejects.toBeInstanceOf(ImageConversionError);
  });

  it("un mimetype fuera de lo esperado falla honesto en vez de un passthrough silencioso", async () => {
    const buf = await makeJpeg();
    await expect(normalizeImageForStorage(buf, "image/gif")).rejects.toBeInstanceOf(ImageConversionError);
  });

  it("es insensible a mayúsculas en el mimetype", async () => {
    const buf = await makeJpeg();
    const out = await normalizeImageForStorage(buf, "IMAGE/JPEG");
    expect(out.mimetype).toBe("image/jpeg");
  });
});
