# Cuaderno de estudio (rediseño del PDF) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Convertir el PDF del playbook —hoy un resumen con QR— en un **cuaderno de estudio imprimible** con el curso completo, módulo por módulo, con espacio para escribir a mano y el lenguaje visual real de Ceduverse.

**Architecture:** Un componedor (`server/cuaderno/`) que junta datos ya existentes (nada de llamadas nuevas a IA) y los dibuja con pdfkit. La pieza de riesgo —traducir el `lectureHtml` a bloques imprimibles— se aísla en un módulo **puro y probado**, separado del dibujo.

**Tech Stack:** TypeScript, pdfkit (ya en uso), `qrcode` (ya en uso), `@fontsource/dm-serif-display` y `@fontsource/plus-jakarta-sans` (nuevos, sólo por sus TTF), Drizzle/Postgres, vitest.

**Spec:** `docs/superpowers/specs/2026-07-18-cuaderno-estudio-design.md` — léelo antes de empezar.

## Global Constraints

- **El cuaderno es material de estudio.** La actividad con QR es OPCIONAL y va al margen, en chico. Nunca organiza la página ni ocupa página propia.
- **Cero invención:** las referencias se imprimen verbatim de `studio_modules.references`. El renderizador no agrega, completa ni reformula fuentes.
- **Cero degradación silenciosa:** un módulo sin contenido personalizado se imprime con el contenido base **y su aviso explícito**; jamás se presenta base como personalizado. Un fallo de dibujo omite la figura y degrada a texto, nunca deja un recuadro vacío.
- **Sin llamadas a IA.** Todo el contenido ya existe en la base; esto es sólo render.
- **Tipografía de marca obligatoria:** DM Serif Display (títulos) y Plus Jakarta Sans (texto), incrustadas con `doc.registerFont()`. Helvetica sólo como respaldo si el archivo de fuente falta.
- **Paleta exacta:** `INK #1a1a2e`, `INK_MUTED #7a7a99`, `CREAM #faf8f4`, `BLUE #1b5adf`, `ORANGE #f28023`, `VIOLET #7c3aed`, `GREEN #00b87a`.
- **Página:** LETTER. Márgenes 54pt sup/inf/izq y **170pt derecho** (columna de notas ~110pt con renglones al 8%).
- **Paginación:** ningún bloque se parte a la mitad; reusar el patrón `ensureSpace()` de `server/kit-pdf.ts`.
- Todo el texto visible al usuario, en español de México.

---

### Task 1: Fuentes de marca incrustadas

**Files:**
- Modify: `package.json` (dos dependencias)
- Create: `server/cuaderno/fonts.ts`
- Test: `server/cuaderno/fonts.test.ts`

**Interfaces:**
- Produce: `registerCuadernoFonts(doc: PDFKit.PDFDocument): { serif: string; sans: string; sansBold: string; serifItalic: string }` — registra y devuelve los NOMBRES a usar en `doc.font(...)`. Si un TTF no existe, devuelve los equivalentes Helvetica y lo registra en consola (respaldo honesto, no silencioso).
- Produce: `FONT_FILES` — rutas resueltas de los TTF dentro de `node_modules/@fontsource/...`.

- [ ] **Step 1: Instalar las fuentes**

```bash
npm install @fontsource/dm-serif-display @fontsource/plus-jakarta-sans
```

- [ ] **Step 2: Localizar los TTF**

Los paquetes traen `files/*.ttf`. Confirma las rutas exactas antes de escribir el módulo:

```bash
ls node_modules/@fontsource/dm-serif-display/files | grep -i "latin-400" | head
ls node_modules/@fontsource/plus-jakarta-sans/files | grep -i "latin-" | head
```

Usa las variantes **latin** `normal 400` (serif), `italic 400` (serif), `normal 400` y `normal 700` (sans).

- [ ] **Step 3: Escribir el test**

`server/cuaderno/fonts.test.ts`: que `FONT_FILES` apunte a archivos que **existen** (`fs.existsSync`), y que `registerCuadernoFonts` sobre un `PDFDocument` real devuelva nombres no vacíos y no lance.

- [ ] **Step 4: Implementar y correr**

