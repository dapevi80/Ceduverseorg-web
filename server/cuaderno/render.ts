/**
 * Componedor del Cuaderno de estudio (spec
 * docs/superpowers/specs/2026-07-18-cuaderno-estudio-design.md §6/§9).
 *
 * Esta es la única pieza que arma el documento completo: junta lo que ya
 * dibujan/miden `draw-blocks.ts`, `mindmap.ts` y `writables.ts` sobre las
 * primitivas de `visuals.ts`, con los datos ya reunidos por `gather.ts`. No
 * inventa contenido — sólo compone lo que ya existe, en el orden exacto del
 * §6: portada → cómo usar → índice → guía de estudio → un capítulo por
 * módulo → respuestas de autoevaluación → referencias consolidadas → notas.
 *
 * Reglas que este archivo hace cumplir directamente (las demás ya las
 * garantizan los módulos que consume):
 * - Pie de página (número + nombre del curso) en toda página salvo la
 *   portada — pasada final sobre `doc.bufferedPageRange()`.
 * - Un módulo con `personalizado === false` imprime el aviso textual
 *   verbatim del §6.3 en su portadilla — nunca se presenta como personal.
 * - El examen nunca muestra su respuesta junto a la pregunta: las
 *   respuestas y explicaciones sólo aparecen en la clave al final.
 * - Las referencias (por módulo y consolidadas) se imprimen tal cual llegan
 *   de `gather.ts` — ya verbatim de `studio_modules.references` — sin
 *   reformular ni completar nada aquí.
 *
 * La "actividad opcional" con QR (§6.2.8) reutiliza la URL real que
 * `server/playbook-pdf.ts` ya usa para este mismo dato
 * (`course_playbooks.exercises`, reencuadrado por el detector de riesgos
 * como "repórtalo si lo detectas" — ver el comentario en
 * `server/routes/playbook.ts`): nunca se inventa una URL nueva. Se dibuja
 * chica, dentro de la columna de notas de la última página de la clase del
 * módulo — nunca ocupa página propia.
 */
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { DatosCuaderno, ModuloCuaderno } from "./gather";
import { assembleReferences } from "@shared/playbook-assemble";
import { playbookReportUrl } from "../playbook-pdf";
import {
  CUADERNO,
  MODULE_COLORS,
  dotGrid,
  hexOutline,
  ghostNumeral,
  accentCard,
  noteRules,
} from "./visuals";
import { registerCuadernoFonts, type CuadernoFontNames } from "./fonts";
import { htmlToBlocks } from "./html-blocks";
import { drawBlocks } from "./draw-blocks";
import { drawMindMap } from "./mindmap";
import { reflectionBlock, fillInTable, quizBlock, notesPage } from "./writables";

// ---- Parámetros de página (spec §9) --------------------------------------

const MT = 54;
const MB = 62;
const ML = 54;
const TEXT_W = 330;
const GAP = 18;
const NOTES_W = 172;
/** Ancho de columna completa para todo lo que NO es "la clase" (que reserva
 * la columna de notas aparte): portada de sección, guía, reflexiones,
 * formatos, examen, referencias. */
const CW = TEXT_W + GAP + NOTES_W; // 520pt
const MR = 612 - ML - CW; // 38pt — LETTER = 612x792

type Ejercicio = DatosCuaderno["ejercicios"][number];

// ---- Utilidades de paginación (mismo espíritu que server/kit-pdf.ts) -----

function bottomLimit(doc: PDFKit.PDFDocument): number {
  return doc.page.height - doc.page.margins.bottom;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > bottomLimit(doc)) {
    doc.addPage();
  }
}

function heading(
  doc: PDFKit.PDFDocument,
  fonts: CuadernoFontNames,
  text: string,
  color: string,
  size: number = 14
): void {
  ensureSpace(doc, size + 24);
  doc.font(fonts.serif).fontSize(size).fillColor(CUADERNO.INK).text(text, ML, doc.y, { width: CW });
  const ruleY = doc.y + 4;
  doc.save();
  doc.moveTo(ML, ruleY).lineTo(ML + 28, ruleY).strokeColor(color).lineWidth(2).stroke();
  doc.restore();
  doc.y = ruleY + 10;
}

