# Detector de riesgos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que un trabajador capacitado reporte incumplimientos reales de su empresa con foto, que la empresa los atienda y documente la corrección, y que el trabajador reciba puntos cuando su hallazgo se valida.

**Architecture:** Reemplaza la actividad de campo del playbook reciclando su infraestructura (subida validada, proxy autenticado de fotos, alcance por empresa, logros). Lo nuevo: una tabla de hallazgos con estados, la elección de anonimato por reporte, y la sugerencia de norma acotada a referencias reales.

**Tech Stack:** TypeScript, Express, Drizzle/Postgres, R2, Anthropic (sugerencia de norma), React + wouter, vitest.

**Spec:** `docs/superpowers/specs/2026-07-18-detector-riesgos-design.md` — **léelo antes de empezar**, en particular §3 (el límite honesto del anonimato) y §6 (el anonimato como regla de servidor).

## Global Constraints

- **El anonimato es una regla de SERVIDOR.** Si `anonymous = true`, la identidad no sale del servidor: ni `user_id`, ni nombre, ni correo, ni oculta "para uso del cliente". Cualquiera abre las herramientas del navegador y la lee.
- **La llave de la foto no puede delatar.** Hoy la llave de R2 incluye el `user_id`; en un hallazgo anónimo eso lo firmaría. Para anónimos la llave usa el **id del hallazgo**.
- **Cero invención de normas.** La IA sólo puede escoger entre las referencias reales del curso (`studio_modules.references`, verbatim). Se valida antes de guardar. **Sin coincidencia → se guarda sin norma**; un hallazgo sin norma es válido, uno con norma inventada no.
- **Los puntos se acreditan al validar**, nunca al enviar. `RIESGO_VALIDADO_PUNTOS = 150`.
- **Cero degradación silenciosa:** trabajador sin empresa → mensaje honesto y no se escribe nada; falla R2 → error explícito, sin hallazgo huérfano; `atendido` sin foto de solución y `descartado` sin motivo → 4xx claro.
- **No ampliar el alcance de nadie:** la empresa ve sólo hallazgos de su propio equipo (`getEmpresaAdminTeam`, membresía real de admin/empresa_rh); el trabajador ve sólo los suyos.
- Todo el texto visible, en español de México.

---

### Task 1: Tabla `risk_findings` + migración

**Files:** Modify `shared/schema.ts`; Create `migrations/2026-07-19_risk_findings.sql`

**Interfaces:** produce `riskFindings` (Drizzle) y sus tipos. Columnas exactas en §5 del spec.

- [ ] **Step 1:** agregar la tabla a `shared/schema.ts` con las columnas de §5, índices `(team_id, status)` y `(user_id)`.
- [ ] **Step 2:** escribir la migración SQL equivalente. **Incluir al final los `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` de cada columna**, porque un `CREATE TABLE IF NOT EXISTS` se salta entero si la tabla ya existe (nos pasó con `course_playbooks.source` y rompió el deploy).
- [ ] **Step 3:** **NO** retirar `playbook_evidence` aquí. Quitarla del schema mientras el código sigue importándola rompe la compilación para todas las tareas siguientes (pasó: `server/routes/playbook.ts` dejó de compilar). Su eliminación —schema + `DROP TABLE` + código— va completa en la **Task 10**.
- [ ] **Step 4:** `npx tsc --noEmit` limpio y el SQL revisado contra el schema campo por campo.
- [ ] **Step 5: Commit** — `feat(detector): tabla risk_findings + migración`

---

### Task 2: Reglas de estado y puntos (puro, TDD)

**Files:** Create `server/lib/risk-status.ts` + `.test.ts`

**Interfaces:**
```ts
export type RiskStatus = "nuevo" | "en_revision" | "atendido" | "descartado";
export const RIESGO_VALIDADO_PUNTOS = 150;
export function canTransition(from: RiskStatus, to: RiskStatus): boolean;
export function validateTransition(to: RiskStatus, input: { resolutionPhotoKey?: string|null; resolutionNote?: string|null }):
  { ok: true } | { ok: false; message: string };
export function pointsForTransition(from: RiskStatus, to: RiskStatus, alreadyAwarded: number): number;
```

