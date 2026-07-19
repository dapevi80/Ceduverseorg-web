/**
 * Traductor puro de `lectureHtml` (HTML de las lecciones, generado por LLM)
 * a una lista de bloques imprimibles. Sin pdfkit, sin I/O.
 *
 * Estrategia: `sanitize-html` (ya es dependencia del repo) se encarga de la
 * parte realmente peligrosa — HTML mal formado, entidades, etiquetas
 * desconocidas — y garantiza como salida un HTML bien anidado, sólo con las
 * etiquetas que nos interesan y prácticamente sin atributos (la única
 * excepción es `colspan` en `th`/`td`, necesario para no romper la
 * alineación de tablas con celdas combinadas). A partir de ese HTML, ya
 * confiable, un tokenizer propio y minúsculo arma el árbol de bloques.
 *
 * No se usa una librería de DOM (jsdom, linkedom, etc.) porque sería una
 * dependencia pesada para un problema que, una vez sanitize-html normaliza
 * la entrada, se reduce a caminar una lista de etiquetas conocidas y sin
 * atributos — algo que un tokenizer de ~40 líneas resuelve sin riesgo.
 */
import sanitizeHtml from "sanitize-html";

export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type ListItem = { runs: Inline[]; level: number }; // level 0 = top level
export type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; runs: Inline[] }
  | { kind: "list"; ordered: boolean; items: ListItem[] }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "quote"; runs: Inline[] };

const ALLOWED_TAGS = [
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "blockquote",
  "strong",
  "em",
  "b",
  "i",
  "br",
];

const BOLD_TAGS = new Set(["strong", "b"]);
const ITALIC_TAGS = new Set(["em", "i"]);

// ---- Árbol mínimo ----------------------------------------------------

type TextNode = { type: "text"; text: string };
type ElementNode = { type: "element"; tag: string; children: AnyNode[]; colspan?: number };
type AnyNode = TextNode | ElementNode;

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return "";
      }
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ");
}

/**
 * Extrae `colspan` de la porción de atributos ya recortada por el tokenizer
 * (todo lo que sanitize-html dejó pasar entre el nombre de la etiqueta y el
 * `>`). Cualquier valor ausente, no numérico o menor a 1 se ignora (equivale
 * a colspan=1); valores absurdamente grandes se acotan para no generar
 * arreglos patológicos a partir de HTML malicioso.
 */
function parseColspan(attrs: string): number | undefined {
  const m = /colspan\s*=\s*"?(\d+)"?/i.exec(attrs);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(n, 100);
}

/**
 * Tokenizer defensivo: espera HTML ya normalizado por sanitize-html (sólo
 * etiquetas conocidas, y sin atributos salvo `colspan` en `th`/`td`), pero
 * nunca lanza aunque la entrada no cumpla esa expectativa — cualquier
 * etiqueta de cierre huérfana o sin cerrar simplemente se ignora o se cierra
 * al final. `<br>` no se modela como elemento: se traduce de inmediato a un
 * salto de línea de texto para que las palabras a los lados nunca se fusionen.
 */
function parseNodes(html: string): AnyNode[] {
  const root: AnyNode[] = [];
  const stack: ElementNode[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const currentChildren = () => (stack.length ? stack[stack.length - 1].children : root);

  while ((match = tagRe.exec(html)) !== null) {
    const full = match[0];
    const tagName = match[1].toLowerCase();
    const attrs = match[2];

    const textBefore = html.slice(lastIndex, match.index);
    if (textBefore) {
      currentChildren().push({ type: "text", text: normalizeWhitespace(decodeEntities(textBefore)) });
    }

    const isClosing = full.charAt(1) === "/";
    const isSelfClosing = full.endsWith("/>");

    if (isClosing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tagName) {
          stack.length = i;
          break;
        }
      }
    } else if (tagName === "br") {
      // Línea nueva, nunca una etiqueta que desaparezca en silencio.
      currentChildren().push({ type: "text", text: "\n" });
    } else {
      const node: ElementNode = { type: "element", tag: tagName, children: [] };
      if (tagName === "th" || tagName === "td") {
        const span = parseColspan(attrs);
        if (span !== undefined) node.colspan = span;
      }
      currentChildren().push(node);
      if (!isSelfClosing) stack.push(node);
    }

    lastIndex = tagRe.lastIndex;
  }

  const rest = html.slice(lastIndex);
  if (rest) currentChildren().push({ type: "text", text: normalizeWhitespace(decodeEntities(rest)) });

  return root;
}

