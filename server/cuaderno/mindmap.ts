/**
 * Mapa conceptual dibujado desde `generated_content.mindMap` (Cuaderno de
 * estudio, `server/cuaderno/*`).
 *
 * El Tutor IA ya genera, por alumno y por módulo, un `mindMap` con 4-6 ramas
 * de 2-4 hijos cada una — es exactamente la forma de un mapa conceptual. Este
 * módulo lo dibuja en papel usando las primitivas de marca de `visuals.ts`
 * (`dashedTrajectory` para las líneas, `accentCard` para las cajas).
 *
 * Split deliberado, igual que `html-blocks.ts`:
 * - `mindMapLayout()` es geometría **pura** (sin pdfkit, sin I/O) — calcula
 *   dónde va cada nodo. Es la pieza testeable de verdad.
 * - `drawMindMap()` es la única parte que toca pdfkit; mide texto real para
 *   dimensionar cada caja (así ninguna etiqueta se desborda) y dibuja.
 *
 * `color` y `detail` son opcionales en la práctica (el LLM no siempre los
 * llena): `color` ausente cae a `MODULE_COLORS` por índice de rama; `detail`
 * ausente simplemente no dibuja la línea de detalle. Cero invención: nunca se
 * inventa una etiqueta ni un color fuera de la paleta de respaldo.
 *
 * Degradación (spec §8): si no hay ramas, `drawMindMap` devuelve `false` sin
 * dibujar nada — nunca un recuadro vacío. El llamador debe listar las ramas
 * como texto en ese caso.
 *
 * Pase de diseño 2026-07-19 ("el mapa conceptual sigue saturado — nodos que
 * se encima y demasiado texto"): tres cambios sobre lo anterior.
 * - Las etiquetas se truncan a un máximo de caracteres (`truncateLabel`) —
 *   el detalle completo de cada hijo ya no se dibuja dentro del nodo; vive
 *   en "Conceptos clave" (`drawKeyConcepts`, `render.ts`), que sí tiene
 *   espacio para el texto completo. Truncar es sólo cosmético: no se pierde
 *   ningún dato, `modulo.mindMap` sigue trayendo las etiquetas completas.
 * - Después de medir cada caja con la fuente real se corre
 *   `resolveBoxOverlaps` (geometría pura, sin pdfkit — testeable aislada):
 *   separa cualquier par de cajas que todavía se traslape, determinista
 *   (mismas cajas de entrada, mismo resultado siempre).
 * - Los conectores usan `dashedTrajectory` (línea con una leve curva) en vez
 *   de `dashedConnector` (recta), para el trazo "suelto" a mano que pidió el
 *   dueño.
 */
import { CUADERNO, MODULE_COLORS, accentCard, dashedTrajectory } from "./visuals";
import { registerCuadernoFonts } from "./fonts";

export interface MindMap {
  central: string;
  branches: {
    label: string;
    color?: string;
    children: { label: string; detail?: string }[];
  }[];
}

export interface MindMapNode {
  x: number;
  y: number;
  label: string;
  color: string;
  detail?: string;
  /** -1 = hijo directo del nodo central (es una rama); si no, índice en `nodes` de su rama. */
  parent: number;
}

export interface MindMapLayout {
  central: { x: number; y: number; label: string };
  nodes: MindMapNode[];
}

// ---- Geometría pura -----------------------------------------------------

/** Radio de las ramas, como fracción del radio máximo disponible. */
const BRANCH_RADIUS_RATIO = 0.48;
/** Radio de los hijos, como fracción del radio máximo disponible. */
const CHILD_RADIUS_RATIO = 0.98;
/** Margen reservado en cada eje para que las cajas (dibujadas después) no se salgan del área. */
const MARGIN_X = 60;
const MARGIN_Y = 26;
/** Fracción del sector angular de cada rama que ocupan sus hijos, para no invadir el sector vecino. */
const CHILD_ARC_FRACTION = 0.7;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/**
 * Calcula la posición de cada nodo del mapa conceptual dentro de un área de
 * `w`×`h`, sin dibujar nada. Puro: mismo input, mismo output, sin pdfkit.
 *
 * - El nodo central va al centro del área.
 * - Las ramas se reparten en un círculo completo alrededor del centro,
 *   separadas uniformemente (`2π / n`).
 * - Los hijos de cada rama se reparten en un arco angosto centrado en el
 *   ángulo de su rama, a mayor radio — así quedan agrupados visualmente con
 *   su rama sin invadir el sector de la rama vecina.
 * - Todas las coordenadas quedan garantizadas dentro de `[0,w] × [0,h]`.
 */
