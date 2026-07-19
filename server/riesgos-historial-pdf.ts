import PDFDocument from "pdfkit";
import { registerCuadernoFonts } from "./cuaderno/fonts";
import { CUADERNO, dotGrid, hexOutline, accentCard } from "./cuaderno/visuals";

// Historial de cumplimiento (Task 11 del plan
// docs/superpowers/plans/2026-07-18-detector-riesgos.md; spec
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §10). Es el
// documento comercial de fondo del producto: "riesgo detectado el 12 de
// marzo, corregido el 14, con foto de ambos momentos y la norma citada" —
// lo que una empresa mexicana le enseña a un inspector de la STPS.
//
// Este módulo es PURO respecto a identidad y almacenamiento: no toca la
// base de datos ni R2. Recibe ya resueltos (a) los datos seguros de cada
// hallazgo (el llamador decide qué nombre, si alguno, corresponde — nunca
// se infiere aquí) y (b) los bytes de las fotos ya descargados de R2. Así
// la regla dura de anonimato ("un hallazgo anónimo no trae identidad") se
// cumple en dos capas independientes: el llamador nunca consulta la
// identidad de un reportante anónimo, y este módulo, aunque recibiera un
// nombre por error, lo ignora si `anonymous` es true (defensa en
// profundidad — ver renderFindingEntry).

const ML = 56;
const MR = 56;
const MT = 56;
const MB = 56;
const BOTTOM_BUFFER = 24;

function bottomLimit(PH: number): number {
  return PH - MB - BOTTOM_BUFFER;
}

function ensureSpace(doc: PDFKit.PDFDocument, PH: number, needed: number) {
  if (doc.y + needed > bottomLimit(PH)) {
    doc.addPage();
    doc.y = MT;
  }
}

export interface HistorialFindingInput {
  id: string;
  /** Elección del trabajador en ESE reporte (spec §2.2) — si es true, ningún
   * dato de identidad debe llegar aquí ya poblado; ver reporterName. */
  anonymous: boolean;
  /** Nombre del reportante. El llamador NUNCA debe poblar este campo cuando
   * `anonymous` es true (ni siquiera con un valor real sin usar) — este
   * módulo lo trata como si no existiera en ese caso de todos modos, pero
   * la regla real vive en no haber consultado la identidad antes. */
  reporterName: string | null;
  description: string;
  /** Verbatim de lo guardado en risk_findings.norm_ref — nunca se reformatea,
   * expande o "mejora" aquí. null si el hallazgo no tiene norma asociada
   * (spec §7: válido, cero invención). */
  normRef: string | null;
  detectedAt: Date;
  /** Fecha en que la empresa cerró el hallazgo como "atendido". */
  resolvedAt: Date | null;
  resolutionNote: string | null;
  /** Bytes de la foto del riesgo, ya leídos de R2 por el llamador. null si
   * no se pudo recuperar (dato inconsistente — se imprime un aviso, nunca
   * se omite la entrada completa). */
  hazardPhoto: Buffer | null;
  /** Bytes de la foto de la corrección. null si el hallazgo no tiene una
   * (dato inconsistente para un "atendido", que debería exigirla) — se
   * imprime "sin foto de corrección" explícito (brief Task 11), nunca se
   * oculta el hueco. */
  correctionPhoto: Buffer | null;
}

export interface HistorialPdfOptions {
  /** Nombre(s) de la(s) empresa(s) del solicitante — normalmente una sola. */
  companyNames: string[];
  /** Texto ya formateado del periodo cubierto (p. ej. "1 de enero — 15 de
   * julio de 2026" o "Historial completo"). Se decide fuera de este módulo
   * porque depende de cómo el llamador interpretó los filtros de fecha. */
  periodLabel: string;
  generatedAt?: Date;
}

const PHOTO_LABEL_H = 14;
const PHOTO_GAP = 16;
const ENTRY_GAP = 18;
const ENTRY_PAD = 14;

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

