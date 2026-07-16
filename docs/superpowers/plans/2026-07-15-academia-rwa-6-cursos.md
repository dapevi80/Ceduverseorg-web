# Academia RWA — 6 cursos (3 base + 3 comerciales gateados) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development o executing-plans. Rama base: `feat/rwa-onboarding-courses` (donde vive el Curso 1). Steps con checkbox.

**Goal:** Extender Academia RWA de 1 a 6 cursos: 3 base de onboarding para TODOS (incl. estudiantes) + 3 comerciales gateados a `socio_comercial`/`empresa`/`director` que sí llevan la estrategia legal-fiscal (bono, NFT de aportación, modelo cooperativo). Los estudiantes NO ven la capa legal-fiscal.

**Architecture:** Reutiliza el sistema **Studio** sin cambios de schema (igual que el Curso 1): cada curso = data file `Record<slug, RwaModule[]>` (módulos con `contentHtml` + `references`) sembrado vía `seed-studio.ts` → `studio_courses`/`studio_modules`, con quiz. Audio = "Leer en voz alta" del navegador (gratis, sin MP3). **SIN HeyGen.** Gateo por `subcategory` (ya implementado en `server/routes/courses.ts`), con UNA extensión: nueva subcategoría `"Comercial"` visible a comercial+empresa+director. Al completar → logro + diploma digital gratuito (`dc3Available=false`, NO STPS).

**Tech Stack:** TS (server data files), Drizzle/Studio tables, seed-studio.ts. Sin migración de schema.

## Global Constraints

- **Gateo por rol (regla dura):** estudiantes ven SOLO `"Para Todos"` (cursos 1-3). `socio_comercial`/`partner`/`director`/`empresa`/admin ven además `"Comercial"` (cursos 4-6). El detalle legal-fiscal (capitalización 5%, reserva 1:1, split IVA, bono, secreto industrial) va **EXCLUSIVAMENTE** en 4-6 — NUNCA en 1-3.
- **Calidad de contenido:** prosa narrativa, honesta, en español MX, al nivel del Curso 1 existente (`server/data/rwa-onboarding-courses.ts`, curso `que-es-un-rwa`) — ese es el estándar. Cada módulo ~10-14 min de lectura, `contentHtml` con `<p>`/`<h3>`.
- **Parámetros correctos (de memoria):** bono $170 ($150 aportación + $20 saldo), origen EXTERNO (token 1:1 **CEDU 1:1 MXN**/BRAIN 1:1 USDC/KAKAW 1:1 oro, o beca); capitalización **5%** tope 20 certs ($3,000); RVOE Academy $49,900; 1 socio = 1 voto; certificado de aportación digital (Art. Sexto acta 6520); NFT = gemelo registral, no título negociable; comisión agente base 15%. Fuentes: memorias `ceduverse-cobros-web3`, `ceduverse-estructura-legal`, `brainshield-rwa-pivot`, `ceduverse-roles-comision`.
- **Disclaimers legales:** los módulos legales llevan guardrails (NO oferta de valores, NO asesoría de inversión, NO rendimientos garantizados) y se marcan para revisión de Daniel/Aimée antes de sembrar en prod.
- **Sin schema nuevo.** Reutiliza Studio tal cual.

## Lineup (6 cursos → subcategory → rol)

| # | Curso | slug | subcategory | Quién lo ve |
|---|-------|------|-------------|-------------|
| 1 | ¿Qué es un RWA? | `que-es-un-rwa` | Para Todos | Todos *(YA HECHO)* |
| 2 | BrainShield y la bóveda de PI | `brainshield-boveda-pi` | Para Todos | Todos |
| 3 | CryptoVault 24k | `cryptovault-24k` | Para Todos | Todos |
| 4 | Bono de bienvenida (cómo te vuelves copropietario) | `bono-bienvenida` | Comercial | comercial/empresa/director |
| 5 | Certificados de aportación NFT | `certificados-aportacion-nft` | Comercial | comercial/empresa/director |
| 6 | Modelo cooperativo comercial (cómo vender) | `modelo-cooperativo-comercial` | Comercial | comercial/empresa/director |

---

### Task 1: Extensión de gateo — subcategoría `"Comercial"`

**Files:** Modify `server/routes/courses.ts` (bloque `category === "Onboarding"`, ~líneas 904-926)

**Interfaces:** Produces: los roles comercial/empresa/director/admin incluyen `"Comercial"` en `allowedSubcategories`.

- [ ] **Step 1: Ajustar el mapa de subcategorías permitidas**

En el bloque de gateo, actualizar para que `"Comercial"` sea visible a comercial+empresa+director+admin (los estudiantes NO):
```ts
let allowedSubcategories: string[] = ["Para Todos"];
if (role === "admin" || role === "superadmin") {
  allowedSubcategories = ["Para Todos", "Empresas", "Socios", "Comercial"];
} else if (role === "socio_comercial" || role === "partner" || role === "director") {
  allowedSubcategories = ["Para Todos", "Socios", "Comercial"];
} else if (role === "empresa" || role === "empresa_rh") {
  allowedSubcategories = ["Para Todos", "Empresas", "Comercial"];
}
```
(Mantener el resto de la lógica igual; solo se agrega `"Comercial"` a esos tres branches.)