export function mindMapLayout(m: MindMap, w: number, h: number): MindMapLayout {
  const central = { x: w / 2, y: h / 2, label: m?.central ?? "" };
  const branches = m?.branches ?? [];
  const n = branches.length;

  if (n === 0) {
    return { central, nodes: [] };
  }

  const maxRx = Math.max(w / 2 - MARGIN_X, w / 8, 1);
  const maxRy = Math.max(h / 2 - MARGIN_Y, h / 8, 1);
  const sector = (2 * Math.PI) / n;

  const nodes: MindMapNode[] = [];

  branches.forEach((branch, i) => {
    const angle = -Math.PI / 2 + i * sector;
    const color = branch?.color || MODULE_COLORS[i % MODULE_COLORS.length];

    const bx = clamp(central.x + Math.cos(angle) * maxRx * BRANCH_RADIUS_RATIO, 0, w);
    const by = clamp(central.y + Math.sin(angle) * maxRy * BRANCH_RADIUS_RATIO, 0, h);
    const branchIndex = nodes.length;
    nodes.push({ x: bx, y: by, label: branch?.label ?? "", color, parent: -1 });

    const children = branch?.children ?? [];
    const c = children.length;
    const arcSpan = sector * CHILD_ARC_FRACTION;

    children.forEach((child, j) => {
      const childAngle = c === 1 ? angle : angle - arcSpan / 2 + (arcSpan * j) / (c - 1);
      const cx = clamp(central.x + Math.cos(childAngle) * maxRx * CHILD_RADIUS_RATIO, 0, w);
      const cy = clamp(central.y + Math.sin(childAngle) * maxRy * CHILD_RADIUS_RATIO, 0, h);

      const node: MindMapNode = {
        x: cx,
        y: cy,
        label: child?.label ?? "",
        color,
        parent: branchIndex,
      };
      if (child?.detail) node.detail = child.detail;
      nodes.push(node);
    });
  });

  return { central, nodes };
}

// ---- Dibujo (pdfkit) -----------------------------------------------------

const CENTRAL_FONT = 12;
const CENTRAL_PAD = 12;
const CENTRAL_MAX_W = 168;
const CENTRAL_RADIUS = 10;

const BRANCH_FONT = 9.5;
const BRANCH_PAD = 8;
const BRANCH_MAX_W = 116;
const BRANCH_RADIUS = 8;

const CHILD_FONT = 8;
const CHILD_PAD = 6;
const CHILD_MAX_W = 98;
const CHILD_RADIUS = 6;
const DETAIL_FONT = 6.5;
const DETAIL_GAP = 3;

/** Máximo de caracteres por etiqueta dentro del mapa — el detalle completo
 * (`child.detail`) ya no se dibuja aquí, vive en "Conceptos clave". */
const CENTRAL_MAX_CHARS = 46;
const BRANCH_MAX_CHARS = 30;
const CHILD_MAX_CHARS = 24;

/** Trunca una etiqueta a `maxChars`, con elipsis — nunca inventa texto, sólo
 * recorta lo que ya vino de los datos. */