/** Dibuja una imagen ya descargada dentro de una caja con esquinas
 * redondeadas, o un aviso explícito si no hay bytes o si pdfkit no puede
 * decodificar el formato (pdfkit solo soporta JPEG/PNG de forma nativa —
 * las fotos del detector permiten también webp/heic/heif en la subida, así
 * que un hallazgo real puede traer un formato que la vista previa del PDF
 * no puede pintar). Nunca lanza: un formato no soportado se documenta con
 * texto en vez de tronar la generación de todo el historial. */
function drawPhotoBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  photo: Buffer | null,
  missingText: string,
  fonts: ReturnType<typeof registerCuadernoFonts>
) {
  doc.save();
  doc.roundedRect(x, y, w, h, 6).lineWidth(0.75).strokeColor(CUADERNO.INK).strokeOpacity(0.15).stroke();
  doc.restore();

  let drawn = false;
  if (photo && photo.length > 0) {
    try {
      doc.image(photo, x + 3, y + 3, { fit: [w - 6, h - 6], align: "center", valign: "center" });
      drawn = true;
    } catch {
      // Formato que pdfkit no decodifica (p. ej. webp/heic) — cae al aviso
      // de abajo en vez de tronar la generación completa del historial.
    }
  }

  if (!drawn) {
    doc.save();
    doc.roundedRect(x + 3, y + 3, w - 6, h - 6, 4).fillOpacity(0.05).fill(CUADERNO.INK);
    doc.fillOpacity(1);
    const text = photo && photo.length > 0
      ? "Formato de imagen no compatible con esta vista previa"
      : missingText;
    doc.font(fonts.sans).fontSize(8.5).fillColor(CUADERNO.INK_MUTED)
      .text(text, x + 12, y + h / 2 - 10, { width: w - 24, align: "center", lineGap: 2 });
    doc.restore();
  }
}

/** Altura total que va a ocupar una entrada, calculada ANTES de dibujar
 * nada (mismo patrón que CH_NEED/startChapter en kit-pdf.ts): permite un
 * solo ensureSpace() por entrada en vez de arriesgar que el pdfkit
 * autopaginador parta la tarjeta a la mitad y deje el borde/fondo
 * desalineado con el contenido. */
function measureEntry(
  doc: PDFKit.PDFDocument,
  f: HistorialFindingInput,
  CW: number,
  photoBoxH: number,
  fonts: ReturnType<typeof registerCuadernoFonts>
): number {
  const textW = CW - ENTRY_PAD * 2;
  doc.font(fonts.sans).fontSize(10.5);
  const descH = doc.heightOfString(f.description, { width: textW, lineGap: 2 });

  const noteText = f.resolutionNote?.trim() || "";
  doc.font(fonts.sans).fontSize(9.5);
  const noteH = noteText ? doc.heightOfString(`Nota de la empresa: ${noteText}`, { width: textW, lineGap: 2 }) : 0;

  const HEADER_H = 20; // badge + fecha
  const NORM_H = 16;
  const DATES_H = 14;
  const REPORTER_H = 14;
  const photosH = photoBoxH + PHOTO_LABEL_H + PHOTO_GAP;

  return ENTRY_PAD + HEADER_H + 6 + NORM_H + descH + 8 + DATES_H + 4 + REPORTER_H
    + (noteText ? noteH + 8 : 0) + 8 + photosH + ENTRY_PAD;
}

/** Dibuja una entrada del historial. Regla dura (spec §6, brief Task 11):
 * si `f.anonymous` es true, el nombre NUNCA se imprime — ni siquiera si
 * `f.reporterName` llegara poblado por error del llamador, esta función lo
 * ignora explícitamente. Esa es la segunda capa de defensa; la primera (la
 * que de verdad importa) es que el llamador jamás debe consultar la
 * identidad de un reportante anónimo. */
