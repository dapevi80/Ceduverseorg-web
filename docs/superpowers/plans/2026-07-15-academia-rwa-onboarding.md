# Academia RWA — Onboarding Courses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sembrar 3 cursos de onboarding gratuitos en Ceduverse (sistema Studio, categoría "Onboarding", gateo por rol) que explican el ecosistema RWA de BrainShield y el CryptoVault 24k.

**Architecture:** Los cursos son datos: entradas en `studio-courses-meta.ts` + archivos de contenido (`rwa-onboarding-courses.ts`, `rwa-onboarding-quizzes.ts`) que el seed existente (`seed-studio.ts`) inserta en las tablas `studioCourses`/`studioModules`/`studioQuizzes`. El gateo por rol ya está implementado en `server/routes/courses.ts` (categoría "Onboarding" → filtrado por `subcategory`). El "audio" es el "Leer en voz alta" del navegador ya integrado en `studio-course.tsx`. No hay migración ni cambios de schema.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL (Supabase), Express, React (frontend existente, no se toca).

## Global Constraints

- **Sin migración de base de datos ni cambios de schema.** Se usan `studioCourses`/`studioModules`/`studioQuizzes` tal cual (`shared/schema.ts`).
- **HeyGen fuera de alcance.** No tocar campos ni servicios `heygen*`. No confundir con el Tutor IA.
- **No pipeline de MP3/TTS.** El audio es el "Leer en voz alta" del navegador; no se toca `generate-ted-audio.ts` ni `audio-cache`.
- **Formato de módulo:** objeto `{ title: string, description: string, contentHtml: string, references?: string[], durationMinutes?: number }`. El `contentHtml` sigue el estilo de `server/data/yuridia-courses.ts`: solo `<p>`, `<h3>`, `<ul>/<li>`, `<strong>`, `<em>` (NADA de `<script>`, estilos inline ni imágenes externas). Se sanitiza con DOMPurify en el frontend.
- **Formato de quiz:** objeto `{ title: string, passingScore: number, questions: Array<{ question: string, options: string[], correctIndex: number, explanation: string }> }` (idéntico a `server/data/yuridia-quizzes.ts`).
- **Categoría y subcategoría exactas:** `category: "Onboarding"`; `subcategory` ∈ `{"Para Todos", "Empresas", "Socios"}` (strings exactos; así los filtra `courses.ts`).
- **`dc3Available: false`** en los 3 (no son STPS, no llevan DC-3 ni SEP).
- **`source: "brainshield"`** en los 3 (los distingue de yuridia/medina/procadist).
- **Voz del contenido:** español mexicano, divulgativo, cálido y profesional, con ejemplos concretos. Fiel a los hechos del pivote RWA (ver "Fuente de verdad").
- **Guardrail legal (Cursos 2 y 3):** cada curso que toque inversión/compra incluye, al inicio y al cierre del módulo legal, el disclaimer EXACTO: *"Contenido educativo. No constituye oferta de valores, asesoría de inversión ni asesoría financiera. Los rendimientos no están garantizados."* Nunca prometer rendimientos garantizados ni llamar "inversión segura" a los productos.
- **Slugs exactos:** `que-es-un-rwa`, `brainshield-vault-24k-a-fondo`, `como-vender-rwa`.

### Fuente de verdad (hechos para el contenido)