function truncateLabel(label: string | undefined, maxChars: number): string {
  const clean = (label ?? "").trim() || "—";
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

interface BoxDims {
  /** Ancho útil de texto (lo que se pasa como `width` a `doc.text`, para que la medida y el dibujo coincidan). */
  innerW: number;
  w: number;
  h: number;
  labelH: number;
  detailH: number;
}

/**
 * Mide una etiqueta (y opcionalmente su detalle) con la fuente real, para
 * que la caja se dimensione al texto verdadero — así ninguna etiqueta se
 * desborda, ni siquiera las largas ("Marco legal y normativo aplicable").
 */
function measureBox(
  doc: PDFKit.PDFDocument,
  labelFont: string,
  labelSize: number,
  label: string,
  maxW: number,
  pad: number,
  detailFont?: string,
  detail?: string
): BoxDims {
  const text = label || "—";
  doc.font(labelFont).fontSize(labelSize);
  const naturalW = doc.widthOfString(text);
  const innerW = clamp(naturalW, 24, maxW - pad * 2);
  const labelH = doc.heightOfString(text, { width: innerW, align: "center" });

  let detailH = 0;
  if (detail && detailFont) {
    doc.font(detailFont).fontSize(DETAIL_FONT);
    detailH = doc.heightOfString(detail, { width: innerW, align: "center" }) + DETAIL_GAP;
  }

  return {
    innerW,
    w: innerW + pad * 2,
    h: labelH + detailH + pad * 2,
    labelH,
    detailH,
  };
}

/** Punto donde el rayo desde `(fromX,fromY)` hacia `(toX,toY)` cruza el borde de la caja centrada en `(fromX,fromY)`. */
function edgePoint(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  halfW: number,
  halfH: number
): { x: number; y: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx === 0 && dy === 0) return { x: fromX, y: fromY };

  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const t = clamp(Math.min(scaleX, scaleY), 0, 1);

  return { x: fromX + dx * t, y: fromY + dy * t };
}

// ---- Separación de traslapes (geometría pura, testeable sin pdfkit) ------

export interface OverlapBox {
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
  /** El nodo central nunca se mueve — es el ancla del mapa. */
  fixed?: boolean;
}

const OVERLAP_ITERATIONS = 500;
/** Separación mínima adicional entre cajas, más allá de que no se toquen. */
const OVERLAP_PADDING = 5;

/**
 * Separa cajas (AABB) que se traslapan. Estrategia: en cada pasada, busca el
 * par MÁS encimado (mayor área de traslape) y lo resuelve por completo (no a
 * medias) por su eje de menor solape — nunca el promedio de todos los pares
 * a la vez. Una relajación pareja (mover un poco cada par, cada pasada) se
 * probó primero y se quedaba en un equilibrio estable con un par todavía
 * encimado (las fuerzas de varios vecinos se cancelaban exactamente antes de
 * cerrar el último hueco); resolver el peor par completo, uno a la vez, no
 * tiene ese punto muerto. Determinista: mismas cajas de entrada, mismo
 * resultado siempre — nada de `Math.random()`, así que el mismo mapa
 * conceptual dibuja exactamente igual entre corridas. Las cajas `fixed` (el
 * nodo central) nunca se mueven. Al final recorta cada caja movible para que
 * su centro quede dentro de `[bx,bx+bw] × [by,by+bh]` respetando su
 * medio-ancho/alto. Muta `boxes` in place y también lo devuelve, por
 * conveniencia.
 */
export function resolveBoxOverlaps(
  boxes: OverlapBox[],
  bx: number,
  by: number,
  bw: number,
  bh: number
): OverlapBox[] {
  for (let iter = 0; iter < OVERLAP_ITERATIONS; iter++) {
    let worstI = -1;
    let worstJ = -1;
    let worstArea = 0;
    let worstOverlapX = 0;
    let worstOverlapY = 0;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = a.halfW + b.halfW + OVERLAP_PADDING - Math.abs(b.cx - a.cx);
        const overlapY = a.halfH + b.halfH + OVERLAP_PADDING - Math.abs(b.cy - a.cy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        const area = overlapX * overlapY;
        if (area > worstArea) {
          worstArea = area;
          worstI = i;
          worstJ = j;
          worstOverlapX = overlapX;
          worstOverlapY = overlapY;
        }
      }
    }

    if (worstI === -1) break; // ningún par se traslapa — listo.

    const a = boxes[worstI];
    const b = boxes[worstJ];
    // Se separa por el eje de MENOR solape: es el que resuelve el traslape
    // con el desplazamiento más chico.
    if (worstOverlapX < worstOverlapY) {
      const sign = b.cx - a.cx < 0 ? -1 : 1;
      const shift = worstOverlapX / 2;
      if (!a.fixed) a.cx -= sign * shift;
      if (!b.fixed) b.cx += sign * shift;
    } else {
      const sign = b.cy - a.cy < 0 ? -1 : 1;
      const shift = worstOverlapY / 2;
      if (!a.fixed) a.cy -= sign * shift;
      if (!b.fixed) b.cy += sign * shift;
    }
  }

  boxes.forEach((box) => {
    if (box.fixed) return;
    const minCx = bx + box.halfW;
    const maxCx = bx + bw - box.halfW;
    const minCy = by + box.halfH;
    const maxCy = by + bh - box.halfH;
    box.cx = minCx <= maxCx ? clamp(box.cx, minCx, maxCx) : bx + bw / 2;
    box.cy = minCy <= maxCy ? clamp(box.cy, minCy, maxCy) : by + bh / 2;
  });

  return boxes;
}

