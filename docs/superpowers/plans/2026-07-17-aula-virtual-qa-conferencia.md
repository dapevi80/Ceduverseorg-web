# Aula Virtual — Q&A al final de la conferencia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a push-to-talk Q&A session (voice → voice, instructor's own voice) to the end of an Aula Virtual conference, with curated/community FAQ, a server-enforced 3-question limit, semantic caching, T&C consent, moderation, and anonymous (referral-code-only) attribution.

**Architecture:** New Postgres tables (`conference_faqs`, `conference_qa_log`, `conference_qa_consent`, `qa_presence`) back a small Express route module (`server/routes/aula-qa.ts`) that chains OpenAI STT → moderation → embedding-based cache lookup → `tutorAIService.generateResponse` (Claude Haiku, extended with `instructorName`) → OpenAI TTS → R2 upload. All decision logic (rate limit, cache hit, consent validity, hand-raise ordering, moderation interpretation) is factored into small pure functions under `shared/` and `server/lib/` so it is unit-testable without a database or network. A new client component `<ConferenceQA>` is inserted into `client/src/pages/curso-virtual.tsx` at the `allCompleted` boundary, gating the existing diploma CTA (`stps-next-steps`) behind the Q&A session closing.

**Tech Stack:** Node/Express 5, Drizzle ORM (Postgres, no pgvector), React 18 + TanStack Query + wouter, OpenAI SDK (`gpt-4o-transcribe`, `omni-moderation-latest`, `text-embedding-3-small`, `gpt-4o-mini-tts`), Anthropic SDK (`claude-haiku-4-5-20251001`), Cloudflare R2 (`@aws-sdk/client-s3` via `r2Storage`), Vitest for pure-logic tests, `multer` (memory storage) for the audio upload.

## Global Constraints

Parameters (single source of truth — exact values, copy verbatim into code):
```
AULA_QA_LIVE_LIMIT        = 3      // generaciones por alumno por curso
AULA_QA_MAX_RECORD_SEC    = 40     // tope de grabación
AULA_QA_IDLE_FAREWELL_SEC = 30     // inactividad sin pregunta → despedida + cierre de sesión
AULA_QA_HAND_TTL_SEC      = 60     // vigencia de "mano levantada" por heartbeat (boost de visibilidad)
AULA_QA_ANSWER_MAX_SENT   = 4      // frases (ya implícito en generateResponse: ≤3-4)
AULA_QA_CACHE_SIM_THRESH  = 0.90   // umbral de similitud coseno para cache HIT (a calibrar)
AULA_QA_TC_VERSION        = "2026-07-qa-v1"  // versión de T&C; subir invalida consentimientos viejos
STT_MODEL                 = "gpt-4o-transcribe" (o "whisper-1")
MODERATION_MODEL          = "omni-moderation-latest"  // gratis
EMBED_MODEL                = "text-embedding-3-small"
TTS_MODEL/VOICE            = "gpt-4o-mini-tts" / voz del instructor (ver reparto de voces)
```

Voice-per-instructor mapping (substring match against `courses.instructor`): Yuridia → `coral`, Medina → `ash`, "David Pérez" → `verse`, "Daniel Zavala" → `onyx`, default → `ash`.

Invariants (apply to every task below, not restated per-task):
- **Server-side enforcement only.** The 3-question limit, consent gate, and moderation gate are all decided and enforced in the Express route/store, never trusted from the client.
- **Cero-mock / errores explícitos.** Missing `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` → `503` with an honest message. Never fabricate an answer, a transcript, or a cached hit.
- **Anonimato solo por código de referido.** Any public/promoted attribution uses `accounts.referralCode`, never a name or `user_id`.
- **El audio de la voz del alumno se descarta tras STT.** Only the text transcript is ever persisted; the uploaded blob (`req.file.buffer`, in-memory via `multer.memoryStorage()`) is never written to disk or R2.
- **Ofensivo se borra de inmediato.** A moderation-flagged transcript is never inserted into `conference_qa_log`, never cached, never promoted, and does not count against the limit.

Embeddings storage: `jsonb` array of floats (`.$type<number[]>()`), cosine similarity computed in JS in `shared/qa-cache.ts` over candidate rows loaded into memory. No pgvector extension.

Test runner: `npm test` → `vitest run` (per `package.json`). Typecheck: `npx tsc --noEmit`.

---

### Task 1: Schema + migration — `conference_faqs`, `conference_qa_log`, `conference_qa_consent`, `qa_presence`

**Files:**
- Modify: `shared/schema.ts` (add after `courseQuizzes`, i.e. after line 476 — new pgTable exports; follow the `pgTable`/`uniqueIndex`/`index`/`references()` style already used at `shared/schema.ts:447-463` and `shared/schema.ts:74-91`)
- Create: `migrations/0011_aula_qa.sql`

**Interfaces:**
- Consumes: `courses` (`shared/schema.ts:176-199`, has `.slug` unique, `.instructor`), `users` (`shared/schema.ts:67-72`)
- Produces (drizzle exports later tasks import from `@shared/schema`):
  - `conferenceFaqs` — columns: `id`, `courseSlug`, `question`, `answerText`, `answerAudioUrl`, `embedding` (`jsonb().$type<number[]>()`), `source` (`text`, `'curated'|'promoted'`), `authorReferralCode`, `isPublic` (`boolean` default `false`), `sortOrder` (`integer` default `0`), `active` (`boolean` default `true`), `createdAt`
  - `conferenceQaLog` — columns: `id`, `userId`, `courseSlug`, `questionTranscript`, `referralCode`, `embedding` (`jsonb().$type<number[]>()`), `answerText`, `answerAudioUrl`, `wasCacheHit` (`boolean` default `false`), `deflected` (`boolean` default `false`), `createdAt`
  - `conferenceQaConsent` — columns: `id`, `userId`, `tcVersion`, `acceptedAt`; unique on `(userId, tcVersion)`
  - `qaPresence` — columns: `userId` (PK), `handRaisedUntil` (`timestamptz`, nullable)

- [ ] **Step 1: Add the four `pgTable` definitions to `shared/schema.ts`**

Insert immediately after the `courseQuizzes` block (after line 476):

```typescript
export const conferenceFaqs = pgTable("conference_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseSlug: text("course_slug").notNull().references(() => courses.slug, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answerText: text("answer_text").notNull(),
  answerAudioUrl: text("answer_audio_url"),
  embedding: jsonb("embedding").$type<number[]>(),
  source: text("source").notNull().default("curated"),
  authorReferralCode: text("author_referral_code"),
  isPublic: boolean("is_public").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_conference_faqs_course_slug").on(table.courseSlug),
  index("idx_conference_faqs_is_public").on(table.isPublic),
]);

export const conferenceQaLog = pgTable("conference_qa_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").notNull().references(() => courses.slug, { onDelete: "cascade" }),
  questionTranscript: text("question_transcript").notNull(),
  referralCode: text("referral_code"),
  embedding: jsonb("embedding").$type<number[]>(),
  answerText: text("answer_text"),
  answerAudioUrl: text("answer_audio_url"),
  wasCacheHit: boolean("was_cache_hit").notNull().default(false),
  deflected: boolean("deflected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_conference_qa_log_user_course").on(table.userId, table.courseSlug),
]);

export const conferenceQaConsent = pgTable("conference_qa_consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tcVersion: text("tc_version").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_conference_qa_consent_user_version").on(table.userId, table.tcVersion),
]);

export const qaPresence = pgTable("qa_presence", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  handRaisedUntil: timestamp("hand_raised_until", { withTimezone: true }),
});
```

- [ ] **Step 2: Write `migrations/0011_aula_qa.sql`**

```sql
-- Migration: Aula Virtual Q&A al final de la conferencia (spec 2026-07-17-aula-virtual-qa-conferencia-design.md)
-- Nuevas tablas: conference_faqs, conference_qa_log, conference_qa_consent, qa_presence.
-- Embeddings como jsonb (no pgvector) — similitud coseno se calcula en JS (shared/qa-cache.ts).

CREATE TABLE "conference_faqs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_slug" text NOT NULL REFERENCES "courses"("slug") ON DELETE CASCADE,
  "question" text NOT NULL,
  "answer_text" text NOT NULL,
  "answer_audio_url" text,
  "embedding" jsonb,
  "source" text NOT NULL DEFAULT 'curated',
  "author_referral_code" text,
  "is_public" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_conference_faqs_course_slug" ON "conference_faqs" ("course_slug");
CREATE INDEX "idx_conference_faqs_is_public" ON "conference_faqs" ("is_public");

CREATE TABLE "conference_qa_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_slug" text NOT NULL REFERENCES "courses"("slug") ON DELETE CASCADE,
  "question_transcript" text NOT NULL,
  "referral_code" text,
  "embedding" jsonb,
  "answer_text" text,
  "answer_audio_url" text,
  "was_cache_hit" boolean NOT NULL DEFAULT false,
  "deflected" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_conference_qa_log_user_course" ON "conference_qa_log" ("user_id", "course_slug");

CREATE TABLE "conference_qa_consent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tc_version" text NOT NULL,
  "accepted_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_conference_qa_consent_user_version" ON "conference_qa_consent" ("user_id", "tc_version");

CREATE TABLE "qa_presence" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "hand_raised_until" timestamptz
);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `shared/schema.ts`.

- [ ] **Step 4: Commit**

```bash
git add shared/schema.ts migrations/0011_aula_qa.sql
git commit -m "feat(aula-qa): add conference_faqs, conference_qa_log, conference_qa_consent, qa_presence schema + migration"
```

---

### Task 2: `shared/instructor-voice.ts` — voice mapping per instructor

**Files:**
- Create: `shared/instructor-voice.ts`
- Test: `shared/instructor-voice.test.ts`

**Interfaces:**
- Consumes: `courses.instructor: string | null` (`shared/schema.ts:182`)
- Produces: `export interface InstructorVoice { voice: string; instructions: string }`, `export function voiceForInstructor(name: string | null): InstructorVoice`

- [ ] **Step 1: Write the failing test**

```typescript
// shared/instructor-voice.test.ts
import { describe, it, expect } from "vitest";
import { voiceForInstructor } from "./instructor-voice";

