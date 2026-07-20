# Rediseño Certificados → Colección de Placas Acuñadas

**Fecha:** 2026-07-20
**Alcance:** SOLO UI. Componente `client/src/pages/certificates-tab.tsx`. Sin cambios de backend, esquema, ni flujo de pago.

## Problema

Las dos pantallas (`Mis Cursos` y `Certificados`) no coinciden en información ni diseño, y no se entiende qué hay que hacer para conseguir un certificado. Hoy la pestaña de Certificados es una lista plana donde casi todo dice "Falta aprobar el quiz → Ir al Tutor IA", sin jerarquía ni sensación de logro.

## Solución

Reencuadrar la pestaña como una **colección de cartas coleccionables** ("Placa Acuñada"): cada certificado de pago es una placa vertical tipo objeto (deliberadamente distinta a las fichas landscape de curso). El estado del backend mapea 1:1 al estado visual de la placa, y cada placa lleva su CTA. Se agrega una guía fija de 4 pasos y un progreso de colección para que el "cómo consigo un certificado" quede obvio.

Dirección visual aprobada (mock): opción A "Placa Acuñada" con movimiento sutil. Paleta y tipografía de Ceduverse (`cedu-*`, DM Serif Display + Plus Jakarta Sans). Marco metálico por rareza, sello acuñado con el emoji del curso, fondo de puntos repetido (no concéntrico), foil holográfico que barre la placa, brillo en el sello, latido del sello VÁLIDO. Respeta `prefers-reduced-motion`.

## Decisiones de producto (confirmadas)

1. **1 carta por certificado.** Un curso con DC-3 y SEP genera **dos** placas.
2. **Cursos sin certificado de pago se ocultan** del grid (los "no ofrece certificados de pago").
3. **Intensidad:** coleccionable premium (movimiento sutil, no arcade).

## Rareza

| certType | Rareza | Metal | Precio (real) |
|----------|--------|-------|---------------|
| `dc3` | Oro | dorado | $499 MXN |
| `sep` | Acero | azul acero | $1,999 MXN |

## Mapeo de estado → placa (todo real, de `state` en `/api/me/cert-elegibles`)

| `state` | Placa | Status pill | CTA (mutación existente) |
|---------|-------|-------------|--------------------------|
| `sin_intento_aprobado` | Bloqueada (sello gris, emoji desaturado) | 🔒 Falta aprobar el quiz | **Ir al Tutor IA** → `/tutor-ia/{slug}` |
| `elegible` | Lista para acuñar (brillo) | ✨ Lista para acuñar | **Acuñar mi placa** → `requestMutation({slug, certType})` (redirige a Stripe) |
| `pago_pendiente` | Pago pendiente | ⚠ Pago pendiente | **Completar pago** → `requestMutation(...)` |
| `ya_solicitado` | Emitiéndose (spinner) | ⏳ Emitiéndose… | (deshabilitado) |
| `emitido` | En tu colección (sello VÁLIDO + foil) | 🏅 En tu colección | **Descargar PDF** → `request.pdfUrl` |
| `rechazado`* | Rechazada | ✕ Rechazada | muestra `rejectReason`; permite reintentar si el estado lo permite |

\* Si `state` no expone rechazado, se cubre con la lista `/api/me/certificates` (status `rechazado` + `rejectReason`).

## Datos: REAL vs NO DISPONIBLE (regla: nada falso)

**Real (se usa):** `slug`, `title`, `icon`, `certType`, `state`, `message`, `priceMxn`, `request.{pdfUrl,status,rejectReason}` (de cert-elegibles); `createdAt`, `courseName` (de `/api/me/certificates`, join por `slug`+`certType`).

**NO disponible (NO se pinta):**
- **Folio** — no existe columna en `certificate_requests`. Se omite. (El mock lo mostraba; era ficticio.)
- **Instructor** — `StudioCourseFacts` no lo trae para cursos del Tutor IA. Se omite. Meterlo sería cambio de backend.

**Subline de la placa:** `emitido` → "Emitida · {createdAt}" (real). Otros estados → sin subline (título + pill + precio + CTA bastan).

## Estructura de la pestaña (de arriba a abajo)

1. **Header** existente: "Mis Certificados" + subtítulo + botón "Solicitar certificado" (se conserva el diálogo tal cual).
2. **Tira de progreso / colección:** "X de Y en tu colección" + barra + contadores reales (Listas, En proceso, Emitidas, DC-3). Reemplaza el bloque de 4 stat-cards actual, con los mismos números.
3. **Guía "¿Cómo consigo un certificado?":** 4 pasos (Toma el curso → Aprueba el quiz → Acúñala/paga → Descarga). Resuelve la confusión principal.
4. **Filtros:** Todas · Listas · Bloqueadas · En proceso · Emitidas · (tipo) DC-3 / SEP. Filtran de verdad sobre las placas.
5. **Grid de placas:** una por (curso × certType con cert de pago). Cursos sin cert de pago ocultos.
6. **Rechazadas** (si hay): callout con motivo, de `/api/me/certificates`.

## No cambia

- Endpoints, queries (`/api/me/cert-elegibles`, `/api/me/certificates`), mutaciones, Stripe, permisos, RLS.
- El diálogo "Solicitar certificado".
- Estados vacíos y de error (se re-visten con el nuevo estilo, misma semántica).

## Verificación

- `npm run build` / typecheck sin errores.
- `data-testid` existentes se conservan (`certificates-tab`, `btn-request-*`, `btn-complete-payment-*`, `button-download-cert-*`, etc.).
- Revisión visual en claro y oscuro.