function eyebrow(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, text: string, color: string): void {
  ensureSpace(doc, 18);
  doc.font(fonts.sansBold).fontSize(8.5).fillColor(color).text(text.toUpperCase(), ML, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.4);
}

// ---- Portada ---------------------------------------------------------------

function drawCover(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, datos: DatosCuaderno, dateStr: string): void {
  const PW = doc.page.width;
  const PH = doc.page.height;

  doc.rect(0, 0, PW, PH).fill(CUADERNO.CREAM);
  dotGrid(doc, 0, 0, PW, PH, CUADERNO.BLUE);
  doc.rect(0, 0, PW, 8).fill(CUADERNO.BLUE);
  hexOutline(doc, PW - 90, 90, 30, CUADERNO.ORANGE);
  hexOutline(doc, PW - 90, 90, 17, CUADERNO.VIOLET);

  doc.y = PH * 0.2;
  doc.font(fonts.sansBold).fontSize(9).fillColor(CUADERNO.INK_MUTED).text("CUADERNO DE ESTUDIO", ML, doc.y, {
    characterSpacing: 3,
  });
  doc.moveDown(1);
  const iconTitle = `${datos.course.icon ? datos.course.icon + "  " : ""}${datos.course.title}`;
  doc.font(fonts.serif).fontSize(30).fillColor(CUADERNO.INK).text(iconTitle, ML, doc.y, { width: CW });
  doc.moveDown(2);
  doc.rect(ML, doc.y, 60, 2).fill(CUADERNO.ORANGE);
  doc.moveDown(1.4);

  const field = (label: string, value: string) => {
    doc.font(fonts.sansBold).fontSize(8).fillColor(CUADERNO.INK_MUTED).text(label, ML, doc.y, { characterSpacing: 2 });
    doc.moveDown(0.2);
    doc.font(fonts.sans).fontSize(13).fillColor(CUADERNO.INK).text(value, ML, doc.y, { width: CW });
    doc.moveDown(1);
  };
  field("ALUMNO", datos.alumno.nombre);
  field("INSTRUCTOR", datos.course.instructor || "Ceduverse — Tutor IA");
  field("FECHA", dateStr);

  doc.font(fonts.sans).fontSize(8).fillColor(CUADERNO.INK_MUTED).text("ceduverse.org", ML, PH - 70, {
    width: CW,
    align: "right",
    lineBreak: false,
  });
}

// ---- Cómo usar este cuaderno -----------------------------------------------

function drawComoUsar(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames): void {
  heading(doc, fonts, "Cómo usar este cuaderno", CUADERNO.BLUE, 20);
  const paras = [
    "Este cuaderno trae el curso completo, módulo por módulo: la clase, un mapa conceptual, los conceptos clave, preguntas para reflexionar y una autoevaluación.",
    "Está pensado para escribir encima. Cada clase trae una columna lateral con renglones para tus notas, y hay formatos en blanco y renglones reales para contestar a mano.",
    "Las actividades marcadas con un código QR, chicas y al margen, son OPCIONALES: te invitan a aplicar lo aprendido y dan logros y puntos. Si no escaneas ninguna, el cuaderno te sirve igual para estudiar.",
    "Las respuestas de la autoevaluación no están junto a las preguntas: van todas juntas al final del cuaderno, para que puedas ponerte a prueba de verdad antes de revisarlas.",
  ];
  paras.forEach((p) => {
    doc.font(fonts.sans).fontSize(11);
    const h = doc.heightOfString(p, { width: CW, lineGap: 4 });
    ensureSpace(doc, h + 14);
    doc.font(fonts.sans).fontSize(11).fillColor(CUADERNO.INK).text(p, ML, doc.y, { width: CW, lineGap: 4 });
    doc.moveDown(0.8);
  });
}

// ---- Índice ------------------------------------------------------------

interface TocEntry {
  label: string;
  pageIdx: number;
  color: string;
}

