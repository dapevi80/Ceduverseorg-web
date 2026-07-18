# Cuaderno de Trabajo (PDF por curso) — Design

**Fecha:** 2026-07-17
**Producto:** Ceduverse — Aula Virtual / Tutor IA
**Autor de la decisión:** David
**Estado:** Borrador para revisión (spec). No implementar hasta aprobación.

---

## 1. Problema y objetivo

El botón **"Descargar material del curso"** (Aula Virtual, `curso-virtual.tsx:432` `PdfDownloadButton`, hoy vía `jsPDF`/`html2pdf` en el cliente) baja un **PDF prácticamente en blanco**. El dueño quiere convertirlo en un **cuaderno de trabajo real por curso**: un documento que el alumno usa **en su trabajo** — con plantillas aplicables, preguntas, espacios para notas y **referencias verificadas reales**, en los **colores de Ceduverse**.

Es el "cuaderno" del curso que se propone tomar en el **Tutor IA** para obtener el DC-3.

### Decisión de enfoque (David, 2026-07-17)
- **Server-side con `pdfkit`** (como `server/kit-pdf.ts`), no el `html2pdf` del cliente → control fino de layout (líneas para notas, tablas-plantilla, portada).
- **Pre-generado por curso** (no por usuario) en v1. Personalización por puesto/industria = posible fase 2.
- **Estructura pedagógica generada por IA** desde el contenido real del curso.
- **Referencias tomadas VERBATIM del campo `references` real y curado del curso** — nunca inventadas por la IA (regla de "no claims falsos / no mock").

---

## 2. Regla dura: cero referencias/afirmaciones inventadas

Las referencias del cuaderno **provienen únicamente del campo `references: string[]`** que ya trae cada módulo del curso (`course_modules.references`, curado). La IA **no** genera ni "mejora" referencias. Si un módulo no tiene referencias, esa sección se omite (no se rellena con inventos). Todo el contenido pedagógico (objetivos, resúmenes, preguntas, plantillas) se genera **a partir del texto real del curso** (`contentHtml`), no de conocimiento externo no verificado. Esto es coherente con [[feedback_no_claims_falsos_contenido]] y [[feedback_no_silent_degradation]].

---

## 3. Estructura del cuaderno (secciones)

Por curso, en este orden:

1. **Portada.** Colores Ceduverse; título del curso, instructor (con su título correcto — Lic./Psic.), logo/paleta, "Cuaderno de trabajo".
2. **Objetivos de aprendizaje.** 3–6 objetivos, generados desde el contenido del curso.
3. **Resumen de conceptos clave.** Los conceptos centrales del curso, en viñetas, con 1–2 líneas cada uno (desde `contentHtml`).
4. **Plantillas aplicables al trabajo.** 1–3 plantillas/tablas que el alumno llena en su chamba (p.ej. checklist de la NOM, matriz de riesgos, formato de acta) — estructura derivada del tema del curso. Con celdas/renglones vacíos para llenar.
5. **Preguntas de reflexión y aplicación.** 5–8 preguntas abiertas que conectan el tema con el trabajo del alumno, con **espacio de renglones** para responder a mano.
6. **Espacio de notas.** Páginas con renglones para apuntes libres.
7. **Referencias.** Lista **verbatim** de `references` del curso (deduplicadas). Encabezado: "Referencias del curso (fuentes verificadas)".
8. **Cierre / CTA.** "Para tu certificado DC-3 o SEP, toma este curso en el Tutor IA y aprueba su evaluación." (Sin links de pago; coherente con la pantalla de completado nueva.)

---

## 4. Arquitectura

### 4.1 Módulos
- **`server/workbook-content.ts`** (nuevo): `buildWorkbookContent(course, modules): WorkbookContent` — genera la estructura pedagógica con IA (Claude) desde `modules[].contentHtml`, y **adjunta las `references` verbatim** de los módulos. Devuelve un objeto tipado (objetivos, conceptos, plantillas, preguntas, referencias) — **sin** tocar el render.
- **`server/workbook-pdf.ts`** (nuevo): `renderWorkbookPdf(content: WorkbookContent): Promise<Buffer>` — toma el `WorkbookContent` y dibuja el PDF con `pdfkit` (paleta Ceduverse, portada, secciones, renglones para notas). Análogo a `server/kit-pdf.ts`.
- **Endpoint** `GET /api/courses/:slug/workbook.pdf` — sirve el PDF (pre-generado/cacheado; ver 4.3).
- **Cliente:** `PdfDownloadButton` deja de generar con `html2pdf` y solo **descarga** desde ese endpoint.