function drawLabel(
  doc: PDFKit.PDFDocument,
  font: string,
  size: number,
  text: string,
  cx: number,
  topY: number,
  innerW: number,
  color: string
): void {
  doc.save();
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(text || "—", cx - innerW / 2, topY, { width: innerW, align: "center", lineGap: 0 });
  doc.restore();
}

interface MindMapNodeBox {
  dims: BoxDims;
  label: string;
  cx: number;
  cy: number;
  isBranch: boolean;
  font: string;
  size: number;
}

export interface MindMapBoxLayout {
  central: { cx: number; cy: number; dims: BoxDims; label: string };
  nodes: MindMapNodeBox[];
}

/**
 * Mide todas las cajas del mapa con la fuente real (etiquetas ya truncadas)
 * y separa cualquier traslape (`resolveBoxOverlaps`) — sin dibujar nada.
 * Es la pieza que aísla "¿dónde y de qué tamaño queda cada caja?" para
 * poder verificarla directo (no hay overlap) con datos reales, sin tener
 * que rasterizar el PDF final — mismo espíritu que `mindMapLayout()` separa
 * la geometría pura del dibujo.
 */
export function layoutMindMapBoxes(
  doc: PDFKit.PDFDocument,
  layout: MindMapLayout,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: ReturnType<typeof registerCuadernoFonts>
): MindMapBoxLayout {
  const centralLabel = truncateLabel(layout.central.label || "Mapa conceptual", CENTRAL_MAX_CHARS);
  const centralDims = measureBox(doc, fonts.serif, CENTRAL_FONT, centralLabel, CENTRAL_MAX_W, CENTRAL_PAD);
  const centralCx = x + layout.central.x;
  const centralCy = y + layout.central.y;

  const nodeDims: MindMapNodeBox[] = layout.nodes.map((node) => {
    const isBranch = node.parent === -1;
    const font = isBranch ? fonts.sansBold : fonts.sans;
    const size = isBranch ? BRANCH_FONT : CHILD_FONT;
    const maxW = isBranch ? BRANCH_MAX_W : CHILD_MAX_W;
    const pad = isBranch ? BRANCH_PAD : CHILD_PAD;
    const label = truncateLabel(node.label, isBranch ? BRANCH_MAX_CHARS : CHILD_MAX_CHARS);
    const dims = measureBox(doc, font, size, label, maxW, pad);
    return {
      dims,
      label,
      cx: x + node.x,
      cy: y + node.y,
      isBranch,
      font,
      size,
    };
  });

  // Separar cualquier caja que todavía se traslape (determinista — ver
  // `resolveBoxOverlaps`). El central es el ancla, nunca se mueve.
  const centralBox: OverlapBox = {
    cx: centralCx,
    cy: centralCy,
    halfW: centralDims.w / 2,
    halfH: centralDims.h / 2,
    fixed: true,
  };
  const movableBoxes: OverlapBox[] = nodeDims.map((nd) => ({
    cx: nd.cx,
    cy: nd.cy,
    halfW: nd.dims.w / 2,
    halfH: nd.dims.h / 2,
  }));
  resolveBoxOverlaps([centralBox, ...movableBoxes], x, y, w, h);
  nodeDims.forEach((nd, i) => {
    nd.cx = movableBoxes[i].cx;
    nd.cy = movableBoxes[i].cy;
  });

  return { central: { cx: centralCx, cy: centralCy, dims: centralDims, label: centralLabel }, nodes: nodeDims };
}

/**
 * Devuelve `true` si algún par de cajas (incluido el central) de un
 * `MindMapBoxLayout` ya resuelto todavía se traslapa (AABB) — para que un
 * caller (o una prueba) pueda verificarlo directo sobre datos reales.
 */
