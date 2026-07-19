import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { BuiltPlaybook } from "./playbook-generator";
import type { StudioCourse } from "@shared/schema";

const CEDU_BLUE = "#1b5adf";
const CEDU_ORANGE = "#f28023";
const CEDU_VIOLET = "#7c3aed";
const INK = "#1a1a2e";
const INK_MUTED = "#6b7280";
const WHITE = "#ffffff";

const ML = 60;
const MR = 60;
const MT = 60;
const MB = 60;

export const PLAYBOOK_PUBLIC_BASE_URL = process.env.PLAYBOOK_PUBLIC_BASE_URL || "https://ceduverse.org";

/** URL que codifica el QR impreso junto a las señales de riesgo del curso: el
 * detector de riesgos reemplaza la actividad de campo (spec
 * docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §9) — el QR ya
 * no sube evidencia de un ejercicio, abre el reporte real de un hallazgo para
 * este curso. Exige login (la página en sí gatea). */
export function playbookReportUrl(courseSlug: string): string {
  return `${PLAYBOOK_PUBLIC_BASE_URL}/riesgos/reportar/${courseSlug}`;
}

// Mirrors the ensureSpace()/bottomLimit() pagination-guard pattern proven in kit-pdf.ts:
// leave a small buffer above the bottom margin, and force a fresh page whenever the next
// block wouldn't have room to start cleanly.
const BOTTOM_BUFFER = 30;
const SECTION_HEADER_H = 18;
const SECTION_FIRST_BULLET_H = 16;
const SECTION_BULLET_H = 16;

function bottomLimit(PH: number): number {
  return PH - MB - BOTTOM_BUFFER;
}

function ensureSpace(doc: PDFKit.PDFDocument, PH: number, needed: number) {
  if (doc.y + needed > bottomLimit(PH)) {
    doc.addPage();
    doc.y = MT;
  }
}

function section(doc: PDFKit.PDFDocument, PH: number, title: string, items: string[], color: string, left: number, width: number) {
  // Don't orphan the header at the bottom of a page: only draw it if there's also room
  // for at least the first bullet, otherwise start a new page so the heading and its
  // bullets stay together.
  ensureSpace(doc, PH, SECTION_HEADER_H + (items.length > 0 ? SECTION_FIRST_BULLET_H : 0));
  doc.fontSize(9).font("Helvetica-Bold").fillColor(color).text(title.toUpperCase(), left, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.3);
  items.forEach((item) => {
    ensureSpace(doc, PH, SECTION_BULLET_H);
    doc.fontSize(10.5).font("Helvetica").fillColor(INK).text(`•  ${item}`, left, doc.y, { width, lineGap: 2 });
    doc.moveDown(0.15);
  });
  doc.moveDown(0.6);
}