### 4.2 Separación de responsabilidades
- La **generación de contenido** (IA + referencias reales) y el **render** (pdfkit) son piezas separadas y testeables por su cuenta. `WorkbookContent` es el contrato entre ambas.

### 4.3 Generación y almacenamiento
- **Pre-generado por curso**, almacenado en **R2** (`workbooks/<slug>.pdf`), servido por el endpoint (R2 primero, fallback a generación on-demand). Igual patrón que el audio (`/audio/:filename`).
- Un **script/seed** genera (o regenera) los cuadernos de todos los cursos: `npx tsx server/generate-workbooks.ts [slug]` (reúsa `buildWorkbookContent` + `renderWorkbookPdf` + subida a R2). Regenerable cuando cambie el contenido del curso.
- La generación con IA cuesta tokens **una vez por curso** (no por descarga) → barato y predecible.

### 4.4 Paleta Ceduverse (para el PDF)
Azul `#1b5adf`, violeta `#7c3aed`, naranja `#f28023`, crema `cedu-cream`, tinta `cedu-ink`. Tipografía serif para títulos (como la app).

---

## 5. Manejo de errores (cero PDF en blanco, cero mock)

- Si la **IA falla** o no hay `ANTHROPIC_API_KEY`: se genera un cuaderno **mínimo pero real** directamente del curso (títulos de módulos + resumen recortado del `contentHtml` + referencias reales + páginas de notas). **Nunca** un PDF en blanco.
- Si un curso **no tiene módulos/contenido**: el endpoint responde honesto ("cuaderno en preparación"), no un PDF vacío.
- Referencias ausentes → se omite la sección, no se inventa.
- El endpoint valida que el curso exista y esté publicado.

---

## 6. Parámetros

```
WORKBOOK_OBJECTIVES        = 3..6
WORKBOOK_QUESTIONS         = 5..8
WORKBOOK_NOTE_PAGES        = 2
WORKBOOK_LLM_MODEL         = claude (mismo que tutor-ai / ai-engine)
WORKBOOK_STORAGE_KEY       = workbooks/<slug>.pdf   (R2)
PDF_FORMAT                 = "letter", portrait (igual que hoy)
```

---

## 7. Testing

- **Contenido (pura):** `buildWorkbookContent` con un curso de prueba → objetivos/preguntas no vacíos; **referencias == las del curso, sin agregar ninguna** (invariante anti-invención); si el curso no tiene referencias, la lista sale vacía (no inventada).
- **Render:** `renderWorkbookPdf(content)` devuelve un Buffer PDF válido (empieza con `%PDF`), con las secciones esperadas; no truena con secciones vacías.
- **Fallback:** sin IA, `buildWorkbookContent` degrada a contenido mínimo real (no blanco).
- **Endpoint:** `GET /api/courses/:slug/workbook.pdf` devuelve `application/pdf` para un curso válido; 404 para uno inexistente.
- **Anti-blanco:** el PDF resultante siempre tiene > N KB y contiene el título del curso.

---

## 8. Fuera de alcance (v1)

- **Personalización por puesto/industria** (cuaderno a medida por usuario) — fase 2 sobre este diseño.
- Edición interactiva del PDF (rellenable digital) — v1 es para imprimir/anotar.
- Multi-idioma.

---

## 9. Referencias cruzadas
- Pantalla de completado del Aula (el botón vive ahí): `client/src/pages/curso-virtual.tsx`.
- Patrón pdfkit existente: `server/kit-pdf.ts`.
- Regla de contenido real: [[feedback_no_claims_falsos_contenido]], [[feedback_no_silent_degradation]].
- Instructores/títulos correctos (Lic. Medina, Psic. Yuridia): [[project_ceduverse_tutor_ia_instructor_voices]].
