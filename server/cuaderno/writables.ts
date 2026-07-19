/**
 * Elementos para escribir a mano (Cuaderno de estudio, `server/cuaderno/*`).
 *
 * Son las piezas que convierten el PDF de un resumen en un cuaderno de
 * trabajo: preguntas de reflexión con renglones reales, un formato vacío
 * para llenar, la autoevaluación (sin revelar la respuesta) y páginas de
 * notas libres. El reclamo original del dueño sobre el PDF viejo era
 * exactamente "no hay dónde escribir" — este módulo es la respuesta directa.
 *
 * Convención de paginación (mismo espíritu que `ensureSpace()` en
 * `server/kit-pdf.ts`, adaptada a funciones que reciben `x,y,w` explícitos en
 * vez de un `ctx` compartido): cada bloque **mide su alto real antes de
 * dibujar nada**. Si no cabe entero entre `y` y el margen inferior de la
 * página actual, se mueve completo — nunca se parte — a una página nueva, y
 * se dibuja desde el margen superior de esa página. La función deja
 * `doc.y` apuntando justo debajo del bloque (igual que el resto de
 * `server/cuaderno/*`), y también **devuelve el alto realmente dibujado**
 * (medido desde donde el bloque terminó aterrizando, no desde el `y`
 * original si hubo salto de página) para que un componedor que lleve su
 * propio cursor pueda sumarlo sin adivinar.
 */
import { CUADERNO, noteRules } from "./visuals";
import { registerCuadernoFonts } from "./fonts";

/** Alto de renglón para escritura a mano en todo el cuaderno (spec §9: RENGLON). */
const LINE_GAP = 22;

/**
 * Decide dónde empieza realmente un bloque de alto `height` que se quería
 * dibujar en `y`: si cabe en lo que resta de la página actual, se queda en
 * `y`; si no, se abre una página nueva y se dibuja desde su margen superior.
 * No es recursivo: un bloque patológicamente más alto que una página
 * completa se dibuja igual (puede rebasar visualmente el margen inferior)
 * en vez de generar páginas en blanco infinitas — caso extremo que no
 * debería ocurrir con contenido real.
 */
function placeBlock(doc: PDFKit.PDFDocument, y: number, height: number): number {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (y + height <= bottomLimit) return y;
  doc.addPage();
  return doc.page.margins.top;
}

// ---------------------------------------------------------------------------
// Reflexiona y escribe
// ---------------------------------------------------------------------------

const REFLECTION_ACCENT = CUADERNO.VIOLET;
const REFLECTION_FONT_SIZE = 11;
const REFLECTION_PAD_LEFT = 14;
const REFLECTION_GAP_AFTER_QUESTION = 16;
const REFLECTION_BOTTOM_PAD = 4;
const REFLECTION_DEFAULT_LINES = 6;

/**
 * Pregunta de reflexión con renglones reales para contestar a mano.
 * Devuelve el alto dibujado.
 */
export function reflectionBlock(
  doc: PDFKit.PDFDocument,
  question: string,
  x: number,
  y: number,
  w: number,
  lines: number = REFLECTION_DEFAULT_LINES
): number {
  const fonts = registerCuadernoFonts(doc);
  const safeLines = Math.max(1, Math.floor(lines));
  const textW = w - REFLECTION_PAD_LEFT;

  doc.font(fonts.sansBold).fontSize(REFLECTION_FONT_SIZE);
  const questionH = doc.heightOfString(question || "", { width: textW, lineGap: 2 });

  const rulesH = safeLines * LINE_GAP;
  const totalHeight = questionH + REFLECTION_GAP_AFTER_QUESTION + rulesH + REFLECTION_BOTTOM_PAD;

  const drawY = placeBlock(doc, y, totalHeight);

  doc.save();
  doc.rect(x, drawY, 2.5, questionH).fill(REFLECTION_ACCENT);
  doc.font(fonts.sansBold).fontSize(REFLECTION_FONT_SIZE).fillColor(CUADERNO.INK);
  doc.text(question || "", x + REFLECTION_PAD_LEFT, drawY, { width: textW, lineGap: 2 });
  doc.restore();

  const rulesY = drawY + questionH + REFLECTION_GAP_AFTER_QUESTION;
  noteRules(doc, x, rulesY, w, safeLines, LINE_GAP);

  doc.y = drawY + totalHeight;
  return totalHeight;
}