function renderFindingEntry(
  doc: PDFKit.PDFDocument,
  PH: number,
  CW: number,
  f: HistorialFindingInput,
  index: number,
  fonts: ReturnType<typeof registerCuadernoFonts>
) {
  const photoBoxH = 150;
  const totalH = measureEntry(doc, f, CW, photoBoxH, fonts);
  ensureSpace(doc, PH, totalH + ENTRY_GAP);

  const top = doc.y;
  const left = ML;
  const textW = CW - ENTRY_PAD * 2;
  let y = top + ENTRY_PAD;

  // Encabezado: número de hallazgo + insignia "Atendido".
  doc.font(fonts.sansBold).fontSize(9).fillColor(CUADERNO.GREEN)
    .text(`HALLAZGO ${String(index + 1).padStart(2, "0")} · ATENDIDO`, left + ENTRY_PAD, y, { characterSpacing: 1.5, lineBreak: false });
  y += 20;

  // Norma citada verbatim — nunca reformateada.
  doc.font(fonts.sansBold).fontSize(10).fillColor(CUADERNO.INK);
  if (f.normRef) {
    doc.text(f.normRef, left + ENTRY_PAD, y, { width: textW, lineGap: 2 });
  } else {
    doc.font(fonts.sans).fontSize(9.5).fillColor(CUADERNO.INK_MUTED).text("Sin norma citada", left + ENTRY_PAD, y, { width: textW });
  }
  y = doc.y + 6;

  // Descripción del trabajador.
  doc.font(fonts.sans).fontSize(10.5).fillColor(CUADERNO.INK)
    .text(f.description, left + ENTRY_PAD, y, { width: textW, lineGap: 2 });
  y = doc.y + 8;

  // Fechas de detección y corrección.
  doc.font(fonts.sans).fontSize(9).fillColor(CUADERNO.INK_MUTED)
    .text(`Detectado: ${formatDate(f.detectedAt)}      Corregido: ${formatDate(f.resolvedAt)}`, left + ENTRY_PAD, y, { width: textW, lineBreak: false });
  y = doc.y + 4;

  // Reportante: solo si el hallazgo NO es anónimo. Defensa en profundidad —
  // ver comentario de la función.
  const reporterLabel = !f.anonymous && f.reporterName && f.reporterName.trim().length > 0
    ? f.reporterName.trim()
    : "Anónimo";
  doc.font(fonts.sans).fontSize(9).fillColor(CUADERNO.INK_MUTED)
    .text(`Reportado por: ${reporterLabel}`, left + ENTRY_PAD, y, { width: textW, lineBreak: false });
  y = doc.y + 8;

  const noteText = f.resolutionNote?.trim() || "";
  if (noteText) {
    doc.font(fonts.sans).fontSize(9.5).fillColor(CUADERNO.INK)
      .text(`Nota de la empresa: ${noteText}`, left + ENTRY_PAD, y, { width: textW, lineGap: 2 });
    y = doc.y + 8;
  }

  // Fotos lado a lado: riesgo detectado / corrección.
  const photoW = (textW - PHOTO_GAP) / 2;
  drawPhotoBox(doc, left + ENTRY_PAD, y, photoW, photoBoxH, f.hazardPhoto, "Foto no disponible", fonts);
  drawPhotoBox(doc, left + ENTRY_PAD + photoW + PHOTO_GAP, y, photoW, photoBoxH, f.correctionPhoto, "Sin foto de corrección", fonts);
  doc.font(fonts.sans).fontSize(8).fillColor(CUADERNO.INK_MUTED)
    .text("Riesgo detectado", left + ENTRY_PAD, y + photoBoxH + 4, { width: photoW, align: "center" });
  doc.font(fonts.sans).fontSize(8).fillColor(CUADERNO.INK_MUTED)
    .text("Corrección", left + ENTRY_PAD + photoW + PHOTO_GAP, y + photoBoxH + 4, { width: photoW, align: "center" });

  // Tarjeta de marca alrededor de toda la entrada — se dibuja al final,
  // conociendo ya la altura real, para no arriesgar un fondo que no cubra
  // texto que se desbordó de la estimación (measureEntry es una cota
  // superior con márgenes, no un cálculo pixel-perfect).
  const bottom = Math.max(top + totalH, y + photoBoxH + PHOTO_LABEL_H + ENTRY_PAD);
  accentCard(doc, left, top, CW, bottom - top, CUADERNO.GREEN);

  doc.y = bottom + ENTRY_GAP;
}