// ---- Árbol -> bloques --------------------------------------------------

function textContent(node: AnyNode): string {
  if (node.type === "text") return node.text;
  return node.children.map(textContent).join("");
}

function elementsOf(nodes: AnyNode[], tag: string): ElementNode[] {
  return nodes.filter((n): n is ElementNode => n.type === "element" && n.tag === tag);
}

/** Busca recursivamente todos los descendientes con la etiqueta dada, en orden de documento. */
function findAllDeep(node: AnyNode, tag: string, out: ElementNode[] = []): ElementNode[] {
  if (node.type === "element") {
    if (node.tag === tag) out.push(node);
    for (const child of node.children) findAllDeep(child, tag, out);
  }
  return out;
}

/**
 * Recorre recursivamente para que negrita/cursiva se combinen por OR en vez
 * de que la más interna gane sola: `<strong>bold <em>emph</em></strong>`
 * debe producir un run con bold+italic para "emph", no perder el italic.
 */
function collectInlineRuns(node: AnyNode, bold: boolean, italic: boolean, out: Inline[]): void {
  if (node.type === "text") {
    if (node.text.length === 0) return;
    const run: Inline = { text: node.text };
    if (bold) run.bold = true;
    if (italic) run.italic = true;
    out.push(run);
    return;
  }
  // Etiqueta inline desconocida (no debería llegar aquí tras sanitize-html):
  // se sigue bajando sin agregar flags, el texto nunca se pierde.
  const nextBold = bold || BOLD_TAGS.has(node.tag);
  const nextItalic = italic || ITALIC_TAGS.has(node.tag);
  for (const child of node.children) {
    collectInlineRuns(child, nextBold, nextItalic, out);
  }
}

function inlineRuns(children: AnyNode[]): Inline[] {
  const runs: Inline[] = [];
  for (const child of children) {
    collectInlineRuns(child, false, false, runs);
  }
  return runs;
}

/** Expande cada celda según su `colspan` repitiendo la etiqueta, para que una
 * celda combinada ocupe tantas posiciones como columnas cubre en vez de
 * desalinear el resto de la fila. */
function expandRow(cells: ElementNode[]): string[] {
  const out: string[] = [];
  for (const cell of cells) {
    const label = textContent(cell).trim();
    const span = cell.colspan && cell.colspan > 1 ? cell.colspan : 1;
    for (let i = 0; i < span; i++) out.push(label);
  }
  return out;
}

function padTo(row: string[], len: number): string[] {
  if (row.length >= len) return row;
  return [...row, ...Array(len - row.length).fill("")];
}