- [ ] **Step 1: tests primero.** Casos obligatorios: `nuevo→en_revision→atendido` permitido; `atendido→nuevo` NO; `atendido` sin `resolutionPhotoKey` → `ok:false` con mensaje; `descartado` sin `resolutionNote` → `ok:false`; `pointsForTransition` da `RIESGO_VALIDADO_PUNTOS` sólo al entrar a `atendido` y **0 si ya se habían acreditado** (reabrir y volver a cerrar no duplica); `descartado` da 0.
- [ ] **Step 2:** correr, ver fallar. **Step 3:** implementar. **Step 4:** pasar.
- [ ] **Step 5: Commit** — `feat(detector): reglas puras de estado y puntos`

---

### Task 3: Proyección anónima (puro, TDD) — **la pieza de seguridad**

**Files:** Create `server/lib/risk-anonymity.ts` + `.test.ts`

**Interfaces:**
```ts
export interface FindingRow { id:string; userId:string; anonymous:boolean; description:string; normRef:string|null;
  status:string; photoKey:string; createdAt:Date; reporterName?:string|null; reporterEmail?:string|null; /* ...resto */ }
export interface CompanyFinding { id:string; anonymous:boolean; description:string; normRef:string|null;
  status:string; createdAt:Date; reporter: { name:string } | null; /* null si anónimo */ }
export function toCompanyView(row: FindingRow): CompanyFinding;
export function anonymousPhotoKey(findingId: string, ext: string): string;
export function identifiedPhotoKey(userId: string, findingId: string, ext: string): string;
```

- [ ] **Step 1: tests primero.** Obligatorios:
  - anónimo → el objeto resultante **no contiene** `userId`, `reporterName` ni `reporterEmail` en NINGUNA propiedad (comprobarlo con `JSON.stringify(result)` y buscar el id y el correo: no deben aparecer).
  - identificado → sí trae `reporter.name`.
  - `anonymousPhotoKey` **no contiene** el `userId` (pasarlo como argumento adicional en el test y verificar que no aparece en la cadena).
  - `toCompanyView` nunca lanza con campos nulos.
- [ ] **Step 2-4:** fallar → implementar → pasar.
- [ ] **Step 5: Commit** — `feat(detector): proyección anónima con pruebas de fuga`

---

### Task 4: Sugerencia de norma acotada (IA)

**Files:** Create `server/risk-norm-suggest.ts`; Create `server/lib/norm-validate.ts` + `.test.ts`

**Interfaces:**
```ts
// puro
export function isAllowedNorm(candidate: string|null|undefined, allowed: string[]): boolean;
export function pickAllowedNorm(candidate: string|null|undefined, allowed: string[]): string | null;
// I/O
export function suggestNorm(description: string, allowedRefs: string[]): Promise<string | null>;
```

- [ ] **Step 1: tests puros primero.** `pickAllowedNorm` devuelve la norma sólo si está en `allowed` (comparación exacta tras recortar espacios); si el candidato no está → `null`; `allowed` vacío → `null`; candidato null → `null`. **Ninguna coincidencia parcial ni difusa**: si la IA devuelve "NOM-006" y la lista dice "NOM-006-STPS-2014", NO se acepta (evita inventar precisión que nadie verificó).
- [ ] **Step 2:** implementar `suggestNorm` con el mismo patrón de cliente Anthropic de `server/ai-engine.ts`. El prompt entrega la lista y pide **elegir una o ninguna**. La respuesta **siempre** pasa por `pickAllowedNorm` antes de devolverse.
- [ ] **Step 3:** sin `ANTHROPIC_API_KEY` o ante cualquier fallo → devuelve `null` y lo registra. **Nunca inventa.**
- [ ] **Step 4: Commit** — `feat(detector): sugerencia de norma acotada a referencias reales`

