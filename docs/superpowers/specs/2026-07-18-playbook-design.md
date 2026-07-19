# Playbook del curso (Tutor IA) — Design

**Fecha:** 2026-07-18
**Producto:** Ceduverse — Tutor IA (Studio)
**Autor de la decisión:** David
**Estado:** Borrador para revisión (spec). No implementar hasta aprobación.

---

## 1. Problema y objetivo

El botón "Descargar" del Tutor IA (que bajaba un PDF de texto plano) se **quitó** (commit `5db47c0`). El dueño quiere reemplazarlo por un **Playbook**: un "libro de jugadas" del curso, estilo fútbol americano, que combina **resúmenes, estrategias, preguntas de reflexión** y — lo diferenciador — **ejercicios de campo** que el alumno aplica en su trabajo y **documenta con fotos** vía QR, ganando **logros y puntos**. Es lo que cierra el ciclo "aprender → aplicar → evidenciar → reconocer".

## 2. Decisiones tomadas (David, 2026-07-18)

- **Formato: híbrido (C).** Playbook **interactivo en la app** + **exportar a PDF**.
- **Ejercicios: IA (A).** La IA genera **3-5 ejercicios de campo por curso** desde el contenido. **Cada ejercicio = un QR.** Subir su foto → **medalla + puntos por ese ejercicio**; completar todos → **medalla especial "Playbook completado"**.
- **QR por login:** el QR codifica una URL `/playbook/:courseSlug/ejercicio/:n` que **exige login**; el usuario sale de la sesión, no de un token. QR por ejercicio (igual para todos).
- **Visibilidad:** la evidencia es **privada del alumno** + **visible para su empresa/admin** (para que la empresa vea que su gente aplica). **No pública** → moderación mínima.
- **Ubicación:** una pestaña **"Playbook"** en el curso del Tutor IA. El botón "Descargar" renace ahí, y abre el playbook interactivo + el export PDF.

## 3. Regla dura: contenido real, evidencia real

- Los **resúmenes/estrategias/preguntas** se generan por IA **desde el `contentHtml` real del curso**; las **referencias se toman verbatim** del campo `references` del curso, nunca inventadas (regla de [[feedback_no_claims_falsos_contenido]]). Mismo criterio que el spec del cuaderno (`docs/superpowers/specs/2026-07-17-cuaderno-trabajo-pdf-design.md`), que este playbook **absorbe**.
- La **evidencia** es foto real subida por el alumno; nada simulado.

## 4. Arquitectura

### 4.1 Piezas que ya existen (reúso)
| Necesidad | Se reutiliza | Ref |
|---|---|---|
| Logros + puntos | `achievements`/`achievementUsers`, `storage.awardAchievement`, `CollectibleBadge`, pestaña "Logros" | `shared/schema.ts:228-279`, `server/storage.ts:345`, `dashboard.tsx` |
| Subida de archivos a R2 | `multer.memoryStorage()` + `r2Storage.uploadBuffer(buf, key, ct)` (patrón del cert PDF) | `server/routes/certificates.ts:232-275`, `server/services/r2-storage.ts` |
| QR | `qrcode.react` (`QRCodeSVG`) + patrón "QR/URL abre página" | `client/src/pages/vcard.tsx`, `verify-socio.tsx` |
| Render PDF | `pdfkit` + paleta Ceduverse (`CEDU_BLUE/ORANGE/VIOLET`) | `server/kit-pdf.ts` |
| Contenido del curso | `studio_modules.contentHtml` + `references`; `studio_courses.icon/title/instructor` | `shared/schema.ts:593-626` |

### 4.2 Modelo de datos (nuevas tablas)

**`course_playbooks`** — el playbook generado por curso (pre-generado una vez, cacheado):
| Columna | Tipo | Nota |
|---|---|---|
| course_slug | text PK FK → studio_courses.slug | |
| content | jsonb | `{ objetivos[], resumen[], estrategias[], preguntas[] }` — generado por IA desde el curso |
| exercises | jsonb | `[{ index, title, instruction }]` — 3-5 ejercicios de campo |
| references | jsonb | referencias verbatim del curso |
| generated_at | timestamptz | |

