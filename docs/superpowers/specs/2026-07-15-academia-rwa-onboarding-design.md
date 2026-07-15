# Academia RWA — 3 cursos de onboarding en Ceduverse

**Fecha:** 2026-07-15
**Autor:** David Pérez Villaseñor (con Claude)
**Estado:** Diseño aprobado — pendiente escribir plan de implementación

## Resumen

Tres cursos de onboarding gratuitos en Ceduverse que explican el ecosistema **RWA
(Real World Assets)** de BrainShield y el producto **CryptoVault 24k**, alineados al
pivote estratégico de BrainShield hacia originación de RWA (tangibles e intangibles).

Sirven como **embudo educativo por rol**: cada usuario ve el curso general más el
curso específico de su rol. No generan ingreso (son onboarding); su objetivo es
educar y empujar al siguiente paso del embudo (registrar IP en BrainShield, comprar
CryptoVault, o activarse como socio comercial).

## Contexto y decisiones tomadas

Decisiones del brainstorming (2026-07-15):

- **Audiencia:** mixta — los tres roles (público/empresa/socio comercial).
- **Estructura:** 3 cursos separados, cada uno con su quiz.
- **Producción:** texto rico (HTML) + **audio TTS** (voz `onyx`) + quiz. **SIN avatar
  HeyGen** — esa función está desactivada y NO se toca ni se confunde.
- **Acceso:** los 3 gratis, onboarding, gateados por rol (ver tabla).
- **Recompensa:** como todo curso, al completar dispara el logro (`achievement`) + el
  certificado digital de Ceduverse (diploma gratuito, `dc3Available=false`, NO STPS).
- **Siembra:** patrón de archivos semilla versionados en git + seed script (patrón A),
  no alta manual.

## Arquitectura (sin infraestructura nueva)

Se reutiliza el sistema **Studio** existente, que ya tiene exactamente el mecanismo de
gateo por rol necesario.

- Categoría `"Onboarding"` con filtrado por `subcategory` según el rol del usuario
  (implementado hoy en `server/routes/courses.ts`, endpoint de listado de studio
  courses, bloque `category === "Onboarding"`):
  - `"Para Todos"` → todos, incluso sin login
  - `"Empresas"` → rol `empresa` / team admin (RH) (+ admin/superadmin)
  - `"Socios"` → `socio_comercial` / `partner` / `director` (+ admin/superadmin)
  - admin/superadmin ven las tres subcategorías
- Cada curso = 1 fila `studioCourses` + N filas `studioModules` + 1 fila
  `studioQuizzes` (schema en `shared/schema.ts`).
- Al completar, el flujo estándar de studio dispara el logro + certificado digital.
- El **Tutor IA** (avatar de Q&A por curso, `server/services/tutor-ai.ts`, Haiku) queda
  automáticamente encima: usa los módulos como contexto. No requiere trabajo extra.

### Mapa de cursos → rol

| Curso | `subcategory` | Rol que lo ve |
|---|---|---|
| 1. ¿Qué es un RWA? | `Para Todos` | Todos (incluso sin login) |
| 2. BrainShield + Vault 24k a fondo | `Empresas` | Empresa / RH (+ admin) |
| 3. Cómo vender RWA | `Socios` | socio_comercial / director (+ admin) |

## Contenido de los cursos

Todo el contenido lo redacta Claude a partir de la memoria del pivote RWA
(`brainshield-rwa-pivot`), materiales de BrainShield y el marketplace. Se revisa antes
de sembrar en producción. Los módulos legales (disclaimers) los valida Daniel/Aimée
(ver Riesgos).

### Curso 1 — "¿Qué es un RWA?" (`Para Todos`, ~5 módulos)

1. Qué es un Real World Asset (inmueble, oro, PI) — off-chain vs on-chain.
2. El problema que resuelve: iliquidez, opacidad, falta de procedencia. Por qué la
   mayoría de proyectos RWA "fingen" la sustancia off-chain.
3. Las 4 patas de un RWA legítimo: valuación independiente · título legal · flujo de
   efectivo · procedencia/sustancia. El marco BrainShield.
4. On-chain sin miedo: atestación vs tokenización, qué es Base, qué es un hash anclado,
   el token **BRAIN 1:1 USDC/USDT** (estable, sin volatilidad).
5. El ecosistema: BrainShield (originador) · marketplace RWA · CryptoVault 24k
   (commodity oro Kakaw) · anonimato del socio.
- Quiz de cierre. CTA: crear cuenta / explorar el marketplace / conocer BrainShield.

### Curso 2 — "BrainShield + Vault 24k a fondo" (`Empresas`, ~5 módulos)

1. Cómo BrainShield estructura un RWA real: valuación NIF C-8 / avalúo inmobiliario,
   corredor a 0% margen, atestación on-chain en Base. Caso hotel ARCICOM.
2. El marketplace RWA: tipos (CryptoVault producto vs copropiedad), ROI mostrado,
   multi-moneda (MXN/USD/EUR/GBP/CAD), cómo se reserva.
3. CryptoVault 24k a fondo: oro Au 999.9, ediciones 100g/200g, 320 piezas totales, NFT
   título 1:1 de lingote, reverso 24 palabras BIP39, modelo Kakaw no-custodio,
   redimible. Precio = spot × gramos × 1.25.
