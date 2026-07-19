/**
 * Dibujante de bloques imprimibles para el Cuaderno de estudio
 * (server/cuaderno/*). Consume la salida pura de `html-blocks.ts` y la
 * traza sobre un `PDFKit.PDFDocument` real, respetando la regla de
 * paginación del spec: **ningún bloque se parte a la mitad**, salvo el
 * caso explícito de una tabla que ni siquiera cabe en una página completa
 * (§ Task 4 del plan), que se reparte por filas repitiendo el encabezado.
 *
 * Estrategia de paginación: en vez de reimplementar los márgenes/pie de
 * página del documento (eso lo posee `render.ts` vía la función
 * `ensureSpace` que se recibe en `opts`), cada bloque se mide *antes* de
 * dibujarse (con las métricas reales de la fuente incrustada) y sólo
 * entonces se pide el espacio necesario con `ensureSpace(alto)`. Así
 * `ensureSpace` decide si hay que saltar de página, y este módulo nunca
 * dibuja un bloque a caballo entre dos páginas.
 *
 * Texto con estilos mixtos (negrita/cursiva dentro de un mismo párrafo) se
 * dibuja encadenando llamadas a `doc.text(texto, { continued: true })`
 * cambiando de fuente entre cada `run` — la técnica estándar de pdfkit
 * para texto de estilo mixto (ver README de pdfkit, sección "Line Wrapping
 * / continued text"). El salto de línea forzado de un `<br>` llega como un
 * literal `"\n"` dentro del texto de un `run`; pdfkit interpreta `"\n"`
 * como salto de línea obligatorio de forma nativa (usa la librería
 * `linebreak`, que sigue UAX #14), así que basta con **no** reemplazarlo
 * ni quitarlo — se deja pasar tal cual a `doc.text()`/`doc.heightOfString()`.
 *
 * Como Plus Jakarta Sans sólo se incrustó en regular y bold (`fonts.ts`;
 * no hay una variante itálica de la fuente de texto — la itálica
 * incrustada es sólo de la serif de títulos), la cursiva del cuerpo se
 * sintetiza con la opción nativa `oblique` de pdfkit (una inclinación
 * sintética del glifo), en vez de caer a Helvetica o perder el énfasis.
 */

import type { Block, Inline, ListItem } from "./html-blocks";
import { CUADERNO, accentCard } from "./visuals";
import { registerCuadernoFonts, type CuadernoFontNames } from "./fonts";

export interface DrawBlocksOpts {
  /** Coordenada x izquierda de la columna donde se dibuja. */
  x: number;
  /** Ancho de la columna (NO el ancho completo de la página: el cuaderno
   * deja aparte la columna de notas). */
  width: number;
  /** Color de acento del módulo actual (viñetas, barra de cita, banda de tabla). */
  accent: string;
  /** Reserva `h` puntos verticales; si no caben en lo que resta de la
   * página actual, salta de página (patrón de `server/kit-pdf.ts`). */
  ensureSpace(h: number): void;
}

// ---- Constantes de estilo (§ Task 4 del plan) --------------------------

const H2_SIZE = 15;
const H3_SIZE = 12.5;
const HEADING_SPACE_AFTER = 8;
const H2_SPACE_BEFORE = 14;
const H3_SPACE_BEFORE = 10;
/** Alto mínimo de "algo más" que debe caber tras un título para no dejarlo
 * huérfano al pie de la página (se pide junto con el alto del título). */
const HEADING_MIN_FOLLOW = 40;

const BODY_SIZE = 10.5;
const BODY_LINE_GAP = 3;
const PARAGRAPH_SPACING_AFTER = 8;

const LIST_LEVEL_INDENT = 14;
const LIST_MARKER_WIDTH = 16;
const LIST_ITEM_SPACING = 5;
const LIST_SPACING_AFTER = 6;

const QUOTE_PAD_X = 16;
const QUOTE_PAD_Y = 10;
const QUOTE_SPACING_AFTER = 10;

const TABLE_FONT_SIZE = 9.5;
const TABLE_CELL_PAD_X = 6;
const TABLE_CELL_PAD_Y = 5;
const TABLE_MIN_ROW_H = 18;
const TABLE_SPACING_AFTER = 10;

// ---- Entrada -------------------------------------------------------------

/**
 * Dibuja una lista de bloques (Task 2) en `doc`, paginando con `opts.ensureSpace`.
 * Registra las fuentes de marca (idempotente: `doc.registerFont` puede
 * llamarse varias veces con el mismo nombre sin efecto secundario).
 */