- **RWA** = Real World Asset (activo del mundo real representado on-chain). BrainShield/GCS = originador/estructurador de RWA: **tangibles** (inmuebles, ej. hotel **ARCICOM** $51M MXN en Playa del Carmen) e **intangibles** (PI, regalías, licencias).
- **Las 4 patas de un RWA legítimo (marco BrainShield):** (1) valuación independiente (corredor público NIF C-8 / avalúo inmobiliario, **0% de margen** → sin incentivo a inflar → evita riesgo Art. 69-B; con atestación on-chain = valor defendible); (2) título legal (cesión/escritura, activo enajenable); (3) flujo de efectivo (regalías o rentas); (4) procedencia/sustancia (hash SHA-256, defense file Art. 69-B, CFDIs, KYC LFPIORPI).
- **On-chain:** la **atestación** ancla un **hash** del pago/dictamen en **Base** (red L2 de Ethereum); NO es pago on-chain (el pago es fiat/SPEI). Token de valor = **BRAIN, pegged 1:1 a USDC/USDT** (estable, sin volatilidad). KakawChain/KakawCoin están diferidos (no mencionarlos como vivos).
- **Marketplace RWA:** grid público + panel admin; 2 tipos de activo: **CryptoVault (producto)** y **copropiedad** (reserva con **depósito proporcional reembolsable** + formalización **offline** con KYC/contrato — NO es oferta de valores). Muestra **ROI** (renta neta anual / regalías proyectadas / spot del oro). Multi-moneda **MXN/USD/EUR/GBP/CAD** (cobra en la moneda elegida). Incluye NFTs externos reales de referencia (RealT, Damien Hirst "The Currency").
- **CryptoVault 24k:** oro **Au 999.9**, ediciones **100g** (3.215 ozt) y **200g** (6.430 ozt), **320 piezas totales** (numeradas 1..320), **NFT título 1:1** del lingote, reverso con **24 palabras BIP39** (semilla), **modelo Kakaw no-custodio** (por eso no es un valor: falla el test de Howey), **redimible** por el lingote físico. **Precio** = spot (metals.dev) × gramos / 31.1035 × **1.25** (25% de margen), con snapshot al checkout. **Pago:** Stripe (fiat, multi-moneda) + **NOWPayments** (cripto BTC/USDT). Custodia sin domicilio expuesto; la orden muestra "Pieza N/320" + `tx_hash` verificable en basescan.
- **Anonimato del socio:** ante el corredor solo se expone el activo + un alias; el dictamen/CFDI van a nombre de BrainShield SC.
- **Comisiones de socio (Ceduverse, modelo conocido — ver Pregunta Abierta #1):** agente 15% del fee + 40% DC-3 + 10% SEP + **$500 por referido** (vitalicio; el $500 se paga cuando la **empresa** referida hace su **primera aportación**). El esquema para venta de BrainShield/CryptoVault puede diferir; si no está confirmado, redactar genérico y marcar "(pendiente de confirmar)".

### Preguntas abiertas (heredadas del spec)

1. Comisiones para venta de BrainShield/RWA — ¿mismo esquema Ceduverse o distinto? Si no hay confirmación de David al ejecutar, el módulo 4 del Curso 3 se redacta genérico con nota "(pendiente de confirmar con David)".
2. Validación legal de disclaimers por Daniel/Aimée antes de que el seed corra en producción (DeFiYogini/main).

---

## File Structure

- **Create** `server/data/rwa-onboarding-courses.ts` — módulos (contentHtml) de los 3 cursos, `Record<string, Module[]>` por slug.
- **Create** `server/data/rwa-onboarding-quizzes.ts` — quizzes de los 3 cursos, `Record<string, Quiz>` por slug.
- **Modify** `server/data/studio-courses-meta.ts` — agregar 3 entradas `StudioCourseMeta`.
- **Modify** `server/seed-studio.ts` — extender `getModulesForSlug` y `getQuizForSlug` para consultar los archivos RWA.
- **No se toca:** schema, migraciones, frontend, `generate-ted-audio.ts`, servicios HeyGen.

---

## Task 1: Wire-up + Curso 1 "¿Qué es un RWA?" (Para Todos)

Entrega: el seed inserta el Curso 1, visible para todos (incluso sin login), con sus ~5 módulos y su quiz; el "Leer en voz alta" funciona.

**Files:**
- Create: `server/data/rwa-onboarding-courses.ts`
- Create: `server/data/rwa-onboarding-quizzes.ts`
- Modify: `server/data/studio-courses-meta.ts` (agregar 1 entrada, al final del array `studioCourseMeta`)
- Modify: `server/seed-studio.ts:11-35` (funciones `getModulesForSlug` y `getQuizForSlug`)

**Interfaces:**
- Produces:
  - `rwaOnboardingModules: Record<string, Array<{ title: string; description: string; contentHtml: string; references?: string[]; durationMinutes?: number }>>`
  - `rwaOnboardingQuizzes: Record<string, { title: string; passingScore: number; questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }> }>`
  - slug `"que-es-un-rwa"` disponible en ambos records.
- Consumes: el bloque de gateo en `server/routes/courses.ts` (categoría "Onboarding" → subcategoría "Para Todos") ya existente.

- [ ] **Step 1: Crear `server/data/rwa-onboarding-courses.ts` con el Curso 1**

Crear el archivo con este esqueleto y el contenido del Curso 1. Cada módulo lleva `contentHtml` de **~800–1200 palabras** en el estilo de `yuridia-courses.ts` (párrafos `<p>`, subtítulos `<h3>`, listas `<ul><li>`). Escribir prosa real y fiel a la "Fuente de verdad"; NO dejar marcadores tipo "TODO".

```typescript
// ═══════════════════════════════════════════════════════════
// ACADEMIA RWA — Cursos de onboarding BrainShield (Studio)
// Formato: módulos con contentHtml (texto) + "Leer en voz alta"
// ═══════════════════════════════════════════════════════════

interface RwaModule {
  title: string;
  description: string;
  contentHtml: string;
  references?: string[];
  durationMinutes?: number;
}

export const rwaOnboardingModules: Record<string, RwaModule[]> = {

  "que-es-un-rwa": [
    {
      title: "Qué es un Real World Asset (RWA)",
      description: "Definición simple de RWA: activos del mundo real —inmuebles, oro, propiedad intelectual— representados on-chain. Off-chain vs on-chain.",
      durationMinutes: 12,
      contentHtml: `<p>...escribir ~1000 palabras...</p>`,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    // ... módulos 2 a 5 (ver briefs abajo)
  ],

};
```

Briefs de los 5 módulos del Curso 1 (cada uno ~800–1200 palabras):

1. **Qué es un Real World Asset (RWA).** Definición en lenguaje llano. Ejemplos: un departamento, un lingote de oro, una patente. Diferencia off-chain (el activo y su papeleo legal en el mundo real) vs on-chain (su representación digital). Por qué "tokenizar" no es magia: el valor sigue viviendo en el activo real. CTA suave: seguir al módulo 2.
2. **El problema que resuelve.** Iliquidez (un inmueble tarda meses en venderse), opacidad (no sabes si el avalúo es real), falta de procedencia (¿de dónde salió el dinero/activo?). Por qué la mayoría de proyectos "RWA" fingen la sustancia off-chain (ponen un token sin activo defendible detrás).
3. **Las 4 patas de un RWA legítimo (marco BrainShield).** Explicar las 4: valuación independiente (corredor NIF C-8, 0% margen), título legal (activo enajenable), flujo de efectivo (rentas/regalías), procedencia (hash SHA-256, CFDIs, KYC, defense file 69-B). Analogía: una mesa necesita las 4 patas o se cae.
4. **On-chain sin miedo: atestación vs tokenización.** Qué es Base (red L2 de Ethereum). Qué es anclar un hash (huella digital inalterable del dictamen/pago) — atestación, no pago on-chain. El token **BRAIN 1:1 USDC/USDT** (estable, sin volatilidad). Aclarar que KakawChain/KakawCoin aún no existen como producto.
5. **El ecosistema BrainShield.** Cómo encajan: BrainShield (originador) → marketplace RWA → CryptoVault 24k (oro) → anonimato del socio. Cierre con CTA fuerte: *"Crea tu cuenta y explora el marketplace de activos reales."*

- [ ] **Step 2: Crear `server/data/rwa-onboarding-quizzes.ts` con el quiz del Curso 1**

```typescript
// ═══════════════════════════════════════════════════════════
// ACADEMIA RWA — Quizzes de onboarding
// ═══════════════════════════════════════════════════════════

interface RwaQuiz {
  title: string;
  passingScore: number;
  questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
}

export const rwaOnboardingQuizzes: Record<string, RwaQuiz> = {

  "que-es-un-rwa": {
    title: "Evaluación: ¿Qué es un RWA?",
    passingScore: 70,
    questions: [
      {
        question: "¿Qué es un Real World Asset (RWA)?",
        options: [
          "Una criptomoneda sin respaldo",
          "Un activo del mundo real (inmueble, oro, PI) representado on-chain",
          "Un videojuego con NFTs",
          "Una acción de bolsa tradicional",
        ],
        correctIndex: 1,
        explanation: "Un RWA es un activo real —inmueble, oro, propiedad intelectual— cuyo valor vive en el mundo físico/legal y se representa digitalmente on-chain.",
      },
      {
        question: "¿Cuáles son las 4 patas de un RWA legítimo según BrainShield?",
        options: [
          "Marketing, token, comunidad y hype",
          "Valuación independiente, título legal, flujo de efectivo y procedencia",
          "Compra, venta, renta y reventa",
          "Bitcoin, Ethereum, Base y Solana",
        ],
        correctIndex: 1,
        explanation: "Las 4 patas son: valuación independiente (corredor NIF C-8, 0% margen), título legal (activo enajenable), flujo de efectivo (rentas/regalías) y procedencia/sustancia (hash, CFDIs, KYC).",
      },
      {
        question: "En BrainShield, la atestación on-chain significa:",
        options: [
          "Que el pago se hace con criptomonedas",
          "Que se ancla un hash (huella) del dictamen/pago en la red Base, sin ser pago on-chain",
          "Que el activo se vende en una subasta",
          "Que se emite una acción bursátil",
        ],
        correctIndex: 1,
        explanation: "La atestación ancla un hash inalterable en Base como prueba de integridad. El pago sigue siendo fiat/SPEI; no es un pago on-chain.",
      },
      {
        question: "El token BRAIN está diseñado para:",
        options: [
          "Especular con alta volatilidad",
          "Estar pegado 1:1 a USDC/USDT (estable, sin volatilidad)",
          "Reemplazar al peso mexicano",
          "Pagar comisiones de Bitcoin",
        ],
        correctIndex: 1,
        explanation: "BRAIN es un token de valor pegado 1:1 a stablecoins (USDC/USDT) para evitar volatilidad.",
      },
      {
        question: "¿Por qué muchos proyectos 'RWA' del mercado son débiles?",
        options: [
          "Porque usan blockchain",
          "Porque fingen la sustancia off-chain: ponen un token sin un activo real y defendible detrás",
          "Porque cobran comisiones",
          "Porque son demasiado transparentes",
        ],
        correctIndex: 1,
        explanation: "La mitad difícil de un RWA es el activo real con valuación, título, flujo y procedencia. Muchos proyectos sólo emiten el token y fingen esa sustancia.",
      },
    ],
  },

};
```

- [ ] **Step 3: Agregar la entrada de meta del Curso 1 en `studio-courses-meta.ts`**

Agregar al final del array `studioCourseMeta` (antes del `];` de cierre):

```typescript
  { slug: "que-es-un-rwa", title: "¿Qué es un RWA?", description: "Entiende qué es un Real World Asset, el problema que resuelve y cómo BrainShield estructura activos reales verificables on-chain", category: "Onboarding", subcategory: "Para Todos", durationMinutes: 55, level: "basico", tags: ["RWA", "BrainShield", "activos reales", "Base", "onboarding"], dc3Available: false, icon: "🌐", color: "#0ea5e9", source: "brainshield" },
```

- [ ] **Step 4: Extender los lookups en `server/seed-studio.ts`**

En `getModulesForSlug` (después de la línea que consulta `procadistModulesPart2`, antes del `return undefined;`):

```typescript
  const { rwaOnboardingModules } = await import("./data/rwa-onboarding-courses");
  if (rwaOnboardingModules[slug]) return rwaOnboardingModules[slug];
```

En `getQuizForSlug` (dentro del bloque, antes del `return undefined;`):

```typescript
  const { rwaOnboardingQuizzes } = await import("./data/rwa-onboarding-quizzes");
  if (rwaOnboardingQuizzes[slug]) return rwaOnboardingQuizzes[slug];
```

- [ ] **Step 5: Verificar que TypeScript compila**

Run: `npm run check` (o `npx tsc --noEmit` si no existe el script)
Expected: sin errores en `rwa-onboarding-courses.ts`, `rwa-onboarding-quizzes.ts`, `studio-courses-meta.ts`, `seed-studio.ts`.

- [ ] **Step 6: Correr el seed contra la base de datos de desarrollo**

Run: `npx tsx server/seed-studio.ts`
Expected: en el log aparece `✓ Created course: ¿Qué es un RWA?` y el conteo final incluye 1 course, 5 modules, 1 quiz creados. Correrlo **otra vez** debe imprimir `already exists, skipping` y crear 0 (idempotencia).

- [ ] **Step 7: Verificar en la app (sin login) que el curso aparece y funciona**

Levantar la app (`npm run dev`), ir a la sección Studio/Onboarding **sin iniciar sesión**. Verificar:
- El curso "¿Qué es un RWA?" aparece (subcategoría "Para Todos").
- Los 5 módulos se listan y su contenido renderiza (HTML sanitizado).
- El botón "Leer en voz alta" narra el módulo.
- El quiz se puede tomar y calificar (passingScore 70).

- [ ] **Step 8: Commit**

```bash
git add server/data/rwa-onboarding-courses.ts server/data/rwa-onboarding-quizzes.ts server/data/studio-courses-meta.ts server/seed-studio.ts
git commit -m "feat(academia-rwa): Curso 1 ¿Qué es un RWA? (Onboarding/Para Todos) + wire-up del seed"
```

---

## Task 2: Curso 2 "BrainShield + Vault 24k a fondo" (Empresas)

Entrega: el seed inserta el Curso 2, visible sólo para rol empresa/RH (+ admin), con guardrail legal.

**Files:**
- Modify: `server/data/rwa-onboarding-courses.ts` (agregar slug `"brainshield-vault-24k-a-fondo"`)
- Modify: `server/data/rwa-onboarding-quizzes.ts` (agregar el mismo slug)
- Modify: `server/data/studio-courses-meta.ts` (agregar 1 entrada)

**Interfaces:**
- Consumes: `rwaOnboardingModules`, `rwaOnboardingQuizzes` (Task 1). El seed wiring ya existe.
- Produces: slug `"brainshield-vault-24k-a-fondo"` en ambos records.

- [ ] **Step 1: Agregar los 5 módulos del Curso 2 en `rwa-onboarding-courses.ts`**

Agregar la clave `"brainshield-vault-24k-a-fondo": [ ... ]` al record. Briefs (~800–1200 palabras c/u):

1. **Cómo BrainShield estructura un RWA real.** Valuación NIF C-8 / avalúo inmobiliario, corredor a **0% de margen** (por qué: si BrainShield ganara del avalúo, tendría incentivo a inflarlo → riesgo Art. 69-B), atestación on-chain en Base. **Caso hotel ARCICOM** ($51M MXN, Playa del Carmen) como RWA inmobiliario.
2. **El marketplace RWA.** Tipos: CryptoVault (producto) vs copropiedad (reserva con depósito proporcional **reembolsable** + formalización offline KYC/contrato). ROI mostrado (renta neta anual / regalías / spot oro). Multi-moneda MXN/USD/EUR/GBP/CAD. NFTs externos reales de referencia (RealT, Damien Hirst).
3. **CryptoVault 24k a fondo.** Au 999.9; 100g/200g; 320 piezas numeradas; NFT título 1:1 del lingote; 24 palabras BIP39 al reverso; modelo Kakaw **no-custodio** (por eso falla Howey y no es un valor); redimible. Precio = spot × gramos / 31.1035 × 1.25.
4. **Cómo se compra.** Stripe (fiat, multi-moneda) + NOWPayments (cripto BTC/USDT); snapshot de precio al checkout; custodia sin domicilio; la orden muestra "Pieza N/320" + `tx_hash` en basescan.
5. **Marco legal y riesgos (guardrail).** Iniciar y cerrar con el disclaimer EXACTO del Global Constraints. Explicar: esto NO es oferta de valores ni asesoría de inversión; la copropiedad se formaliza **offline** con KYC/contrato; el riesgo regulatorio CNBV (MX) / SEC (US) de tokenizar flujos de ingresos futuros; por qué el modelo no-custodio del CryptoVault lo mantiene como producto (no valor).

- [ ] **Step 2: Agregar el quiz del Curso 2 en `rwa-onboarding-quizzes.ts`**

Agregar la clave `"brainshield-vault-24k-a-fondo"`:

```typescript
  "brainshield-vault-24k-a-fondo": {
    title: "Evaluación: BrainShield + Vault 24k a fondo",
    passingScore: 70,
    questions: [
      {
        question: "¿Por qué el corredor de BrainShield trabaja con 0% de margen sobre el avalúo?",
        options: [
          "Porque es obligatorio por ley",
          "Para evitar el incentivo de inflar el valor y el riesgo del Art. 69-B",
          "Porque no cobra nada por su trabajo",
          "Para pagar menos impuestos",
        ],
        correctIndex: 1,
        explanation: "Si BrainShield ganara del monto del avalúo, tendría incentivo a inflarlo. El 0% de margen (honorario pass-through) mantiene la valuación independiente y defendible.",
      },
      {
        question: "El CryptoVault 24k es un NFT que representa:",
        options: [
          "Una acción de la empresa Kakaw",
          "Un título 1:1 de un lingote de oro físico Au 999.9, redimible",
          "Una promesa de rendimiento mensual",
          "Una fracción de un fondo de inversión",
        ],
        correctIndex: 1,
        explanation: "El CryptoVault es un NFT título 1:1 de un lingote real (100g o 200g, Au 999.9), redimible. Modelo no-custodio, por eso es producto y no un valor.",
      },
      {
        question: "¿Cómo se calcula el precio del CryptoVault?",
        options: [
          "Precio fijo definido por BrainShield",
          "Spot del oro × gramos / 31.1035 × 1.25 (25% de margen), con snapshot al checkout",
          "Al doble del valor del oro",
          "Según la oferta y demanda del mercado secundario",
        ],
        correctIndex: 1,
        explanation: "El precio se ata al spot real del oro (metals.dev) por los gramos del lingote, más 25% de margen operativo, congelado al momento del checkout.",
      },
      {
        question: "La copropiedad de un RWA en el marketplace se formaliza:",
        options: [
          "Emitiendo acciones al público (oferta de valores)",
          "Con una reserva de depósito proporcional reembolsable + KYC/contrato offline",
          "Automáticamente al pagar con cripto",
          "Sin ningún trámite legal",
        ],
        correctIndex: 1,
        explanation: "La copropiedad usa una reserva con depósito reembolsable y se formaliza offline con KYC y contrato, precisamente para NO constituir una oferta de valores.",
      },
      {
        question: "¿Cuál de estas afirmaciones es correcta sobre el contenido de este curso?",
        options: [
          "Es una oferta de valores con rendimiento garantizado",
          "Es asesoría financiera personalizada",
          "Es contenido educativo; no es oferta de valores ni asesoría de inversión, y los rendimientos no están garantizados",
          "Garantiza que el oro siempre subirá de precio",
        ],
        correctIndex: 2,
        explanation: "Todo el contenido es educativo. No constituye oferta de valores, asesoría de inversión ni financiera; los rendimientos no están garantizados.",
      },
    ],
  },
```

- [ ] **Step 3: Agregar la entrada de meta del Curso 2 en `studio-courses-meta.ts`**

```typescript
  { slug: "brainshield-vault-24k-a-fondo", title: "BrainShield + Vault 24k a fondo", description: "Para empresas e inversionistas: cómo BrainShield estructura RWA reales, el marketplace, el CryptoVault 24k y su marco legal", category: "Onboarding", subcategory: "Empresas", durationMinutes: 60, level: "intermedio", tags: ["CryptoVault", "oro", "RWA", "marketplace", "inversión", "onboarding"], dc3Available: false, icon: "🏆", color: "#d4af37", source: "brainshield" },
```

- [ ] **Step 4: Verificar compilación**

Run: `npm run check`
Expected: sin errores.

- [ ] **Step 5: Seed idempotente**

Run: `npx tsx server/seed-studio.ts`
Expected: `✓ Created course: BrainShield + Vault 24k a fondo` (1 course, 5 modules, 1 quiz). Segunda corrida: 0 creados.

- [ ] **Step 6: Verificar gateo por rol**

- Con un usuario **rol empresa** (o team admin/RH): el curso aparece.
- Con un usuario **socio_estudiante** o **sin login**: el curso NO aparece (solo ve "Para Todos").
- Verificar que el módulo 5 muestra el disclaimer legal exacto al inicio y al cierre.

- [ ] **Step 7: Commit**

```bash
git add server/data/rwa-onboarding-courses.ts server/data/rwa-onboarding-quizzes.ts server/data/studio-courses-meta.ts
git commit -m "feat(academia-rwa): Curso 2 BrainShield + Vault 24k a fondo (Onboarding/Empresas)"
```

---

## Task 3: Curso 3 "Cómo vender RWA" (Socios)

Entrega: el seed inserta el Curso 3, visible sólo para socio_comercial/director (+ admin), con módulo de "qué NO prometer".

**Files:**
- Modify: `server/data/rwa-onboarding-courses.ts` (agregar slug `"como-vender-rwa"`)
- Modify: `server/data/rwa-onboarding-quizzes.ts` (agregar el mismo slug)
- Modify: `server/data/studio-courses-meta.ts` (agregar 1 entrada)

**Interfaces:**
- Consumes: `rwaOnboardingModules`, `rwaOnboardingQuizzes`, seed wiring (Tasks 1–2).
- Produces: slug `"como-vender-rwa"` en ambos records.

- [ ] **Step 1: Agregar los 5 módulos del Curso 3 en `rwa-onboarding-courses.ts`**

Agregar la clave `"como-vender-rwa": [ ... ]`. Briefs (~800–1200 palabras c/u):

1. **El pitch en 3 minutos.** Qué es un RWA en una frase, por qué BrainShield es distinto (sustancia real, las 4 patas), y el gancho para el prospecto.
2. **Los productos que vendes.** Bóveda de PI/intangibles, marketplace, CryptoVault 24k. A quién le sirve cada uno (empresa con PI, inversionista, comprador de oro).
3. **Manejo de objeciones.** "¿Es cripto/estafa?" (no: activo real + atestación), "¿es legal?" (KYC, corredor NIF C-8, no oferta de valores), "¿por qué anónimo?" (protege al socio; el dictamen/CFDI van a BrainShield SC). El marco de anonimato del socio ante el corredor.
4. **Comisiones y modelo de socio.** ⚠️ Ver Pregunta Abierta #1. Si David confirma el esquema RWA, redactarlo; si no, usar el esquema Ceduverse conocido (agente 15% + $500/referido cuando la empresa hace su 1ra aportación) con nota visible **"(esquema base Ceduverse; el esquema para RWA está pendiente de confirmar con David)"**.
5. **Guardrails de venta (qué NO prometer).** Iniciar y cerrar con el disclaimer EXACTO. Lista de lo prohibido: prometer rendimientos garantizados, llamar "inversión segura", garantizar que el oro sube, presentar la copropiedad como "acción" o "valor". Qué SÍ decir: es un activo real, verificable, con marco legal; el rendimiento depende del mercado.

- [ ] **Step 2: Agregar el quiz del Curso 3 en `rwa-onboarding-quizzes.ts`**

Agregar la clave `"como-vender-rwa"`:

```typescript
  "como-vender-rwa": {
    title: "Evaluación: Cómo vender RWA",
    passingScore: 70,
    questions: [
      {
        question: "Ante la objeción '¿esto es cripto/estafa?', el mejor argumento es:",
        options: [
          "Que el precio siempre sube",
          "Que detrás hay un activo real, valuado por un corredor independiente y con atestación on-chain de su procedencia",
          "Que muchos famosos lo compran",
          "Que es una oportunidad única que se acaba hoy",
        ],
        correctIndex: 1,
        explanation: "El diferenciador de BrainShield es la sustancia real: activo valuado independientemente, título legal y procedencia verificable. Eso responde honestamente a la objeción.",
      },
      {
        question: "¿Cuál de estas frases NUNCA debe usar un socio al vender?",
        options: [
          "Es un activo real con marco legal",
          "El rendimiento depende del mercado",
          "Es una inversión segura con rendimiento garantizado",
          "Puedes redimir tu CryptoVault por el lingote físico",
        ],
        correctIndex: 2,
        explanation: "Prometer 'inversión segura' o 'rendimiento garantizado' es falso y riesgoso legalmente. El contenido es educativo y los rendimientos no están garantizados.",
      },
      {
        question: "El anonimato del socio ante el corredor significa que:",
        options: [
          "El socio no paga impuestos",
          "Ante el corredor sólo se expone el activo y un alias; el dictamen/CFDI van a BrainShield SC",
          "Nadie sabe quién es el dueño, ni las autoridades",
          "El socio no necesita hacer KYC",
        ],
        correctIndex: 1,
        explanation: "El anonimato es operativo frente al corredor (activo + alias); la sustancia legal (dictamen, CFDI, KYC) existe y va a nombre de BrainShield SC.",
      },
      {
        question: "La copropiedad de un RWA se debe presentar al prospecto como:",
        options: [
          "Una acción o valor que cotiza",
          "Una reserva con depósito reembolsable que se formaliza offline con KYC/contrato",
          "Una criptomoneda que se mina",
          "Un préstamo con interés fijo",
        ],
        correctIndex: 1,
        explanation: "Presentarla como 'acción/valor' sería una oferta de valores. Es una reserva con depósito reembolsable formalizada offline con KYC y contrato.",
      },
      {
        question: "¿De dónde salen las comisiones del socio comercial?",
        options: [
          "De la aportación del cliente",
          "Del fee de administración (no de la aportación); esquema RWA a confirmar",
          "De un porcentaje del oro físico",
          "De la red Base",
        ],
        correctIndex: 1,
        explanation: "En el modelo Ceduverse las comisiones salen del fee de administración, no de la aportación. El esquema específico para RWA está pendiente de confirmar con David.",
      },
    ],
  },
```

- [ ] **Step 3: Agregar la entrada de meta del Curso 3 en `studio-courses-meta.ts`**

```typescript
  { slug: "como-vender-rwa", title: "Cómo vender RWA", description: "Capacitación para socios comerciales: pitch, productos, manejo de objeciones, comisiones y qué NO prometer al vender RWA", category: "Onboarding", subcategory: "Socios", durationMinutes: 60, level: "intermedio", tags: ["ventas", "socios", "RWA", "objeciones", "comisiones", "onboarding"], dc3Available: false, icon: "🤝", color: "#7c3aed", source: "brainshield" },
```

- [ ] **Step 4: Verificar compilación**

Run: `npm run check`
Expected: sin errores.

- [ ] **Step 5: Seed idempotente**

Run: `npx tsx server/seed-studio.ts`
Expected: `✓ Created course: Cómo vender RWA` (1 course, 5 modules, 1 quiz). Segunda corrida: 0 creados.

- [ ] **Step 6: Verificar gateo por rol**

- Con un usuario **socio_comercial** (o director): el curso aparece.
- Con **empresa** o **sin login**: NO aparece.
- Verificar que el módulo 5 lleva el disclaimer exacto y la lista de "qué NO prometer".

- [ ] **Step 7: Commit**

```bash
git add server/data/rwa-onboarding-courses.ts server/data/rwa-onboarding-quizzes.ts server/data/studio-courses-meta.ts
git commit -m "feat(academia-rwa): Curso 3 Cómo vender RWA (Onboarding/Socios)"
```

---

## Task 4: Verificación end-to-end del gateo por rol y la recompensa

Entrega: confirmación de que la matriz de visibilidad por rol funciona y que completar un curso dispara el logro + certificado digital estándar. Sin cambios de código salvo que se detecte un defecto.

**Files:**
- (Sólo verificación; si se detecta un bug, corregir en el archivo pertinente.)

- [ ] **Step 1: Matriz de visibilidad**

Con la app corriendo, verificar la sección Studio/Onboarding para cada caso:

| Usuario | Ve Curso 1 (Para Todos) | Ve Curso 2 (Empresas) | Ve Curso 3 (Socios) |
|---|---|---|---|
| Sin login | ✅ | ❌ | ❌ |
| socio_estudiante | ✅ | ❌ | ❌ |
| empresa / RH (team admin) | ✅ | ✅ | ❌ |
| socio_comercial / director | ✅ | ❌ | ✅ |
| admin / superadmin | ✅ | ✅ | ✅ |

Expected: coincide exactamente con la tabla (lógica en `server/routes/courses.ts`, bloque `category === "Onboarding"`).

- [ ] **Step 2: Completar un curso dispara logro + certificado**

Con un usuario de prueba, completar el Curso 1 al 100% (leer módulos + aprobar quiz). Verificar que:
- Se registra el logro (`achievement`) correspondiente.
- Se genera el certificado digital estándar de Ceduverse (diploma, gratuito).
- NO aparece opción de DC-3 ni SEP (porque `dc3Available: false`).

- [ ] **Step 3: Tutor IA (Q&A) responde en contexto**

Abrir el Tutor IA (avatar de Q&A) dentro del Curso 1 y hacer una pregunta sobre RWA. Expected: responde usando el contenido de los módulos como contexto (el servicio `tutor-ai.ts` lee los módulos automáticamente; no requiere cambios).

- [ ] **Step 4: Commit (si hubo correcciones)**

```bash
git add -A
git commit -m "fix(academia-rwa): correcciones de verificación end-to-end"
```

Si no hubo cambios, no se commitea nada; sólo se documenta el resultado de la verificación.

---

## Self-Review (cobertura del spec)

- ✅ Vehículo Studio/Onboarding + gateo por rol → Task 1 (wire-up) + Task 4 (matriz).
- ✅ 3 cursos con módulos + quiz → Tasks 1, 2, 3.
- ✅ Gateo Para Todos / Empresas / Socios → subcategorías exactas en cada meta + Task 4.
- ✅ Audio = "Leer en voz alta" (sin MP3) → Task 1 Step 7; sin migración (Global Constraints).
- ✅ Recompensa logro + certificado digital → Task 4 Step 2.
- ✅ Guardrails legales (disclaimer exacto, Cursos 2 y 3) → Global Constraints + Task 2 Step 1/6, Task 3 Step 1/6.
- ✅ Sin HeyGen, sin cambios de schema → Global Constraints.
- ✅ Preguntas abiertas (comisiones, validación legal) → registradas y manejadas en Task 3 Step 1.
- ✅ Seed idempotente → Tasks 1–3 Step 5/6.