function drawIndexContent(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, entries: TocEntry[]): void {
  doc.font(fonts.sansBold).fontSize(9).fillColor(CUADERNO.ORANGE).text("CONTENIDO", ML, MT, { characterSpacing: 3 });
  doc.moveDown(0.3);
  doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(CUADERNO.ORANGE).lineWidth(0.8).stroke();
  doc.moveDown(1);
  doc.font(fonts.serif).fontSize(22).fillColor(CUADERNO.INK).text("Índice", ML, doc.y, { width: CW });
  doc.moveDown(1.4);

  let y = doc.y;
  entries.forEach((e) => {
    doc.save();
    doc.font(fonts.sans).fontSize(10.5).fillColor(CUADERNO.INK);
    const labelW = CW - 46;
    doc.text(e.label, ML, y, { width: labelW, lineBreak: false, ellipsis: true });
    doc.font(fonts.sans).fontSize(10.5).fillColor(CUADERNO.INK_MUTED);
    doc.text(String(e.pageIdx + 1), ML + CW - 26, y, { width: 26, align: "right", lineBreak: false });

    const tw = doc.font(fonts.sans).fontSize(10.5).widthOfString(e.label);
    const dotStart = ML + Math.min(tw, labelW) + 8;
    const dotEnd = ML + CW - 34;
    if (dotEnd > dotStart) {
      doc.moveTo(dotStart, y + 8).lineTo(dotEnd, y + 8).dash(1.5, { space: 3 }).strokeColor(e.color).strokeOpacity(0.5).lineWidth(0.5).stroke();
      doc.undash();
    }
    doc.restore();
    y += 22;
  });
}

// ---- Guía de estudio del curso ---------------------------------------------

function drawGuiaEstudio(
  doc: PDFKit.PDFDocument,
  fonts: CuadernoFontNames,
  guia: NonNullable<DatosCuaderno["guiaEstudio"]>
): void {
  heading(doc, fonts, "Guía de estudio del curso", CUADERNO.BLUE, 18);
  const sections: [string, string[], string][] = [
    ["Objetivos", guia.objetivos ?? [], CUADERNO.BLUE],
    ["Resumen", guia.resumen ?? [], CUADERNO.BLUE],
    ["Estrategias", guia.estrategias ?? [], CUADERNO.ORANGE],
    ["Preguntas de reflexión", guia.preguntas ?? [], CUADERNO.VIOLET],
  ];
  sections.forEach(([title, items, color]) => {
    if (items.length === 0) return;
    eyebrow(doc, fonts, title, color);
    items.forEach((item) => {
      doc.font(fonts.sans).fontSize(10);
      const h = doc.heightOfString(item, { width: CW - 16, lineGap: 2 });
      ensureSpace(doc, h + 8);
      const y0 = doc.y;
      doc.save();
      doc.circle(ML + 4, y0 + 6, 2.2).fill(color);
      doc.restore();
      doc.font(fonts.sans).fontSize(10).fillColor(CUADERNO.INK).text(item, ML + 16, y0, { width: CW - 16, lineGap: 2 });
      doc.y = y0 + h + 8;
    });
    doc.moveDown(0.5);
  });
}

// ---- Portadilla de módulo (§6.2.1 + aviso §6.3) ---------------------------

function drawNoticeBox(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, accent: string): void {
  const text =
    "Este módulo todavía no lo has tomado en el Tutor IA: aquí va el contenido base del curso. Cuando lo tomes, tu cuaderno lo incluirá personalizado a tu puesto.";
  const innerW = CW - 32;
  doc.font(fonts.sans).fontSize(9.5);
  const bodyH = doc.heightOfString(text, { width: innerW, lineGap: 2 });
  const boxH = bodyH + 34;
  ensureSpace(doc, boxH + 14);
  const y0 = doc.y;
  accentCard(doc, ML, y0, CW, boxH, accent);
  doc.font(fonts.sansBold).fontSize(8.5).fillColor(accent).text("CONTENIDO BASE — AÚN NO PERSONALIZADO", ML + 16, y0 + 12, {
    characterSpacing: 1,
    width: innerW,
  });
  doc.font(fonts.sans).fontSize(9.5).fillColor(CUADERNO.INK_MUTED).text(text, ML + 16, y0 + 26, { width: innerW, lineGap: 2 });
  doc.y = y0 + boxH + 14;
}