- [ ] **Step 2: Verificar compilación**

Run: `npx tsc --noEmit -p tsconfig.json` → sin errores nuevos en courses.ts.

- [ ] **Step 3: Commit**

```bash
git add server/routes/courses.ts
git commit -m "feat(academia): subcategoria Comercial visible a comercial/empresa/director"
```

---

### Task 2: Curso 2 — "BrainShield y la bóveda de PI" (`Para Todos`)

**Files:** Modify `server/data/rwa-onboarding-courses.ts` (agregar entrada `brainshield-boveda-pi`) + `server/data/rwa-onboarding-quizzes.ts`

**Módulos (contentHtml al nivel del Curso 1; base, SIN legal-fiscal cooperativo):**
1. **Qué es BrainShield** — originador de RWA (tangibles: inmueble/hotel ARCICOM; intangibles: PI). Custodia y protege activos.
2. **La bóveda de PI anónima** — cómo un creador deposita su PI (patente/marca/secreto), el alias, el modelo 80/20, la pensión/regalía. Anonimato del socio como secreto industrial.
3. **Valuación y atestación** — corredor público NIF C-8, 0% margen, hash anclado en Base. Por qué la sustancia off-chain manda.
4. **El token BRAIN** — 1:1 USDC/USDT (estable), atestación vs tokenización. Sin volatilidad.
5. **El ecosistema completo** — BrainShield (originador) · marketplace RWA · CryptoVault. CTA: explorar marketplace / conocer BrainShield.

- [ ] Step 1: Escribir los 5 módulos (contentHtml) siguiendo el estándar del Curso 1. Fuente: memorias `brainshield-rwa-pivot`, `project_brainshield`.
- [ ] Step 2: Escribir el quiz (5 preguntas de opción múltiple con `passingScore` 70).
- [ ] Step 3: `npx tsc --noEmit` limpio.
- [ ] Step 4: Commit `feat(academia): curso 2 BrainShield y boveda de PI (Para Todos)`.

---

### Task 3: Curso 3 — "CryptoVault 24k" (`Para Todos`)

**Files:** Modify `rwa-onboarding-courses.ts` (`cryptovault-24k`) + quizzes.

**Módulos (base, sin legal-fiscal):**
1. **Qué es CryptoVault 24k** — oro Au 999.9, ediciones 100g/200g, 320 piezas, 1/320·2026.
2. **NFT título 1:1 del lingote** — gemelo digital del oro, redimible, no-custodio (modelo Kakaw).
3. **La seed en el reverso** — 24 palabras BIP39, autocustodia, separar pago de custodia.
4. **Cómo se compra** — Stripe fiat multi-moneda + NOWPayments cripto, tx verificable en basescan. Precio = spot × gramos × 1.25.
5. **Guardrails** — NO es oferta de valores ni asesoría; garantía verificable. CTA: reservar / conocer más.

- [ ] Step 1: Escribir 5 módulos. Fuente: memorias `kakaw_landing_brand` (CryptoVault), `brainshield-rwa-pivot`.
- [ ] Step 2: Quiz 5 preguntas.
- [ ] Step 3: tsc limpio. Step 4: Commit `feat(academia): curso 3 CryptoVault 24k (Para Todos)`.

---

### Task 4: Curso 4 — "Bono de bienvenida" (`Comercial`, legal-fiscal)

**Files:** Modify `rwa-onboarding-courses.ts` (`bono-bienvenida`) + quizzes.

**Módulos (capa comercial/legal-fiscal — solo comercial/empresa):**
1. **La aportación NO es un gasto** — es tu patrimonio (capital cooperativo, devolvible). Reencuadre.
2. **El bono de $170** — $150 fundan tu 1er certificado de aportación + $20 saldo para DC-3/SEP.
3. **De dónde sale el valor (EXTERNO)** — token respaldado 1:1 (CEDU 1:1 MXN, BRAIN 1:1 USDC, KAKAW 1:1 oro) o beca de empresa. Por qué un token sin reserva 1:1 = capital simulado (NO sirve).
4. **La reserva 1:1** — la tesorería que respalda el bono; sin ella no se emite.
5. **Materialidad y trazabilidad** — el comprobante sellado on-chain da respaldo real al certificado/NFT. CTA: activa tu certificado.

- [ ] Step 1: Escribir 5 módulos con guardrails legales. Fuente: memoria `ceduverse-cobros-web3` (§ bono/capitalización) + `reglamento-interno-ceduverse-DRAFT.md` (Art. 14 Bis).
- [ ] Step 2: Quiz 5 preguntas. Step 3: tsc. Step 4: Commit `feat(academia): curso 4 bono de bienvenida (Comercial)`.