---

### Task 5: Endpoints del trabajador

**Files:** Create `server/routes/riesgos.ts`; Modify `server/routes.ts`

**Interfaces (consumidos por el cliente):**
- `POST /api/riesgos` (requireAuth, multipart campo `photo`) → crea el hallazgo. Body: `description`, `anonymous`, `courseSlug?`, `normRef?`. Resuelve el equipo del trabajador; **sin equipo → 400 honesto sin escribir nada**. Sube a R2 **antes** de insertar. Devuelve `{ finding: CompanyFinding-like del propio autor }`.
- `POST /api/riesgos/sugerir-norma` (requireAuth) → `{ description, courseSlug? }` → `{ normRef: string|null, opciones: string[] }` (las referencias reales disponibles, para que el trabajador corrija).
- `GET /api/riesgos/mios` (requireAuth) → los hallazgos del propio usuario, con estado y puntos.
- `GET /api/riesgos/:id/foto` (requireAuth) → proxy autenticado, `Cache-Control: private, no-store`, autorizado si es el autor **o** admin de su equipo. Reusar el patrón ya probado en `server/routes/playbook.ts`.

- [ ] **Step 1:** implementar reusando `server/lib/playbook-upload.ts` (allowlist de mimetypes, 8 MB, traducción de errores de multer a 400).
- [ ] **Step 2:** la llave de la foto sale de `anonymousPhotoKey`/`identifiedPhotoKey` (Task 3) según `anonymous`.
- [ ] **Step 3:** `npx tsc --noEmit` + `npx vitest run server/lib/`.
- [ ] **Step 4: Commit** — `feat(detector): endpoints de reporte del trabajador`

---

### Task 6: Endpoints de la empresa

**Files:** Modify `server/routes/riesgos.ts`

**Interfaces:**
- `GET /api/empresa/riesgos` (requireAuth) → hallazgos **del propio equipo** vía `getEmpresaAdminTeam`; cada uno pasa por `toCompanyView` (Task 3). Sin equipo → `403`, **nunca** una lista de otro equipo ni todos.
- `PATCH /api/empresa/riesgos/:id` (requireAuth) → `{ status, resolutionNote? }` + multipart opcional `resolutionPhoto`. Valida con `validateTransition` (Task 2), acredita puntos con `pointsForTransition`, escribe `resolved_by`/`resolved_at`.
- `GET /api/empresa/riesgos/:id/foto-solucion` (requireAuth) → proxy autenticado de la foto de solución.

- [ ] **Step 1:** implementar. El hallazgo debe pertenecer al equipo del solicitante — verificarlo por `team_id`, **no** por un parámetro del cliente.
- [ ] **Step 2:** los puntos se acreditan con el mismo patrón tolerante a colisión única ya usado en `server/routes/playbook.ts` (no reventar por una carrera).
- [ ] **Step 3: Commit** — `feat(detector): endpoints de la empresa con estados y puntos`

---

### Task 7: Página de reporte (cliente)

**Files:** Modify `client/src/pages/playbook-exercise.tsx` → renombrar a `client/src/pages/reportar-riesgo.tsx`; Modify `client/src/App.tsx`

Flujo: foto → descripción → **botón "¿Qué norma aplica?"** que llama a `sugerir-norma` y muestra la sugerencia junto a la lista real para corregir → interruptor **"Enviar como anónimo"** con el texto honesto de §3 del spec → enviar.

- [ ] **Step 1:** reusar el guard de sesión ya correcto del archivo (`!authLoading && !user` + `authUrlWithNext`), la subida y el manejo honesto de errores.
- [ ] **Step 2:** el `accept` del input mantiene la allowlist real (sin SVG).
- [ ] **Step 3:** ruta `/riesgos/reportar` (y `/riesgos/reportar/:slug` cuando viene del QR de un curso). Conservar la vieja como redirección.
- [ ] **Step 4: Commit** — `feat(detector): pantalla de reporte del trabajador`