`npx vitest run server/cuaderno/fonts.test.ts` → pasa. `npx tsc --noEmit` limpio.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json server/cuaderno/fonts.ts server/cuaderno/fonts.test.ts
git commit -m "feat(cuaderno): incrustar DM Serif Display y Plus Jakarta Sans"
```

---

### Task 2: `lectureHtml` → bloques imprimibles (puro, TDD)

Esta es la pieza de riesgo. **Nada de pdfkit aquí**: sólo transformar HTML en una estructura que el dibujante entienda.

**Files:**
- Create: `server/cuaderno/html-blocks.ts`
- Test: `server/cuaderno/html-blocks.test.ts`

**Interfaces:**
- Produce:
```ts
export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; runs: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "quote"; runs: Inline[] };
export function htmlToBlocks(html: string): Block[];
```

Usa el `sanitize-html` que ya está en el repo para normalizar antes de parsear, o un parser ligero; **no** agregues una dependencia pesada de DOM sin justificarlo en el reporte.

- [ ] **Step 1: Escribir los tests primero**

Casos obligatorios en `server/cuaderno/html-blocks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { htmlToBlocks } from "./html-blocks";

describe("htmlToBlocks", () => {
  it("vacío -> sin bloques", () => {
    expect(htmlToBlocks("")).toEqual([]);
  });

  it("h2 y h3 conservan su nivel", () => {
    const b = htmlToBlocks("<h2>Uno</h2><h3>Dos</h3>");
    expect(b).toEqual([
      { kind: "heading", level: 2, text: "Uno" },
      { kind: "heading", level: 3, text: "Dos" },
    ]);
  });

  it("párrafo con negrita y cursiva se parte en runs", () => {
    const b = htmlToBlocks("<p>Hola <strong>mundo</strong> y <em>algo</em></p>");
    expect(b[0]).toMatchObject({ kind: "paragraph" });
    const runs = (b[0] as any).runs;
    expect(runs.map((r: any) => r.text.trim()).filter(Boolean)).toEqual(["Hola", "mundo", "y", "algo"]);
    expect(runs.find((r: any) => r.text.includes("mundo")).bold).toBe(true);
    expect(runs.find((r: any) => r.text.includes("algo")).italic).toBe(true);
  });

  it("lista desordenada y ordenada", () => {
    expect(htmlToBlocks("<ul><li>a</li><li>b</li></ul>")[0]).toMatchObject({ kind: "list", ordered: false });
    expect(htmlToBlocks("<ol><li>a</li></ol>")[0]).toMatchObject({ kind: "list", ordered: true });
  });

  it("tabla con encabezados y filas", () => {
    const b = htmlToBlocks("<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>");
    expect(b[0]).toEqual({ kind: "table", headers: ["A", "B"], rows: [["1", "2"]] });
  });

  it("tabla sin th: la primera fila NO se asume encabezado", () => {
    const b = htmlToBlocks("<table><tr><td>1</td><td>2</td></tr></table>") as any;
    expect(b[0].headers).toEqual([]);
    expect(b[0].rows).toEqual([["1", "2"]]);
  });

  it("blockquote", () => {
    expect(htmlToBlocks("<blockquote>cita</blockquote>")[0]).toMatchObject({ kind: "quote" });
  });

  it("etiquetas desconocidas no pierden su texto", () => {
    const b = htmlToBlocks("<section><p>visible</p></section>");
    expect(JSON.stringify(b)).toContain("visible");
  });

  it("entidades HTML se decodifican", () => {
    const b = htmlToBlocks("<p>caf&eacute; &amp; m&aacute;s</p>") as any;
    expect(b[0].runs.map((r: any) => r.text).join("")).toContain("café & más");
  });

  it("HTML roto no lanza", () => {
    expect(() => htmlToBlocks("<p>sin cerrar <strong>nada")).not.toThrow();
  });
});
```

- [ ] **Step 2: Correr y ver fallar** — `npx vitest run server/cuaderno/html-blocks.test.ts`
- [ ] **Step 3: Implementar hasta pasar**
- [ ] **Step 4: Commit** — `git commit -m "feat(cuaderno): traductor puro de lectureHtml a bloques"`

---

### Task 3: Primitivas visuales de marca

**Files:**
- Create: `server/cuaderno/visuals.ts`

**Interfaces:**
```ts
export const CUADERNO = { INK:"#1a1a2e", INK_MUTED:"#7a7a99", CREAM:"#faf8f4",
  BLUE:"#1b5adf", ORANGE:"#f28023", VIOLET:"#7c3aed", GREEN:"#00b87a" };