---

### Task 5: Curso 5 — "Certificados de aportación NFT" (`Comercial`, legal-fiscal)

**Files:** Modify `rwa-onboarding-courses.ts` (`certificados-aportacion-nft`) + quizzes.

**Módulos:**
1. **Qué es un certificado de aportación** — título del socio en la cooperativa; Art. Sexto (acta 6520) permite que sean digitales.
2. **El NFT gemelo registral** — el Libro de Registro es la fuente de verdad; el NFT/sello on-chain es espejo por hash, NO el título negociable. Privacidad (sin datos personales on-chain).
3. **1 socio = 1 voto** — por más certificados que tengas, sigues con 1 voto. Cooperativa de personas, no de capitales.
4. **Capitalización del 5%** — cómo crece tu aportación con tu propia actividad (ej. certificación RVOE $49,900 → $2,495 ≈ 16 certificados), tope 20.
5. **Transmisión y reembolso** — restringida (derecho del tanto 15 días, valor nominal), certificados capitalizados afectos, reembolso a valor en libros. CTA.

- [ ] Step 1: Escribir 5 módulos. Fuente: `ceduverse-estructura-legal`, `ceduverse-cobros-web3`, `reglamento-interno-ceduverse-DRAFT.md` (Art. 11, 12, 14). Step 2: Quiz. Step 3: tsc. Step 4: Commit `feat(academia): curso 5 certificados de aportacion NFT (Comercial)`.

---

### Task 6: Curso 6 — "Modelo cooperativo comercial (cómo vender)" (`Comercial`)

**Files:** Modify `rwa-onboarding-courses.ts` (`modelo-cooperativo-comercial`) + quizzes.

**Módulos:**
1. **El pitch en 3 minutos** — qué vendes (bóveda PI, marketplace, CryptoVault, membresía cooperativa) y por qué BrainShield/Ceduverse es distinto (sustancia real).
2. **Comisiones y niveles** — agente base 15% (commissionRate), $500/referido a la 1ª aportación, cómo se dispersan (día 25). Agente vs director.
3. **Manejo de objeciones** — "¿es cripto?", "¿es legal?", "¿es estafa?", "¿por qué anónimo?".
4. **El modelo cooperativo** — aportación capitalizada, socio copropietario, 1 socio=1 voto, el rol del socio comercial.
5. **Guardrails de venta** — qué NO prometer (rendimientos garantizados, "inversión segura"), disclaimers obligatorios, no oferta de valores. CTA: descargar kit / agendar onboarding.

- [ ] Step 1: Escribir 5 módulos. Fuente: `ceduverse-business_model`, `ceduverse-roles-comision`, `brainshield-rwa-pivot`. Step 2: Quiz. Step 3: tsc. Step 4: Commit `feat(academia): curso 6 modelo cooperativo comercial (Comercial)`.

---

### Task 7: Wire-up del seed + metadata + verificación

**Files:** Modify `server/data/studio-courses-meta.ts` (metadata: title, slug, subcategory, category="Onboarding", durationMinutes, dc3Available=false) para los 5 cursos nuevos · `server/seed-studio.ts` (incluir los nuevos en el seed) · confirmar quizzes wired.

- [ ] Step 1: Agregar metadata de los 5 cursos (subcategory correcta: 2-3 `"Para Todos"`, 4-6 `"Comercial"`).
- [ ] Step 2: Asegurar que `seed-studio.ts` siembra los 6 cursos + módulos + quizzes.
- [ ] Step 3: `npx tsc --noEmit -p tsconfig.json` limpio (todo el repo).
- [ ] Step 4: Verificación local del gateo (sin DB): revisar que el mapa de courses.ts asigna las subcategorías correctas por rol (estudiante NO ve "Comercial").
- [ ] Step 5: Commit `feat(academia): wire-up seed de los 6 cursos + metadata`.

---

## Manuales del usuario (post-implementación)

1. **⚠️ Resolver la deuda de migraciones ANTES del seed:** la BD de prod (Supabase) va atrás del código. Aplicar las migraciones pendientes (incluida `0007` de certificados) y confirmar que las tablas `studio_courses`/`studio_modules`/`studio_quizzes` existen en prod.
2. **Correr el seed** de Studio en prod para insertar los 6 cursos (`npm run` del seed correspondiente / o el endpoint de seed).
3. **Revisión legal:** Daniel/Aimée validan los módulos con contenido legal-fiscal (cursos 4-6) antes de exponerlos.
4. Smoke: entrar como `socio_estudiante` (ve 1-3, NO 4-6) y como `socio_comercial`/`empresa` (ve 1-6). Completar un curso → dispara logro + diploma.

## Fuera de alcance

- MP3/TTS (se usa "Leer en voz alta"). HeyGen (desactivado). Migración de schema (no se necesita). El esquema fino de comisiones BrainShield si difiere del cooperativo (se redacta genérico + marca pendiente de David).
