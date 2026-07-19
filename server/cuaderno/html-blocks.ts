/**
 * Traductor puro de `lectureHtml` (HTML de las lecciones, generado por LLM)
 * a una lista de bloques imprimibles. Sin pdfkit, sin I/O.
 *
 * Estrategia: `sanitize-html` (ya es dependencia del repo) se encarga de la
 * parte realmente peligrosa — HTML mal formado, entidades, etiquetas
 * desconocidas — y garantiza como salida un HTML bien anidado, sólo con las
 * etiquetas que nos interesan y sin atributos. A partir de ese HTML, ya
 * confiable, un tokenizer propio y minúsculo arma el árbol de bloques.
 *
 * No se usa una librería de DOM (jsdom, linkedom, etc.) porque sería una
 * dependencia pesada para un problema que, una vez sanitize-html normaliza
 * la entrada, se reduce a caminar una lista de etiquetas conocidas y sin
 * atributos — algo que un tokenizer de ~40 líneas resuelve sin riesgo.
 */
import sanitizeHtml from "sanitize-html";

export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; runs: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
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
];

const BOLD_TAGS = new Set(["strong", "b"]);
const ITALIC_TAGS = new Set(["em", "i"]);

// ---- Árbol mínimo ----------------------------------------------------

type TextNode = { type: "text"; text: string };
type ElementNode = { type: "element"; tag: string; children: AnyNode[] };
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
 * Tokenizer defensivo: espera HTML ya normalizado por sanitize-html (sin
 * atributos, sólo etiquetas conocidas), pero nunca lanza aunque la entrada
 * no cumpla esa expectativa — cualquier etiqueta de cierre huérfana o sin
 * cerrar simplemente se ignora o se cierra al final.
 */
function parseNodes(html: string): AnyNode[] {
  const root: AnyNode[] = [];
  const stack: ElementNode[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\s*\/?>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const currentChildren = () => (stack.length ? stack[stack.length - 1].children : root);

  while ((match = tagRe.exec(html)) !== null) {
    const full = match[0];
    const tagName = match[1].toLowerCase();

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
    } else {
      const node: ElementNode = { type: "element", tag: tagName, children: [] };
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

function inlineRuns(children: AnyNode[]): Inline[] {
  const runs: Inline[] = [];
  for (const child of children) {
    if (child.type === "text") {
      if (child.text.length === 0) continue;
      runs.push({ text: child.text });
      continue;
    }
    const text = textContent(child);
    if (text.length === 0) continue;
    if (BOLD_TAGS.has(child.tag)) {
      runs.push({ text, bold: true });
    } else if (ITALIC_TAGS.has(child.tag)) {
      runs.push({ text, italic: true });
    } else {
      // Etiqueta inline desconocida (no debería llegar aquí tras sanitize-html):
      // se conserva el texto plano, nunca se pierde.
      runs.push({ text });
    }
  }
  return runs;
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
      headers = firstCells.map((c) => textContent(c).trim());
      dataRows = trs.slice(1);
    }
  }

  const rows = dataRows.map((tr) =>
    tr.children
      .filter((n): n is ElementNode => n.type === "element" && (n.tag === "td" || n.tag === "th"))
      .map((cell) => textContent(cell).trim())
  );

  return { kind: "table", headers, rows };
}

function blockFromElement(node: ElementNode): Block | null {
  switch (node.tag) {
    case "h2":
      return { kind: "heading", level: 2, text: textContent(node).trim() };
    case "h3":
      return { kind: "heading", level: 3, text: textContent(node).trim() };
    case "p":
      return { kind: "paragraph", runs: inlineRuns(node.children) };
    case "ul":
      return {
        kind: "list",
        ordered: false,
        items: elementsOf(node.children, "li").map((li) => inlineRuns(li.children)),
      };
    case "ol":
      return {
        kind: "list",
        ordered: true,
        items: elementsOf(node.children, "li").map((li) => inlineRuns(li.children)),
      };
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
      allowedAttributes: {},
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
