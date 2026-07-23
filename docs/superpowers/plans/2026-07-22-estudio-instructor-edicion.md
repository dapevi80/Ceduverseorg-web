# Estudio del instructor — edición de cursos propios · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el instructor pueda editar sus cursos propios — texto de cada módulo, frases destacadas, videos de YouTube y una bibliografía cuyas referencias él confirma — sobre `instructor_courses`.

**Architecture:** Los módulos salen del `jsonb` de `instructor_courses.modules` y se normalizan en tres tablas nuevas. La lógica con reglas (IDs de YouTube, marcas de cita, regla de publicación) vive en módulos puros bajo `server/lib/` con tests, siguiendo el patrón ya usado en `server/lib/risk-status.ts` y `server/lib/norm-validate.ts`. Los endpoints van en un archivo propio `server/routes/instructor-cursos.ts` y el editor en `client/src/pages/instructor-curso-editor.tsx`, para no engordar más `server/routes.ts` ni `client/src/pages/instructor-dashboard.tsx`.

**Tech Stack:** Express + Drizzle ORM + PostgreSQL (Supabase) · React 19 + wouter + TanStack Query · vitest · zod · sanitize-html

**Spec:** `docs/superpowers/specs/2026-07-22-estudio-instructor-edicion-design.md`

## Global Constraints

- **Alcance: sólo `instructor_courses`.** No tocar `courses`/`course_modules` (Aula Virtual, DC-3 con programa registrado ante STPS) ni `studio_courses`/`studio_modules` (Tutor IA).
- **Ninguna referencia se crea automáticamente.** `generated_content.suggested_sources` no alimenta esta bibliografía en ningún punto.
- **Un curso no se publica con referencias sin verificar.**
- **Pertenencia siempre por base de datos**, nunca por parámetro del cliente. Curso ajeno → **404**, no 403 (patrón ya usado en `server/routes.ts:720`).
- **`content_html` se sanitiza en el servidor** antes de guardar. Usar `sanitize-html` (ya en `package.json`).
- Migraciones: `CREATE TABLE IF NOT EXISTS` **seguido de `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` por cada columna**. Las migraciones de este repo **no corren solas en el deploy**: se aplican a mano en el editor SQL de Supabase y no se dan por aplicadas sin pegar su verificación.
- **No dropear `instructor_courses.modules`** en este trabajo.
- Comandos: `npx vitest run <ruta>` para tests, `npx tsc --noEmit` para tipos.
- Base de producción para verificar: `npx tsx --env-file=.env.seed.txt <script>` (la variable es `DB_URL`, no `DATABASE_URL`).
- **No commitear scripts de verificación.** Usar `/tmp/` del repo, que está en `.gitignore`.

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `migrations/2026-07-22_instructor_course_editor.sql` | Las tres tablas nuevas |
| `shared/schema.ts` | Declaración Drizzle + tipos exportados |
| `server/lib/youtube-id.ts` | Normalizar cualquier forma de URL de YouTube a un ID |
| `server/lib/course-citations.ts` | Extraer y validar marcas `[[ref:uuid]]` |
| `server/lib/course-publish.ts` | Regla de publicación con referencias verificadas |
| `server/lib/course-html.ts` | Sanitización del HTML del instructor |
| `server/routes/instructor-cursos.ts` | Endpoints de módulos, referencias y quotes |
| `client/src/pages/instructor-curso-editor.tsx` | Editor completo |
| `client/src/pages/instructor-dashboard.tsx` | Botón "Editar" en `MyCreatedCoursesTab` |

---

### Task 1: Tablas nuevas + schema

**Files:**
- Create: `migrations/2026-07-22_instructor_course_editor.sql`
- Modify: `shared/schema.ts` (después de `instructorCourses`, que hoy está en la línea 1354)

**Interfaces:**
- Consumes: `instructorCourses` de `shared/schema.ts`
- Produces: `instructorCourseModules`, `instructorCourseReferences`, `instructorModuleQuotes` y los tipos `InstructorCourseModule`, `InstructorCourseReference`, `InstructorModuleQuote`

- [ ] **Step 1: Escribir la migración**

Crear `migrations/2026-07-22_instructor_course_editor.sql`:

```sql
-- Estudio del instructor — spec docs/superpowers/specs/2026-07-22-estudio-instructor-edicion-design.md
--
-- Normaliza los módulos de instructor_courses (hoy en la columna jsonb "modules")
-- y agrega bibliografía y frases destacadas. instructor_courses estaba en 0 filas
-- al 2026-07-22, así que no hay datos que migrar.
--
-- instructor_courses.modules NO se dropea aquí: primero el código deja de leerla,
-- después se retira en un cambio aparte.
--
-- Aplicar manualmente en el editor SQL de Supabase antes de desplegar el código.

CREATE TABLE IF NOT EXISTS instructor_course_modules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  course_id     uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE,
  "order"       integer NOT NULL DEFAULT 1,
  title         text NOT NULL,
  description   text,
  duration_min  integer,
  content_html  text,
  audio_url     text,
  youtube_ids   text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

CREATE TABLE IF NOT EXISTS instructor_course_references (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  course_id              uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE,
  authors                text NOT NULL,
  year                   integer,
  title                  text NOT NULL,
  source                 text,
  url                    text,
  verified_by_instructor boolean NOT NULL DEFAULT false,
  verified_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instructor_module_quotes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  module_id    uuid NOT NULL REFERENCES instructor_course_modules(id) ON DELETE CASCADE,
  "order"      integer NOT NULL DEFAULT 1,
  text         text NOT NULL,
  attribution  text
);

-- IMPRESCINDIBLE: si alguna tabla ya existiera de una corrida previa, el
-- CREATE TABLE IF NOT EXISTS de arriba se salta ENTERO y las columnas nuevas
-- nunca se crean — pasó con course_playbooks.source y rompió el deploy.
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS course_id uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 1;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS title text NOT NULL;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS duration_min integer;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS content_html text;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS youtube_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS course_id uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS authors text NOT NULL;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS title text NOT NULL;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS verified_by_instructor boolean NOT NULL DEFAULT false;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS module_id uuid NOT NULL REFERENCES instructor_course_modules(id) ON DELETE CASCADE;
ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 1;
ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS text text NOT NULL;
ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS attribution text;

CREATE INDEX IF NOT EXISTS idx_instructor_course_modules_course ON instructor_course_modules (course_id, "order");
CREATE INDEX IF NOT EXISTS idx_instructor_course_references_course ON instructor_course_references (course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_module_quotes_module ON instructor_module_quotes (module_id, "order");
```