**`playbook_evidence`** — evidencia subida por alumno por ejercicio:
| Columna | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| course_slug | text FK → studio_courses.slug | |
| exercise_index | int | qué ejercicio |
| photo_url | text | R2 key `evidence/<slug>/<userId>/<exIdx>-<ts>.jpg` |
| points | int | puntos otorgados por esta evidencia (default `PLAYBOOK_EVIDENCE_POINTS`) |
| created_at | timestamptz | |

Índice: `(user_id, course_slug)` para armar el álbum; permite varias fotos por ejercicio (el álbum las muestra todas; el ejercicio cuenta como "hecho" con ≥1).

**Logro de completado:** un registro en el catálogo `achievements` por curso con playbook (slug `playbook-<courseSlug>`, `value` = puntos bonus), sembrado. Al subir evidencia de **todos** los ejercicios de un curso → `awardAchievement` (dedupe existente) → sale en "Logros" + da los puntos bonus.

**Puntos totales del usuario (net-new agregación):** `SUM(playbook_evidence.points) + SUM(achievements.value vía achievementUsers)`. Hoy no hay UI de puntos totales (el mapa lo confirmó); se agrega una consulta agregada + su display.

### 4.3 Generación del playbook (IA, por curso)
- `server/playbook-generator.ts` (nuevo): `buildPlaybook(courseSlug)` — lee `studio_modules` del curso, genera con IA (Claude, mismo proveedor que ai-engine) la estructura pedagógica (objetivos, resumen, estrategias/"jugadas", preguntas) + **3-5 ejercicios de campo** contextuales al tema (p.ej. ergonomía → "foto de tu escritorio aplicando…"), y adjunta las `references` **verbatim**. Guarda en `course_playbooks`.
- **Pre-generado por curso** (no por usuario) — costo IA una sola vez por curso. Script `npx tsx server/generate-playbooks.ts [slug]`.
- Si la IA falla → playbook mínimo real (resumen recortado del `contentHtml` + referencias + ejercicios genéricos del tema), nunca vacío ([[feedback_no_silent_degradation]]).

### 4.4 Flujo de evidencia (QR → foto → logro) — **REEMPLAZADO (2026-07-19)**

> **Estado: retirado.** Esta actividad de campo ("haz el ejercicio y sube tu foto")
> se retiró en Task 10 del plan `docs/superpowers/plans/2026-07-18-detector-riesgos.md`.
> El dueño del producto la reemplazó por el **detector de riesgos**
> (`docs/superpowers/specs/2026-07-18-detector-riesgos-design.md`, ver su §1):
> el trabajador ya no sube evidencia de una tarea, reporta un incumplimiento
> real que la empresa atiende o descarta. La infraestructura descrita abajo
> (subida validada, proxy autenticado, alcance por empresa) se reutilizó para
> ese flujo nuevo (spec §11); `playbook_evidence` como tabla quedó retirada
> (nunca tuvo datos en producción según el diseño original — la migración de
> retiro deja, por precaución, un chequeo manual antes de dropear la tabla real,
> ver `migrations/2026-07-19_risk_findings.sql`). Los `course_playbooks.exercises`
> que la IA genera NO se descartaron: se reencuadraron de "tareas" a "señales de
> riesgo que puedes detectar" (spec del detector §9) y su QR/CTA apunta ahora a
> `/riesgos/reportar/:slug`. El resto del playbook (guía de estudio §4.2-4.3,
> referencias, export PDF §4.6) sigue vivo sin cambios de fondo.
>
> El flujo descrito abajo queda como registro histórico de lo que se construyó
> y por qué cambió de sentido; ya no describe el comportamiento actual.

```
[PDF/app] ejercicio N con QR → escanea con el cel
   → abre /playbook/:courseSlug/ejercicio/:n  (exige login; si no, /auth y regresa)
   → sube foto (cámara/galería)
      → POST /api/playbook/:slug/ejercicio/:n/evidencia  (multipart, imagen)
         → valida (imagen, tamaño), sube a R2 (evidence/<slug>/<userId>/<n>-<ts>.jpg)
         → inserta playbook_evidence (+ points)
         → si ya hay evidencia de TODOS los ejercicios del curso → awardAchievement("playbook-<slug>")
   → confirma "¡Evidencia registrada! +N puntos 🏅" y muestra el álbum
```