export function drawBlocks(doc: PDFKit.PDFDocument, blocks: Block[], opts: DrawBlocksOpts): void {
  const fonts = registerCuadernoFonts(doc);
  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
        drawHeading(doc, block, opts, fonts);
        break;
      case "paragraph":
        drawParagraph(doc, block, opts, fonts);
        break;
      case "list":
        drawList(doc, block, opts, fonts);
        break;
      case "table":
        drawTable(doc, block, opts, fonts);
        break;
      case "quote":
        drawQuote(doc, block, opts, fonts);
        break;
    }
  }
}

// ---- Medición de texto con estilos mixtos --------------------------------

/**
 * Estima el alto que va a ocupar una lista de `runs` (párrafo, item de
 * lista o cita) antes de dibujarla. Como el dibujo real mezcla fuentes
 * (regular/bold) por `run` y `heightOfString` sólo mide con una fuente a
 * la vez, se mide el texto completo con AMBAS fuentes (regular y bold, que
 * en Plus Jakarta Sans es más ancha) y se toma el máximo: una cota segura
 * por exceso, nunca por defecto — preferible reservar de más y dejar un
 * pequeño margen en la página a partir el bloque a la mitad.
 */
function measureRunsHeight(
  doc: PDFKit.PDFDocument,
  runs: Inline[],
  width: number,
  fontRegular: string,
  fontBold: string,
  size: number,
  lineGap: number
): number {
  if (runs.length === 0) return 0;
  const text = runs.map((r) => r.text).join("");
  if (!text.trim()) return 0;

  doc.font(fontRegular).fontSize(size);
  const hRegular = doc.heightOfString(text, { width, lineGap });
  doc.font(fontBold).fontSize(size);
  const hBold = doc.heightOfString(text, { width, lineGap });
  return Math.max(hRegular, hBold);
}

/**
 * Dibuja `runs` como un único párrafo de estilo mixto, encadenando
 * llamadas `continued` de pdfkit. El `\n` embebido de un `<br>` (ver
 * cabecera del archivo) no se toca: se pasa tal cual, pdfkit lo interpreta
 * como salto de línea forzado de forma nativa.
 *
 * `oblique` se fija explícitamente en CADA run (incluso a `false`) porque
 * pdfkit hereda automáticamente las opciones no especificadas del primer
 * `run` de la cadena (`continued`) — si no se fijara explícitamente, un
 * primer run en cursiva "contagiaría" `oblique` a los runs siguientes que
 * no lo pidieron.
 */
function drawRuns(
  doc: PDFKit.PDFDocument,
  runs: Inline[],
  x: number,
  y: number,
  width: number,
  size: number,
  color: string,
  fonts: CuadernoFontNames,
  lineGap: number
): void {
  if (runs.length === 0) return;
  doc.x = x;
  doc.y = y;
  const n = runs.length;
  runs.forEach((run, i) => {
    const font = run.bold ? fonts.sansBold : fonts.sans;
    const options: PDFKit.Mixins.TextOptions & { oblique?: boolean } = {
      continued: i < n - 1,
      oblique: !!run.italic,
    };
    if (i === 0) {
      options.width = width;
      options.lineGap = lineGap;
    }
    doc.font(font).fontSize(size).fillColor(color).text(run.text, options);
  });
}

// ---- heading ---------------------------------------------------------

function drawHeading(
  doc: PDFKit.PDFDocument,
  block: Extract<Block, { kind: "heading" }>,
  opts: DrawBlocksOpts,
  fonts: CuadernoFontNames
): void {
  const isH2 = block.level === 2;
  const size = isH2 ? H2_SIZE : H3_SIZE;
  const spaceBefore = isH2 ? H2_SPACE_BEFORE : H3_SPACE_BEFORE;

  doc.font(fonts.serif).fontSize(size);
  const textHeight = doc.heightOfString(block.text, { width: opts.width });

  // Nunca huérfano al pie: se pide el alto del título MÁS un colchón de
  // contenido que debe caber justo debajo, para no dejarlo solo.
  opts.ensureSpace(spaceBefore + textHeight + HEADING_SPACE_AFTER + HEADING_MIN_FOLLOW);

  doc.y += spaceBefore;
  const y = doc.y;
  const color = isH2 ? CUADERNO.INK : opts.accent;
  doc.font(fonts.serif).fontSize(size).fillColor(color).text(block.text, opts.x, y, { width: opts.width });
  doc.y = y + textHeight;

  if (isH2) {
    const ruleY = doc.y + 4;
    doc.save();
    doc.moveTo(opts.x, ruleY).lineTo(opts.x + 28, ruleY).strokeColor(opts.accent).lineWidth(2).stroke();
    doc.restore();
    doc.y = ruleY + 6;
  } else {
    doc.y += HEADING_SPACE_AFTER;
  }
}