function drawPortadilla(
  doc: PDFKit.PDFDocument,
  fonts: CuadernoFontNames,
  modulo: ModuloCuaderno,
  accent: string,
  totalModules: number
): void {
  const PW = doc.page.width;

  doc.save();
  doc.rect(0, 0, PW, 130).fillOpacity(0.08).fill(accent);
  doc.restore();

  ghostNumeral(doc, modulo.index + 1, ML, 34, 150, fonts.serif);

  doc.y = 170;
  doc.font(fonts.sansBold).fontSize(9).fillColor(accent).text(
    `MÓDULO ${String(modulo.index + 1).padStart(2, "0")} DE ${String(totalModules).padStart(2, "0")}`,
    ML,
    doc.y,
    { characterSpacing: 2 }
  );
  doc.moveDown(0.5);
  doc.font(fonts.serif).fontSize(26).fillColor(CUADERNO.INK).text(modulo.title, ML, doc.y, { width: CW });

  if (modulo.description) {
    doc.moveDown(0.6);
    doc.font(fonts.sans).fontSize(11).fillColor(CUADERNO.INK_MUTED).text(modulo.description, ML, doc.y, {
      width: CW,
      lineGap: 3,
    });
  }
  doc.moveDown(1.4);

  if (!modulo.personalizado) {
    drawNoticeBox(doc, fonts, accent);
  }
}

// ---- La clase + columna de notas + actividad opcional al margen ----------

const QR_BOX_H = 190;

function drawOptionalActivity(
  doc: PDFKit.PDFDocument,
  fonts: CuadernoFontNames,
  exercise: Ejercicio,
  qrPng: Buffer,
  accent: string,
  x: number,
  y: number,
  w: number
): void {
  doc.save();
  doc.font(fonts.sansBold).fontSize(7.5).fillColor(accent).text("ACTIVIDAD OPCIONAL", x, y, {
    width: w,
    characterSpacing: 1,
  });
  let cy = doc.y + 2;
  doc.font(fonts.sansBold).fontSize(8.5).fillColor(CUADERNO.INK).text(exercise.title, x, cy, {
    width: w,
    height: 22,
    ellipsis: true,
    lineGap: 1,
  });
  cy = doc.y + 2;
  doc.font(fonts.sans).fontSize(7).fillColor(CUADERNO.INK_MUTED).text(exercise.instruction, x, cy, {
    width: w,
    height: 20,
    ellipsis: true,
    lineGap: 1,
  });
  cy = doc.y + 6;
  const qrSize = 60;
  doc.image(qrPng, x + (w - qrSize) / 2, cy, { width: qrSize, height: qrSize });
  cy += qrSize + 5;
  doc.font(fonts.sans).fontSize(6.5).fillColor(CUADERNO.INK_MUTED).text(
    "Opcional · escanéalo si lo detectas · da logros",
    x,
    cy,
    { width: w, align: "center", lineGap: 1 }
  );
  doc.restore();
}

/** Dibuja los renglones de la columna de notas en cada página que ocupó la
 * clase (de `fromPage` a `toPage`), y —sólo en la última, si el módulo tiene
 * un ejercicio opcional emparejado por índice— la actividad chica con su QR,
 * recortando los renglones para dejarle espacio. Nunca fuerza una página
 * propia: vive dentro del margen que ya existe. */