4. Cómo se compra: Stripe fiat multi-moneda + NOWPayments cripto (BTC/USDT), custodia,
   tx verificable en basescan.
5. **Marco legal y riesgos** (guardrail fuerte): esto NO es oferta de valores ni
   asesoría de inversión; copropiedad = reserva con depósito proporcional reembolsable +
   formalización offline (KYC/contrato); riesgo regulatorio CNBV (MX) / SEC (US) de
   tokenizar flujos de ingresos futuros.
- Quiz de cierre. CTA: reservar tu CryptoVault / agendar asesor / registrar la empresa.

### Curso 3 — "Cómo vender RWA" (`Socios`, ~5 módulos)

1. El pitch en 3 minutos: qué es un RWA, por qué BrainShield es distinto (sustancia real).
2. Los productos que vendes: bóveda de PI/intangibles · marketplace · CryptoVault 24k. A
   quién le sirve cada uno.
3. Manejo de objeciones ("¿es cripto?", "¿es estafa?", "¿es legal?", "¿por qué anónimo?")
   + el marco de anonimato del socio ante el corredor.
4. Comisiones y modelo de socio. **⚠️ Hueco de contenido (ver Preguntas abiertas):** el
   esquema de comisiones para venta de BrainShield/CryptoVault puede diferir del de
   Ceduverse (15% agente + $500/referido a la 1ª aportación de la empresa). Si no está
   definido, se redacta genérico y se marca como pendiente de David.
5. Guardrails de venta: qué NO puedes prometer (rendimientos garantizados, "es una
   inversión segura"), disclaimers obligatorios, no oferta de valores.
- Quiz de cierre. CTA: activarse como socio / descargar kit de venta / agendar onboarding.

## Cambios técnicos

### Migración de base de datos

`studio_modules` hoy no tiene campo de audio (solo `video_url`). Se agrega:

```sql
ALTER TABLE studio_modules ADD COLUMN audio_url text;
```

Más el campo correspondiente en el schema Drizzle (`shared/schema.ts`, tabla
`studioModules`) y en el insert schema si aplica.

### Archivos semilla nuevos

- `server/data/rwa-onboarding-courses.ts` — contenido HTML de los ~15 módulos
  (estructura por slug, igual que `yuridia-courses.ts` / `medina-modules.ts`).
- `server/data/rwa-onboarding-quizzes.ts` — 3 quizzes (formato `studioQuizzes.questions`
  jsonb: pregunta, opciones, índice correcto, explicación).
- 3 entradas nuevas en `server/data/studio-courses-meta.ts` con:
  - `category: "Onboarding"`, `subcategory` correspondiente
  - `dc3Available: false`, `source: "brainshield"` (o `"rwa"`)
  - `icon`/`color` de marca BrainShield/RWA

### Seed

Extender `server/seed-studio.ts` para sembrar los 3 cursos RWA de forma idempotente
(upsert por slug), incluyendo módulos y quiz.

### Audio (TTS)

Extender `server/generate-ted-audio.ts` para incluir los módulos RWA: strip HTML →
chunk → TTS `onyx` (OpenAI) → concat con ffmpeg → subir a R2 → poblar `audio_url` de
cada módulo. Requiere `OPENAI_API_KEY`. Los MP3 quedan pre-generados en R2 (como los
cursos existentes), no se generan en runtime.

## Guardrails legales (requisito)

Todo curso que toque inversión o compra (Cursos 2 y 3) incluye, de forma visible, un
disclaimer:

> **Contenido educativo. No constituye oferta de valores, asesoría de inversión ni
> asesoría financiera. Los rendimientos no están garantizados.**

Fundamento: riesgo regulatorio CNBV/SEC identificado en el pivote RWA (tokenizar flujos
de ingresos futuros puede constituir un valor/security). El Curso 3 incluye un módulo
explícito de "qué NO prometer" para la fuerza de venta.

Los textos legales los redacta Claude en borrador y **los valida Daniel/Aimée** antes de
sembrar en producción.

## Testing / verificación

- Seed idempotente: correr el seed dos veces no duplica cursos/módulos/quiz.
- Gateo por rol: verificar que un usuario sin login solo ve el Curso 1; un rol empresa
  ve Curso 1 + 2; un socio comercial ve Curso 1 + 3; admin ve los tres.
- Audio: cada módulo con `audio_url` poblado y el MP3 accesible en R2.
- Completar un curso dispara el logro + certificado digital estándar.
- Quiz: `passingScore` respetado; preguntas/opciones/explicaciones bien formadas.
- El Tutor IA responde en contexto usando los módulos RWA.

## Preguntas abiertas (no bloquean el diseño, sí el texto final)

1. **Comisiones RWA (Curso 3, módulo 4):** ¿el socio que vende BrainShield/CryptoVault
   cobra bajo el mismo esquema de Ceduverse (15% agente + $500/referido) o hay uno
   distinto para RWA? Si no está definido, se redacta genérico y se marca pendiente.
2. **Validación legal:** confirmar que Daniel/Aimée revisan los disclaimers y el módulo
   legal del Curso 2 antes de sembrar en producción.

## Fuera de alcance

- Avatar HeyGen (función desactivada).
- Cobro / certificación de pago (DC-3, SEP) para estos cursos.
- Cambios al motor de comisiones o al checkout.
- Traducción a otros idiomas.