// ---------------------------------------------------------------------------
// Formato para llenar
// ---------------------------------------------------------------------------

const TABLE_HEADER_FILL = CUADERNO.BLUE;
const TABLE_HEADER_FONT_SIZE = 9;
const TABLE_HEADER_PAD_Y = 7;
const TABLE_ROW_HEIGHT = 28;

/**
 * Tabla vacía (encabezados impresos, filas en blanco) para que el alumno la
 * llene a mano — checklist, bitácora, comparativo, lo que pida el módulo.
 * Devuelve el alto dibujado.
 */
export function fillInTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: number,
  x: number,
  y: number,
  w: number
): number {
  const fonts = registerCuadernoFonts(doc);
  const cols = Math.max(1, headers.length);
  const colW = w / cols;
  const safeRows = Math.max(0, Math.floor(rows));

  doc.font(fonts.sansBold).fontSize(TABLE_HEADER_FONT_SIZE);
  const headerTextH = headers.reduce(
    (max, h) => Math.max(max, doc.heightOfString(h || "", { width: colW - 12, lineGap: 1 })),
    0
  );
  const headerH = headerTextH + TABLE_HEADER_PAD_Y * 2;
  const totalHeight = headerH + safeRows * TABLE_ROW_HEIGHT;

  const drawY = placeBlock(doc, y, totalHeight);

  // Banda de encabezado.
  doc.save();
  doc.rect(x, drawY, w, headerH).fillOpacity(0.08).fill(TABLE_HEADER_FILL);
  doc.restore();
  doc.save();
  doc.font(fonts.sansBold).fontSize(TABLE_HEADER_FONT_SIZE).fillColor(CUADERNO.INK);
  headers.forEach((h, i) => {
    doc.text(h || "", x + i * colW + 6, drawY + TABLE_HEADER_PAD_Y, {
      width: colW - 12,
      lineGap: 1,
    });
  });
  doc.restore();

  // Cuadrícula: contorno + separadores de fila y columna, todo capilar.
  doc.save();
  doc.strokeColor(CUADERNO.INK).strokeOpacity(0.15).lineWidth(0.6);
  doc.rect(x, drawY, w, totalHeight).stroke();
  doc.moveTo(x, drawY + headerH).lineTo(x + w, drawY + headerH).stroke();
  for (let r = 1; r < safeRows; r++) {
    const ry = drawY + headerH + r * TABLE_ROW_HEIGHT;
    doc.moveTo(x, ry).lineTo(x + w, ry).stroke();
  }
  for (let c = 1; c < cols; c++) {
    const cx = x + c * colW;
    doc.moveTo(cx, drawY).lineTo(cx, drawY + totalHeight).stroke();
  }
  doc.restore();

  doc.y = drawY + totalHeight;
  return totalHeight;
}

// ---------------------------------------------------------------------------
// Autoevaluación (sin revelar la respuesta)
// ---------------------------------------------------------------------------

/**
 * Pregunta de autoevaluación tal como la necesita `quizBlock`. Puede llegar
 * un objeto con `correctIndex`/`explanation` (la forma completa de
 * `generated_content.adaptiveQuiz`) — se ignoran a propósito: la respuesta y
 * su explicación van en la clave de respuestas al final del libro, nunca
 * junto a la pregunta.
 */