export function hasBoxOverlap(layout: MindMapBoxLayout): boolean {
  const boxes = [
    { cx: layout.central.cx, cy: layout.central.cy, halfW: layout.central.dims.w / 2, halfH: layout.central.dims.h / 2 },
    ...layout.nodes.map((n) => ({ cx: n.cx, cy: n.cy, halfW: n.dims.w / 2, halfH: n.dims.h / 2 })),
  ];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapsX = Math.abs(b.cx - a.cx) < a.halfW + b.halfW;
      const overlapsY = Math.abs(b.cy - a.cy) < a.halfH + b.halfH;
      if (overlapsX && overlapsY) return true;
    }
  }
  return false;
}

/**
 * Dibuja el mapa conceptual dentro del área `(x,y,w,h)`. Devuelve `false`
 * (sin dibujar nada) cuando no hay ramas — datos insuficientes para una
 * figura con sentido; el llamador debe degradar a listar las ramas como
 * texto en vez de imprimir un recuadro vacío.
 */
export function drawMindMap(
  doc: PDFKit.PDFDocument,
  m: MindMap,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  if (!m || !Array.isArray(m.branches) || m.branches.length === 0) {
    return false;
  }

  const layout = mindMapLayout(m, w, h);
  if (layout.nodes.length === 0) return false;

  try {
    const fonts = registerCuadernoFonts(doc);
    const boxLayout = layoutMindMapBoxes(doc, layout, x, y, w, h, fonts);
    const { central: centralBoxLayout, nodes: nodeDims } = boxLayout;
    const centralLabel = centralBoxLayout.label;
    const centralDims = centralBoxLayout.dims;
    const centralCx = centralBoxLayout.cx;
    const centralCy = centralBoxLayout.cy;

    // Conectores — trayectoria suelta (leve curva) de la caja del
    // padre a la del nodo, recortada al borde de cada una. El sentido de la
    // curva alterna por índice (determinista, no al azar) para que no todas
    // se doblen para el mismo lado.
    layout.nodes.forEach((node, i) => {
      const child = nodeDims[i];
      const parent =
        node.parent === -1
          ? { cx: centralCx, cy: centralCy, dims: centralDims }
          : nodeDims[node.parent];

      const a = edgePoint(parent.cx, parent.cy, child.cx, child.cy, parent.dims.w / 2, parent.dims.h / 2);
      const b = edgePoint(child.cx, child.cy, parent.cx, parent.cy, child.dims.w / 2, child.dims.h / 2);
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      const bendSign = i % 2 === 0 ? 1 : -1;
      const bend = bendSign * clamp(segLen * 0.12, 4, 14);
      dashedTrajectory(doc, a.x, a.y, b.x, b.y, node.color, { bend, opacity: 0.6 });
    });

    // Cajas y texto encima de los conectores.
    doc.save();
    doc.roundedRect(
      centralCx - centralDims.w / 2,
      centralCy - centralDims.h / 2,
      centralDims.w,
      centralDims.h,
      CENTRAL_RADIUS
    ).fill(CUADERNO.INK);
    doc.restore();
    drawLabel(
      doc,
      fonts.serif,
      CENTRAL_FONT,
      centralLabel,
      centralCx,
      centralCy - centralDims.labelH / 2,
      centralDims.innerW,
      "#ffffff"
    );

    layout.nodes.forEach((node, i) => {
      const { dims, label, cx, cy, isBranch, font, size } = nodeDims[i];
      const boxX = cx - dims.w / 2;
      const boxY = cy - dims.h / 2;

      if (isBranch) {
        accentCard(doc, boxX, boxY, dims.w, dims.h, node.color, node.color);
        drawLabel(doc, font, size, label, cx, cy - dims.labelH / 2, dims.innerW, "#ffffff");
      } else {
        accentCard(doc, boxX, boxY, dims.w, dims.h, node.color);
        drawLabel(doc, font, size, label, cx, cy - dims.labelH / 2, dims.innerW, CUADERNO.INK);
      }
    });

    return true;
  } catch (err) {
    // Cero degradación silenciosa a medias: se registra el fallo y se omite
    // la figura por completo; el llamador decide el respaldo en texto.
    console.error("[cuaderno/mindmap] Fallo al dibujar el mapa conceptual; se omite la figura.", err);
    return false;
  }
}