### 4.5 Endpoints
- `GET /api/playbook/:slug` — devuelve el `course_playbooks` (contenido + ejercicios) + el estado del usuario (qué ejercicios ya tienen evidencia). Pre-genera si falta.
- `POST /api/playbook/:slug/ejercicio/:n/evidencia` (multipart imagen, requireAuth) — sube evidencia (§4.4).
- `GET /api/playbook/:slug/album` — el álbum del usuario (sus fotos + medallas por ejercicio).
- `GET /api/playbook/:slug/export.pdf` — genera/descarga el PDF (pdfkit, §4.6).
- **Empresa/admin:** `GET /api/empresa/playbook-evidencias` (o dentro del panel de empresa) — evidencias de su equipo (solo empresa/admin del alumno). Privado, nunca público.

### 4.6 Export PDF
- `server/playbook-pdf.ts` — `renderPlaybookPdf(course_playbooks)`: pdfkit (patrón `kit-pdf.ts`, paleta Ceduverse). Portada (ícono+título del curso), objetivos, resumen, estrategias/"jugadas", preguntas de reflexión, **ejercicios con su QR impreso** (cada uno con su `QRCodeSVG`→PNG apuntando a `/playbook/:slug/ejercicio/:n`), referencias, cierre con CTA. Pre-generable a R2 (`playbooks/<slug>.pdf`) o on-demand.

### 4.7 Cliente
- Pestaña **"Playbook"** en `studio-course.tsx` (donde estaba el botón "Descargar"): muestra el playbook interactivo (resúmenes/estrategias/preguntas + lista de ejercicios con su estado ✅/pendiente + QR/botón para subir evidencia) + botón **"Descargar PDF"** + el **álbum** de evidencias del alumno.
- Página `/playbook/:slug/ejercicio/:n` (nueva, `App.tsx`): subida de evidencia (foto), gate de login, confirma + suma puntos.
- Reúso de `CollectibleBadge` para las medallas.

## 5. Manejo de errores (cero mock)
- Falla IA al generar el playbook → versión mínima real, no vacía.
- Falla subida R2 → error explícito, no registra evidencia falsa.
- Foto no-imagen / muy grande → 4xx claro.
- Sin login en la página de evidencia → a `/auth` y regresa.
- Sin `ANTHROPIC_API_KEY` (generación) → 503 honesto.

## 6. Parámetros
```
PLAYBOOK_EXERCISES_PER_COURSE = 3..5
PLAYBOOK_EVIDENCE_POINTS      = 100      // puntos por evidencia subida
PLAYBOOK_COMPLETION_BONUS     = 500      // value del logro "Playbook <curso>"
EVIDENCE_MAX_MB               = 8
EVIDENCE_KEY                  = evidence/<slug>/<userId>/<exIdx>-<ts>.jpg  (R2)
PLAYBOOK_LLM_MODEL            = claude (mismo que ai-engine)
```

## 7. Testing
- **Generación (pura):** `buildPlaybook` con curso de prueba → ejercicios no vacíos, **referencias == las del curso** (invariante anti-invención), 3-5 ejercicios.
- **Evidencia:** subir foto → inserta `playbook_evidence` con `photo_url` R2 + points; una imagen inválida → rechazada.
- **Completado:** subir evidencia del último ejercicio faltante → `awardAchievement("playbook-<slug>")` una sola vez (dedupe).
- **Álbum/visibilidad:** el álbum solo devuelve la evidencia del propio usuario; empresa/admin ve la de su equipo; **nunca pública**.
- **QR:** la URL del QR abre la página correcta del ejercicio.
- **PDF:** `export.pdf` devuelve `%PDF`, con los QR y las referencias reales.
- **Puntos:** el total = evidencia + logros.

## 8. Fuera de alcance (v1 / fase 2)
- **Participación en preguntas del Aula → puntos** — depende del feature de Q&A del Aula (aún no construido, `feat/aula-qa-conferencia`). Fase 2.
- Moderación automática de fotos (v1: privadas, sin exposición pública → no requiere).
- Ranking/leaderboard entre alumnos.

## 9. Referencias cruzadas
- Absorbe: `docs/superpowers/specs/2026-07-17-cuaderno-trabajo-pdf-design.md` (parte "documento").
- Sistema de logros existente; [[project_ceduverse_playbook]]; [[feedback_no_claims_falsos_contenido]]; [[project_ceduverse_cert_catalog_ux]] (embudo NFT, siguiente).