describe("voiceForInstructor", () => {
  it("Yuridia -> coral", () => {
    expect(voiceForInstructor("Psic. Yuridia Iturriaga").voice).toBe("coral");
  });

  it("Medina -> ash", () => {
    expect(voiceForInstructor("Lic. Jorge Armando Medina Castillo").voice).toBe("ash");
  });

  it("David Pérez -> verse", () => {
    expect(voiceForInstructor("David Pérez").voice).toBe("verse");
  });

  it("Daniel Zavala -> onyx", () => {
    expect(voiceForInstructor("Daniel Zavala").voice).toBe("onyx");
  });

  it("nombre desconocido -> default ash", () => {
    expect(voiceForInstructor("Instructor Genérico").voice).toBe("ash");
  });

  it("null -> default ash", () => {
    expect(voiceForInstructor(null).voice).toBe("ash");
  });

  it("cada voz trae instructions no vacías", () => {
    expect(voiceForInstructor("Yuridia").instructions.length).toBeGreaterThan(0);
    expect(voiceForInstructor(null).instructions.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/instructor-voice.test.ts`
Expected: FAIL — `Cannot find module './instructor-voice'`

- [ ] **Step 3: Write the implementation**

```typescript
// shared/instructor-voice.ts
// Voz + estilo de TTS por instructor, para que la respuesta hablada del Q&A
// (server/services/qa-openai.ts::synthesizeAnswer) suene coherente con la voz
// que dio la conferencia. Match por substring de courses.instructor (spec
// 2026-07-17-aula-virtual-qa-conferencia-design.md §8).

export interface InstructorVoice {
  voice: string;
  instructions: string;
}

const DEFAULT_INSTRUCTIONS =
  "Habla en español de México con tono cálido, profesional y cercano, como un instructor respondiendo brevemente la duda de un alumno al final de una conferencia.";

const VOICE_MAP: { match: string; voice: InstructorVoice }[] = [
  {
    match: "yuridia",
    voice: { voice: "coral", instructions: DEFAULT_INSTRUCTIONS },
  },
  {
    match: "medina",
    voice: { voice: "ash", instructions: DEFAULT_INSTRUCTIONS },
  },
  {
    match: "david pérez",
    voice: { voice: "verse", instructions: DEFAULT_INSTRUCTIONS },
  },
  {
    match: "daniel zavala",
    voice: { voice: "onyx", instructions: DEFAULT_INSTRUCTIONS },
  },
];

const DEFAULT_VOICE: InstructorVoice = { voice: "ash", instructions: DEFAULT_INSTRUCTIONS };

export function voiceForInstructor(name: string | null): InstructorVoice {
  if (!name) return DEFAULT_VOICE;
  const lower = name.toLowerCase();
  const hit = VOICE_MAP.find((entry) => lower.includes(entry.match));
  return hit ? hit.voice : DEFAULT_VOICE;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/instructor-voice.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add shared/instructor-voice.ts shared/instructor-voice.test.ts
git commit -m "feat(aula-qa): add per-instructor TTS voice mapping"
```

---

### Task 3: `shared/qa-cache.ts` — cosine similarity + semantic cache lookup

**Files:**
- Create: `shared/qa-cache.ts`
- Test: `shared/qa-cache.test.ts`

**Interfaces:**
- Consumes: nothing (pure)
- Produces: `export function cosineSimilarity(a: number[], b: number[]): number`, `export function findCacheHit(query: number[], candidates: { id: string; embedding: number[] }[], threshold: number): { id: string; score: number } | null`

- [ ] **Step 1: Write the failing test**

```typescript
// shared/qa-cache.test.ts
import { describe, it, expect } from "vitest";
import { cosineSimilarity, findCacheHit } from "./qa-cache";

describe("cosineSimilarity", () => {
  it("vectores idénticos -> 1", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 10);
  });

  it("vectores ortogonales -> 0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  it("vectores opuestos -> -1", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it("escala no afecta similitud", () => {
    expect(cosineSimilarity([2, 0], [5, 0])).toBeCloseTo(1, 10);
  });

  it("vector cero -> 0 (evita división entre cero)", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("findCacheHit", () => {
  const query = [1, 0];

  it("sin candidatos -> null", () => {
    expect(findCacheHit(query, [], 0.9)).toBeNull();
  });

  it("candidato sobre el umbral -> hit con id y score", () => {
    const candidates = [{ id: "a", embedding: [1, 0.01] }];
    const hit = findCacheHit(query, candidates, 0.9);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe("a");
    expect(hit!.score).toBeGreaterThanOrEqual(0.9);
  });

  it("candidato bajo el umbral -> null", () => {
    const candidates = [{ id: "a", embedding: [0, 1] }];
    expect(findCacheHit(query, candidates, 0.9)).toBeNull();
  });

  it("con varios candidatos, devuelve el de mayor score sobre el umbral", () => {
    const candidates = [
      { id: "low", embedding: [1, 0.5] },
      { id: "high", embedding: [1, 0.001] },
    ];
    const hit = findCacheHit(query, candidates, 0.9);
    expect(hit!.id).toBe("high");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/qa-cache.test.ts`
Expected: FAIL — `Cannot find module './qa-cache'`

- [ ] **Step 3: Write the implementation**

```typescript
// shared/qa-cache.ts
// Caché semántico de preguntas (spec 2026-07-17-aula-virtual-qa-conferencia-design.md §3.1, §9).
// Sin pgvector: los embeddings viven en jsonb y la similitud se calcula aquí en JS
// sobre los candidatos ya cargados en memoria (server/services/qa-store.ts::getCacheCandidates).

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findCacheHit(
  query: number[],
  candidates: { id: string; embedding: number[] }[],
  threshold: number,
): { id: string; score: number } | null {
  let best: { id: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = cosineSimilarity(query, candidate.embedding);
    if (score >= threshold && (!best || score > best.score)) {
      best = { id: candidate.id, score };
    }
  }
  return best;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/qa-cache.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add shared/qa-cache.ts shared/qa-cache.test.ts
git commit -m "feat(aula-qa): add cosine similarity semantic cache lookup"
```

---

### Task 4: `shared/qa-rate-limit.ts` — 3-question live limit

**Files:**
- Create: `shared/qa-rate-limit.ts`
- Test: `shared/qa-rate-limit.test.ts`

**Interfaces:**
- Consumes: nothing (pure)
- Produces: `export const AULA_QA_LIVE_LIMIT = 3`, `export function evaluateQaLimit(liveCount: number, limit?: number): { allowed: boolean; remaining: number }` (default `limit = AULA_QA_LIVE_LIMIT`)

- [ ] **Step 1: Write the failing test**

```typescript
// shared/qa-rate-limit.test.ts
import { describe, it, expect } from "vitest";
import { evaluateQaLimit, AULA_QA_LIVE_LIMIT } from "./qa-rate-limit";

describe("evaluateQaLimit", () => {
  it("el límite por defecto es 3", () => {
    expect(AULA_QA_LIVE_LIMIT).toBe(3);
  });

  it("0 preguntas usadas -> permitido, quedan 3", () => {
    expect(evaluateQaLimit(0)).toEqual({ allowed: true, remaining: 3 });
  });

  it("2 preguntas usadas -> permitido, queda 1", () => {
    expect(evaluateQaLimit(2)).toEqual({ allowed: true, remaining: 1 });
  });

  it("3 preguntas usadas (límite alcanzado) -> no permitido, quedan 0", () => {
    expect(evaluateQaLimit(3)).toEqual({ allowed: false, remaining: 0 });
  });

  it("4 preguntas usadas -> no permitido, quedan 0 (nunca negativo)", () => {
    expect(evaluateQaLimit(4)).toEqual({ allowed: false, remaining: 0 });
  });

  it("acepta un límite custom", () => {
    expect(evaluateQaLimit(1, 5)).toEqual({ allowed: true, remaining: 4 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/qa-rate-limit.test.ts`
Expected: FAIL — `Cannot find module './qa-rate-limit'`

- [ ] **Step 3: Write the implementation**

```typescript
// shared/qa-rate-limit.ts
// Límite de 3 generaciones en vivo por alumno por conferencia (spec §3.1, §9).
// Un cache HIT NO cuenta aquí: el caller pasa liveCount = solo los MISS previos
// (server/services/qa-store.ts::countLiveGenerations ya filtra was_cache_hit=false).

export const AULA_QA_LIVE_LIMIT = 3;

export function evaluateQaLimit(
  liveCount: number,
  limit: number = AULA_QA_LIVE_LIMIT,
): { allowed: boolean; remaining: number } {
  const remaining = Math.max(0, limit - liveCount);
  return { allowed: liveCount < limit, remaining };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/qa-rate-limit.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add shared/qa-rate-limit.ts shared/qa-rate-limit.test.ts
git commit -m "feat(aula-qa): add 3-question live rate limit evaluator"
```

---

### Task 5: `shared/qa-hand.ts` — "mano levantada" TTL

**Files:**
- Create: `shared/qa-hand.ts`
- Test: `shared/qa-hand.test.ts`

**Interfaces:**
- Consumes: nothing (pure)
- Produces: `export const AULA_QA_HAND_TTL_SEC = 60`, `export function isHandRaised(until: Date | string | null, now: Date): boolean`, `export function nextHandExpiry(now: Date, ttlSec?: number): Date` (default `ttlSec = AULA_QA_HAND_TTL_SEC`)

- [ ] **Step 1: Write the failing test**

```typescript
// shared/qa-hand.test.ts
import { describe, it, expect } from "vitest";
import { isHandRaised, nextHandExpiry, AULA_QA_HAND_TTL_SEC } from "./qa-hand";

const NOW = new Date("2026-07-17T12:00:00Z");

describe("qa-hand", () => {
  it("el TTL es 60s", () => {
    expect(AULA_QA_HAND_TTL_SEC).toBe(60);
  });

  it("null -> no levantada", () => {
    expect(isHandRaised(null, NOW)).toBe(false);
  });

  it("until en el futuro -> levantada", () => {
    const until = new Date(NOW.getTime() + 30_000);
    expect(isHandRaised(until, NOW)).toBe(true);
  });

  it("until en el pasado -> no levantada (expiró)", () => {
    const until = new Date(NOW.getTime() - 1_000);
    expect(isHandRaised(until, NOW)).toBe(false);
  });

  it("until exactamente ahora -> no levantada (estrictamente mayor)", () => {
    expect(isHandRaised(NOW, NOW)).toBe(false);
  });

  it("acepta until como string ISO", () => {
    const until = new Date(NOW.getTime() + 5_000).toISOString();
    expect(isHandRaised(until, NOW)).toBe(true);
  });

  it("nextHandExpiry suma el TTL por defecto (60s)", () => {
    const expiry = nextHandExpiry(NOW);
    expect(expiry.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it("nextHandExpiry acepta un TTL custom", () => {
    const expiry = nextHandExpiry(NOW, 10);
    expect(expiry.getTime()).toBe(NOW.getTime() + 10_000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/qa-hand.test.ts`
Expected: FAIL — `Cannot find module './qa-hand'`

- [ ] **Step 3: Write the implementation**

```typescript
// shared/qa-hand.ts
// "Mano levantada": señal efímera de presencia que da boost de visibilidad en el
// feed de FAQ públicas (spec §4 qa_presence, §5 POST /api/aula/qa/hand, §9).
// Se refresca por heartbeat del cliente; expira sola si deja de latir.

export const AULA_QA_HAND_TTL_SEC = 60;

export function isHandRaised(until: Date | string | null, now: Date): boolean {
  if (until === null) return false;
  const untilDate = typeof until === "string" ? new Date(until) : until;
  return untilDate.getTime() > now.getTime();
}

export function nextHandExpiry(now: Date, ttlSec: number = AULA_QA_HAND_TTL_SEC): Date {
  return new Date(now.getTime() + ttlSec * 1000);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/qa-hand.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add shared/qa-hand.ts shared/qa-hand.test.ts
git commit -m "feat(aula-qa): add hand-raise presence TTL helpers"
```

---

### Task 6: `shared/qa-faq-order.ts` — FAQ feed ordering (hand-raised boost)

**Files:**
- Create: `shared/qa-faq-order.ts`
- Test: `shared/qa-faq-order.test.ts`

**Interfaces:**
- Consumes: nothing (pure; the caller — Task 11's `getFaqsForCourse`/Task 12's route — supplies `activeHandCodes` built from `isHandRaised` in Task 5)
- Produces: `export function orderFaqs<T extends { authorReferralCode?: string | null; sortOrder: number; createdAt: Date | string }>(faqs: T[], activeHandCodes: Set<string>, now: Date): T[]`

Note: `now` is accepted for interface symmetry with the rest of the module (matches the "inject now" convention used throughout this plan) but is not used internally — `activeHandCodes` is precomputed by the caller from `qa_presence` rows via `isHandRaised(row.handRaisedUntil, now)` (Task 5), so ordering itself is a pure function of the already-resolved set.

- [ ] **Step 1: Write the failing test**

```typescript
// shared/qa-faq-order.test.ts
import { describe, it, expect } from "vitest";
import { orderFaqs } from "./qa-faq-order";

const NOW = new Date("2026-07-17T12:00:00Z");

type Faq = { id: string; authorReferralCode?: string | null; sortOrder: number; createdAt: Date | string };

describe("orderFaqs", () => {
  it("mano levantada sube al principio, sin importar sortOrder", () => {
    const faqs: Faq[] = [
      { id: "a", authorReferralCode: "REF-A", sortOrder: 0, createdAt: NOW },
      { id: "b", authorReferralCode: "REF-B", sortOrder: 1, createdAt: NOW },
    ];
    const ordered = orderFaqs(faqs, new Set(["REF-B"]), NOW);
    expect(ordered.map((f) => f.id)).toEqual(["b", "a"]);
  });

  it("sin manos levantadas, ordena por sortOrder ascendente", () => {
    const faqs: Faq[] = [
      { id: "a", sortOrder: 2, createdAt: NOW },
      { id: "b", sortOrder: 0, createdAt: NOW },
      { id: "c", sortOrder: 1, createdAt: NOW },
    ];
    const ordered = orderFaqs(faqs, new Set(), NOW);
    expect(ordered.map((f) => f.id)).toEqual(["b", "c", "a"]);
  });

  it("empate en sortOrder, desempata por createdAt descendente (más reciente primero)", () => {
    const faqs: Faq[] = [
      { id: "old", sortOrder: 0, createdAt: new Date("2026-01-01") },
      { id: "new", sortOrder: 0, createdAt: new Date("2026-06-01") },
    ];
    const ordered = orderFaqs(faqs, new Set(), NOW);
    expect(ordered.map((f) => f.id)).toEqual(["new", "old"]);
  });

  it("dos autores con mano levantada mantienen entre ellos el orden por sortOrder", () => {
    const faqs: Faq[] = [
      { id: "a", authorReferralCode: "REF-A", sortOrder: 5, createdAt: NOW },
      { id: "b", authorReferralCode: "REF-B", sortOrder: 1, createdAt: NOW },
      { id: "c", authorReferralCode: "REF-C", sortOrder: 0, createdAt: NOW },
    ];
    const ordered = orderFaqs(faqs, new Set(["REF-A", "REF-B"]), NOW);
    expect(ordered.map((f) => f.id)).toEqual(["b", "a", "c"]);
  });

  it("no muta el arreglo original", () => {
    const faqs: Faq[] = [
      { id: "a", sortOrder: 1, createdAt: NOW },
      { id: "b", sortOrder: 0, createdAt: NOW },
    ];
    const original = [...faqs];
    orderFaqs(faqs, new Set(), NOW);
    expect(faqs).toEqual(original);
  });

  it("FAQ sin authorReferralCode (curated) nunca cuenta como mano levantada", () => {
    const faqs: Faq[] = [
      { id: "curated", authorReferralCode: null, sortOrder: 1, createdAt: NOW },
      { id: "promoted", authorReferralCode: "REF-X", sortOrder: 0, createdAt: NOW },
    ];
    const ordered = orderFaqs(faqs, new Set(["REF-X"]), NOW);
    expect(ordered.map((f) => f.id)).toEqual(["promoted", "curated"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run shared/qa-faq-order.test.ts`
Expected: FAIL — `Cannot find module './qa-faq-order'`

- [ ] **Step 3: Write the implementation**

```typescript
// shared/qa-faq-order.ts
// Orden del feed GET /api/aula/:slug/faqs (spec §5): las FAQ públicas cuyo autor
// tiene la mano levantada AHORA suben al principio (boost de visibilidad
// asincrónico, no una sala compartida), luego por sortOrder asc, luego por
// createdAt desc. `activeHandCodes` ya viene resuelto por el caller con
// shared/qa-hand.ts::isHandRaised sobre las filas de qa_presence.

export function orderFaqs<
  T extends { authorReferralCode?: string | null; sortOrder: number; createdAt: Date | string },
>(faqs: T[], activeHandCodes: Set<string>, _now: Date): T[] {
  const isHandUp = (faq: T) => !!faq.authorReferralCode && activeHandCodes.has(faq.authorReferralCode);

  return [...faqs].sort((a, b) => {
    const handA = isHandUp(a);
    const handB = isHandUp(b);
    if (handA !== handB) return handA ? -1 : 1;

    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    return createdB - createdA;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run shared/qa-faq-order.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add shared/qa-faq-order.ts shared/qa-faq-order.test.ts
git commit -m "feat(aula-qa): add FAQ feed ordering with hand-raise boost"
```

---

### Task 7: `server/lib/qa-consent.ts` — T&C consent gate

**Files:**
- Create: `server/lib/qa-consent.ts`
- Test: `server/lib/qa-consent.test.ts`

**Interfaces:**
- Consumes: nothing (pure)
- Produces: `export const AULA_QA_TC_VERSION = "2026-07-qa-v1"`, `export function hasValidConsent(consents: { tcVersion: string }[], required?: string): boolean` (default `required = AULA_QA_TC_VERSION`)

- [ ] **Step 1: Write the failing test**

```typescript
// server/lib/qa-consent.test.ts
import { describe, it, expect } from "vitest";
import { hasValidConsent, AULA_QA_TC_VERSION } from "./qa-consent";

describe("hasValidConsent", () => {
  it("la versión vigente es 2026-07-qa-v1", () => {
    expect(AULA_QA_TC_VERSION).toBe("2026-07-qa-v1");
  });

  it("sin consentimientos -> false", () => {
    expect(hasValidConsent([])).toBe(false);
  });

  it("consentimiento de la versión vigente -> true", () => {
    expect(hasValidConsent([{ tcVersion: "2026-07-qa-v1" }])).toBe(true);
  });

  it("consentimiento de una versión vieja -> false (subir T&C invalida)", () => {
    expect(hasValidConsent([{ tcVersion: "2026-06-old-v0" }])).toBe(false);
  });

  it("acepta una versión requerida custom", () => {
    expect(hasValidConsent([{ tcVersion: "v2" }], "v2")).toBe(true);
    expect(hasValidConsent([{ tcVersion: "v1" }], "v2")).toBe(false);
  });

  it("mezcla de versiones -> true si alguna coincide con la vigente", () => {
    expect(hasValidConsent([{ tcVersion: "v0" }, { tcVersion: "2026-07-qa-v1" }])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/lib/qa-consent.test.ts`
Expected: FAIL — `Cannot find module './qa-consent'`

- [ ] **Step 3: Write the implementation**

```typescript
// server/lib/qa-consent.ts
// Consentimiento T&C del Q&A (spec §5 GET|POST /api/aula/qa/consent, §9).
// Subir AULA_QA_TC_VERSION invalida automáticamente los consentimientos viejos:
// basta con que ninguna fila del alumno tenga la versión vigente.

export const AULA_QA_TC_VERSION = "2026-07-qa-v1";

export function hasValidConsent(
  consents: { tcVersion: string }[],
  required: string = AULA_QA_TC_VERSION,
): boolean {
  return consents.some((c) => c.tcVersion === required);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/lib/qa-consent.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add server/lib/qa-consent.ts server/lib/qa-consent.test.ts
git commit -m "feat(aula-qa): add T&C consent version gate"
```

---

### Task 8: `server/lib/qa-moderation.ts` — moderation result interpretation

**Files:**
- Create: `server/lib/qa-moderation.ts`
- Test: `server/lib/qa-moderation.test.ts`

**Interfaces:**
- Consumes: nothing (pure; shape matches OpenAI moderation API's `results[0]`)
- Produces: `export function interpretModeration(result: { flagged: boolean }): { offensive: boolean }`

- [ ] **Step 1: Write the failing test**

```typescript
// server/lib/qa-moderation.test.ts
import { describe, it, expect } from "vitest";
import { interpretModeration } from "./qa-moderation";

describe("interpretModeration", () => {
  it("flagged:true -> offensive:true", () => {
    expect(interpretModeration({ flagged: true })).toEqual({ offensive: true });
  });

  it("flagged:false -> offensive:false", () => {
    expect(interpretModeration({ flagged: false })).toEqual({ offensive: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/lib/qa-moderation.test.ts`
Expected: FAIL — `Cannot find module './qa-moderation'`

- [ ] **Step 3: Write the implementation**

```typescript
// server/lib/qa-moderation.ts
// Interpreta el resultado de OpenAI moderation (omni-moderation-latest, gratis).
// Aislado en una función pura para que server/routes/aula-qa.ts (Task 12) tenga
// una sola decisión de "¿esto es ofensivo?" testeable sin llamar a la API.

export function interpretModeration(result: { flagged: boolean }): { offensive: boolean } {
  return { offensive: result.flagged };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/lib/qa-moderation.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/lib/qa-moderation.ts server/lib/qa-moderation.test.ts
git commit -m "feat(aula-qa): add moderation result interpreter"
```

---

### Task 9: `server/lib/tutor-system-prompt.ts` — extract + extend system prompt with `instructorName`

**Files:**
- Create: `server/lib/tutor-system-prompt.ts`
- Test: `server/lib/tutor-system-prompt.test.ts`
- Modify: `server/services/tutor-ai.ts:31-50` (use the extracted builder; add `instructorName` param to `generateResponse`)

**Interfaces:**
- Consumes: nothing new (pure string builder)
- Produces: `export function buildTutorSystemPrompt(courseTitle: string, instructorName: string | null): string`
- Modifies existing: `TutorAIService.generateResponse` signature becomes:
  `generateResponse(question: string, courseTitle: string, courseContext: string, messageHistory: { role: string; content: string }[], instructorName: string | null, onChunk?: (textDelta: string) => void): Promise<string>`
  (new 5th parameter `instructorName` inserted before the existing optional `onChunk`, per spec §8: "Se extiende su firma para recibir `instructorName`")

- [ ] **Step 1: Write the failing test**

```typescript
// server/lib/tutor-system-prompt.test.ts
import { describe, it, expect } from "vitest";
import { buildTutorSystemPrompt } from "./tutor-system-prompt";

describe("buildTutorSystemPrompt", () => {
  it("incluye el título del curso", () => {
    const prompt = buildTutorSystemPrompt("Manejo de Estrés Laboral", null);
    expect(prompt).toContain("Manejo de Estrés Laboral");
  });

  it("sin instructorName, no rompe y sigue trayendo las reglas base", () => {
    const prompt = buildTutorSystemPrompt("Curso X", null);
    expect(prompt).toContain("Máximo 3-4 oraciones");
    expect(prompt).toContain("NO uses markdown");
  });

  it("con instructorName, lo interpola en el prompt", () => {
    const prompt = buildTutorSystemPrompt("Curso X", "Psic. Yuridia Iturriaga");
    expect(prompt).toContain("Psic. Yuridia Iturriaga");
  });

  it("mantiene la regla de redirigir fuera de tema", () => {
    const prompt = buildTutorSystemPrompt("Curso X", "Alguien");
    expect(prompt).toContain("fuera del tema del curso, redirige");
  });

  it("mantiene la regla de nunca decir que es una IA", () => {
    const prompt = buildTutorSystemPrompt("Curso X", null);
    expect(prompt).toContain("Nunca digas que eres una IA");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/lib/tutor-system-prompt.test.ts`
Expected: FAIL — `Cannot find module './tutor-system-prompt'`

- [ ] **Step 3: Write the implementation**

Extract the hardcoded string from `server/services/tutor-ai.ts:38-50` verbatim, parameterizing the instructor name:

```typescript
// server/lib/tutor-system-prompt.ts
// System prompt del Tutor IA / Q&A de conferencia, extraído de
// server/services/tutor-ai.ts para reusarlo también en el Q&A en vivo del Aula
// Virtual (server/routes/aula-qa.ts), interpolando instructorName para que la
// respuesta hablada suene coherente con quien dio la conferencia (spec §8).

export function buildTutorSystemPrompt(courseTitle: string, instructorName: string | null): string {
  const instructorLine = instructorName
    ? `Tu nombre es ${instructorName}, instructor del curso "${courseTitle}" en la plataforma Ceduverse.`
    : `Tu nombre es el instructor del curso "${courseTitle}" en la plataforma Ceduverse.`;

  return `Eres un instructor experto en capacitación laboral STPS de México. ${instructorLine}

Reglas estrictas:
- Responde SIEMPRE en español mexicano, tono conversacional y profesional
- Máximo 3-4 oraciones (tu respuesta será hablada por un avatar, debe ser concisa)
- NO uses markdown, listas, viñetas ni formato especial — solo texto plano hablado
- Da ejemplos prácticos del contexto laboral mexicano
- Si preguntan algo fuera del tema del curso, redirige amablemente al tema
- Usa expresiones naturales mexicanas pero profesionales
- Nunca digas que eres una IA o un clon digital`;
}
```

Note: `courseContext` is deliberately NOT part of this builder — `tutor-ai.ts` appends it separately (see Step 5) so the extracted function stays a pure, easily-testable string builder independent of DB-sourced content.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/lib/tutor-system-prompt.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Modify `server/services/tutor-ai.ts` to use the extracted builder and accept `instructorName`**

Replace lines 1-50 (imports through the hardcoded `systemPrompt` template literal) with:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db";
import { courseModules } from "@shared/schema";
import { eq } from "drizzle-orm";
import { buildTutorSystemPrompt } from "../lib/tutor-system-prompt";

const anthropic = new Anthropic();

export class TutorAIService {
  get isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async getCourseContext(courseId: string): Promise<string> {
    const modules = await db.select().from(courseModules).where(eq(courseModules.courseId, courseId));

    if (modules.length === 0) return "Curso de capacitación profesional en Ceduverse.";

    const moduleTexts = modules
      .sort((a, b) => a.order - b.order)
      .map((m) => {
        const plainContent = m.contentHtml
          ? m.contentHtml.replace(/<[^>]*>/g, "").substring(0, 500)
          : "";
        return `Módulo ${m.order}: ${m.title}\n${plainContent}`;
      })
      .join("\n\n");

    return moduleTexts.substring(0, 4000);
  }

  async generateResponse(
    question: string,
    courseTitle: string,
    courseContext: string,
    messageHistory: { role: string; content: string }[],
    instructorName: string | null = null,
    onChunk?: (textDelta: string) => void,
  ): Promise<string> {
    const systemPrompt = `${buildTutorSystemPrompt(courseTitle, instructorName)}

Contexto del curso:
${courseContext}`;
```

The rest of the method (`recentHistory` through the closing `return textBlock?.text || ...`, currently lines 52-83) stays unchanged. Confirm the file still ends with:

```typescript
export const tutorAIService = new TutorAIService();
```

- [ ] **Step 6: Update the one existing caller so it still compiles**

`server/routes/heygen.ts:688` and `:706` call `tutorAIService.generateResponse(question, courseTitle || "Curso de Capacitación", courseContext, history.map(...), (delta) => {...})` and `generateResponse(question, courseTitle || "Curso de Capacitación", courseContext, history.map(...))` respectively — both currently pass `onChunk` (or nothing) as the 5th argument. Since `instructorName` is now the 5th parameter, update both call sites to pass `null` for `instructorName` explicitly and move `onChunk` to the 6th slot:

At `server/routes/heygen.ts:688-694`:
```typescript
        const answer = await tutorAIService.generateResponse(
          question, courseTitle || "Curso de Capacitación", courseContext,
          history.map(m => ({ role: m.role, content: m.content })),
          null,
          (delta) => {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          },
        );
```

At `server/routes/heygen.ts:706-709`:
```typescript
      const answer = await tutorAIService.generateResponse(
        question, courseTitle || "Curso de Capacitación", courseContext,
        history.map(m => ({ role: m.role, content: m.content })),
        null,
      );
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `server/services/tutor-ai.ts` or `server/routes/heygen.ts`.

- [ ] **Step 8: Run full test suite to confirm no regression**

Run: `npm test`
Expected: PASS (all existing + new tests green)

- [ ] **Step 9: Commit**

```bash
git add server/lib/tutor-system-prompt.ts server/lib/tutor-system-prompt.test.ts server/services/tutor-ai.ts server/routes/heygen.ts
git commit -m "refactor(tutor-ai): extract system prompt builder, add instructorName param to generateResponse"
```

---

### Task 10: `server/services/qa-openai.ts` — STT, embeddings, moderation, TTS

**Files:**
- Create: `server/services/qa-openai.ts`

**Interfaces:**
- Consumes: `OPENAI_API_KEY` env var; `voiceForInstructor` shape from Task 2 (`{ voice, instructions }`) is passed in by the caller, not imported here.
- Produces:
  - `export function isQaOpenAiConfigured(): boolean`
  - `export async function transcribeAudio(buf: Buffer, filename: string): Promise<string>`
  - `export async function embedText(text: string): Promise<number[]>`
  - `export async function moderateText(text: string): Promise<{ flagged: boolean }>`
  - `export async function synthesizeAnswer(text: string, voice: string, instructions: string): Promise<Buffer>`

- [ ] **Step 1: Write the implementation**

```typescript
// server/services/qa-openai.ts
// Pipeline STT -> embed -> moderate -> TTS del Q&A de conferencia (spec §3.1, §5, §9).
// Reusa el patrón de openai.audio.speech.create de server/audio-generator.ts:64-76,
// con la voz/instructions por instructor (shared/instructor-voice.ts) en vez de "ash" fijo.
import OpenAI from "openai";
import { toFile } from "openai/uploads";

const STT_MODEL = "gpt-4o-transcribe";
const MODERATION_MODEL = "omni-moderation-latest";
const EMBED_MODEL = "text-embedding-3-small";
const TTS_MODEL = "gpt-4o-mini-tts";

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function isQaOpenAiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function transcribeAudio(buf: Buffer, filename: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("OPENAI_API_KEY no configurada");

  const file = await toFile(buf, filename);
  const transcription = await client.audio.transcriptions.create({
    model: STT_MODEL,
    file,
  });
  return transcription.text.trim();
}

export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  if (!client) throw new Error("OPENAI_API_KEY no configurada");

  const response = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export async function moderateText(text: string): Promise<{ flagged: boolean }> {
  const client = getClient();
  if (!client) throw new Error("OPENAI_API_KEY no configurada");

  const response = await client.moderations.create({
    model: MODERATION_MODEL,
    input: text,
  });
  return { flagged: response.results[0]?.flagged ?? false };
}

export async function synthesizeAnswer(text: string, voice: string, instructions: string): Promise<Buffer> {
  const client = getClient();
  if (!client) throw new Error("OPENAI_API_KEY no configurada");

  const response = await client.audio.speech.create({
    model: TTS_MODEL,
    voice: voice as any,
    input: text,
    instructions,
    response_format: "mp3",
  });
  return Buffer.from(await response.arrayBuffer());
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `server/services/qa-openai.ts`. If `openai/uploads` `toFile` import path errors, check the installed `openai` package version's export (`package.json:83` pins `"openai": "^6.32.0"`) — `toFile` is exported from the package root in v6 as well (`import { toFile } from "openai"` is also valid); use whichever resolves without a TS error.

- [ ] **Step 3: Written manual smoke check**

With `OPENAI_API_KEY` set locally, run a one-off script via `npx tsx`:
```bash
cat <<'EOF' > /tmp/qa-openai-smoke.ts
import { embedText, moderateText } from "./server/services/qa-openai";
(async () => {
  const emb = await embedText("¿Cómo prevengo el estrés laboral?");
  console.log("embedding length:", emb.length);
  const mod = await moderateText("¿Cómo prevengo el estrés laboral?");
  console.log("moderation flagged:", mod.flagged);
})();
EOF
npx tsx /tmp/qa-openai-smoke.ts
```
Expected: `embedding length: 1536`, `moderation flagged: false`. (STT/TTS require an actual audio file — verified end-to-end in Task 12's manual smoke check instead.)

- [ ] **Step 4: Commit**

```bash
git add server/services/qa-openai.ts
git commit -m "feat(aula-qa): add OpenAI STT, embeddings, moderation, TTS service"
```

---

### Task 11: `server/services/qa-store.ts` — drizzle data access

**Files:**
- Create: `server/services/qa-store.ts`

**Interfaces:**
- Consumes: `conferenceFaqs`, `conferenceQaLog`, `conferenceQaConsent`, `qaPresence`, `accounts` from `@shared/schema` (Task 1); `AULA_QA_TC_VERSION` from `server/lib/qa-consent.ts` (Task 7, used only as the default in callers, not imported here); `nextHandExpiry`/`AULA_QA_HAND_TTL_SEC` from `shared/qa-hand.ts` (Task 5)
- Produces:
  - `export async function getFaqsForCourse(courseSlug: string): Promise<Array<typeof conferenceFaqs.$inferSelect>>` — active FAQ for the course PLUS all `isPublic=true` rows across courses
  - `export async function getConsents(userId: string): Promise<{ tcVersion: string }[]>`
  - `export async function insertConsent(userId: string, tcVersion: string): Promise<void>`
  - `export async function countLiveGenerations(userId: string, courseSlug: string): Promise<number>` — count of `conferenceQaLog` rows where `wasCacheHit=false AND deflected=false` (moderated/discarded rows never reach this table per the invariant, and cache hits/deflections must not consume the limit)
  - `export async function upsertHand(userId: string, until: Date): Promise<void>`
  - `export async function getActiveHandReferralCodes(now: Date): Promise<Set<string>>` — joins `qaPresence` → `accounts.referralCode` where `handRaisedUntil > now`
  - `export async function getCacheCandidates(courseSlug: string): Promise<{ id: string; embedding: number[] }[]>` — union of `conferenceFaqs` (active, matching course OR public) and `conferenceQaLog` (matching course, not deflected) rows that have a non-null `embedding`
  - `export async function insertQaLog(row: { userId: string; courseSlug: string; questionTranscript: string; referralCode: string | null; embedding: number[] | null; answerText: string | null; answerAudioUrl: string | null; wasCacheHit: boolean; deflected: boolean }): Promise<void>`

- [ ] **Step 1: Write the implementation**

```typescript
// server/services/qa-store.ts
// Acceso a datos del Q&A de conferencia (spec §4, §5). Sigue el patrón de
// server/routes/heygen.ts (db.select/insert/update directo con drizzle, sin
// capa de repositorio adicional).
import { db } from "../db";
import { and, eq, gt, inArray, or, isNotNull } from "drizzle-orm";
import { conferenceFaqs, conferenceQaLog, conferenceQaConsent, qaPresence, accounts } from "@shared/schema";

export async function getFaqsForCourse(courseSlug: string) {
  return db
    .select()
    .from(conferenceFaqs)
    .where(
      and(
        eq(conferenceFaqs.active, true),
        or(eq(conferenceFaqs.courseSlug, courseSlug), eq(conferenceFaqs.isPublic, true)),
      ),
    );
}

export async function getConsents(userId: string): Promise<{ tcVersion: string }[]> {
  const rows = await db
    .select({ tcVersion: conferenceQaConsent.tcVersion })
    .from(conferenceQaConsent)
    .where(eq(conferenceQaConsent.userId, userId));
  return rows;
}

export async function insertConsent(userId: string, tcVersion: string): Promise<void> {
  await db
    .insert(conferenceQaConsent)
    .values({ userId, tcVersion })
    .onConflictDoNothing();
}

export async function countLiveGenerations(userId: string, courseSlug: string): Promise<number> {
  const rows = await db
    .select()
    .from(conferenceQaLog)
    .where(
      and(
        eq(conferenceQaLog.userId, userId),
        eq(conferenceQaLog.courseSlug, courseSlug),
        eq(conferenceQaLog.wasCacheHit, false),
        eq(conferenceQaLog.deflected, false),
      ),
    );
  return rows.length;
}

export async function upsertHand(userId: string, until: Date): Promise<void> {
  await db
    .insert(qaPresence)
    .values({ userId, handRaisedUntil: until })
    .onConflictDoUpdate({ target: qaPresence.userId, set: { handRaisedUntil: until } });
}

export async function getActiveHandReferralCodes(now: Date): Promise<Set<string>> {
  const rows = await db
    .select({ referralCode: accounts.referralCode })
    .from(qaPresence)
    .innerJoin(accounts, eq(accounts.id, qaPresence.userId))
    .where(and(gt(qaPresence.handRaisedUntil, now), isNotNull(accounts.referralCode)));

  return new Set(rows.map((r) => r.referralCode).filter((code): code is string => !!code));
}

export async function getCacheCandidates(courseSlug: string): Promise<{ id: string; embedding: number[] }[]> {
  const faqRows = await db
    .select({ id: conferenceFaqs.id, embedding: conferenceFaqs.embedding })
    .from(conferenceFaqs)
    .where(
      and(
        eq(conferenceFaqs.active, true),
        or(eq(conferenceFaqs.courseSlug, courseSlug), eq(conferenceFaqs.isPublic, true)),
        isNotNull(conferenceFaqs.embedding),
      ),
    );

  const logRows = await db
    .select({ id: conferenceQaLog.id, embedding: conferenceQaLog.embedding })
    .from(conferenceQaLog)
    .where(
      and(
        eq(conferenceQaLog.courseSlug, courseSlug),
        eq(conferenceQaLog.deflected, false),
        isNotNull(conferenceQaLog.embedding),
      ),
    );

  return [...faqRows, ...logRows].filter(
    (row): row is { id: string; embedding: number[] } => Array.isArray(row.embedding),
  );
}

export async function insertQaLog(row: {
  userId: string;
  courseSlug: string;
  questionTranscript: string;
  referralCode: string | null;
  embedding: number[] | null;
  answerText: string | null;
  answerAudioUrl: string | null;
  wasCacheHit: boolean;
  deflected: boolean;
}): Promise<void> {
  await db.insert(conferenceQaLog).values(row);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `server/services/qa-store.ts`. If `onConflictDoNothing`/`onConflictDoUpdate` signatures differ for this drizzle-orm version (`^0.45.2`, per `package.json:65`), check an existing usage in the repo with `grep -rn "onConflictDo" server/` and match that call shape exactly.

- [ ] **Step 3: Commit**

```bash
git add server/services/qa-store.ts
git commit -m "feat(aula-qa): add drizzle data access for conference Q&A"
```

---

### Task 12: `server/routes/aula-qa.ts` — endpoints + wiring

**Files:**
- Create: `server/routes/aula-qa.ts`
- Modify: `server/routes.ts` (add import near line 65 alongside `import { registerHeygenRoutes } from "./routes/heygen";`, add call near line 1068 alongside `registerHeygenRoutes(app);`)

**Interfaces:**
- Consumes:
  - `requireAuth` from `../auth` (used the same way as `server/routes/heygen.ts:2,634`, exposing `req.supabaseUserId!`)
  - `db`, `courses`, `accounts` from `@shared/schema`/`../db`
  - `tutorAIService.getCourseContext(courseId)`, `tutorAIService.generateResponse(question, courseTitle, courseContext, history, instructorName, onChunk?)` (Task 9)
  - `voiceForInstructor` (Task 2), `cosineSimilarity`/`findCacheHit` (Task 3), `evaluateQaLimit`/`AULA_QA_LIVE_LIMIT` (Task 4), `isHandRaised`/`nextHandExpiry`/`AULA_QA_HAND_TTL_SEC` (Task 5), `orderFaqs` (Task 6), `hasValidConsent`/`AULA_QA_TC_VERSION` (Task 7), `interpretModeration` (Task 8), `transcribeAudio`/`embedText`/`moderateText`/`synthesizeAnswer`/`isQaOpenAiConfigured` (Task 10), all of `server/services/qa-store.ts` (Task 11)
  - `r2Storage.uploadBuffer(buffer, key, contentType)` + `r2Storage.isConfigured` (`server/services/r2-storage.ts:23-37,20`)
  - `tutorAIService.isConfigured` (`server/services/tutor-ai.ts:9-11`)
- Produces (consumed by Task 14's client hook/component):
  - `GET /api/aula/:slug/faqs` → `200 { faqs: Array<{ id: string; question: string; answerAudioUrl: string | null; authorReferralCode: string | null; isPublic: boolean }> }`
  - `GET /api/aula/qa/consent` → `200 { accepted: boolean; tcVersion: string }`
  - `POST /api/aula/qa/consent` → `200 { accepted: true; tcVersion: string }`
  - `POST /api/aula/qa/hand` (body `{ raised: boolean }`) → `200 { handRaisedUntil: string | null }`
  - `POST /api/aula/:slug/qa` (multipart, field `audio`, optional field `text` for the no-mic fallback) → `200 { transcript: string; answerText: string; answerAudioUrl: string | null; cacheHit: boolean; deflected: boolean; moderated: boolean; remaining: number }` or `403 { needsConsent: true }` or `413 { message }` or `200 { needsRetry: true }` or `503 { message }`

- [ ] **Step 1: Write `server/routes/aula-qa.ts`**

```typescript
// server/routes/aula-qa.ts
// Q&A al final de la conferencia del Aula Virtual (spec
// docs/superpowers/specs/2026-07-17-aula-virtual-qa-conferencia-design.md §5).
// Pipeline: auth -> consentimiento -> tamaño -> STT -> moderación -> embed ->
// caché semántico -> límite -> generateResponse -> TTS -> R2 -> log.
import type { Express } from "express";
import multer from "multer";
import { requireAuth } from "../auth";
import { db } from "../db";
import { courses, accounts } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { tutorAIService } from "../services/tutor-ai";
import { r2Storage } from "../services/r2-storage";
import {
  isQaOpenAiConfigured,
  transcribeAudio,
  embedText,
  moderateText,
  synthesizeAnswer,
} from "../services/qa-openai";
import {
  getFaqsForCourse,
  getConsents,
  insertConsent,
  countLiveGenerations,
  upsertHand,
  getActiveHandReferralCodes,
  getCacheCandidates,
  insertQaLog,
} from "../services/qa-store";

import { voiceForInstructor } from "@shared/instructor-voice";
import { findCacheHit } from "@shared/qa-cache";
import { evaluateQaLimit } from "@shared/qa-rate-limit";
import { isHandRaised, nextHandExpiry, AULA_QA_HAND_TTL_SEC } from "@shared/qa-hand";
import { orderFaqs } from "@shared/qa-faq-order";
import { hasValidConsent, AULA_QA_TC_VERSION } from "../lib/qa-consent";
import { interpretModeration } from "../lib/qa-moderation";

const AULA_QA_CACHE_SIM_THRESH = 0.9;
const AULA_QA_MAX_RECORD_SEC = 40;
const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // ~4 MB, cota gruesa de 40s de audio comprimido

const qaAudioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
});

const RECHAZO_OFENSIVO =
  "Prefiero no responder a eso. Si tienes una duda sobre el tema de la conferencia, con gusto te ayudo.";
const INVITACION_LIMITE =
  "Ya usaste tus 3 preguntas en vivo de esta conferencia. Para seguir profundizando y conseguir tu DC-3, visita el Tutor IA de este curso.";

async function getReferralCode(userId: string): Promise<string | null> {
  const [account] = await db.select({ referralCode: accounts.referralCode }).from(accounts).where(eq(accounts.id, userId));
  return account?.referralCode ?? null;
}

export function registerAulaQaRoutes(app: Express) {
  app.get("/api/aula/:slug/faqs", async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const now = new Date();
      const faqs = await getFaqsForCourse(slug);
      const activeHandCodes = await getActiveHandReferralCodes(now);
      const ordered = orderFaqs(faqs, activeHandCodes, now);

      res.json({
        faqs: ordered.map((f) => ({
          id: f.id,
          question: f.question,
          answerText: f.answerText,
          answerAudioUrl: f.answerAudioUrl,
          authorReferralCode: f.authorReferralCode,
          isPublic: f.isPublic,
        })),
      });
    } catch (err) { next(err); }
  });

  app.get("/api/aula/qa/consent", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const consents = await getConsents(userId);
      res.json({ accepted: hasValidConsent(consents), tcVersion: AULA_QA_TC_VERSION });
    } catch (err) { next(err); }
  });

  app.post("/api/aula/qa/consent", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      await insertConsent(userId, AULA_QA_TC_VERSION);
      res.json({ accepted: true, tcVersion: AULA_QA_TC_VERSION });
    } catch (err) { next(err); }
  });

  app.post("/api/aula/qa/hand", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { raised } = z.object({ raised: z.boolean() }).parse(req.body);
      const now = new Date();

      if (!raised) {
        await upsertHand(userId, now); // ya pasado -> isHandRaised da false de inmediato
        return res.json({ handRaisedUntil: null });
      }

      const until = nextHandExpiry(now, AULA_QA_HAND_TTL_SEC);
      await upsertHand(userId, until);
      res.json({ handRaisedUntil: until.toISOString() });
    } catch (err) { next(err); }
  });

  app.post("/api/aula/:slug/qa", requireAuth, qaAudioUpload.single("audio"), async (req, res, next) => {
    try {
      if (!tutorAIService.isConfigured || !isQaOpenAiConfigured()) {
        return res.status(503).json({ message: "El Q&A por voz no está disponible ahora" });
      }

      const slug = req.params.slug as string;
      const userId = req.supabaseUserId!;

      const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const consents = await getConsents(userId);
      if (!hasValidConsent(consents)) {
        return res.status(403).json({ needsConsent: true, tcVersion: AULA_QA_TC_VERSION });
      }

      const textFallback = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      let transcript: string;

      if (req.file) {
        transcript = await transcribeAudio(req.file.buffer, req.file.originalname || "question.webm");
      } else if (textFallback) {
        transcript = textFallback;
      } else {
        return res.status(400).json({ message: "No se recibió audio ni texto" });
      }

      if (!transcript) {
        return res.json({ needsRetry: true });
      }

      const moderation = await moderateText(transcript);
      const { offensive } = interpretModeration(moderation);
      if (offensive) {
        // Ofensivo: se descarta de inmediato. No se inserta en conference_qa_log,
        // no cuenta al límite, no se promueve (invariante de la spec §7).
        return res.json({
          moderated: true,
          transcript,
          answerText: RECHAZO_OFENSIVO,
          answerAudioUrl: null,
          cacheHit: false,
          deflected: false,
          remaining: evaluateQaLimit(await countLiveGenerations(userId, slug)).remaining,
        });
      }

      const embedding = await embedText(transcript);
      const candidates = await getCacheCandidates(slug);
      const cacheHit = findCacheHit(embedding, candidates, AULA_QA_CACHE_SIM_THRESH);

      const { voice, instructions } = voiceForInstructor(course.instructor);

      if (cacheHit) {
        // HIT no descuenta del límite ni se re-inserta; el caller ya tiene el
        // texto/audio cacheados en conference_faqs o conference_qa_log.
        const remaining = evaluateQaLimit(await countLiveGenerations(userId, slug)).remaining;
        // Recuperar el texto/audio cacheado: buscamos primero en FAQ, luego en log.
        const faqs = await getFaqsForCourse(slug);
        const faqHit = faqs.find((f) => f.id === cacheHit.id);
        return res.json({
          transcript,
          answerText: faqHit?.answerText ?? "",
          answerAudioUrl: faqHit?.answerAudioUrl ?? null,
          cacheHit: true,
          deflected: false,
          moderated: false,
          remaining,
        });
      }

      const liveCount = await countLiveGenerations(userId, slug);
      const { allowed, remaining } = evaluateQaLimit(liveCount);
      if (!allowed) {
        const referralCode = await getReferralCode(userId);
        await insertQaLog({
          userId,
          courseSlug: slug,
          questionTranscript: transcript,
          referralCode,
          embedding,
          answerText: INVITACION_LIMITE,
          answerAudioUrl: null,
          wasCacheHit: false,
          deflected: true,
        });
        return res.json({
          transcript,
          answerText: INVITACION_LIMITE,
          answerAudioUrl: null,
          cacheHit: false,
          deflected: true,
          moderated: false,
          remaining: 0,
        });
      }

      const courseContext = await tutorAIService.getCourseContext(course.id);
      const answerText = await tutorAIService.generateResponse(
        transcript,
        course.title,
        courseContext,
        [],
        course.instructor,
      );

      const audioBuffer = await synthesizeAnswer(answerText, voice, instructions);
      const hash = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const key = `audio/qa-${hash}.mp3`;
      const answerAudioUrl = r2Storage.isConfigured
        ? await r2Storage.uploadBuffer(audioBuffer, key, "audio/mpeg")
        : null;

      const referralCode = await getReferralCode(userId);
      await insertQaLog({
        userId,
        courseSlug: slug,
        questionTranscript: transcript,
        referralCode,
        embedding,
        answerText,
        answerAudioUrl,
        wasCacheHit: false,
        deflected: false,
      });

      res.json({
        transcript,
        answerText,
        answerAudioUrl,
        cacheHit: false,
        deflected: false,
        moderated: false,
        remaining: remaining - 1,
      });
    } catch (err) { next(err); }
  });
}
```

- [ ] **Step 2: Wire into `server/routes.ts`**

Add the import next to the existing `registerHeygenRoutes` import (near `server/routes.ts:65`):
```typescript
import { registerAulaQaRoutes } from "./routes/aula-qa";
```

Add the call next to `registerHeygenRoutes(app);` (near `server/routes.ts:1068`):
```typescript
  registerAulaQaRoutes(app);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `server/routes/aula-qa.ts` or `server/routes.ts`. Pay attention to the `req.file.originalname` type (Express.Multer.File — already used the same way at `server/routes.ts:834-838`) and to `zod` import style (`import { z } from "zod"` matches `server/routes/heygen.ts:26`, not `zod/v4` used in `shared/schema.ts:24` — keep them separate, do not mix).

- [ ] **Step 4: Written manual smoke check**

With the dev server running (`npm run dev`) and `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/R2 vars set, and at least one seeded course with a `slug`:
```bash
# 1. FAQ feed (no auth required)
curl -s http://localhost:5000/api/aula/some-course-slug/faqs | jq .

# 2. Consent check (requires a valid session cookie/token — use the browser's
#    devtools to copy an authenticated request, or curl with -b "connect.sid=...")
curl -s -b "connect.sid=<paste>" http://localhost:5000/api/aula/qa/consent | jq .

# 3. Accept consent
curl -s -b "connect.sid=<paste>" -X POST http://localhost:5000/api/aula/qa/consent | jq .

# 4. Text-fallback question (no mic, exercises the full pipeline except STT)
curl -s -b "connect.sid=<paste>" -X POST http://localhost:5000/api/aula/some-course-slug/qa \
  -F "text=¿Cómo prevengo el estrés laboral?" | jq .
```
Expected: step 1 returns `{"faqs":[]}` or seeded FAQ; step 2 returns `{"accepted":false,...}` before consent and `{"accepted":true,...}` after step 3; step 4 returns a JSON body with `transcript`, non-empty `answerText`, `cacheHit:false`, `deflected:false`, `remaining:2` on first call. Confirm in the server logs (or Postgres) that a row was inserted into `conference_qa_log`.

- [ ] **Step 5: Commit**

```bash
git add server/routes/aula-qa.ts server/routes.ts
git commit -m "feat(aula-qa): add Q&A endpoints (faqs, consent, hand, voice pipeline)"
```

---

### Task 13: `client/src/hooks/usePushToTalk.ts` — MediaRecorder push-to-talk hook

**Files:**
- Create: `client/src/hooks/usePushToTalk.ts`

**Interfaces:**
- Consumes: browser `MediaRecorder`/`navigator.mediaDevices.getUserMedia`; `AULA_QA_MAX_RECORD_SEC = 40` (inlined here as a local constant matching the spec's global parameter — the client does not import server files)
- Produces: `export function usePushToTalk(): { recording: boolean; start: () => Promise<void>; stop: () => void; blob: Blob | null; error: string | null; supported: boolean }`

- [ ] **Step 1: Write the implementation**

```typescript
// client/src/hooks/usePushToTalk.ts
// Push-to-talk audio-only para el Q&A del Aula Virtual (spec §6). Auto-stop a
// los 40s (AULA_QA_MAX_RECORD_SEC) para acotar el costo de STT/TTS por pregunta.
import { useRef, useState, useCallback, useEffect } from "react";

const AULA_QA_MAX_RECORD_SEC = 40;

export interface UsePushToTalkResult {
  recording: boolean;
  start: () => Promise<void>;
  stop: () => void;
  blob: Blob | null;
  error: string | null;
  supported: boolean;
}

export function usePushToTalk(): UsePushToTalkResult {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supported = typeof window !== "undefined"
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== "undefined";

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    if (!supported) {
      setError("Tu navegador no soporta grabación de audio");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBlob(finalBlob);
        setRecording(false);
        cleanupStream();
      };

      recorder.start();
      setRecording(true);

      autoStopTimerRef.current = setTimeout(() => {
        stop();
      }, AULA_QA_MAX_RECORD_SEC * 1000);
    } catch (err: any) {
      setError(err?.message || "No se pudo acceder al micrófono");
      setRecording(false);
      cleanupStream();
    }
  }, [supported, cleanupStream, stop]);

  useEffect(() => () => {
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    cleanupStream();
  }, [cleanupStream]);

  return { recording, start, stop, blob, error, supported };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `client/src/hooks/usePushToTalk.ts`.

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/usePushToTalk.ts
git commit -m "feat(aula-qa): add push-to-talk MediaRecorder hook"
```

---

### Task 14: `client/src/components/ConferenceQA.tsx` — the Q&A session UI

**Files:**
- Create: `client/src/components/ConferenceQA.tsx`

**Interfaces:**
- Consumes:
  - `usePushToTalk()` from Task 13 (`{ recording, start, stop, blob, error, supported }`)
  - `GET /api/aula/:slug/faqs` → `{ faqs: Array<{ id, question, answerText, answerAudioUrl, authorReferralCode, isPublic }> }` (Task 12)
  - `GET /api/aula/qa/consent` → `{ accepted, tcVersion }`, `POST /api/aula/qa/consent` → `{ accepted, tcVersion }` (Task 12)
  - `POST /api/aula/qa/hand` (body `{ raised: boolean }`) → `{ handRaisedUntil }` (Task 12)
  - `POST /api/aula/:slug/qa` (multipart `audio` or form field `text`) → `{ transcript, answerText, answerAudioUrl, cacheHit, deflected, moderated, remaining }` (Task 12)
  - `apiRequest` helper — same one used throughout `curso-virtual.tsx` (e.g. `client/src/pages/curso-virtual.tsx:587`, `PATCH /api/me/courses/:id/listening`); import path is `@/lib/queryClient` per existing convention in that file — confirm the exact import line in `curso-virtual.tsx`'s header before use, and mirror it.
- Produces: `export function ConferenceQA({ slug, courseId, instructor, onSessionClosed }: { slug: string; courseId: string; instructor: string | null; onSessionClosed: () => void }): JSX.Element` — component. Calls `onSessionClosed()` exactly once, when the 30s idle farewell fires (or immediately if the limit is exhausted and the alumno has no more to ask — still gated by the 30s idle timer per spec §6, which does not special-case limit-exhaustion for the timer itself).

- [ ] **Step 1: Confirm the exact `apiRequest`/query-client import used in `curso-virtual.tsx`**

Before writing the component, grep the top of `client/src/pages/curso-virtual.tsx` for its `apiRequest` and `useQuery`/`useMutation` imports and copy the exact import specifiers (module path + named exports) into `ConferenceQA.tsx`. Do not guess the path.

- [ ] **Step 2: Write the implementation**

```typescript
// client/src/components/ConferenceQA.tsx
// Q&A al final de la conferencia del Aula Virtual (spec §6).
// Sesión que no termina de golpe: al completar el audio se muestra este
// componente; permanece "abierta" hasta 30s sin nueva pregunta, entonces
// reproduce la despedida del instructor y llama onSessionClosed() para que
// curso-virtual.tsx revele el CTA de diploma (stps-next-steps).
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mic, Square, Hand, Sparkles } from "lucide-react";
import { Link } from "wouter";

const AULA_QA_IDLE_FAREWELL_SEC = 30;
const AULA_QA_HAND_HEARTBEAT_MS = 30_000; // AULA_QA_HAND_TTL_SEC/2

interface Faq {
  id: string;
  question: string;
  answerText: string;
  answerAudioUrl: string | null;
  authorReferralCode: string | null;
  isPublic: boolean;
}

interface QaResponse {
  transcript?: string;
  answerText: string;
  answerAudioUrl: string | null;
  cacheHit: boolean;
  deflected: boolean;
  moderated: boolean;
  remaining: number;
  needsConsent?: boolean;
  needsRetry?: boolean;
}

export function ConferenceQA({
  slug,
  courseId,
  instructor,
  onSessionClosed,
}: {
  slug: string;
  courseId: string;
  instructor: string | null;
  onSessionClosed: () => void;
}) {
  const queryClient = useQueryClient();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [remaining, setRemaining] = useState(3);
  const [lastAnswer, setLastAnswer] = useState<QaResponse | null>(null);
  const [textFallback, setTextFallback] = useState("");
  const [sessionClosed, setSessionClosed] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [supported, setSupported] = useState(true);

  const { data: faqData } = useQuery<{ faqs: Faq[] }>({
    queryKey: [`/api/aula/${slug}/faqs`],
  });

  const { data: consentData } = useQuery<{ accepted: boolean; tcVersion: string }>({
    queryKey: ["/api/aula/qa/consent"],
  });

  const consentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/aula/qa/consent", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aula/qa/consent"] });
      setShowConsentModal(false);
    },
  });

  const handMutation = useMutation({
    mutationFn: async (raised: boolean) => {
      const res = await apiRequest("POST", "/api/aula/qa/hand", { raised });
      return res.json();
    },
  });

  const askMutation = useMutation({
    mutationFn: async (payload: { blob?: Blob; text?: string }) => {
      const form = new FormData();
      if (payload.blob) form.append("audio", payload.blob, "question.webm");
      if (payload.text) form.append("text", payload.text);
      const res = await fetch(`/api/aula/${slug}/qa`, { method: "POST", body: form, credentials: "include" });
      if (res.status === 403) {
        const body = await res.json();
        if (body.needsConsent) setShowConsentModal(true);
        throw new Error("needsConsent");
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json() as Promise<QaResponse>;
    },
    onSuccess: (data) => {
      setLastAnswer(data);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (data.answerAudioUrl) {
        const audio = new Audio(data.answerAudioUrl);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
      resetIdleTimer();
    },
  });

  const closeSession = useCallback(() => {
    if (sessionClosed) return;
    setSessionClosed(true);
    if (handHeartbeatRef.current) clearInterval(handHeartbeatRef.current);
    onSessionClosed();
  }, [sessionClosed, onSessionClosed]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(closeSession, AULA_QA_IDLE_FAREWELL_SEC * 1000);
  }, [closeSession]);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [resetIdleTimer]);

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    handMutation.mutate(next);
    if (next) {
      handHeartbeatRef.current = setInterval(() => handMutation.mutate(true), AULA_QA_HAND_HEARTBEAT_MS);
    } else if (handHeartbeatRef.current) {
      clearInterval(handHeartbeatRef.current);
    }
  };

  const handleMicClick = (start: () => Promise<void>) => {
    if (!consentData?.accepted) {
      setShowConsentModal(true);
      return;
    }
    start();
  };

  const submitBlob = (blob: Blob | null) => {
    if (!blob) return;
    askMutation.mutate({ blob });
  };

  const submitText = () => {
    if (!consentData?.accepted) {
      setShowConsentModal(true);
      return;
    }
    if (!textFallback.trim()) return;
    askMutation.mutate({ text: textFallback.trim() });
    setTextFallback("");
  };

  const faqs = faqData?.faqs ?? [];
  const limitReached = remaining <= 0;

  return (
    <Card className="border-2 border-[#7c3aed]/30 bg-[#7c3aed]/[0.03]" data-testid="conference-qa">
      <CardContent className="py-6 space-y-5">
        <div className="text-center">
          <h3 className="font-serif text-xl text-cedu-ink mb-1">
            Preguntas y respuestas con {instructor || "tu instructor"}
          </h3>
          <p className="text-sm text-cedu-ink-muted">Te quedan {remaining} preguntas en vivo</p>
        </div>

        {faqs.length > 0 && (
          <div className="space-y-2" data-testid="conference-qa-faqs">
            {faqs.map((faq) => (
              <button
                key={faq.id}
                className="w-full text-left p-3 rounded-xl bg-white border border-black/[0.06] hover:bg-black/[0.02]"
                onClick={() => {
                  if (faq.answerAudioUrl) new Audio(faq.answerAudioUrl).play().catch(() => {});
                }}
                data-testid={`conference-qa-faq-${faq.id}`}
              >
                <p className="text-sm text-cedu-ink">{faq.question}</p>
                {faq.isPublic && faq.authorReferralCode && (
                  <p className="text-[10px] text-cedu-ink-muted mt-1">aportada por {faq.authorReferralCode}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {lastAnswer && (
          <div className="p-3 rounded-xl bg-white border border-black/[0.06]" data-testid="conference-qa-last-answer">
            {lastAnswer.transcript && <p className="text-xs text-cedu-ink-muted mb-1">Tú: {lastAnswer.transcript}</p>}
            <p className="text-sm text-cedu-ink">{lastAnswer.answerText}</p>
          </div>
        )}

        {limitReached ? (
          <div className="text-center" data-testid="conference-qa-limit-reached">
            <Link href={`/tutor-ia/${slug}`}>
              <Button className="bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white" data-testid="conference-qa-cta-tutor">
                <Sparkles size={16} className="mr-2" /> Consigue tu DC-3 en el Tutor IA
              </Button>
            </Link>
          </div>
        ) : (
          <PushToTalkControl
            supported={supported}
            setSupported={setSupported}
            onSubmitBlob={submitBlob}
            askPending={askMutation.isPending}
            onRequestConsent={() => setShowConsentModal(true)}
            hasConsent={!!consentData?.accepted}
          />
        )}

        {!supported && !limitReached && (
          <div className="flex gap-2" data-testid="conference-qa-text-fallback">
            <input
              type="text"
              value={textFallback}
              onChange={(e) => setTextFallback(e.target.value)}
              placeholder="Escribe tu pregunta"
              className="flex-1 rounded-lg border border-black/[0.1] px-3 py-2 text-sm"
            />
            <Button onClick={submitText} disabled={askMutation.isPending}>Enviar</Button>
          </div>
        )}

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={toggleHand} data-testid="conference-qa-hand-toggle">
            <Hand size={14} className={`mr-1 ${handRaised ? "text-[#f28023]" : "text-cedu-ink-muted"}`} />
            {handRaised ? "Bajar la mano" : "Levantar la mano (sube tu aporte para la comunidad)"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent data-testid="conference-qa-consent-modal">
          <DialogHeader>
            <DialogTitle>Antes de preguntar</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-cedu-ink-soft space-y-2">
            <p>Tu pregunta puede usarse como material pedagógico para futuros alumnos.</p>
            <p>Si se reutiliza, se te identifica solo por tu código de referido — nunca tu nombre.</p>
            <p>Los mensajes ofensivos se eliminan de inmediato.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => consentMutation.mutate()} disabled={consentMutation.isPending} data-testid="conference-qa-consent-accept">
              Acepto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PushToTalkControl({
  supported,
  setSupported,
  onSubmitBlob,
  askPending,
  onRequestConsent,
  hasConsent,
}: {
  supported: boolean;
  setSupported: (v: boolean) => void;
  onSubmitBlob: (blob: Blob | null) => void;
  askPending: boolean;
  onRequestConsent: () => void;
  hasConsent: boolean;
}) {
  const { recording, start, stop, blob, error, supported: hookSupported } = usePushToTalkLocal();

  useEffect(() => { setSupported(hookSupported); }, [hookSupported, setSupported]);
  useEffect(() => { if (blob) onSubmitBlob(blob); }, [blob, onSubmitBlob]);

  if (!supported) return null;

  return (
    <div className="text-center">
      <Button
        size="lg"
        className={`rounded-full w-20 h-20 ${recording ? "bg-red-500 hover:bg-red-600" : "bg-[#7c3aed] hover:bg-[#7c3aed]/90"} text-white`}
        onMouseDown={() => (hasConsent ? start() : onRequestConsent())}
        onMouseUp={() => recording && stop()}
        onTouchStart={() => (hasConsent ? start() : onRequestConsent())}
        onTouchEnd={() => recording && stop()}
        disabled={askPending}
        data-testid="conference-qa-mic-button"
      >
        {recording ? <Square size={24} /> : <Mic size={24} />}
      </Button>
      <p className="text-xs text-cedu-ink-muted mt-2">
        {recording ? "Grabando… suelta para enviar" : askPending ? "Pensando…" : "Mantén presionado para preguntar"}
      </p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Re-exported locally to keep this file self-contained for the diff; consumes
// the hook created in Task 13.
import { usePushToTalk as usePushToTalkLocal } from "@/hooks/usePushToTalk";
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `client/src/components/ConferenceQA.tsx`. If `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter` import paths differ from `@/components/ui/dialog`, grep for an existing `Dialog` usage elsewhere in `client/src/pages/` (e.g. `curso-virtual.tsx`'s share/reset dialogs) and match the exact import path found there.

- [ ] **Step 4: Written manual smoke check**

Run the dev server (`npm run dev`), navigate to a completed Aula Virtual conference as a logged-in user, and verify:
1. The `ConferenceQA` block renders with the header "Preguntas y respuestas con {instructor}" and "Te quedan 3 preguntas en vivo".
2. Clicking/holding the mic button without prior consent opens the T&C modal instead of recording.
3. Accepting consent closes the modal and a subsequent hold-to-record actually starts (browser mic permission prompt appears).
4. After 30 seconds of no interaction, `onSessionClosed` fires (visually: the diploma CTA appears once `curso-virtual.tsx` wires it in Task 15).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ConferenceQA.tsx
git commit -m "feat(aula-qa): add ConferenceQA client component"
```

---

### Task 15: Insert `<ConferenceQA>` into `curso-virtual.tsx` and gate the diploma CTA

**Files:**
- Modify: `client/src/pages/curso-virtual.tsx:841-944` (the `stps-tutor-cta` block and the `stps-next-steps` block, both currently gated only by `user && allCompleted`)

**Interfaces:**
- Consumes: `ConferenceQA` from `client/src/components/ConferenceQA.tsx` (Task 14), props `{ slug, courseId, instructor, onSessionClosed }`
- Produces: local state `qaSessionClosed: boolean` inside `StpsSessionView`, gating `stps-next-steps` visibility

- [ ] **Step 1: Add the import**

At the top of `client/src/pages/curso-virtual.tsx`, alongside the other component imports, add:
```typescript
import { ConferenceQA } from "@/components/ConferenceQA";
```

- [ ] **Step 2: Add local state to `StpsSessionView`**

In `StpsSessionView` (`client/src/pages/curso-virtual.tsx:531-553`), immediately after the existing `const [listeningPct, setListeningPct] = useState(0);` (line 556), add:
```typescript
  const [qaSessionClosed, setQaSessionClosed] = useState(false);
```

- [ ] **Step 3: Insert `<ConferenceQA>` and gate the diploma CTA**

Replace the two `{user && allCompleted && ( ... )}` blocks at `client/src/pages/curso-virtual.tsx:841-865` (the `stps-tutor-cta` block) and `:867-944` (the `stps-next-steps` block) as follows.

Keep the `stps-tutor-cta` block (lines 841-865) exactly as-is — it still shows immediately on completion, per spec §6 ("el instructor sigue presente… la sesión permanece abierta"). Immediately after it (still before the old `stps-next-steps` block), insert:

```typescript
      {user && allCompleted && !qaSessionClosed && (
        <ConferenceQA
          slug={slug}
          courseId={course.id}
          instructor={course.instructor}
          onSessionClosed={() => setQaSessionClosed(true)}
        />
      )}
```

Then change the `stps-next-steps` block's guard from `{user && allCompleted && (` to also require the Q&A session to have closed:
```typescript
      {user && allCompleted && qaSessionClosed && (
        <div className="rounded-2xl overflow-hidden" data-testid="stps-next-steps">
```
(the rest of that block, lines 869-944, is unchanged).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `client/src/pages/curso-virtual.tsx`.

- [ ] **Step 5: Written manual smoke check**

Run `npm run dev`, open a completed conference as a logged-in user:
1. Confirm `stps-tutor-cta` and `ConferenceQA` both render immediately.
2. Confirm `stps-next-steps` (the diploma/DC-3/SEP CTA) is NOT visible yet.
3. Wait 30 seconds without interacting with the Q&A mic → confirm `stps-next-steps` appears.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/curso-virtual.tsx
git commit -m "feat(aula-qa): insert ConferenceQA and gate diploma CTA behind session close"
```

---

### Task 16: Seed data — curated FAQs + per-instructor farewell audio

**Files:**
- Create: `script/seed-conference-faqs.ts`
- Create: `script/generate-instructor-farewells.ts`

**Interfaces:**
- Consumes: `db`, `conferenceFaqs` from `@shared/schema` (Task 1); `embedText`, `synthesizeAnswer` from `server/services/qa-openai.ts` (Task 10); `voiceForInstructor` from `shared/instructor-voice.ts` (Task 2); `r2Storage.uploadBuffer` (`server/services/r2-storage.ts`)
- Produces: seeded rows in `conference_faqs`; R2 objects `audio/farewell-yuridia.mp3`, `audio/farewell-medina.mp3` (key convention matches `audio/<filename>` per `server/services/r2-storage.ts` and spec §8 "Despedida (asset)")

- [ ] **Step 1: Write `script/seed-conference-faqs.ts`**

```typescript
// script/seed-conference-faqs.ts
// Semilla de FAQ curadas para el Q&A del Aula Virtual (spec §4 conference_faqs,
// source='curated'). Ejecutar una vez por conferencia con contenido real —
// las preguntas/respuestas aquí son un punto de partida editorial, no relleno
// automático (regla de "no mock silencioso").
import { db } from "../server/db";
import { conferenceFaqs } from "@shared/schema";
import { embedText, synthesizeAnswer } from "../server/services/qa-openai";
import { voiceForInstructor } from "@shared/instructor-voice";
import { r2Storage } from "../server/services/r2-storage";
import { eq } from "drizzle-orm";

interface SeedFaq {
  courseSlug: string;
  instructorName: string | null;
  question: string;
  answerText: string;
}

// EDITAR con preguntas/respuestas reales curadas por el instructor antes de
// correr en producción. Estas son de arranque para 'manejo-estres-laboral'.
const SEED: SeedFaq[] = [
  {
    courseSlug: "manejo-estres-laboral",
    instructorName: "Psic. Yuridia Iturriaga",
    question: "¿Cuánto tiempo debo dedicar a las técnicas de respiración por día?",
    answerText: "Con 5 a 10 minutos diarios, en la mañana o antes de dormir, es suficiente para empezar a notar diferencia. Lo importante es la constancia, no la duración.",
  },
  {
    courseSlug: "manejo-estres-laboral",
    instructorName: "Psic. Yuridia Iturriaga",
    question: "¿Qué hago si mi jefe es la principal fuente de estrés?",
    answerText: "Primero documenta situaciones específicas y busca hablarlo directamente en un momento tranquilo, usando hechos y no acusaciones. Si no mejora, acude a Recursos Humanos; nadie está obligado a normalizar un ambiente hostil.",
  },
];

async function main() {
  for (const item of SEED) {
    const embedding = await embedText(item.question);
    const { voice, instructions } = voiceForInstructor(item.instructorName);
    const audioBuffer = await synthesizeAnswer(item.answerText, voice, instructions);
    const hash = `${item.courseSlug}-${Buffer.from(item.question).toString("base64url").slice(0, 12)}`;
    const key = `audio/faq-${hash}.mp3`;
    const answerAudioUrl = r2Storage.isConfigured
      ? await r2Storage.uploadBuffer(audioBuffer, key, "audio/mpeg")
      : null;

    await db.insert(conferenceFaqs).values({
      courseSlug: item.courseSlug,
      question: item.question,
      answerText: item.answerText,
      answerAudioUrl,
      embedding,
      source: "curated",
      authorReferralCode: null,
      isPublic: false,
      sortOrder: 0,
      active: true,
    });

    console.log(`[seed] inserted FAQ for ${item.courseSlug}: "${item.question}"`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Write `script/generate-instructor-farewells.ts`**

```typescript
// script/generate-instructor-farewells.ts
// Genera y sube el audio de despedida por instructor (spec §8 "Despedida
// (asset)"). Se reproduce al cerrar la sesión de Q&A por inactividad (30s).
// Correr una vez por instructor; no cuesta tokens en tiempo real después.
import { synthesizeAnswer } from "../server/services/qa-openai";
import { voiceForInstructor } from "@shared/instructor-voice";
import { r2Storage } from "../server/services/r2-storage";

interface FarewellSpec {
  key: string; // usado en el nombre del archivo, sin acentos ni espacios
  instructorName: string;
  text: string;
}

const FAREWELLS: FarewellSpec[] = [
  {
    key: "yuridia",
    instructorName: "Psic. Yuridia Iturriaga",
    text: "Fue un gusto acompañarte en esta conferencia. Sigue practicando lo que vimos hoy, y cuando quieras profundizar más, ahí te espera el Tutor IA. ¡Nos vemos pronto!",
  },
  {
    key: "medina",
    instructorName: "Lic. Jorge Armando Medina Castillo",
    text: "Muchas gracias por tu atención durante esta conferencia. Espero que lo aprendido hoy te sea útil en tu día a día laboral. Si quieres seguir profundizando, el Tutor IA está listo para ti.",
  },
];

async function main() {
  for (const farewell of FAREWELLS) {
    const { voice, instructions } = voiceForInstructor(farewell.instructorName);
    const audioBuffer = await synthesizeAnswer(farewell.text, voice, instructions);
    const key = `audio/farewell-${farewell.key}.mp3`;
    if (!r2Storage.isConfigured) {
      console.warn(`[farewell] R2 no configurado, saltando subida de ${key}`);
      continue;
    }
    const url = await r2Storage.uploadBuffer(audioBuffer, key, "audio/mpeg");
    console.log(`[farewell] uploaded ${key} -> ${url}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[farewell] failed:", err);
  process.exit(1);
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in either script.

- [ ] **Step 4: Written run commands**

```bash
npx tsx script/seed-conference-faqs.ts
npx tsx script/generate-instructor-farewells.ts
```
Expected: console logs confirming each FAQ inserted and each farewell MP3 uploaded to R2. Verify with `curl -s http://localhost:5000/api/aula/manejo-estres-laboral/faqs | jq .` that the seeded FAQs appear.

- [ ] **Step 5: Commit**

```bash
git add script/seed-conference-faqs.ts script/generate-instructor-farewells.ts
git commit -m "feat(aula-qa): add curated FAQ seed and instructor farewell audio generator scripts"
```

---

## Self-Review

**1. Spec coverage** — every numbered spec section maps to a task:
- §1 objetivo/decisiones → Tasks 1-16 collectively (FAQ, push-to-talk, límite 3, consentimiento, moderación, anonimato) ✓
- §2 principio de costo → enforced by Task 4 (limit) + Task 3 (cache) + `AULA_QA_MAX_RECORD_SEC` in Task 13 ✓
- §3.1 flujo completo → Task 12 (route pipeline) end to end ✓
- §3.2 reúso (getCourseContext/generateResponse, patrón heygen.ts, TTS pattern, /audio/:filename, MediaRecorder) → Tasks 9, 10, 12, 13 ✓ (note: this plan uploads Q&A/FAQ/farewell audio directly to R2 and serves the returned public URL rather than routing through the existing `/audio/:filename` endpoint — R2-configured URLs are already public per `r2Storage.uploadBuffer`'s return value, consistent with how `r2Storage` is used elsewhere in the repo, e.g. `server/routes/heygen.ts` twin-video uploads)
- §3.3 piezas nuevas (STT, caché semántico, componente cliente, endpoints, instructorName) → Tasks 3, 10, 12, 14, 9 ✓
- §4 modelo de datos (las 4 tablas, todas las columnas) → Task 1 ✓
- §5 endpoints (los 4, incluyendo el pipeline de 9 pasos de POST /qa) → Task 12 ✓
- §6 cliente (`<ConferenceQA>`, modal consentimiento, mano levantada, push-to-talk, contador, fallback texto, sesión no termina de golpe) → Tasks 13, 14, 15 ✓
- §7 manejo de errores (needsConsent 403, moderated, sin mic, sin MediaRecorder, STT vacío, fuera de tema, límite, falla LLM/TTS, sin API key 503) → Task 12 implements every branch; Task 14's text-fallback covers "sin permiso de micrófono"/"sin MediaRecorder" ✓
- §8 voz/persona (mapa instructor→voz, instructorName en generateResponse, despedida asset) → Tasks 2, 9, 16 ✓
- §9 parámetros → copied verbatim into Global Constraints and used as named constants across Tasks 2-14 ✓
- §10 testing → covered by the pure-logic TDD tasks (3, 4, 5, 6, 7, 8) for rate limit/cache/deflection/consent/moderation/ordering; grounding and I/O-level assertions are covered by Task 12's manual smoke check per this repo's no-route-tests convention (documented in the prompt's decisions-already-made) ✓
- §11 fuera de alcance → intentionally NOT implemented (no task builds mid-conference interruption, Realtime API, multi-user live room, multi-idioma, or automatic FAQ promotion) ✓
- §12 referencias cruzadas → informational, no implementation required ✓

**2. Placeholder scan** — no "TBD"/"handle edge cases"/"similar to Task N" found; every code step has complete, real code. The one intentionally-deferred content item is the seed FAQ/farewell script text (Task 16), which is explicitly marked as editorial placeholder content to be replaced by the instructor before production use — this mirrors the spec's own §8 note ("Pendiente de entregable: el texto de los T&C... lo redacta/valida quien corresponda") and is not a plan gap.

**3. Type consistency** — verified across tasks: `InstructorVoice { voice, instructions }` (Task 2) used identically in Tasks 10, 12, 16; `findCacheHit`'s `{ id, score }` return (Task 3) matches Task 12's `cacheHit.id` usage; `evaluateQaLimit`'s `{ allowed, remaining }` (Task 4) matches Task 12's destructuring; `isHandRaised`/`nextHandExpiry`/`AULA_QA_HAND_TTL_SEC` (Task 5) match Task 11's `upsertHand` and Task 12's `/hand` route; `orderFaqs<T>` (Task 6) matches the shape returned by Task 11's `getFaqsForCourse` (`authorReferralCode`, `sortOrder`, `createdAt` all present on `conferenceFaqs.$inferSelect` per Task 1's schema); `hasValidConsent`/`AULA_QA_TC_VERSION` (Task 7) match Task 11's `getConsents`/`insertConsent` and Task 12's route; `interpretModeration` (Task 8) matches Task 10's `moderateText` return shape `{ flagged }`; `generateResponse`'s new signature (Task 9, `instructorName` as 5th param before `onChunk`) is consumed correctly in Task 12 (`tutorAIService.generateResponse(transcript, course.title, courseContext, [], course.instructor)`, 5 args, no `onChunk`) and in Task 9's own fix to the two `heygen.ts` call sites; `qa-openai.ts`'s four exports (Task 10) are all consumed by name in Task 12 and Task 16 with matching signatures; `usePushToTalk`'s return shape (Task 13) matches Task 14's destructuring `{ recording, start, stop, blob, error, supported }`.