function drawLectureMargin(
  doc: PDFKit.PDFDocument,
  fonts: CuadernoFontNames,
  fromPage: number,
  toPage: number,
  exercise: Ejercicio | undefined,
  qrPng: Buffer | undefined,
  accent: string
): void {
  const notesX = ML + TEXT_W + GAP;
  const savedY = doc.y;

  for (let p = fromPage; p <= toPage; p++) {
    doc.switchToPage(p);
    const bottom = bottomLimit(doc);
    const isLast = p === toPage;
    const reserve = isLast && exercise && qrPng ? QR_BOX_H : 0;
    const rulesBottom = bottom - reserve - (reserve ? 12 : 0);
    const lines = Math.max(0, Math.floor((rulesBottom - MT) / 22));
    noteRules(doc, notesX, MT, NOTES_W, lines, 22);

    if (isLast && exercise && qrPng) {
      const boxY = MT + lines * 22 + 16;
      drawOptionalActivity(doc, fonts, exercise, qrPng, accent, notesX, boxY, NOTES_W);
    }
  }

  doc.switchToPage(toPage);
  doc.y = savedY;
}

// ---- Mapa conceptual + conceptos clave (§6.2.3-4) --------------------------

function drawConceptMapSection(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, modulo: ModuloCuaderno, accent: string): void {
  const mindMap = modulo.mindMap;
  if (!mindMap || !Array.isArray(mindMap.branches) || mindMap.branches.length === 0) return;

  doc.addPage();
  heading(doc, fonts, "Mapa conceptual", accent);
  const areaH = 400;
  const y0 = doc.y;
  const ok = drawMindMap(doc, mindMap, ML, y0, CW, areaH);
  if (ok) {
    doc.y = y0 + areaH + 12;
  } else {
    // Degradación §8: sin figura dibujable, se listan las ramas como texto —
    // nunca un recuadro vacío.
    doc.y = y0;
    mindMap.branches.forEach((b) => {
      ensureSpace(doc, 20);
      doc.font(fonts.sansBold).fontSize(10.5).fillColor(accent).text(`• ${b.label}`, ML, doc.y, { width: CW });
      (b.children ?? []).forEach((c) => {
        ensureSpace(doc, 16);
        const detail = c.detail ? ` (${c.detail})` : "";
        doc.font(fonts.sans).fontSize(9.5).fillColor(CUADERNO.INK).text(`   – ${c.label}${detail}`, ML, doc.y, { width: CW });
      });
    });
    doc.moveDown(0.6);
  }
}

function drawKeyConcepts(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, modulo: ModuloCuaderno, accent: string): void {
  const branches = modulo.mindMap?.branches ?? [];
  if (branches.length === 0) return;

  heading(doc, fonts, "Conceptos clave", accent);
  branches.forEach((b) => {
    const children = (b.children ?? []).map((c) => c.label).filter(Boolean).join(" · ");
    doc.font(fonts.sansBold).fontSize(10.5);
    const titleH = doc.heightOfString(b.label || "—", { width: CW - 40 });
    let childH = 0;
    if (children) {
      doc.font(fonts.sans).fontSize(9);
      childH = doc.heightOfString(children, { width: CW - 40, lineGap: 2 }) + 6;
    }
    const boxH = titleH + childH + 24;
    ensureSpace(doc, boxH + 10);
    const y0 = doc.y;
    accentCard(doc, ML, y0, CW, boxH, b.color || accent);
    doc.font(fonts.sansBold).fontSize(10.5).fillColor(CUADERNO.INK).text(b.label || "—", ML + 16, y0 + 12, { width: CW - 40 });
    if (children) {
      doc.font(fonts.sans).fontSize(9).fillColor(CUADERNO.INK_MUTED).text(children, ML + 16, y0 + 12 + titleH + 6, {
        width: CW - 40,
        lineGap: 2,
      });
    }
    doc.y = y0 + boxH + 10;
  });
  doc.moveDown(0.4);
}

// ---- Reflexiones, formato para llenar, autoevaluación, referencias -------

function drawReflections(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, modulo: ModuloCuaderno, accent: string): void {
  if (modulo.reflections.length === 0) return;
  heading(doc, fonts, "Reflexiona y escribe", accent);
  modulo.reflections.forEach((q, i) => {
    reflectionBlock(doc, `${i + 1}. ${q}`, ML, doc.y, CW, 5, accent);
    doc.moveDown(0.6);
  });
}