export interface QuizQuestionInput {
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

const QUIZ_QUESTION_FONT_SIZE = 10.5;
const QUIZ_OPTION_FONT_SIZE = 10;
const QUIZ_CHECKBOX_SIZE = 8.5;
const QUIZ_OPTION_INDENT = 20;
const QUIZ_OPTION_TEXT_GAP = 8;
const QUIZ_OPTION_ROW_GAP = 8;
const QUIZ_GAP_AFTER_QUESTION = 8;

/**
 * Pregunta de autoevaluación con casillas vacías. Imprime la pregunta y sus
 * opciones — nunca la respuesta correcta ni la explicación, aunque `q` las
 * traiga (ver `QuizQuestionInput`). La casilla se dibuja como cuadro vectorial
 * (no como carácter `☐`) para no depender de que la fuente de marca incluya
 * ese glifo. Devuelve el alto dibujado.
 */
export function quizBlock(
  doc: PDFKit.PDFDocument,
  q: QuizQuestionInput,
  index: number,
  x: number,
  y: number,
  w: number
): number {
  const fonts = registerCuadernoFonts(doc);
  const options = q.options || [];

  doc.font(fonts.sansBold).fontSize(QUIZ_QUESTION_FONT_SIZE);
  const label = `${index}.`;
  const labelW = doc.widthOfString(label) + 6;
  const questionTextW = w - labelW;
  const questionH = doc.heightOfString(q.question || "", { width: questionTextW, lineGap: 2 });

  const optionTextW = w - QUIZ_OPTION_INDENT - QUIZ_CHECKBOX_SIZE - QUIZ_OPTION_TEXT_GAP;
  doc.font(fonts.sans).fontSize(QUIZ_OPTION_FONT_SIZE);
  const optionHeights = options.map((opt) =>
    Math.max(doc.heightOfString(opt || "", { width: optionTextW, lineGap: 2 }), QUIZ_CHECKBOX_SIZE)
  );
  const optionsHeight = optionHeights.reduce((sum, h) => sum + h + QUIZ_OPTION_ROW_GAP, 0);

  const totalHeight = questionH + QUIZ_GAP_AFTER_QUESTION + optionsHeight;

  const drawY = placeBlock(doc, y, totalHeight);

  doc.save();
  doc.font(fonts.sansBold).fontSize(QUIZ_QUESTION_FONT_SIZE).fillColor(CUADERNO.BLUE);
  doc.text(label, x, drawY, { width: labelW, lineBreak: false });
  doc.font(fonts.sansBold).fontSize(QUIZ_QUESTION_FONT_SIZE).fillColor(CUADERNO.INK);
  doc.text(q.question || "", x + labelW, drawY, { width: questionTextW, lineGap: 2 });
  doc.restore();

  let oy = drawY + questionH + QUIZ_GAP_AFTER_QUESTION;
  options.forEach((opt, i) => {
    doc.save();
    doc
      .rect(x + QUIZ_OPTION_INDENT, oy + 1, QUIZ_CHECKBOX_SIZE, QUIZ_CHECKBOX_SIZE)
      .lineWidth(0.9)
      .strokeColor(CUADERNO.INK_MUTED)
      .stroke();
    doc.restore();

    doc.save();
    doc.font(fonts.sans).fontSize(QUIZ_OPTION_FONT_SIZE).fillColor(CUADERNO.INK);
    doc.text(opt || "", x + QUIZ_OPTION_INDENT + QUIZ_CHECKBOX_SIZE + QUIZ_OPTION_TEXT_GAP, oy, {
      width: optionTextW,
      lineGap: 2,
    });
    doc.restore();

    oy += optionHeights[i] + QUIZ_OPTION_ROW_GAP;
  });

  doc.y = drawY + totalHeight;
  return totalHeight;
}

// ---------------------------------------------------------------------------
// Página de notas libres
// ---------------------------------------------------------------------------

const NOTES_TITLE_FONT_SIZE = 20;
const NOTES_GAP_AFTER_TITLE = 20;

/**
 * Página completa de renglones vacíos, con título, para notas libres del
 * alumno (cierre del cuaderno, spec §6.4). Siempre abre una página nueva:
 * cada llamada es exactamente una página de notas.
 */
export function notesPage(doc: PDFKit.PDFDocument, title: string): void {
  const fonts = registerCuadernoFonts(doc);
  doc.addPage();

  const { left, right, top, bottom } = doc.page.margins;
  const contentW = doc.page.width - left - right;
  const bottomLimit = doc.page.height - bottom;

  doc.font(fonts.serif).fontSize(NOTES_TITLE_FONT_SIZE).fillColor(CUADERNO.INK);
  doc.text(title || "Notas", left, top, { width: contentW });

  const rulesY = doc.y + NOTES_GAP_AFTER_TITLE;
  const availableH = bottomLimit - rulesY;
  const lineCount = Math.max(0, Math.floor(availableH / LINE_GAP));
  noteRules(doc, left, rulesY, contentW, lineCount, LINE_GAP);

  doc.y = bottomLimit;
}
