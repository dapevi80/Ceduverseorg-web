/**
 * Primitivas visuales de marca para el Cuaderno de estudio (server/cuaderno/*).
 *
 * El PDF anterior usaba Helvetica y ningún motivo gráfico: "no parece
 * Ceduverse". Este módulo traduce a pdfkit el lenguaje gráfico real de la
 * landing (`client/src/pages/landing.tsx`) — retícula de puntos, hexágono de
 * contorno, conectores punteados con punta de flecha, tarjetas de borde
 * capilar con barra de acento, y numerales fantasma — para que el cuaderno
 * impreso se vea del mismo sistema visual que el producto.
 *
 * Convenciones reusadas de `server/kit-pdf.ts`:
 * - Puntas de flecha: `lineTo` + `closePath().fill()` (ver `drawFlow()`).
 * - Bandas de tinte: `fillOpacity()` antes de `fill()`, restaurando después.
 * - Bordes capilares y trazos punteados: `dash(len, { space })` / `undash()`.
 * - Esquinas redondeadas: `roundedRect()`.
 *
 * No hay ilustración dibujada aquí — sólo geometría reproducible con las
 * primitivas de pdfkit, tal como decide §3 del spec.
 */

/** Paleta exacta de marca (valores idénticos a los usados en la web). */
export const CUADERNO = {
  INK: "#1a1a2e",
  INK_MUTED: "#7a7a99",
  CREAM: "#faf8f4",
  BLUE: "#1b5adf",
  ORANGE: "#f28023",
  VIOLET: "#7c3aed",
  GREEN: "#00b87a",
} as const;

/** Rotación de color de acento por módulo, igual que la landing por sección. */
export const MODULE_COLORS: string[] = [
  CUADERNO.BLUE,
  CUADERNO.ORANGE,
  CUADERNO.VIOLET,
  CUADERNO.GREEN,
];

/**
 * Retícula de puntos (`.dot-grid-bg` en la landing): puntos de ~1px cada
 * 28pt, opacidad 7%. Se usa como textura de portada y portadillas de módulo.
 */
export function dotGrid(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = CUADERNO.BLUE
): void {
  const SPACING = 28;
  const DOT_RADIUS = 0.5;

  doc.save();
  doc.fillColor(color).fillOpacity(0.07);
  for (let py = y; py <= y + h; py += SPACING) {
    for (let px = x; px <= x + w; px += SPACING) {
      doc.circle(px, py, DOT_RADIUS).fill();
    }
  }
  doc.restore();
}

/**
 * Hexágono de contorno (ornamento de esquina), calcado de
 * `M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z`: seis vértices de un
 * hexágono regular "punta arriba" centrado en `(cx, cy)` con radio `r`,
 * trazo 1.5pt, opacidad 30%, sin relleno.
 */
export function hexOutline(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  const ANGLES_DEG = [-90, -30, 30, 90, 150, 210];
  const points = ANGLES_DEG.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  });

  doc.save();
  doc.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    doc.lineTo(points[i][0], points[i][1]);
  }
  doc.closePath();
  doc.lineWidth(1.5).strokeColor(color).strokeOpacity(0.3).stroke();
  doc.restore();
}

/**
 * Conector punteado con punta de flecha (mapas conceptuales, diagramas):
 * línea `dash 6/4` de `(x1,y1)` a `(x2,y2)` con un triángulo de cierre en el
 * destino, siguiendo la técnica de `drawFlow()` en `kit-pdf.ts`
 * (`lineTo` + `closePath().fill()`).
 */
export function dashedConnector(
  doc: PDFKit.PDFDocument,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const HEAD_LEN = 6;
  const HEAD_WIDTH = 3;
  const ux = dx / len;
  const uy = dy / len;
  // Punto base de la flecha: donde termina la línea punteada, para que la
  // punta sólida no quede partida por el guionado.
  const baseX = x2 - ux * HEAD_LEN;
  const baseY = y2 - uy * HEAD_LEN;
  const px = -uy;
  const py = ux;

  doc.save();
  doc.moveTo(x1, y1).lineTo(baseX, baseY)
    .dash(6, { space: 4 })
    .strokeColor(color)
    .lineWidth(1)
    .stroke();
  doc.undash();

  doc.moveTo(x2, y2)
    .lineTo(baseX + px * HEAD_WIDTH, baseY + py * HEAD_WIDTH)
    .lineTo(baseX - px * HEAD_WIDTH, baseY - py * HEAD_WIDTH)
    .closePath()
    .fill(color);
  doc.restore();
}

/**
 * Numeral de módulo en serif enorme, opacidad 4% (portadillas de capítulo),
 * igual que el `text-cedu-ink/[0.04]` de las tarjetas de feature en la
 * landing. `n` se imprime con dos dígitos ("01", "02"...).
 */
export function ghostNumeral(
  doc: PDFKit.PDFDocument,
  n: number,
  x: number,
  y: number,
  size: number,
  font: string
): void {
  doc.save();
  doc.font(font).fontSize(size).fillColor(CUADERNO.INK).fillOpacity(0.04);
  doc.text(String(n).padStart(2, "0"), x, y, { lineBreak: false });
  doc.restore();
}

/**
 * Tarjeta de marca: esquina redondeada grande, borde capilar
 * `rgba(0,0,0,0.06)` y barra de acento de color en el borde izquierdo
 * (recortada al radio para que no sobresalga de la esquina redondeada).
 * `fill`, si se da, pinta el fondo de la tarjeta (p. ej. un tinte suave del
 * color del módulo) antes del borde y la barra.
 */
export function accentCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  fill?: string
): void {
  const RADIUS = 10;
  const BAR_WIDTH = 3.5;

  doc.save();
  if (fill) {
    doc.roundedRect(x, y, w, h, RADIUS).fill(fill);
  }

  doc.save();
  doc.roundedRect(x, y, w, h, RADIUS).clip();
  doc.rect(x, y, BAR_WIDTH, h).fill(color);
  doc.restore();

  doc.roundedRect(x, y, w, h, RADIUS)
    .lineWidth(0.75)
    .strokeColor(CUADERNO.INK)
    .strokeOpacity(0.06)
    .stroke();
  doc.restore();
}

/**
 * Renglones de escritura a mano (columna de notas): `lines` líneas
 * horizontales de ancho `w` a partir de `(x, y)`, separadas `gap` puntos
 * (22pt por defecto — la interlínea del spec para que sea escribible a
 * mano), a 8% de opacidad.
 */
export function noteRules(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  lines: number,
  gap: number = 22
): void {
  doc.save();
  doc.strokeColor(CUADERNO.INK).strokeOpacity(0.08).lineWidth(0.5);
  for (let i = 0; i < lines; i++) {
    const ly = y + i * gap;
    doc.moveTo(x, ly).lineTo(x + w, ly).stroke();
  }
  doc.restore();
}