function drawFillInForm(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, modulo: ModuloCuaderno, accent: string): void {
  heading(doc, fonts, "Formato para llenar", accent);
  doc.font(fonts.sans).fontSize(9).fillColor(CUADERNO.INK_MUTED).text(
    `Usa esta bitácora para registrar cómo aplicas "${modulo.title}" en tu trabajo.`,
    ML,
    doc.y,
    { width: CW, lineGap: 2 }
  );
  doc.moveDown(0.5);
  const headers = ["Idea o técnica", "¿Cómo la aplicarás?", "Fecha", "Resultado"];
  fillInTable(doc, headers, 5, ML, doc.y, CW, accent);
  doc.moveDown(0.8);
}

function drawQuizSection(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, modulo: ModuloCuaderno, accent: string): void {
  if (modulo.quiz.length === 0) return;
  heading(doc, fonts, "Autoevaluación", accent);
  doc.font(fonts.sans).fontSize(8.5).fillColor(CUADERNO.INK_MUTED).text(
    "Marca tu respuesta. Las respuestas correctas están al final del cuaderno.",
    ML,
    doc.y,
    { width: CW }
  );
  doc.moveDown(0.6);
  modulo.quiz.forEach((q, i) => {
    quizBlock(doc, q, i + 1, ML, doc.y, CW, accent);
    doc.moveDown(0.5);
  });
}

function drawModuleReferences(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, modulo: ModuloCuaderno, accent: string): void {
  if (modulo.references.length === 0) return;
  heading(doc, fonts, "Referencias del módulo", accent);
  modulo.references.forEach((ref, i) => {
    doc.font(fonts.sans).fontSize(8.5);
    const h = doc.heightOfString(ref, { width: CW - 26, lineGap: 2 });
    ensureSpace(doc, h + 8);
    const y0 = doc.y;
    doc.font(fonts.sans).fontSize(8.5).fillColor(CUADERNO.INK_MUTED).text(`[${i + 1}]`, ML, y0, { width: 22, lineBreak: false });
    doc.font(fonts.sans).fontSize(8.5).fillColor(CUADERNO.INK).text(ref, ML + 26, y0, { width: CW - 26, lineGap: 2 });
    doc.y = y0 + h + 8;
  });
  doc.moveDown(0.4);
}

// ---- Un capítulo completo por módulo (§6.2) --------------------------------

function drawModuleBody(
  doc: PDFKit.PDFDocument,
  fonts: CuadernoFontNames,
  modulo: ModuloCuaderno,
  accent: string,
  exercise: Ejercicio | undefined,
  qrPng: Buffer | undefined
): void {
  doc.addPage();
  const lectureStart = doc.bufferedPageRange().count - 1;
  eyebrow(doc, fonts, "La clase", accent);
  const blocks = htmlToBlocks(modulo.lectureHtml);
  drawBlocks(doc, blocks, { x: ML, width: TEXT_W, accent, ensureSpace: (h: number) => ensureSpace(doc, h) });
  const lectureEnd = doc.bufferedPageRange().count - 1;
  drawLectureMargin(doc, fonts, lectureStart, lectureEnd, exercise, qrPng, accent);

  drawConceptMapSection(doc, fonts, modulo, accent);
  drawKeyConcepts(doc, fonts, modulo, accent);
  drawReflections(doc, fonts, modulo, accent);
  drawFillInForm(doc, fonts, modulo, accent);
  drawQuizSection(doc, fonts, modulo, accent);
  drawModuleReferences(doc, fonts, modulo, accent);
}

// ---- Cierre: respuestas + referencias consolidadas (§6.4) -----------------

interface ChapterMeta {
  modulo: ModuloCuaderno;
  accent: string;
}