---

### Task 8: Tablero de la empresa

**Files:** Modify `client/src/pages/team-playbook-evidence-tab.tsx` → `client/src/pages/team-riesgos-tab.tsx`; Modify `client/src/pages/dashboard.tsx`

- [ ] **Step 1:** lista con filtros por estado, foto, descripción, norma y fecha. Si el hallazgo es anónimo, **la interfaz no muestra ni deja pedir** el nombre.
- [ ] **Step 2:** acciones de estado; `atendido` **exige** subir la foto de solución; `descartado` **exige** motivo. Errores del servidor visibles.
- [ ] **Step 3:** conservar `isError`/`isLoading` distinguidos (no repetir el falso "sin datos" que ya corregimos) y la misma condición de visibilidad `isOrgAdmin`.
- [ ] **Step 4: Commit** — `feat(detector): tablero de hallazgos de la empresa`

---

### Task 9: "Mis hallazgos" (trabajador)

**Files:** Create `client/src/pages/mis-riesgos.tsx`; Modify `client/src/App.tsx` y el panel del trabajador

- [ ] **Step 1:** lista con estado, puntos acreditados y —cuando exista— la foto de solución, para que vea que su reporte sirvió de algo. Incluye los anónimos.
- [ ] **Step 2: Commit** — `feat(detector): mis hallazgos`

---

### Task 10: Retirar la actividad de campo

**Files:** Modify `server/routes/playbook.ts`, `client/src/pages/studio-course.tsx`, docs

- [ ] **Step 1:** quitar los endpoints de evidencia del playbook y su vista, ya reemplazados. **No** tocar el resto del playbook (guía de estudio, referencias, PDF).
- [ ] **Step 2:** los `course_playbooks.exercises` se reencuadran como **"señales de riesgo que puedes detectar"** (§9 del spec): cambia el texto y el QR ahora apunta a `/riesgos/reportar/:slug`.
- [ ] **Step 3:** actualizar `docs/superpowers/specs/2026-07-18-playbook-design.md` marcando §4.4 como reemplazado.
- [ ] **Step 4:** `npx tsc --noEmit` + suite completa.
- [ ] **Step 5: Commit** — `refactor(detector): retirar la actividad de campo reemplazada`

---

### Task 11: Historial de cumplimiento

**Files:** Modify `server/routes/riesgos.ts`; Modify `client/src/pages/team-riesgos-tab.tsx`

- [ ] **Step 1:** `GET /api/empresa/riesgos/historial.pdf` — hallazgos atendidos con foto del riesgo y de su corrección, norma citada y fechas. Reusar `server/cuaderno/fonts.ts` y `visuals.ts` para que salga con identidad de marca.
- [ ] **Step 2:** botón de descarga en el tablero.
- [ ] **Step 3: Commit** — `feat(detector): historial de cumplimiento en PDF`

---

### Task 12: Verificación final

- [ ] **Step 1:** **Prueba de fuga de anonimato:** crear un hallazgo anónimo y otro firmado; consultar el endpoint de la empresa y confirmar que en la respuesta cruda del anónimo **no aparece** el id del usuario ni su correo. Es la prueba que no puede fallar.
- [ ] **Step 2:** confirmar que la llave de la foto del anónimo no contiene el id del usuario.
- [ ] **Step 3:** ciclo completo: reportar → en revisión → atendido con foto → puntos acreditados una sola vez.
- [ ] **Step 4:** `descartado` sin motivo y `atendido` sin foto → rechazados con mensaje claro.
- [ ] **Step 5:** dos empresas distintas: ninguna ve hallazgos de la otra.
- [ ] **Step 6:** reportar sin pertenecer a una empresa → mensaje honesto, nada escrito en la base.
- [ ] **Step 7:** reportar el resultado; no commitear scripts de verificación.