function renderCover(
  doc: PDFKit.PDFDocument,
  PW: number,
  PH: number,
  CW: number,
  findings: HistorialFindingInput[],
  options: HistorialPdfOptions,
  fonts: ReturnType<typeof registerCuadernoFonts>
) {
  doc.rect(0, 0, PW, PH).fill(CUADERNO.INK);
  dotGrid(doc, 0, 0, PW, PH, "#ffffff");
  hexOutline(doc, PW - 70, 70, 34, "#ffffff");
  hexOutline(doc, 70, PH - 70, 24, CUADERNO.GREEN);

  doc.y = PH * 0.16;
  doc.font(fonts.sans).fontSize(9).fillColor("rgba(255,255,255,0.55)")
    .text("CEDUVERSE — DETECTOR DE RIESGOS", ML, doc.y, { characterSpacing: 3 });
  doc.moveDown(1);
  doc.font(fonts.serif).fontSize(30).fillColor("#ffffff")
    .text("Historial de cumplimiento", ML, doc.y, { width: CW });
  doc.moveDown(0.6);
  doc.font(fonts.sans).fontSize(13).fillColor("rgba(255,255,255,0.75)")
    .text(options.companyNames.length > 0 ? options.companyNames.join(", ") : "Empresa", ML, doc.y, { width: CW });

  doc.moveDown(2);
  doc.rect(ML, doc.y, CW * 0.28, 1).fill(CUADERNO.GREEN);
  doc.moveDown(1);

  doc.font(fonts.sansBold).fontSize(8).fillColor("rgba(255,255,255,0.5)").text("PERIODO", ML, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.2);
  doc.font(fonts.sans).fontSize(12).fillColor("#ffffff").text(options.periodLabel, ML, doc.y, { width: CW });

  doc.moveDown(1.2);
  doc.font(fonts.sansBold).fontSize(8).fillColor("rgba(255,255,255,0.5)").text("RESUMEN", ML, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.2);
  const withoutCorrectionPhoto = findings.filter((f) => !f.correctionPhoto).length;
  const summary = findings.length === 0
    ? "Sin hallazgos atendidos en este periodo."
    : withoutCorrectionPhoto > 0
      ? `${findings.length} hallazgo${findings.length === 1 ? "" : "s"} atendido${findings.length === 1 ? "" : "s"} con evidencia documentada (${withoutCorrectionPhoto} sin foto de corrección registrada).`
      : `${findings.length} hallazgo${findings.length === 1 ? "" : "s"} atendido${findings.length === 1 ? "" : "s"}, cada uno con foto del riesgo y de su corrección.`;
  doc.font(fonts.sans).fontSize(12).fillColor("#ffffff").text(summary, ML, doc.y, { width: CW * 0.85, lineGap: 3 });

  const generatedAt = options.generatedAt ?? new Date();
  doc.font(fonts.sans).fontSize(8.5).fillColor("rgba(255,255,255,0.4)")
    .text(`Generado el ${formatDate(generatedAt)} — ceduverse.org`, ML, PH - MB - 10, { width: CW });
}

export async function renderHistorialPdf(
  findings: HistorialFindingInput[],
  options: HistorialPdfOptions
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: MT, bottom: MB, left: ML, right: MR },
    info: {
      Title: `Historial de cumplimiento — ${options.companyNames.join(", ") || "Empresa"}`,
      Author: "Ceduverse",
      Creator: "Ceduverse (ceduverse.org)",
    },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const fonts = registerCuadernoFonts(doc);
  const PW = doc.page.width;
  const PH = doc.page.height;
  const CW = PW - ML - MR;

  renderCover(doc, PW, PH, CW, findings, options, fonts);

  if (findings.length > 0) {
    doc.addPage();
    doc.y = MT;
    findings.forEach((f, i) => renderFindingEntry(doc, PH, CW, f, i, fonts));
  }

  doc.end();
  return done;
}