export const MODULE_COLORS: string[]; // [BLUE, ORANGE, VIOLET, GREEN]
export function dotGrid(doc, x, y, w, h, color?): void;      // puntos 1px cada 28pt, opacidad 0.07
export function hexOutline(doc, cx, cy, r, color): void;      // trazo 1.5, opacidad 0.3
export function dashedConnector(doc, x1, y1, x2, y2, color): void; // dash 6/4 + punta de flecha
export function ghostNumeral(doc, n: number, x, y, size, font: string): void; // serif, opacidad 0.04
export function accentCard(doc, x, y, w, h, color, fill?): void;   // esquina redondeada + borde capilar + barra de acento
export function noteRules(doc, x, y, w, lines: number, gap?: number): void; // renglones al 8%
```

Reusa las convenciones de `server/kit-pdf.ts` (mismos grosores, mismo estilo de punta de flecha en `drawFlow()`).

- [ ] **Step 1: Implementar** siguiendo §4.3 del spec.
- [ ] **Step 2: Verificación visual** — script desechable que dibuje cada primitiva en una página; confirma `%PDF` y revisa el archivo. Bórralo, no lo commitees.
- [ ] **Step 3: `npx tsc --noEmit`** limpio.
- [ ] **Step 4: Commit** — `git commit -m "feat(cuaderno): primitivas visuales de marca"`

---

### Task 4: Dibujante de bloques (con paginación)

**Files:**
- Create: `server/cuaderno/draw-blocks.ts`

**Interfaces:**
- Consume: `Block` (Task 2), `visuals.ts` (Task 3), fuentes (Task 1).
- Produce: `drawBlocks(doc, blocks: Block[], opts: { x: number; width: number; accent: string; ensureSpace(h: number): void }): void`

Reglas:
- `heading` nivel 2 → serif 15pt; nivel 3 → serif 12.5pt; ambos con `ensureSpace` para no quedar huérfanos al pie.
- `paragraph` → sans 10.5pt, interlínea 3, runs con bold/italic.
- `list` → viñeta circular del color de acento (o número), sangría 14pt.
- `table` → encabezado con banda tintada del acento, filas con línea capilar, ancho repartido; una tabla que no cabe **empieza en página nueva**; si aun así no cabe, se parte por filas repitiendo el encabezado.
- `quote` → caja con barra de acento a la izquierda.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Prueba de humo** con un `lectureHtml` real de la base (2,500 palabras con tabla): renderiza, confirma `%PDF`, revisa que no haya bloques partidos ni páginas en blanco. Script desechable, no se commitea.
- [ ] **Step 3: Commit** — `git commit -m "feat(cuaderno): dibujante de bloques con paginación"`

---

### Task 5: Mapa conceptual dibujado

**Files:**
- Create: `server/cuaderno/mindmap.ts`
- Test: `server/cuaderno/mindmap.test.ts`

**Interfaces:**
```ts
export interface MindMap { central: string;
  branches: { label: string; color?: string; children: { label: string; detail?: string }[] }[] }