- [ ] **Step 2: Declarar las tablas en el schema**

En `shared/schema.ts`, inmediatamente después del bloque de `instructorCourses`:

```ts
export const instructorCourseModules = pgTable("instructor_course_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => instructorCourses.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(1),
  title: text("title").notNull(),
  description: text("description"),
  durationMin: integer("duration_min"),
  contentHtml: text("content_html"),
  audioUrl: text("audio_url"),
  youtubeIds: text("youtube_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_instructor_course_modules_course").on(table.courseId, table.order),
]);

export const instructorCourseReferences = pgTable("instructor_course_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => instructorCourses.id, { onDelete: "cascade" }),
  authors: text("authors").notNull(),
  year: integer("year"),
  title: text("title").notNull(),
  source: text("source"),
  url: text("url"),
  verifiedByInstructor: boolean("verified_by_instructor").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_instructor_course_references_course").on(table.courseId),
]);

export const instructorModuleQuotes = pgTable("instructor_module_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => instructorCourseModules.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(1),
  text: text("text").notNull(),
  attribution: text("attribution"),
}, (table) => [
  index("idx_instructor_module_quotes_module").on(table.moduleId, table.order),
]);

export type InstructorCourseModule = typeof instructorCourseModules.$inferSelect;
export type InstructorCourseReference = typeof instructorCourseReferences.$inferSelect;
export type InstructorModuleQuote = typeof instructorModuleQuotes.$inferSelect;
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Aplicar la migración en Supabase y verificarla**

Aplicar el SQL a mano en el editor de Supabase. Después crear `tmp/verify-migracion.ts` (la carpeta `/tmp/` del repo está en `.gitignore`):

```ts
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });
const TABLAS = ["instructor_course_modules", "instructor_course_references", "instructor_module_quotes"];
async function main() {
  for (const t of TABLAS) {
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t]);
    console.log(`\n${t}: ${cols.rowCount} columnas`);
    for (const c of cols.rows) console.log(`  - ${c.column_name} :: ${c.data_type}`);
  }
  await pool.end();
}
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
```

Run: `npx tsx --env-file=.env.seed.txt tmp/verify-migracion.ts`
Expected: `instructor_course_modules: 10 columnas`, `instructor_course_references: 9 columnas`, `instructor_module_quotes: 4 columnas`. **Pegar esta salida como evidencia**; sin ella la migración no se da por aplicada. Borrar `tmp/` después.

- [ ] **Step 5: Commit**

```bash
git add migrations/2026-07-22_instructor_course_editor.sql shared/schema.ts
git commit -m "feat(estudio): tablas de modulos, referencias y citas del instructor"
```

---

### Task 2: Normalizador de IDs de YouTube (puro, TDD)

**Files:**
- Create: `server/lib/youtube-id.ts`
- Test: `server/lib/youtube-id.test.ts`

**Interfaces:**
- Produces: `extractYoutubeId(input: string): string | null`

- [ ] **Step 1: Escribir el test primero**

Crear `server/lib/youtube-id.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractYoutubeId } from "./youtube-id";

