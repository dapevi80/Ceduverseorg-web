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

/** URL que codifica el QR de cada ejercicio: exige login (la página en sí gatea). */
export function playbookExerciseUrl(courseSlug: string, exerciseIndex: number): string {
  return `${PLAYBOOK_PUBLIC_BASE_URL}/playbook/${courseSlug}/ejercicio/${exerciseIndex}`;
}

function section(doc: PDFKit.PDFDocument, title: string, items: string[], color: string, left: number, width: number) {
  doc.fontSize(9).font("Helvetica-Bold").fillColor(color).text(title.toUpperCase(), left, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.3);
  items.forEach((item) => {
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
  section(doc, "Objetivos", playbook.content.objetivos, CEDU_BLUE, ML, CW);
  section(doc, "Resumen", playbook.content.resumen, CEDU_BLUE, ML, CW);
  section(doc, "Estrategias", playbook.content.estrategias, CEDU_ORANGE, ML, CW);
  section(doc, "Preguntas de reflexión", playbook.content.preguntas, CEDU_VIOLET, ML, CW);

  // Ejercicios de campo, cada uno con su QR
  for (const ex of playbook.exercises) {
    doc.addPage();
    doc.fontSize(9).font("Helvetica-Bold").fillColor(CEDU_ORANGE).text(`EJERCICIO ${ex.index + 1}`, ML, doc.y, { characterSpacing: 2 });
    doc.moveDown(0.3);
    doc.fontSize(16).font("Helvetica-Bold").fillColor(INK).text(ex.title, ML, doc.y, { width: CW });
    doc.moveDown(0.5);
    const textTop = doc.y;
    doc.fontSize(11).font("Helvetica").fillColor(INK_MUTED).text(ex.instruction, ML, doc.y, { width: CW * 0.6, lineGap: 3 });

    const url = playbookExerciseUrl(course.slug, ex.index);
    const qrPng = await QRCode.toBuffer(url, { type: "png", width: 220, margin: 1, color: { dark: CEDU_BLUE, light: "#ffffff" } });
    doc.image(qrPng, ML + CW * 0.66, textTop, { width: CW * 0.32 });
    doc.fontSize(8).fillColor(INK_MUTED).text("Escanea para subir tu evidencia", ML + CW * 0.66, textTop + CW * 0.32 + 6, { width: CW * 0.32, align: "center" });
  }

  // Referencias verbatim
  doc.addPage();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(INK).text("REFERENCIAS", ML, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.5);
  playbook.references.forEach((ref, i) => {
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