export async function renderPlaybookPdf(
  playbook: BuiltPlaybook,
  course: Pick<StudioCourse, "slug" | "title" | "icon">,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: MT, bottom: MB, left: ML, right: MR },
    info: { Title: `Playbook — ${course.title}`, Author: "Ceduverse", Creator: "Ceduverse (ceduverse.org)" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const PW = doc.page.width;
  const PH = doc.page.height;
  const CW = PW - ML - MR;

  // Portada
  doc.rect(0, 0, PW, PH).fill(CEDU_BLUE);
  doc.rect(0, 0, PW, 6).fill(CEDU_ORANGE);
  doc.y = 140;
  doc.fontSize(28).font("Helvetica-Bold").fillColor(WHITE).text(`${course.icon || "📘"}  Playbook`, ML, doc.y, { width: CW });
  doc.moveDown(0.4);
  doc.fontSize(20).font("Helvetica").fillColor("rgba(255,255,255,0.85)").text(course.title, ML, doc.y, { width: CW });
  doc.fontSize(11).fillColor("rgba(255,255,255,0.6)").text("Ceduverse — Tutor IA", ML, PH - MB - 20, { width: CW });

  // Objetivos / resumen / estrategias / preguntas
  doc.addPage();
  section(doc, PH, "Objetivos", playbook.content.objetivos, CEDU_BLUE, ML, CW);
  section(doc, PH, "Resumen", playbook.content.resumen, CEDU_BLUE, ML, CW);
  section(doc, PH, "Estrategias", playbook.content.estrategias, CEDU_ORANGE, ML, CW);
  section(doc, PH, "Preguntas de reflexión", playbook.content.preguntas, CEDU_VIOLET, ML, CW);

  // Señales de riesgo (los `exercises` que la IA ya genera, reencuadrados — spec
  // §9), cada una con el mismo QR de reporte. Cada señal arranca en página propia
  // (diseño de una página por señal); dentro de esa página, la instrucción se
  // acota a la altura disponible (con elipsis) para que jamás dispare la paginación
  // automática de pdfkit a mitad de texto, lo cual dejaría el QR y el título huérfanos
  // en una página de continuación.
  const qrSize = CW * 0.32;
  const qrCaptionH = 20;
  const EX_LABEL_H = 16;
  const EX_MIN_INSTRUCTION = 60; // room for a "reasonable first chunk" of instruction
  for (const ex of playbook.exercises) {
    doc.addPage();
    doc.y = MT;

    // Guard: make sure the header (label + title, which can wrap to multiple lines)
    // still leaves room for the QR block + a first chunk of instruction. On a page we
    // just added this is normally a no-op, but it protects against a pathologically
    // long title eating most of the fresh page.
    doc.fontSize(16).font("Helvetica-Bold");
    const titleH = doc.heightOfString(ex.title, { width: CW });
    ensureSpace(doc, PH, EX_LABEL_H + titleH + 10 + Math.max(qrSize + qrCaptionH, EX_MIN_INSTRUCTION));

    doc.fontSize(9).font("Helvetica-Bold").fillColor(CEDU_ORANGE).text(`SEÑAL DE RIESGO ${ex.index + 1}`, ML, doc.y, { characterSpacing: 2 });
    doc.moveDown(0.3);
    doc.fontSize(16).font("Helvetica-Bold").fillColor(INK).text(ex.title, ML, doc.y, { width: CW });
    doc.moveDown(0.5);
    const textTop = doc.y;
    // Never let the instruction exceed what's actually left on this page — clip with
    // an ellipsis instead of letting pdfkit auto-paginate mid-block, which is what
    // orphaned the QR/title on a blank continuation page before this fix.
    const availableH = Math.max(bottomLimit(PH) - textTop, 40);
    doc.fontSize(11).font("Helvetica").fillColor(INK_MUTED).text(ex.instruction, ML, doc.y, {
      width: CW * 0.6,
      lineGap: 3,
      height: availableH,
      ellipsis: true,
    });

    const url = playbookReportUrl(course.slug);
    const qrPng = await QRCode.toBuffer(url, { type: "png", width: 220, margin: 1, color: { dark: CEDU_BLUE, light: "#ffffff" } });
    doc.image(qrPng, ML + CW * 0.66, textTop, { width: qrSize });
    doc.fontSize(8).fillColor(INK_MUTED).text("Escanea si detectas esto: reporta el riesgo", ML + CW * 0.66, textTop + qrSize + 6, { width: qrSize, align: "center" });
  }

  // Referencias verbatim
  doc.addPage();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(INK).text("REFERENCIAS", ML, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.5);
  playbook.references.forEach((ref, i) => {
    ensureSpace(doc, PH, 18);
    doc.fontSize(9.5).font("Helvetica").fillColor(INK_MUTED).text(`[${i + 1}] ${ref}`, ML, doc.y, { width: CW, lineGap: 2 });
    doc.moveDown(0.2);
  });

  // Cierre / CTA
  doc.addPage();
  doc.rect(0, 0, PW, PH).fill(INK);
  doc.fontSize(22).font("Helvetica-Bold").fillColor(WHITE).text("Sigue aplicando lo que aprendiste", ML, PH * 0.4, { width: CW, align: "center" });
  doc.fontSize(11).font("Helvetica").fillColor("rgba(255,255,255,0.6)").text("ceduverse.org", ML, PH * 0.4 + 40, { width: CW, align: "center" });

  doc.end();
  return done;
}