// ---- paragraph ---------------------------------------------------------

function drawParagraph(
  doc: PDFKit.PDFDocument,
  block: Extract<Block, { kind: "paragraph" }>,
  opts: DrawBlocksOpts,
  fonts: CuadernoFontNames
): void {
  if (block.runs.length === 0) return;
  const estHeight = measureRunsHeight(doc, block.runs, opts.width, fonts.sans, fonts.sansBold, BODY_SIZE, BODY_LINE_GAP);
  if (estHeight <= 0) return;

  opts.ensureSpace(estHeight + PARAGRAPH_SPACING_AFTER);
  const y = doc.y;
  drawRuns(doc, block.runs, opts.x, y, opts.width, BODY_SIZE, CUADERNO.INK, fonts, BODY_LINE_GAP);
  doc.y += PARAGRAPH_SPACING_AFTER;
}

// ---- list ---------------------------------------------------------------

function drawList(
  doc: PDFKit.PDFDocument,
  block: Extract<Block, { kind: "list" }>,
  opts: DrawBlocksOpts,
  fonts: CuadernoFontNames
): void {
  if (block.items.length === 0) return;

  // Contador por nivel: se reinicia cada vez que se desciende a un nivel
  // nuevo (una sub-lista recién abierta), y se preserva al volver a un
  // nivel más superficial (para que el siguiente hermano del nivel 0
  // siga contando 2, 3... en vez de reiniciar). `ListItem.level` viene
  // aplanado-con-profundidad desde html-blocks.ts, no como árbol.
  const counters: number[] = [];
  let prevLevel = -1;

  block.items.forEach((item: ListItem) => {
    const level = Math.max(0, item.level);
    if (level > prevLevel) counters[level] = 0;
    counters[level] = (counters[level] ?? 0) + 1;
    prevLevel = level;

    const markerX = opts.x + level * LIST_LEVEL_INDENT;
    const textX = markerX + LIST_MARKER_WIDTH;
    const textWidth = Math.max(opts.width - (textX - opts.x), 20);

    const itemHeight = Math.max(
      measureRunsHeight(doc, item.runs, textWidth, fonts.sans, fonts.sansBold, BODY_SIZE, BODY_LINE_GAP),
      12
    );
    opts.ensureSpace(itemHeight + LIST_ITEM_SPACING);

    const y = doc.y;
    if (block.ordered) {
      const label = `${counters[level]}.`;
      doc
        .font(fonts.sansBold)
        .fontSize(BODY_SIZE)
        .fillColor(opts.accent)
        .text(label, markerX, y, { width: LIST_MARKER_WIDTH - 4, lineBreak: false });
    } else {
      const radius = level === 0 ? 2.2 : 1.6;
      doc.save();
      doc.circle(markerX + 4, y + BODY_SIZE * 0.5, radius).fill(opts.accent);
      doc.restore();
    }

    drawRuns(doc, item.runs, textX, y, textWidth, BODY_SIZE, CUADERNO.INK, fonts, BODY_LINE_GAP);
    doc.y += LIST_ITEM_SPACING;
  });

  doc.y += LIST_SPACING_AFTER - LIST_ITEM_SPACING;
}

// ---- quote ---------------------------------------------------------------

function drawQuote(
  doc: PDFKit.PDFDocument,
  block: Extract<Block, { kind: "quote" }>,
  opts: DrawBlocksOpts,
  fonts: CuadernoFontNames
): void {
  if (block.runs.length === 0) return;
  const innerWidth = Math.max(opts.width - QUOTE_PAD_X * 2, 20);
  const textHeight = measureRunsHeight(doc, block.runs, innerWidth, fonts.sans, fonts.sansBold, BODY_SIZE, BODY_LINE_GAP);
  if (textHeight <= 0) return;
  const boxHeight = textHeight + QUOTE_PAD_Y * 2;

  opts.ensureSpace(boxHeight + QUOTE_SPACING_AFTER);
  const y0 = doc.y;
  accentCard(doc, opts.x, y0, opts.width, boxHeight, opts.accent);
  drawRuns(doc, block.runs, opts.x + QUOTE_PAD_X, y0 + QUOTE_PAD_Y, innerWidth, BODY_SIZE, CUADERNO.INK_MUTED, fonts, BODY_LINE_GAP);
  doc.y = y0 + boxHeight + QUOTE_SPACING_AFTER;
}