function buildTable(table: ElementNode): Block {
  const trs = findAllDeep(table, "tr");
  let headers: string[] = [];
  let dataRows = trs;

  if (trs.length > 0) {
    const firstCells = trs[0].children.filter(
      (n): n is ElementNode => n.type === "element" && (n.tag === "th" || n.tag === "td")
    );
    const hasHeaderRow = firstCells.length > 0 && firstCells.every((c) => c.tag === "th");
    if (hasHeaderRow) {
      headers = expandRow(firstCells);
      dataRows = trs.slice(1);
    }
  }

  const rows = dataRows.map((tr) =>
    expandRow(
      tr.children.filter((n): n is ElementNode => n.type === "element" && (n.tag === "td" || n.tag === "th"))
    )
  );

  // Invariante: headers.length === 0 || headers.length === max(row.length).
  // No se fabrica un encabezado que no existía (headers=[] se respeta tal
  // cual), pero si sí existe se rellena — junto con las filas — hasta el
  // ancho real más grande de la tabla, para que un consumidor pueda hacer
  // zip(headers[i], row[i]) sin desalinearse por un colspan o una fila corta.
  const maxRowLen = rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (headers.length > 0) {
    const width = Math.max(headers.length, maxRowLen);
    headers = padTo(headers, width);
    for (let i = 0; i < rows.length; i++) rows[i] = padTo(rows[i], width);
  } else if (maxRowLen > 0) {
    for (let i = 0; i < rows.length; i++) rows[i] = padTo(rows[i], maxRowLen);
  }

  return { kind: "table", headers, rows };
}

/**
 * Aplana una lista (posiblemente anidada) a `ListItem[]` conservando la
 * profundidad. Una `<ul>`/`<ol>` anidada dentro de un `<li>` no genera un
 * bloque de lista aparte: sus items se agregan al mismo arreglo con
 * `level` incrementado (aplanado-con-profundidad, no árbol).
 */
function collectListItems(container: ElementNode, level: number, out: ListItem[]): void {
  for (const li of elementsOf(container.children, "li")) {
    const inlineChildren: AnyNode[] = [];
    const nestedLists: ElementNode[] = [];
    for (const child of li.children) {
      if (child.type === "element" && (child.tag === "ul" || child.tag === "ol")) {
        nestedLists.push(child);
      } else {
        inlineChildren.push(child);
      }
    }
    out.push({ runs: inlineRuns(inlineChildren), level });
    for (const nested of nestedLists) {
      collectListItems(nested, level + 1, out);
    }
  }
}

function blockFromElement(node: ElementNode): Block | null {
  switch (node.tag) {
    case "h2":
      return { kind: "heading", level: 2, text: textContent(node).trim() };
    case "h3":
      return { kind: "heading", level: 3, text: textContent(node).trim() };
    case "p":
      return { kind: "paragraph", runs: inlineRuns(node.children) };
    case "ul": {
      const items: ListItem[] = [];
      collectListItems(node, 0, items);
      return { kind: "list", ordered: false, items };
    }
    case "ol": {
      const items: ListItem[] = [];
      collectListItems(node, 0, items);
      return { kind: "list", ordered: true, items };
    }
    case "table":
      return buildTable(node);
    case "blockquote":
      return { kind: "quote", runs: inlineRuns(node.children) };
    default:
      return null;
  }
}

/**
 * Convierte HTML (típicamente `generated_content.lectureHtml`) en una lista
 * de bloques imprimibles. Pura: no depende de pdfkit ni hace I/O. Nunca
 * lanza — HTML mal formado degrada a lo que se pueda rescatar, nunca revienta
 * el render del cuaderno.
 */
export function htmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return [];

  try {
    const clean = sanitizeHtml(html, {
      allowedTags: ALLOWED_TAGS,
      // Único atributo permitido en toda la superficie: colspan en th/td,
      // indispensable para no desalinear encabezados y filas (finding 3).
      allowedAttributes: { th: ["colspan"], td: ["colspan"] },
      disallowedTagsMode: "discard",
    });

    const nodes = parseNodes(clean);
    const blocks: Block[] = [];

    for (const node of nodes) {
      if (node.type === "text") {
        const text = node.text.trim();
        if (text) blocks.push({ kind: "paragraph", runs: [{ text }] });
        continue;
      }
      const block = blockFromElement(node);
      if (block) blocks.push(block);
    }

    return blocks;
  } catch {
    // Defensa final: cualquier entrada verdaderamente patológica degrada a
    // "sin bloques" en vez de romper el resto del cuaderno.
    return [];
  }
}