function drawAnswerKey(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, entries: ChapterMeta[]): void {
  heading(doc, fonts, "Respuestas de la autoevaluación", CUADERNO.INK, 16);
  entries.forEach(({ modulo, accent }) => {
    ensureSpace(doc, 30);
    doc.font(fonts.sansBold).fontSize(11).fillColor(accent).text(
      `Módulo ${String(modulo.index + 1).padStart(2, "0")} — ${modulo.title}`,
      ML,
      doc.y,
      { width: CW }
    );
    doc.moveDown(0.4);

    modulo.quiz.forEach((q, i) => {
      const optionText = q.options?.[q.correctIndex] ?? "(respuesta no disponible)";
      doc.font(fonts.sansBold).fontSize(9.5);
      const qH = doc.heightOfString(`${i + 1}. ${q.question}`, { width: CW });
      doc.font(fonts.sans).fontSize(9);
      const aH = doc.heightOfString(`Respuesta: ${optionText}`, { width: CW });
      const eH = q.explanation ? doc.heightOfString(q.explanation, { width: CW, lineGap: 2 }) : 0;
      ensureSpace(doc, qH + aH + eH + 20);

      doc.font(fonts.sansBold).fontSize(9.5).fillColor(CUADERNO.INK).text(`${i + 1}. ${q.question}`, ML, doc.y, { width: CW });
      doc.moveDown(0.15);
      doc.font(fonts.sansBold).fontSize(9).fillColor(CUADERNO.GREEN).text(`Respuesta: ${optionText}`, ML, doc.y, { width: CW });
      if (q.explanation) {
        doc.moveDown(0.1);
        doc.font(fonts.sans).fontSize(8.5).fillColor(CUADERNO.INK_MUTED).text(q.explanation, ML, doc.y, {
          width: CW,
          lineGap: 2,
        });
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(0.6);
  });
}

function drawConsolidatedReferences(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, refs: string[]): void {
  heading(doc, fonts, "Referencias del curso", CUADERNO.INK, 16);
  refs.forEach((ref, i) => {
    doc.font(fonts.sans).fontSize(9);
    const h = doc.heightOfString(ref, { width: CW - 26, lineGap: 2 });
    ensureSpace(doc, h + 10);
    const y0 = doc.y;
    doc.font(fonts.sans).fontSize(9).fillColor(CUADERNO.INK_MUTED).text(`[${i + 1}]`, ML, y0, { width: 22, lineBreak: false });
    doc.font(fonts.sans).fontSize(9).fillColor(CUADERNO.INK).text(ref, ML + 26, y0, { width: CW - 26, lineGap: 2 });
    doc.y = y0 + h + 10;
  });
}

// ---- Pie de página (spec §9: en todas menos la portada) -------------------

function drawFooters(doc: PDFKit.PDFDocument, fonts: CuadernoFontNames, courseTitle: string): void {
  const total = doc.bufferedPageRange().count;
  for (let i = 1; i < total; i++) {
    doc.switchToPage(i);
    const PW = doc.page.width;
    const PH = doc.page.height;
    const footerY = PH - 34;
    doc.save();
    doc.page.margins.bottom = 0;
    doc.moveTo(ML, footerY - 8).lineTo(PW - MR, footerY - 8).strokeColor(CUADERNO.INK).strokeOpacity(0.1).lineWidth(0.5).stroke();
    doc.font(fonts.sans).fontSize(8).fillColor(CUADERNO.INK_MUTED).fillOpacity(1).text(courseTitle, ML, footerY, {
      width: 320,
      lineBreak: false,
    });
    doc.text(`Página ${i + 1}`, PW - MR - 80, footerY, { width: 80, align: "right", lineBreak: false });
    doc.restore();
    doc.page.margins.bottom = MB;
  }
}

// ---- Entrada -----------------------------------------------------------

/**
 * Compone el Cuaderno de estudio completo de un alumno para un curso, en el
 * orden exacto del spec §6, y devuelve el PDF ya cerrado como `Buffer`. Sin
 * llamadas a IA — `datos` ya trae todo lo que hace falta (`gatherCuaderno`).
 */
export async function renderCuadernoPdf(datos: DatosCuaderno): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: MT, bottom: MB, left: ML, right: MR },
    bufferPages: true,
    autoFirstPage: false,
    info: {
      Title: `Cuaderno de estudio — ${datos.course.title}`,
      Author: "Ceduverse",
      Subject: "Cuaderno de estudio — Tutor IA",
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

  // Un solo QR para todo el curso: la misma URL real que playbook-pdf.ts ya
  // usa para este dato (`course_playbooks.exercises`) — nunca se inventa una
  // URL nueva para la actividad opcional.
  const qrPng: Buffer | undefined =
    datos.ejercicios.length > 0
      ? await QRCode.toBuffer(playbookReportUrl(datos.course.slug), {
          type: "png",
          width: 200,
          margin: 1,
          color: { dark: CUADERNO.INK, light: "#ffffff" },
        })
      : undefined;

  const dateStr = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  // Portada
  doc.addPage();
  drawCover(doc, fonts, datos, dateStr);

  // Cómo usar este cuaderno
  doc.addPage();
  const comoUsarIdx = doc.bufferedPageRange().count - 1;
  drawComoUsar(doc, fonts);

  // Índice — página reservada, se llena al final cuando ya se conocen todas
  // las páginas (mismo patrón que server/kit-pdf.ts).
  doc.addPage();
  const tocIdx = doc.bufferedPageRange().count - 1;

  const tocEntries: TocEntry[] = [{ label: "Cómo usar este cuaderno", pageIdx: comoUsarIdx, color: CUADERNO.INK }];

  // Guía de estudio del curso — sólo si existe (§8: sin course_playbooks, el
  // cuaderno se arma igual, sin inventar esta sección).
  if (datos.guiaEstudio) {
    doc.addPage();
    const idx = doc.bufferedPageRange().count - 1;
    tocEntries.push({ label: "Guía de estudio del curso", pageIdx: idx, color: CUADERNO.BLUE });
    drawGuiaEstudio(doc, fonts, datos.guiaEstudio);
  }

  // Un capítulo por módulo.
  const chapterMeta: ChapterMeta[] = [];
  datos.modulos.forEach((modulo, i) => {
    const accent = MODULE_COLORS[i % MODULE_COLORS.length];
    doc.addPage();
    const idx = doc.bufferedPageRange().count - 1;
    tocEntries.push({
      label: `Módulo ${String(modulo.index + 1).padStart(2, "0")} — ${modulo.title}`,
      pageIdx: idx,
      color: accent,
    });
    drawPortadilla(doc, fonts, modulo, accent, datos.modulos.length);
    const exercise = datos.ejercicios.find((e) => e.index === modulo.index);
    drawModuleBody(doc, fonts, modulo, accent, exercise, qrPng);
    chapterMeta.push({ modulo, accent });
  });

  // Respuestas de la autoevaluación — sólo si algún módulo trae examen.
  const modulesWithQuiz = chapterMeta.filter((cm) => cm.modulo.quiz.length > 0);
  if (modulesWithQuiz.length > 0) {
    doc.addPage();
    const idx = doc.bufferedPageRange().count - 1;
    tocEntries.push({ label: "Respuestas de la autoevaluación", pageIdx: idx, color: CUADERNO.INK });
    drawAnswerKey(doc, fonts, modulesWithQuiz);
  }

  // Referencias consolidadas del curso, verbatim, sin duplicados.
  const allRefs = assembleReferences(datos.modulos);
  if (allRefs.length > 0) {
    doc.addPage();
    const idx = doc.bufferedPageRange().count - 1;
    tocEntries.push({ label: "Referencias del curso", pageIdx: idx, color: CUADERNO.INK });
    drawConsolidatedReferences(doc, fonts, allRefs);
  }

  // Páginas de notas libres.
  const notesIdx = doc.bufferedPageRange().count;
  tocEntries.push({ label: "Notas libres", pageIdx: notesIdx, color: CUADERNO.INK });
  notesPage(doc, "Notas libres");
  notesPage(doc, "Notas libres");
  notesPage(doc, "Notas libres");

  // Ahora que se conocen todas las páginas: llenar el índice y los pies.
  doc.switchToPage(tocIdx);
  drawIndexContent(doc, fonts, tocEntries);

  drawFooters(doc, fonts, datos.course.title);

  doc.end();
  return done;
}