export function mindMapLayout(m: MindMap, w: number, h: number): {
  central: { x:number; y:number; label:string };
  nodes: { x:number; y:number; label:string; color:string; detail?:string; parent:number }[];
}; // PURO, testeable
export function drawMindMap(doc, m: MindMap, x, y, w, h): boolean; // false si no hay datos suficientes
```

- [ ] **Step 1: Tests del layout (puro):** nodo central al centro; ramas repartidas sin solaparse; `color` ausente → toma de `MODULE_COLORS` por índice; `detail` ausente → no rompe; 0 ramas → layout vacío y `drawMindMap` devuelve `false`.
- [ ] **Step 2: Implementar layout, ver pasar.**
- [ ] **Step 3: Implementar el dibujo** con `dashedConnector` + cajas redondeadas.
- [ ] **Step 4: Commit** — `git commit -m "feat(cuaderno): mapa conceptual dibujado desde mindMap"`

---

### Task 6: Elementos para escribir a mano

**Files:**
- Create: `server/cuaderno/writables.ts`

**Interfaces:**
```ts
export function reflectionBlock(doc, question: string, x, y, w, lines?: number): number; // devuelve alto usado
export function fillInTable(doc, headers: string[], rows: number, x, y, w): number;
export function quizBlock(doc, q: { question:string; options:string[] }, index: number, x, y, w): number;
export function notesPage(doc, title: string): void;
```

Reglas: renglones de 22pt, al 8% de opacidad; el `quizBlock` imprime opciones con casilla `☐` y **no** revela la respuesta.

- [ ] **Step 1: Implementar.** **Step 2:** humo visual desechable. **Step 3:** tsc limpio.
- [ ] **Step 4: Commit** — `git commit -m "feat(cuaderno): reflexiones, formatos y autoevaluación para llenar"`

---

### Task 7: Reunir los datos del cuaderno

**Files:**
- Create: `server/cuaderno/gather.ts`
- Test: `server/cuaderno/gather.test.ts`

**Interfaces:**
```ts
export interface ModuloCuaderno {
  index: number; title: string; description?: string;
  lectureHtml: string;             // personalizado o base
  personalizado: boolean;          // ← manda el aviso del §6.3
  mindMap?: MindMap;
  reflections: string[];
  quiz: { question:string; options:string[]; correctIndex:number; explanation:string }[];
  references: string[];            // verbatim
  suggestedSources: { title:string; url:string; type:string }[];
}
export interface DatosCuaderno {
  course: { slug:string; title:string; icon:string|null; instructor:string|null };
  alumno: { nombre:string };
  guiaEstudio?: { objetivos:string[]; resumen:string[]; estrategias:string[]; preguntas:string[] };
  ejercicios: { index:number; title:string; instruction:string }[];
  modulos: ModuloCuaderno[];
}
export function gatherCuaderno(userId: string, courseSlug: string): Promise<DatosCuaderno>;
```

Reglas: por cada módulo, si hay `generated_content` **de ese usuario** con `lectureHtml` y sin `isStub`, se usa y `personalizado = true`; si no, `studio_modules.contentHtml` y `personalizado = false`. `references` SIEMPRE de `studio_modules` (verbatim). Sin `course_playbooks` → `guiaEstudio` y `ejercicios` vacíos, el cuaderno se arma igual.

- [ ] **Step 1: Extraer la decisión a una función pura y testearla:**
```ts
export function pickModuleContent(
  generated: { lectureHtml: string|null; isStub: boolean|null } | undefined,
  baseHtml: string,
): { lectureHtml: string; personalizado: boolean };
```
Casos: sin fila → base/false; fila con `isStub:true` → base/false; fila con `lectureHtml` vacío → base/false; fila buena → personalizado/true.
- [ ] **Step 2: Implementar `gatherCuaderno`** (I/O) usando esa función.
- [ ] **Step 3: Commit** — `git commit -m "feat(cuaderno): reunir contenido por módulo con respaldo marcado"`

---

### Task 8: Componer el cuaderno

**Files:**
- Create: `server/cuaderno/render.ts`

**Interfaces:**
- Produce: `renderCuadernoPdf(datos: DatosCuaderno): Promise<Buffer>`

Estructura exacta del §6 del spec: portada (retícula de puntos, ícono, título, alumno, instructor, fecha) → "Cómo usar este cuaderno" (incluye que las actividades con QR son **opcionales** y dan logros) → índice con páginas (`bufferPages: true`) → guía de estudio → **un capítulo por módulo** (portadilla con numeral fantasma → clase con margen de notas → mapa conceptual → conceptos clave → reflexiones con renglones → formato para llenar → autoevaluación → actividad opcional al margen con su QR → referencias del módulo) → respuestas de autoevaluación → referencias consolidadas → páginas de notas.

Los módulos con `personalizado === false` llevan el aviso textual del §6.3.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Humo con un curso real** (script desechable + `.env.seed.txt`): confirma `%PDF`, cuenta páginas, revisa el archivo a ojo.
- [ ] **Step 3: Commit** — `git commit -m "feat(cuaderno): componer el cuaderno completo"`

---

### Task 9: Conectar la descarga

**Files:**
- Modify: `server/routes/playbook.ts` (la ruta `export.pdf`)
- Modify: `client/src/pages/studio-course.tsx` (texto del botón)

**Interfaces:** `GET /api/playbook/:slug/export.pdf` (ya con `requireAuth`) pasa a usar `gatherCuaderno(userId, slug)` + `renderCuadernoPdf`. Nombre de archivo: `cuaderno-<slug>.pdf`.

- [ ] **Step 1:** cambiar la ruta; conservar `requireAuth` y el manejo honesto de errores.
- [ ] **Step 2:** en el cliente, el botón dice **"Descargar cuaderno"**.
- [ ] **Step 3:** `npx tsc --noEmit` + `npx vitest run server/ shared/ client/src/lib/`.
- [ ] **Step 4: Commit** — `git commit -m "feat(cuaderno): la descarga entrega el cuaderno de estudio"`

---

### Task 10: Verificación final con datos reales

**Files:** ninguno (verificación).

- [ ] **Step 1:** generar el cuaderno de un curso **con módulos tomados** y otro **sin tomar**, y comparar: el segundo debe traer los avisos.
- [ ] **Step 2:** revisar a ojo: sin páginas en blanco, sin bloques partidos, tablas legibles, mapa conceptual dibujado, renglones utilizables, QR al margen.
- [ ] **Step 3:** confirmar que el PDF incrusta DM Serif Display y Plus Jakarta Sans (propiedades del archivo).
- [ ] **Step 4:** confirmar que las referencias impresas coinciden verbatim con `studio_modules.references`.
- [ ] **Step 5:** reportar hallazgos; NO commitear scripts de verificación.