// ---- table -----------------------------------------------------------

function cellHeight(doc: PDFKit.PDFDocument, text: string, font: string, size: number, colWidth: number): number {
  doc.font(font).fontSize(size);
  const innerWidth = Math.max(colWidth - TABLE_CELL_PAD_X * 2, 4);
  const h = doc.heightOfString(text || "", { width: innerWidth });
  return Math.max(h + TABLE_CELL_PAD_Y * 2, TABLE_MIN_ROW_H);
}

function rowHeight(doc: PDFKit.PDFDocument, cells: string[], colWidths: number[], font: string, size: number): number {
  let max = TABLE_MIN_ROW_H;
  colWidths.forEach((w, i) => {
    max = Math.max(max, cellHeight(doc, cells[i] ?? "", font, size, w));
  });
  return max;
}

function drawTableRowCells(
  doc: PDFKit.PDFDocument,
  cells: string[],
  colWidths: number[],
  x: number,
  y: number,
  h: number,
  font: string,
  size: number,
  color: string
): void {
  let cx = x;
  doc.font(font).fontSize(size).fillColor(color);
  colWidths.forEach((w, i) => {
    const innerWidth = Math.max(w - TABLE_CELL_PAD_X * 2, 4);
    doc.text(cells[i] ?? "", cx + TABLE_CELL_PAD_X, y + TABLE_CELL_PAD_Y, { width: innerWidth });
    cx += w;
  });
}

function drawTable(
  doc: PDFKit.PDFDocument,
  block: Extract<Block, { kind: "table" }>,
  opts: DrawBlocksOpts,
  fonts: CuadernoFontNames
): void {
  const hasHeader = block.headers.length > 0;
  const nCols = hasHeader ? block.headers.length : block.rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (nCols === 0) return; // sin columnas válidas: nada que dibujar, sin reventar el render.

  const colWidths = new Array(nCols).fill(opts.width / nCols);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  const headerH = hasHeader ? rowHeight(doc, block.headers, colWidths, fonts.sansBold, TABLE_FONT_SIZE) : 0;
  const rowHeights = block.rows.map((r) => rowHeight(doc, r, colWidths, fonts.sans, TABLE_FONT_SIZE));
  const total = headerH + rowHeights.reduce((a, b) => a + b, 0);
  if (total <= 0) return;

  // "Una tabla que no cabe empieza en página nueva": se pide el alto
  // completo de una sola vez. `ensureSpace` sólo salta de página si no
  // cabe en lo que resta de la actual (si cabe, es un no-op y seguimos
  // donde estábamos) — no sabemos ni necesitamos saber la capacidad total
  // de una página en blanco: eso lo decide `ensureSpace`.
  opts.ensureSpace(total);

  const drawHeaderBand = () => {
    if (!hasHeader) return;
    const y = doc.y;
    doc.save();
    doc.rect(opts.x, y, totalWidth, headerH).fillOpacity(0.12).fill(opts.accent);
    doc.restore();
    drawTableRowCells(doc, block.headers, colWidths, opts.x, y, headerH, fonts.sansBold, TABLE_FONT_SIZE, CUADERNO.INK);
    doc.save();
    doc.moveTo(opts.x, y + headerH).lineTo(opts.x + totalWidth, y + headerH).strokeColor(opts.accent).strokeOpacity(0.5).lineWidth(0.75).stroke();
    doc.restore();
    doc.y = y + headerH;
  };

  drawHeaderBand();

  // "si aun así no cabe, se parte por filas repitiendo el encabezado":
  // cada fila pide su propio espacio; si eso provoca un salto de página en
  // plena tabla (detectable porque `doc.y` cambia por algo distinto de lo
  // que esta fila avanzó), se repite el encabezado antes de seguir.
  block.rows.forEach((row, i) => {
    const h = rowHeights[i];
    const before = doc.y;
    opts.ensureSpace(h);
    if (doc.y !== before) {
      drawHeaderBand();
    }
    const y = doc.y;
    drawTableRowCells(doc, row, colWidths, opts.x, y, h, fonts.sans, TABLE_FONT_SIZE, CUADERNO.INK);
    doc.save();
    doc.moveTo(opts.x, y + h).lineTo(opts.x + totalWidth, y + h).strokeColor(CUADERNO.INK).strokeOpacity(0.08).lineWidth(0.5).stroke();
    doc.restore();
    doc.y = y + h;
  });

  doc.y += TABLE_SPACING_AFTER;
}