describe("extractYoutubeId", () => {
  it("acepta la forma watch?v=", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("acepta youtu.be", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("acepta /embed/", () => {
    expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("ignora parametros extra", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLabc")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
  });

  it("acepta un ID pelado", () => {
    expect(extractYoutubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("recorta espacios", () => {
    expect(extractYoutubeId("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });

  it("devuelve null ante basura", () => {
    expect(extractYoutubeId("https://vimeo.com/12345")).toBeNull();
    expect(extractYoutubeId("no es una url")).toBeNull();
    expect(extractYoutubeId("")).toBeNull();
    expect(extractYoutubeId("https://www.youtube.com/watch?v=corto")).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run server/lib/youtube-id.test.ts`
Expected: FAIL — `Failed to resolve import "./youtube-id"`.

- [ ] **Step 3: Implementar**

Crear `server/lib/youtube-id.ts`:

```ts
// Normaliza cualquier forma de enlace de YouTube a su ID de 11 caracteres.
// Se guarda el ID, no la URL: así el reproductor puede usar youtube-nocookie.com
// sin volver a parsear lo que el instructor haya pegado.

const ID = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  if (ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.slice(1);
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      candidate = url.pathname.slice("/embed/".length);
    }
  }

  if (!candidate) return null;
  const clean = candidate.split("/")[0];
  return ID.test(clean) ? clean : null;
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run server/lib/youtube-id.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add server/lib/youtube-id.ts server/lib/youtube-id.test.ts
git commit -m "feat(estudio): normalizador de IDs de YouTube con pruebas"
```

---

### Task 3: Marcas de cita `[[ref:uuid]]` (puro, TDD)

**Files:**
- Create: `server/lib/course-citations.ts`
- Test: `server/lib/course-citations.test.ts`

**Interfaces:**
- Produces:
  - `extractCitationRefIds(html: string): string[]` — uuids únicos, en orden de aparición
  - `validateCitations(html: string, availableRefIds: string[]): { ok: true } | { ok: false; missing: string[] }`
  - `findModulesCiting(refId: string, modules: { id: string; title: string; contentHtml: string | null }[]): { id: string; title: string }[]`

- [ ] **Step 1: Escribir el test primero**

Crear `server/lib/course-citations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractCitationRefIds, validateCitations, findModulesCiting } from "./course-citations";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

describe("extractCitationRefIds", () => {
  it("devuelve vacio sin marcas", () => {
    expect(extractCitationRefIds("<p>Sin citas</p>")).toEqual([]);
    expect(extractCitationRefIds("")).toEqual([]);
  });

  it("encuentra una marca", () => {
    expect(extractCitationRefIds(`<p>Segun [[ref:${A}]] el riesgo baja.</p>`)).toEqual([A]);
  });

  it("encuentra varias en orden de aparicion", () => {
    expect(extractCitationRefIds(`<p>[[ref:${B}]] y luego [[ref:${A}]]</p>`)).toEqual([B, A]);
  });

  it("no duplica la misma marca repetida", () => {
    expect(extractCitationRefIds(`<p>[[ref:${A}]] ... [[ref:${A}]]</p>`)).toEqual([A]);
  });

  it("ignora marcas malformadas", () => {
    expect(extractCitationRefIds("<p>[[ref:no-es-uuid]] [[ref:]] [[ref]]</p>")).toEqual([]);
  });
});

describe("validateCitations", () => {
  it("pasa cuando todas las referencias existen", () => {
    expect(validateCitations(`<p>[[ref:${A}]]</p>`, [A, B])).toEqual({ ok: true });
  });

  it("pasa cuando no hay citas", () => {
    expect(validateCitations("<p>nada</p>", [])).toEqual({ ok: true });
  });

  it("falla y nombra las que faltan", () => {
    expect(validateCitations(`<p>[[ref:${A}]] [[ref:${C}]]</p>`, [A])).toEqual({ ok: false, missing: [C] });
  });
});

describe("findModulesCiting", () => {
  it("lista los modulos que citan la referencia", () => {
    const modules = [
      { id: "m1", title: "Uno", contentHtml: `<p>[[ref:${A}]]</p>` },
      { id: "m2", title: "Dos", contentHtml: `<p>sin citas</p>` },
      { id: "m3", title: "Tres", contentHtml: `<p>[[ref:${A}]] [[ref:${B}]]</p>` },
    ];
    expect(findModulesCiting(A, modules)).toEqual([
      { id: "m1", title: "Uno" },
      { id: "m3", title: "Tres" },
    ]);
  });

  it("tolera contentHtml nulo", () => {
    expect(findModulesCiting(A, [{ id: "m1", title: "Uno", contentHtml: null }])).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run server/lib/course-citations.test.ts`
Expected: FAIL — `Failed to resolve import "./course-citations"`.

- [ ] **Step 3: Implementar**

Crear `server/lib/course-citations.ts`:

```ts
// Citas dentro del texto de un módulo. Van como [[ref:<uuid>]] en content_html
// y apuntan a una fila de instructor_course_references del MISMO curso.
//
// El uuid debe ser un uuid bien formado: una marca malformada se ignora en vez
// de contarse como "referencia faltante", porque no es una cita, es texto roto.

const MARCA = /\[\[ref:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]\]/g;

export function extractCitationRefIds(html: string): string[] {
  if (!html) return [];
  const vistos = new Set<string>();
  const orden: string[] = [];
  for (const m of html.matchAll(MARCA)) {
    const id = m[1];
    if (!vistos.has(id)) {
      vistos.add(id);
      orden.push(id);
    }
  }
  return orden;
}

export function validateCitations(
  html: string,
  availableRefIds: string[],
): { ok: true } | { ok: false; missing: string[] } {
  const disponibles = new Set(availableRefIds);
  const missing = extractCitationRefIds(html).filter((id) => !disponibles.has(id));
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

export function findModulesCiting(
  refId: string,
  modules: { id: string; title: string; contentHtml: string | null }[],
): { id: string; title: string }[] {
  return modules
    .filter((m) => extractCitationRefIds(m.contentHtml || "").includes(refId))
    .map((m) => ({ id: m.id, title: m.title }));
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run server/lib/course-citations.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add server/lib/course-citations.ts server/lib/course-citations.test.ts
git commit -m "feat(estudio): marcas de cita con validacion contra la bibliografia"
```

---

### Task 4: Regla de publicación (puro, TDD)

**Files:**
- Create: `server/lib/course-publish.ts`
- Test: `server/lib/course-publish.test.ts`

**Interfaces:**
- Produces: `canPublish(refs: { id: string; title: string; verifiedByInstructor: boolean }[]): { ok: true } | { ok: false; unverified: { id: string; title: string }[] }`

- [ ] **Step 1: Escribir el test primero**

Crear `server/lib/course-publish.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { canPublish } from "./course-publish";

describe("canPublish", () => {
  it("permite publicar sin bibliografia", () => {
    expect(canPublish([])).toEqual({ ok: true });
  });

  it("permite publicar con todas verificadas", () => {
    expect(canPublish([
      { id: "r1", title: "NOM-035", verifiedByInstructor: true },
      { id: "r2", title: "LFT art. 153", verifiedByInstructor: true },
    ])).toEqual({ ok: true });
  });

  it("bloquea y nombra las no verificadas", () => {
    expect(canPublish([
      { id: "r1", title: "NOM-035", verifiedByInstructor: true },
      { id: "r2", title: "Fuente dudosa", verifiedByInstructor: false },
    ])).toEqual({ ok: false, unverified: [{ id: "r2", title: "Fuente dudosa" }] });
  });

  it("bloquea cuando ninguna esta verificada", () => {
    expect(canPublish([
      { id: "r1", title: "A", verifiedByInstructor: false },
      { id: "r2", title: "B", verifiedByInstructor: false },
    ])).toEqual({ ok: false, unverified: [{ id: "r1", title: "A" }, { id: "r2", title: "B" }] });
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run server/lib/course-publish.test.ts`
Expected: FAIL — `Failed to resolve import "./course-publish"`.

- [ ] **Step 3: Implementar**

Crear `server/lib/course-publish.ts`:

```ts
// "Confirmada" significa que una persona respondió por la referencia. Por eso un
// curso no se publica mientras quede bibliografía sin verificar: publicar es el
// momento en que el contenido deja de ser borrador y lo ve un alumno.
//
// Un curso sin bibliografía sí se publica: no todos los cursos citan fuentes.

export function canPublish(
  refs: { id: string; title: string; verifiedByInstructor: boolean }[],
): { ok: true } | { ok: false; unverified: { id: string; title: string }[] } {
  const unverified = refs
    .filter((r) => !r.verifiedByInstructor)
    .map((r) => ({ id: r.id, title: r.title }));
  return unverified.length === 0 ? { ok: true } : { ok: false, unverified };
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run server/lib/course-publish.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add server/lib/course-publish.ts server/lib/course-publish.test.ts
git commit -m "feat(estudio): regla de publicacion con referencias verificadas"
```

---

### Task 5: Sanitización del HTML del instructor (puro, TDD)

**Files:**
- Create: `server/lib/course-html.ts`
- Test: `server/lib/course-html.test.ts`

**Interfaces:**
- Produces: `sanitizeCourseHtml(html: string): string`

- [ ] **Step 1: Escribir el test primero**

Crear `server/lib/course-html.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sanitizeCourseHtml } from "./course-html";

const A = "11111111-1111-4111-8111-111111111111";

describe("sanitizeCourseHtml", () => {
  it("conserva el formato permitido", () => {
    const html = "<p>Hola <strong>mundo</strong> y <em>algo</em></p><ul><li>uno</li></ul>";
    expect(sanitizeCourseHtml(html)).toBe(html);
  });

  it("elimina script", () => {
    expect(sanitizeCourseHtml('<p>ok</p><script>alert(1)</script>')).toBe("<p>ok</p>");
  });

  it("elimina manejadores de eventos", () => {
    expect(sanitizeCourseHtml('<p onclick="alert(1)">texto</p>')).toBe("<p>texto</p>");
  });

  it("elimina javascript: en enlaces", () => {
    const out = sanitizeCourseHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("conserva enlaces http y https", () => {
    expect(sanitizeCourseHtml('<a href="https://stps.gob.mx">STPS</a>'))
      .toContain('href="https://stps.gob.mx"');
  });

  it("conserva las marcas de cita intactas", () => {
    expect(sanitizeCourseHtml(`<p>Segun [[ref:${A}]] baja.</p>`)).toBe(`<p>Segun [[ref:${A}]] baja.</p>`);
  });

  it("tolera cadena vacia", () => {
    expect(sanitizeCourseHtml("")).toBe("");
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run server/lib/course-html.test.ts`
Expected: FAIL — `Failed to resolve import "./course-html"`.

- [ ] **Step 3: Implementar**

Crear `server/lib/course-html.ts`:

```ts
// El instructor escribe contenido que verán terceros: se sanitiza en el SERVIDOR,
// no sólo en el cliente, porque el endpoint se puede llamar directo.
//
// Las marcas [[ref:uuid]] son texto plano, así que sobreviven a la sanitización
// sin necesidad de tratarlas aparte (ver server/lib/course-citations.ts).

import sanitizeHtml from "sanitize-html";

export function sanitizeCourseHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s",
      "h2", "h3", "h4",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "a", "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run server/lib/course-html.test.ts`
Expected: PASS, 7 tests. Si el test de enlaces falla por el `rel`/`target` que agrega `simpleTransform`, ajustar la aserción a `toContain('href="https://stps.gob.mx"')` — nunca relajar la sanitización para que pase un test.

- [ ] **Step 5: Commit**

```bash
git add server/lib/course-html.ts server/lib/course-html.test.ts
git commit -m "feat(estudio): sanitizacion del HTML del instructor"
```

---

### Task 6: Endpoints de módulos

**Files:**
- Create: `server/routes/instructor-cursos.ts`
- Modify: `server/routes.ts` (registrar el módulo junto a los demás `registerXRoutes`)

**Interfaces:**
- Consumes: `extractYoutubeId` (Task 2), `validateCitations` (Task 3), `sanitizeCourseHtml` (Task 5), tablas de Task 1
- Produces: `registerInstructorCursosRoutes(app: Express, requireAuth: RequestHandler, requireInstructor: RequestHandler): void` — los middlewares se reciben por parámetro porque hoy viven dentro de `server/routes.ts` y no se exportan; si al implementar resulta que sí se exportan, importarlos directamente y dejar la firma en `(app: Express)`. Tasks 7 y 8 agregan rutas dentro de esta misma función.

- [ ] **Step 1: Leer el patrón existente**

Abrir `server/routes/empresa.ts` y `server/routes/riesgos.ts` y copiar su forma: `export function registerXRoutes(app: Express)`, `requireAuth`, `try/catch` con `next(err)`. Confirmar cómo se importan `requireAuth` y `requireInstructor` (los usa `server/routes.ts:682`).

- [ ] **Step 2: Implementar los endpoints de módulos**

Crear `server/routes/instructor-cursos.ts`:

```ts
import type { Express } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  instructorCourses,
  instructorCourseModules,
  instructorCourseReferences,
} from "@shared/schema";
import { extractYoutubeId } from "../lib/youtube-id";
import { validateCitations } from "../lib/course-citations";
import { sanitizeCourseHtml } from "../lib/course-html";

// El curso debe pertenecer a quien llama. Se resuelve SIEMPRE contra la base:
// nunca se confía en un id de instructor que venga del cliente. Curso ajeno o
// inexistente responden igual (404) para no confirmar que existe.
async function ownedCourse(courseId: string, userId: string) {
  const [course] = await db
    .select()
    .from(instructorCourses)
    .where(and(eq(instructorCourses.id, courseId), eq(instructorCourses.instructorId, userId)));
  return course ?? null;
}

async function refIdsOf(courseId: string): Promise<string[]> {
  const rows = await db
    .select({ id: instructorCourseReferences.id })
    .from(instructorCourseReferences)
    .where(eq(instructorCourseReferences.courseId, courseId));
  return rows.map((r) => r.id);
}

export function registerInstructorCursosRoutes(app: Express, requireAuth: any, requireInstructor: any) {
  app.get("/api/instructor/my-courses/:id/modules", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const modules = await db
        .select()
        .from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id))
        .orderBy(asc(instructorCourseModules.order));
      res.json(modules);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses/:id/modules", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const { title, description, durationMin, contentHtml, youtubeUrls } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ message: "El titulo del modulo es obligatorio" });
      }

      const ids: string[] = [];
      for (const raw of (youtubeUrls || []) as string[]) {
        const id = extractYoutubeId(raw);
        if (!id) return res.status(400).json({ message: `No se reconocio un video de YouTube en: ${raw}` });
        ids.push(id);
      }

      const clean = sanitizeCourseHtml(contentHtml || "");
      const check = validateCitations(clean, await refIdsOf(course.id));
      if (!check.ok) {
        return res.status(400).json({
          message: "El texto cita referencias que no existen en la bibliografia de este curso",
          missing: check.missing,
        });
      }

      const existing = await db
        .select({ order: instructorCourseModules.order })
        .from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id));
      const nextOrder = existing.length === 0 ? 1 : Math.max(...existing.map((m) => m.order)) + 1;

      const [created] = await db.insert(instructorCourseModules).values({
        courseId: course.id,
        order: nextOrder,
        title,
        description: description ?? null,
        durationMin: durationMin ?? null,
        contentHtml: clean,
        youtubeIds: ids,
      }).returning();

      res.status(201).json(created);
    } catch (err) { next(err); }
  });

  // ORDEN OBLIGATORIO: /modules/reorder va ANTES que /modules/:moduleId.
  // Express toma la primera ruta que coincide, así que si :moduleId se registra
  // primero captura la palabra "reorder" como si fuera un id y el reordenamiento
  // nunca se ejecuta. Registrar en este mismo orden en el archivo.
  app.patch("/api/instructor/my-courses/:id/modules/reorder", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const { moduleIds } = req.body as { moduleIds: string[] };
      if (!Array.isArray(moduleIds)) return res.status(400).json({ message: "moduleIds debe ser un arreglo" });

      const own = await db.select({ id: instructorCourseModules.id })
        .from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id));
      const ownIds = new Set(own.map((m) => m.id));
      if (moduleIds.length !== ownIds.size || moduleIds.some((id) => !ownIds.has(id))) {
        return res.status(400).json({ message: "La lista debe contener exactamente los modulos de este curso" });
      }

      for (let i = 0; i < moduleIds.length; i++) {
        await db.update(instructorCourseModules)
          .set({ order: i + 1, updatedAt: new Date() })
          .where(eq(instructorCourseModules.id, moduleIds[i]));
      }
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id/modules/:moduleId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const [mod] = await db.select().from(instructorCourseModules).where(
        and(eq(instructorCourseModules.id, req.params.moduleId), eq(instructorCourseModules.courseId, course.id)));
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });

      const { title, description, durationMin, contentHtml, youtubeUrls } = req.body;
      const patch: Record<string, unknown> = { updatedAt: new Date() };

      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (durationMin !== undefined) patch.durationMin = durationMin;

      if (youtubeUrls !== undefined) {
        const ids: string[] = [];
        for (const raw of youtubeUrls as string[]) {
          const id = extractYoutubeId(raw);
          if (!id) return res.status(400).json({ message: `No se reconocio un video de YouTube en: ${raw}` });
          ids.push(id);
        }
        patch.youtubeIds = ids;
      }

      if (contentHtml !== undefined) {
        const clean = sanitizeCourseHtml(contentHtml);
        const check = validateCitations(clean, await refIdsOf(course.id));
        if (!check.ok) {
          return res.status(400).json({
            message: "El texto cita referencias que no existen en la bibliografia de este curso",
            missing: check.missing,
          });
        }
        patch.contentHtml = clean;
      }

      const [updated] = await db.update(instructorCourseModules)
        .set(patch)
        .where(eq(instructorCourseModules.id, mod.id))
        .returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id/modules/:moduleId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const deleted = await db.delete(instructorCourseModules).where(
        and(eq(instructorCourseModules.id, req.params.moduleId), eq(instructorCourseModules.courseId, course.id))
      ).returning();
      if (deleted.length === 0) return res.status(404).json({ message: "Modulo no encontrado" });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

}
```

- [ ] **Step 3: Registrar en `server/routes.ts`**

Junto a los demás registros de rutas, agregar:

```ts
import { registerInstructorCursosRoutes } from "./routes/instructor-cursos";
// ...donde se registran las demás:
registerInstructorCursosRoutes(app, requireAuth, requireInstructor);
```

- [ ] **Step 4: Verificar tipos y arranque**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build && npm run smoke:boot`
Expected: el bundle levanta sin errores de importación.

- [ ] **Step 5: Commit**

```bash
git add server/routes/instructor-cursos.ts server/routes.ts
git commit -m "feat(estudio): endpoints de modulos del instructor"
```

---

### Task 7: Endpoints de bibliografía

**Files:**
- Modify: `server/routes/instructor-cursos.ts`

**Interfaces:**
- Consumes: `findModulesCiting` (Task 3), `canPublish` (Task 4)
- Produces: rutas de referencias

- [ ] **Step 1: Agregar los endpoints de referencias**

En `server/routes/instructor-cursos.ts`, dentro de `registerInstructorCursosRoutes`, agregar los imports `findModulesCiting` y `instructorCourseModules` (ya importado) y estas rutas:

```ts
  app.get("/api/instructor/my-courses/:id/references", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const refs = await db.select().from(instructorCourseReferences)
        .where(eq(instructorCourseReferences.courseId, course.id));
      res.json(refs);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses/:id/references", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const { authors, year, title, source, url, verifiedByInstructor } = req.body;
      if (!authors || !title) {
        return res.status(400).json({ message: "Autores y titulo son obligatorios" });
      }

      // La verificación la declara el instructor. Nada la marca automáticamente.
      const verified = verifiedByInstructor === true;

      const [created] = await db.insert(instructorCourseReferences).values({
        courseId: course.id,
        authors,
        year: year ?? null,
        title,
        source: source ?? null,
        url: url ?? null,
        verifiedByInstructor: verified,
        verifiedAt: verified ? new Date() : null,
      }).returning();

      res.status(201).json(created);
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id/references/:refId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const [ref] = await db.select().from(instructorCourseReferences).where(
        and(eq(instructorCourseReferences.id, req.params.refId), eq(instructorCourseReferences.courseId, course.id)));
      if (!ref) return res.status(404).json({ message: "Referencia no encontrada" });

      const { authors, year, title, source, url, verifiedByInstructor } = req.body;
      const patch: Record<string, unknown> = {};
      if (authors !== undefined) patch.authors = authors;
      if (year !== undefined) patch.year = year;
      if (title !== undefined) patch.title = title;
      if (source !== undefined) patch.source = source;
      if (url !== undefined) patch.url = url;
      if (verifiedByInstructor !== undefined) {
        patch.verifiedByInstructor = verifiedByInstructor === true;
        patch.verifiedAt = verifiedByInstructor === true ? new Date() : null;
      }

      const [updated] = await db.update(instructorCourseReferences)
        .set(patch)
        .where(eq(instructorCourseReferences.id, ref.id))
        .returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id/references/:refId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const [ref] = await db.select().from(instructorCourseReferences).where(
        and(eq(instructorCourseReferences.id, req.params.refId), eq(instructorCourseReferences.courseId, course.id)));
      if (!ref) return res.status(404).json({ message: "Referencia no encontrada" });

      // Borrar una referencia citada dejaría citas huérfanas en el texto: se avisa
      // en qué módulos está usada en vez de romperlo por dentro.
      const modules = await db.select({
        id: instructorCourseModules.id,
        title: instructorCourseModules.title,
        contentHtml: instructorCourseModules.contentHtml,
      }).from(instructorCourseModules).where(eq(instructorCourseModules.courseId, course.id));

      const citing = findModulesCiting(ref.id, modules);
      if (citing.length > 0) {
        return res.status(409).json({
          message: "Esta referencia esta citada en el texto. Quita las citas antes de borrarla.",
          modules: citing,
        });
      }

      await db.delete(instructorCourseReferences).where(eq(instructorCourseReferences.id, ref.id));
      res.json({ ok: true });
    } catch (err) { next(err); }
  });
```

- [ ] **Step 2: Bloquear la publicación con referencias sin verificar**

En `server/routes.ts`, dentro de `app.patch("/api/instructor/my-courses/:id", ...)` (línea 725), antes de aplicar el update, agregar:

```ts
      if (req.body.status === "published") {
        const refs = await db.select({
          id: instructorCourseReferences.id,
          title: instructorCourseReferences.title,
          verifiedByInstructor: instructorCourseReferences.verifiedByInstructor,
        }).from(instructorCourseReferences).where(eq(instructorCourseReferences.courseId, existing.id));

        const check = canPublish(refs);
        if (!check.ok) {
          return res.status(409).json({
            message: "No se puede publicar: hay referencias sin verificar",
            unverified: check.unverified,
          });
        }
      }
```

Agregar los imports de `canPublish` y `instructorCourseReferences` en `server/routes.ts`.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Correr toda la suite**

Run: `npm test`
Expected: PASS, sin regresiones.

- [ ] **Step 5: Commit**

```bash
git add server/routes/instructor-cursos.ts server/routes.ts
git commit -m "feat(estudio): bibliografia con verificacion y bloqueo de publicacion"
```

---

### Task 8: Endpoints de frases destacadas

**Files:**
- Modify: `server/routes/instructor-cursos.ts`

**Interfaces:**
- Produces: rutas de quotes bajo `/api/instructor/my-courses/:id/modules/:moduleId/quotes`

- [ ] **Step 1: Agregar los endpoints**

Importar `instructorModuleQuotes` de `@shared/schema` y agregar dentro de `registerInstructorCursosRoutes`:

```ts
  // Una frase destacada es un recuadro con una cita textual y su atribución.
  // NO liga a la bibliografía: eso son las marcas [[ref:uuid]] del texto.
  async function ownedModule(courseId: string, moduleId: string, userId: string) {
    const course = await ownedCourse(courseId, userId);
    if (!course) return null;
    const [mod] = await db.select().from(instructorCourseModules).where(
      and(eq(instructorCourseModules.id, moduleId), eq(instructorCourseModules.courseId, course.id)));
    return mod ?? null;
  }

  app.get("/api/instructor/my-courses/:id/modules/:moduleId/quotes", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id, req.params.moduleId, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });
      const quotes = await db.select().from(instructorModuleQuotes)
        .where(eq(instructorModuleQuotes.moduleId, mod.id))
        .orderBy(asc(instructorModuleQuotes.order));
      res.json(quotes);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses/:id/modules/:moduleId/quotes", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id, req.params.moduleId, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });

      const { text, attribution } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "El texto de la frase es obligatorio" });
      }

      const existing = await db.select({ order: instructorModuleQuotes.order })
        .from(instructorModuleQuotes).where(eq(instructorModuleQuotes.moduleId, mod.id));
      const nextOrder = existing.length === 0 ? 1 : Math.max(...existing.map((q) => q.order)) + 1;

      const [created] = await db.insert(instructorModuleQuotes).values({
        moduleId: mod.id, order: nextOrder, text, attribution: attribution ?? null,
      }).returning();
      res.status(201).json(created);
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id/modules/:moduleId/quotes/:quoteId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id, req.params.moduleId, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });

      const [quote] = await db.select().from(instructorModuleQuotes).where(
        and(eq(instructorModuleQuotes.id, req.params.quoteId), eq(instructorModuleQuotes.moduleId, mod.id)));
      if (!quote) return res.status(404).json({ message: "Frase no encontrada" });

      const { text, attribution } = req.body;
      const patch: Record<string, unknown> = {};
      if (text !== undefined) patch.text = text;
      if (attribution !== undefined) patch.attribution = attribution;

      const [updated] = await db.update(instructorModuleQuotes).set(patch)
        .where(eq(instructorModuleQuotes.id, quote.id)).returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id/modules/:moduleId/quotes/:quoteId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id, req.params.moduleId, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });
      const deleted = await db.delete(instructorModuleQuotes).where(
        and(eq(instructorModuleQuotes.id, req.params.quoteId), eq(instructorModuleQuotes.moduleId, mod.id))
      ).returning();
      if (deleted.length === 0) return res.status(404).json({ message: "Frase no encontrada" });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add server/routes/instructor-cursos.ts
git commit -m "feat(estudio): frases destacadas por modulo"
```

---

### Task 9: Migrar la creación de cursos del `jsonb` a las tablas

**Files:**
- Modify: `server/routes.ts:690-714` (`POST /api/instructor/my-courses`)
- Modify: `server/routes.ts:716-723` (`GET /api/instructor/my-courses/:id`)

**Interfaces:**
- Consumes: `instructorCourseModules` (Task 1), `sanitizeCourseHtml` (Task 5)

**No se toca el cliente en esta tarea.** `CreateCourseTab` sigue enviando el mismo cuerpo con
`modules`; lo único que cambia es dónde los guarda el servidor. El cliente se modifica hasta la
Task 10.

- [ ] **Step 1: Insertar los módulos en su tabla al crear el curso**

En `server/routes.ts`, en `POST /api/instructor/my-courses`, después de insertar el curso y antes del `res.json(course)`, agregar:

```ts
      // Los módulos ahora viven en instructor_course_modules. La columna jsonb
      // "modules" deja de escribirse; se retira en un cambio aparte, cuando se
      // confirme en producción que nada la lee.
      if (Array.isArray(modules)) {
        for (let i = 0; i < modules.length; i++) {
          const m = modules[i];
          await db.insert(instructorCourseModules).values({
            courseId: course.id,
            order: i + 1,
            title: m.title,
            description: m.description ?? null,
            durationMin: m.durationMin ?? null,
            contentHtml: sanitizeCourseHtml(m.content || ""),
          });
        }
      }
```

Quitar `modules` del objeto que se inserta en `instructorCourses` y agregar los imports de `instructorCourseModules` y `sanitizeCourseHtml`.

- [ ] **Step 2: Devolver el curso con sus relaciones en `GET /:id`**

En `server/routes.ts`, en `GET /api/instructor/my-courses/:id` (línea 716), después de obtener `course`:

```ts
      const modules = await db.select().from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id))
        .orderBy(asc(instructorCourseModules.order));
      const references = await db.select().from(instructorCourseReferences)
        .where(eq(instructorCourseReferences.courseId, course.id));
      res.json({ ...course, modules, references });
```

Confirmar que `asc` esté importado de `drizzle-orm` en ese archivo; si no, agregarlo.

- [ ] **Step 3: Verificar tipos y suite**

Run: `npx tsc --noEmit && npm test`
Expected: sin errores, tests en verde.

- [ ] **Step 4: Commit**

```bash
git add server/routes.ts
git commit -m "refactor(estudio): crear cursos escribiendo modulos normalizados"
```

---

### Task 10: Editor del curso (cliente)

**Files:**
- Create: `client/src/pages/instructor-curso-editor.tsx`
- Modify: `client/src/App.tsx` (ruta `/instructor/curso/:id`)
- Modify: `client/src/pages/instructor-dashboard.tsx:1130` (botón "Editar" en `MyCreatedCoursesTab`)

**Interfaces:**
- Consumes: todos los endpoints de Tasks 6-9

- [ ] **Step 1: Crear la página del editor**

Crear `client/src/pages/instructor-curso-editor.tsx` con tres zonas, siguiendo el patrón de `instructor-gemelo-tab.tsx` (TanStack Query + `apiRequest` + `useToast`):

- **Módulos**: lista ordenable; por módulo, campos de título, descripción, duración, texto y videos de YouTube (un input por video, se envían como `youtubeUrls`).
- **Bibliografía**: tabla de referencias con alta/edición/borrado y casilla "Verificada por mí". Al recibir **409** en el borrado, mostrar los módulos que la citan (vienen en `modules` de la respuesta).
- **Vista previa**: renderiza el `content_html` con las marcas `[[ref:uuid]]` sustituidas por la cita corta (`Autores, año`) de la referencia correspondiente.

Reglas de manejo de errores, copiadas del patrón ya corregido en el repo:

- Distinguir `isLoading` de `isError` — nunca mostrar "sin datos" cuando en realidad falló la carga.
- Mostrar el mensaje real del servidor con `extractServerMessage(err)`, no un texto genérico.
- Avisar de cambios sin guardar al salir del editor.

- [ ] **Step 2: Registrar la ruta**

En `client/src/App.tsx`, dentro de `<Switch>`, **antes** de `<Route path="/instructor" component={InstructorDashboard} />` (wouter toma la primera coincidencia):

```tsx
<Route path="/instructor/curso/:id" component={InstructorCursoEditor} />
```

Con su import arriba: `import InstructorCursoEditor from "@/pages/instructor-curso-editor";`

- [ ] **Step 3: Botón "Editar" en el listado**

En `MyCreatedCoursesTab` (`client/src/pages/instructor-dashboard.tsx:1130`), agregar por cada curso un botón que navegue a `/instructor/curso/${curso.id}`, con `data-testid={`button-editar-curso-${curso.id}`}`.

- [ ] **Step 4: Verificar build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/instructor-curso-editor.tsx client/src/App.tsx client/src/pages/instructor-dashboard.tsx
git commit -m "feat(estudio): editor de cursos del instructor"
```

---

### Task 11: Verificación final

**Files:** ninguno (no commitear scripts de verificación)

- [ ] **Step 1: Suite completa y tipos**

Run: `npm test && npx tsc --noEmit && npm run build && npm run smoke:boot`
Expected: todo en verde y el bundle levanta.

- [ ] **Step 2: Ciclo completo en la aplicación**

Con sesión de instructor: crear un curso → agregar dos módulos → agregar una referencia **sin** marcarla verificada → citarla en el texto con `[[ref:uuid]]` → guardar (debe pasar) → intentar publicar (**debe bloquear** nombrando la referencia sin verificar) → marcarla verificada → publicar (debe pasar).

Además, **reordenar los módulos** y volver a cargar la página: el orden debe conservarse y quedar
sin huecos (1, 2, 3…). Agregar un tercer módulo después de reordenar y confirmar que se coloca al
final, no en medio.

- [ ] **Step 3: Los rechazos**

- Citar un uuid que no existe → **400** que nombra el uuid faltante.
- Borrar una referencia citada → **409** con la lista de módulos que la citan.
- Pegar `https://vimeo.com/12345` como video → **400** con mensaje claro.
- Pegar `<script>alert(1)</script>` en el texto → se guarda sin el `script`.

- [ ] **Step 4: Aislamiento entre instructores**

Con dos cuentas de instructor distintas: pedir el curso de la otra por su id → **404** (no 403). Repetir contra `/modules` y `/references` del curso ajeno.

- [ ] **Step 5: Reportar**

Escribir el resultado de cada verificación. No commitear scripts. Si algo falla, corregir antes de dar el trabajo por terminado.
