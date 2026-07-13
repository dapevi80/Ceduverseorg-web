# Auditoría progreso + certificados (código vivo)

Verificados en código vivo los eslabones críticos (gate 403, mismatch `hasAudio`, UPDATE sin guard, `enrollments[0]`, métrica HQ por `pdfUrl`). Reporte:

---

# REPORTE EJECUTIVO — Progreso y Certificados en Ceduverse
**Fecha:** 2026-07-13 · **Base:** auditoría de código vivo, claims críticos re-verificados línea por línea

---

## 1) Causa exacta de "no se registra el progreso"

No hay UNA causa; hay una cadena con 3 eslabones rotos verificados en el código actual:

**✅ Eslabón roto #1 (el peor): gate de audio inconsistente cliente/servidor → 403 permanente.**
- Server `server/routes/courses.ts:242`: `const hasAudio = modules.some(m => !!m.audioUrl)` — gatea si **cualquier** módulo tiene audio, y responde **403** si `listeningProgress < 95` (líneas 243-248).
- Cliente `client/src/pages/curso-virtual.tsx:593`: `const audioUrl = modules[0]?.audioUrl` — solo reproduce/trackea el audio del **módulo 0**.
- Cliente `curso-virtual.tsx:617`: si el curso tiene video (`hasVideo`), **no se monta `StpsPlayer`** → `listeningPct` nunca sube → el server jamás recibe escucha → 403 eterno. En cursos con `heygenVideoUrl` + audio, **nada se registra jamás**.

**✅ Eslabón roto #2: el 403 destruye el progreso también en local.**
`curso-virtual.tsx:1203-1209`: `saveCompleted(newSet)` solo corre si el PATCH tuvo éxito. En el `catch` (403, red, token vencido) el clic se pierde por completo — ni server ni localStorage.

**✅ Eslabón roto #3: el progreso del server puede retroceder.**
`server/storage.ts:362-369`: `updateCourseProgress` hace `UPDATE ... SET completed = :nuevo` sin guard de máximo. Si el usuario entra desde otro dispositivo (localStorage vacío, `curso-virtual.tsx:936-941` solo hidrata de localStorage) y marca 1 módulo, el 60% del server se sobreescribe con ~14%. Además la única hidratación server→cliente es el caso 100% (`curso-virtual.tsx:1036-1043`) — el progreso parcial nunca regresa a la UI.

**Resumen honesto:** la fuente de verdad del avance por módulo es localStorage; el server solo guarda un smallint agregado (`shared/schema.ts:297-311`). El sistema *aparenta* persistir pero cualquier cambio de dispositivo, limpieza de storage o curso con video rompe la cadena.

---

## 2) Fix seguro y ACOTADO para el progreso (sin rehacer el subsistema)

**Fix A — Alinear el gate (server + cliente), ~4 líneas.** `server/routes/courses.ts:241-243`:
```ts
const modules = await storage.getCourseModules(courseId);
const hasTrackedAudio = !!modules[0]?.audioUrl
  && !modules.some(m => !!m.heygenVideoUrl); // video no tiene tracking: no gatear
if (hasTrackedAudio) {
```
Esto elimina los dos dead-ends (video+audio, y audio en módulo ≠ 0) sin tocar el flujo feliz.

**Fix B — No perder el clic en local ante error, 1 movimiento.** `curso-virtual.tsx:1203-1209`: mover `saveCompleted(newSet)` ANTES del `try` (o al `finally`):
```ts
saveCompleted(newSet); // el avance local nunca se descarta
try {
  await apiRequest("PATCH", `/api/me/courses/${course.id}`, { completed: progressPct });
  toast({ title: "Sección completada", ... });
} catch {
  toast({ title: "Guardado local", description: "Se reintentará sincronizar.", ... });
}
```

**Fix C — Progreso monotónico en server, 1 línea SQL.** `server/storage.ts:365`:
```ts
.set({ completed: sql`GREATEST(${courseUsers.completed}, ${completed})`, updatedAt: new Date() })
```
Elimina las regresiones de P4 sin migración de BD.

**Fix D — Hidratación de parciales, ~6 líneas.** En el efecto de `curso-virtual.tsx:1036-1043`, extender al caso parcial: si `userEnrollment.completed > 0` y el Set local está vacío, sembrar los primeros `Math.round(completed/100 * modules.length)` índices. Aproximado pero honesto: recupera el avance en otro dispositivo sin nueva tabla.

**💡 Fix E (no urgente):** `curso-virtual.tsx:569-581` — avanzar `lastSavedPctRef` solo tras respuesta exitosa del PATCH de listening (hoy avanza antes del `await` y traga errores).

💡 Deuda declarada, NO para este PR: migrar a progreso por-módulo (el patrón ya existe en studio: `moduleProgress`, `shared/schema.ts:682-689`). Eso sí toca BD.

---

## 3) Fix UX: terminados vs en curso

✅ Bug real, 4 causas verificadas en `client/src/pages/dashboard.tsx`:
- Lista plana sin orden ni agrupación (`:743-748`); terminados solo se distinguen por un check pequeño (`:932-935`).
- Cursos al 0% invisibles en filtros (`:745-746`) y fuera de los stats (`:750-752`).
- "Continuar aprendiendo" puede sugerir un curso YA terminado: `lastCourse = enrollments[0]` (`:326`, verificado) — orden arbitrario de DB, sin filtrar `completed < 100`, ignora Tutor IA.
- Dos números de "Certificados" distintos en el mismo dashboard (`:414` usa `userAchievements.length`; `certCount` de `:322` es dead code; el tab usa `certificates.length` incluyendo pendientes).

**💡 Fix concreto (solo frontend, cero componentes nuevos):**
1. En `CoursesTab`, vista "Todos" → 3 secciones con header, copiando el patrón `{title, items, icon, color}` que YA existe en `certificates-tab.tsx:255-266`: **En curso** (0<p<100, desc por progreso) → **Sin empezar** (p=0) → **Completados** (p=100, al final).
2. Cards completadas: `Badge` verde "Completado" (prop `badgeColor` ya soportada, `dashboard.tsx:927-931`) + `opacity-70`.
3. `dashboard.tsx:326` → `enrollments.filter(e => e.completed < 100)[0]` como mínimo; ideal con `orderBy(desc(courseUsers.updatedAt))` en `storage.ts:354` (solo-código, la columna existe).
4. Agregar conteo/filtro "Sin empezar" junto a los de `dashboard.tsx:829-833`.

---

## 4) Certificados: qué está bien y qué arreglar

**✅ Está bien:**
- Máquina de estados sólida: solicitado→en_proceso→emitido/rechazado, emitido es terminal (`server/routes/certificates.ts:98-109`).
- UX de estados clara para el usuario: badges, agrupación, PDF solo si emitido, motivo de rechazo visible (`certificates-tab.tsx:47-52, 255-258, 295-310`).
- El status del enum (`shared/schema.ts:285`) SÍ es confiable como fuente de verdad.
- Admin dashboard cuenta bien (`server/routes/admin.ts:85-86`, por `status='emitido'`).

**✅ Arreglar (verificado):**
1. **Métrica HQ inflada** — `server/routes/hq.ts:80-83` (verificado) cuenta emitidos por `isNotNull(pdfUrl)`. Falso positivo doble: el upload setea `pdfUrl` ANTES de emitir (`certificates.ts:210`) y un rechazo posterior no lo limpia (`certificates.ts:115-118`). **Fix one-liner:** `where(eq(certificateRequests.status, "emitido"))`.
2. **Sin validación server-side de curso completado** — el dropdown filtra `completed >= 100` solo en frontend (`certificates-tab.tsx:74`); el server solo valida quiz *si existe* (`certificates.ts:30-37`). Vía API directa se puede solicitar certificado al 0% en curso sin quiz. Agregar check `courseUsers.completed === 100` en `certificates.ts:13`.
3. **Transparencia:** el "NFT" al emitir es simulado (`simAddress`/`simTokenId` random, `certificates.ts:148-161`) — alinear con la regla de no-mocks en producción o etiquetarlo como simulado.
4. Menor: dropdown muestra `courseSlug.replace(/-/g," ")` en vez del título (`certificates-tab.tsx:147`) y no lista cursos Tutor IA.

---

## 5) Solo-código (PR seguro) vs toca BD

**PR seguro, cero migración (todo lo anterior salvo lo marcado):**

| # | Fix | Archivos |
|---|-----|----------|
| 1 | Gate de audio alineado (Fix A) | `courses.ts:241-243`, opcional `curso-virtual.tsx:593-596` |
| 2 | saveCompleted antes del try (Fix B) | `curso-virtual.tsx:1203-1209` |
| 3 | GREATEST en updateCourseProgress (Fix C) | `storage.ts:365` (SQL en query, no en schema) |
| 4 | Hidratación de parciales (Fix D) | `curso-virtual.tsx:1036-1043` |
| 5 | Secciones/badges en Mis Cursos | `dashboard.tsx` (solo frontend) |
| 6 | Continuar aprendiendo correcto | `dashboard.tsx:326` (+`storage.ts:354` orderBy, solo-código) |
| 7 | Métrica HQ por status | `hq.ts:83` (one-liner) |
| 8 | Validación completed===100 en solicitud | `certificates.ts:13` |

**Toca BD / diseño (posponer, declarar como deuda):**
- Progreso por-módulo persistido en server para cursos STPS (nueva tabla o reutilizar patrón `moduleProgress` de studio, `schema.ts:682-689`). Es la solución de fondo a P5; los fixes A-D son el parche seguro mientras tanto.
- Limpiar `pdfUrl` al rechazar (decisión de producto: ¿conservar el PDF subido?).
- NFT real vs simulado en emisión de certificados.

**Riesgo del PR seguro:** bajo. Ningún fix cambia el schema, ningún fix degrada silenciosamente (los errores siguen siendo visibles vía toast/5xx), y GREATEST solo hace el progreso monotónico — comportamiento estrictamente mejor para el usuario.

**Orden sugerido de merge:** 1→2→3 (destraban el registro de progreso, son el bug reportado), luego 7 (métrica HQ, one-liner), luego 4-6-8, y al final la UX (5).

---
# Anexo Progreso
Auditoría completa. Evidencia leída end-to-end: `curso-virtual.tsx` (1430 líneas), `academy-course.tsx`, `server/routes/courses.ts`, `server/storage.ts`, `shared/schema.ts`, `client/src/lib/queryClient.ts`.

# AUDITORÍA: Persistencia de progreso de cursos — Ceduverse

## Veredicto
El progreso SÍ tiene ruta de persistencia al server, pero se pierde en 5 puntos concretos. La fuente de verdad real del avance por módulo es **localStorage, no el server** (el server solo guarda un porcentaje agregado), y el gate de audio del server produce **dead-ends permanentes** donde nada se registra jamás.

## Cadena end-to-end (archivo:línea)

1. **Estado cliente**: `client/src/pages/curso-virtual.tsx:936-941` — `completedModules` (Set) se inicializa SOLO desde `localStorage["ceduverse-completed-<slug>"]`. Nunca se hidrata desde el server para progreso parcial; la única hidratación server→cliente es `curso-virtual.tsx:1036-1043`, que rellena el Set únicamente cuando `userEnrollment.completed >= 100`.
2. **Escritura al server**: `curso-virtual.tsx:1198-1214` (`handleMarkSectionComplete`) — por cada clic en "Completar" hace `PATCH /api/me/courses/:courseId` con `{completed: pct}` calculado del Set local (línea 1202-1204). También `curso-virtual.tsx:567-585` sincroniza escucha cada 5s vía `PATCH /api/me/courses/:courseId/listening`.
3. **Endpoint**: `server/routes/courses.ts:233-281` (completed) y `:284-386` (listening, auto-completa a 100 al cruzar 95%).
4. **Storage**: `server/storage.ts:362-369` (`updateCourseProgress`, UPDATE directo sin guard de máximo) y `:371-379` (`updateListeningProgress`). Schema: `shared/schema.ts:297-311` (`courseUsers.completed` smallint agregado; NO existe tabla por-módulo para estos cursos).

## Dónde exactamente se pierde el progreso (ranked)

**P1 — Dead-end total en cursos con video (heygenVideoUrl) + audio.** `curso-virtual.tsx:595-617`: si `hasVideo`, NO se renderiza `StpsPlayer`, así que `listeningPct` nunca crece (no hay tracking de video). Pero `hasAudio` sigue true (línea 596) → botón "Completar" queda `disabled` para siempre (línea 725) Y aunque se habilitara, el server responde 403 (`courses.ts:242-248`) porque `listeningProgress` queda en 0. **Nada se registra jamás en estos cursos.**

**P2 — Dead-end si el audio está en un módulo ≠ 0.** Cliente: `curso-virtual.tsx:593` solo reproduce/trackea `modules[0].audioUrl`. Server: `courses.ts:242` gatea si *cualquier* módulo tiene `audioUrl`. Si solo modules[1] tiene audio: botón habilitado (cliente cree que no hay audio), pero server 403 permanente porque nunca hay player que suba `listeningProgress`.

**P3 — El 403 descarta el progreso también en local.** `curso-virtual.tsx:1203-1209`: `saveCompleted(newSet)` solo se ejecuta si el PATCH tuvo éxito; en el catch (403 del gate de `courses.ts:246-248`) no se guarda NI en localStorage. El usuario ve el toast "No se pudo completar" y pierde el clic completo. Además cliente y server pueden divergir en el 95%: el sync de escucha (`curso-virtual.tsx:569-570`) avanza `lastSavedPctRef` ANTES del `await` y traga errores (línea 581 `catch {}`), y el server cierra incrementos a +5 por PATCH (`courses.ts:303-304`) con rate limit de 3s (`courses.ts:295`). Cualquier PATCH fallido (red, 429 con dos pestañas, token vencido) se pierde para siempre — el cliente muestra "Audio completado" (95% local) mientras el server sigue <95 → 403 eterno.

**P4 — Progreso puede RETROCEDER en el server.** `curso-virtual.tsx:1202` calcula `completed` desde el Set local. Si localStorage se limpió (otro dispositivo, incógnito) pero el server tenía 60%, marcar 1 módulo envía `completed = round(1/N*100)` y `storage.ts:362-369` lo sobreescribe sin `GREATEST()` — el 60% del server baja a ~14%.

**P5 — No hay re-hidratación de progreso parcial.** Al volver al curso en otro navegador, el Set arranca vacío (`curso-virtual.tsx:936`), la pantalla de "Continuar curso" muestra "0 de N módulos completados" (`curso-virtual.tsx:1109,1116`) aunque el server tenga 60%. Recuperar por-módulo es imposible por diseño: el server solo guarda el smallint agregado (`schema.ts:302`).

## Respuestas puntuales

1. **¿Persiste al server?** Sí, por módulo (`curso-virtual.tsx:1204`) y escucha cada 5s (`:573`), pero como porcentaje agregado. **¿Se rehidrata?** NO para parciales; solo el caso 100% (`:1036-1043`). Usuario anónimo: solo localStorage (`:1210-1213`).
2. **¿Gate que impida guardar?** Sí: `courses.ts:240-249` (403 si hay audio y `listeningProgress<95`) es el bloqueador central, con los dead-ends P1/P2 y la divergencia P3.
3. **¿Barra de progreso?** Dentro del curso es 100% LOCAL: `curso-virtual.tsx:815` (`completedModules.size/modules.length`) y `:1109,1116`. El dashboard lee el server (`dashboard.tsx:1657-1660`, query `/api/me/courses`). Pueden contradecirse. `aula-virtual.tsx` no muestra progreso alguno. `academy-course.tsx` (contenedor Academy, ruta `/academy/:id` en `App.tsx:67`) **no tiene NINGUNA persistencia**: cero PATCH, cero completedModules, cero localStorage — es un visor de currículum de solo lectura; cualquier curso tomado por ahí no registra nada.

## Fix mínimo sugerido (orden)
1. En `courses.ts:242` y `curso-virtual.tsx:593-596`: excluir el gate de audio cuando hay `heygenVideoUrl` (o trackear video), y alinear la definición de `hasAudio` cliente/server a `modules[0]`.
2. `storage.ts:362-369`: `completed = GREATEST(completed, :nuevo)` (o en la ruta) para eliminar regresiones.
3. Hidratar el Set desde el server para parciales (marcar los primeros `round(completed/100*N)` módulos) o migrar a progreso por-módulo como ya existe en studio (`moduleProgress`, `schema.ts:682-689`).
4. En `curso-virtual.tsx:569-581`: avanzar `lastSavedPctRef` solo tras respuesta exitosa y reintentar en el siguiente tick.

---
# Anexo Certificados/UI
AUDITORÍA CLARIDAD TERMINADOS vs EN CURSO + EMISIÓN DE CERTIFICADOS — Ceduverse

═══ 1. LISTA DE CURSOS (dashboard) ═══

✅ VERIFICADO — Dónde ve el usuario sus cursos:
- Tab "Mis Cursos" → `CoursesTab` en `client/src/pages/dashboard.tsx:668-968`. Unifica STPS (`enrollments`, `completed` 0-100) + Tutor IA (`studioEnrollments.progressPercent`) en `unifiedCourses` (dashboard.tsx:703-738).
- Tab "Resumen" → `OverviewTab` con card "Continuar aprendiendo" (dashboard.tsx:471-495).

✅ VERIFICADO — El bug de UX reportado es real, con 4 causas concretas:

a) **Lista única mezclada sin orden.** El filtro default es `statusFilter = "all"` (dashboard.tsx:672) y `filteredCourses` nunca se ordena (dashboard.tsx:743-748): terminados (100%), en curso y no empezados se intercalan en el orden crudo del arreglo (STPS primero, luego studio, dashboard.tsx:703-738). El backend tampoco ordena: `getUserCourses` es un SELECT sin `orderBy` (server/storage.ts:353-355). La única señal de terminado es un check verde pequeño (dashboard.tsx:932-935) al mismo nivel visual que el "%".

b) **"No empezados" son invisibles en los filtros.** `in-progress` exige `progress > 0 && < 100` y `completed` exige `=== 100` (dashboard.tsx:745-746): un curso al 0% solo aparece en "Todos", sin badge que lo distinga. Los stats (dashboard.tsx:750-752) tampoco los cuentan (total ≠ inProgress + completed).

c) **"Continuar aprendiendo" puede sugerir un curso YA terminado.** `lastCourse = enrollments[0]` (dashboard.tsx:326) toma el primer enrollment en orden arbitrario de DB sin filtrar `completed < 100` ni ordenar por `updatedAt`; además ignora por completo los cursos Tutor IA.

d) **Dos números distintos de "Certificados" en el mismo dashboard.** El stat del Resumen muestra `userAchievements.length` (dashboard.tsx:414, incluye diplomas) — nota: `certCount` (solo dc3/sep) se calcula en dashboard.tsx:322 pero nunca se usa. El tab Certificados muestra `certificates.length` de certificate_requests incluyendo pendientes (certificates-tab.tsx:196).

💡 RECOMENDACIÓN (fix concreto, reusando lo existente):
1. En `CoursesTab`, en vista "Todos" reemplazar la lista plana por 3 secciones con headers, copiando el patrón de grupos que YA existe en `certificates-tab.tsx:255-266` ({title, items, icon, color} → filter → map): "En curso" (0<p<100, orden desc por progreso), "Sin empezar" (p===0), "Completados" (p===100, colapsable al final). Cero componentes nuevos: mismos `Card`/`Badge`/check verde.
2. A las cards completadas agregar `Badge` "Completado" verde (reusar `badgeColor` prop ya soportada en dashboard.tsx:927-931) y bajar opacidad de la card (`opacity-70`).
3. En OverviewTab:326 cambiar a `enrollments.filter(e => e.completed < 100).sort(desc updatedAt)[0]` (requiere agregar `updatedAt` al type CourseEnrollment o agregar `orderBy(desc(courseUsers.updatedAt))` en storage.ts:354).
4. Agregar filtro/conteo "Sin empezar" (p===0) junto a los existentes en dashboard.tsx:829-833.

═══ 2. CERTIFICADOS ═══

✅ VERIFICADO — Flujo de solicitud/emisión:
- Solicitud: dialog en `certificates-tab.tsx:123-185` → `POST /api/me/certificates` (server/routes/certificates.ts:13-55). Solo dc3 ($499) y sep ($1,999); "diploma" es rechazado por el server (certificates.ts:20-22).
- Emisión: admin sube PDF (`POST /api/admin/certificates/:id/upload`, certificates.ts:192-213, setea `pdfUrl` SIN cambiar status) y luego `PATCH` status con máquina de estados solicitado→en_proceso→emitido/rechazado (certificates.ts:98-109). Al emitir crea/vincula `achievementUsers` con NFT simulado (certificates.ts:148-161 — `simAddress`/`simTokenId` random, ojo: no es blockchain real).
- Estado visible al usuario: claro. 4 estados con badge+icono (certificates-tab.tsx:47-52) y agrupación Pendientes/Emitidos/Rechazados (255-258), botón PDF solo si `status==="emitido" && pdfUrl` (295-302), motivo de rechazo visible (304-310).

✅ VERIFICADO — ¿Requiere completed===100? **Solo en el frontend.** El dropdown filtra `e.completed >= 100` (certificates-tab.tsx:74), pero el server NO valida progreso: solo valida quiz aprobado *si el curso tiene quiz* (certificates.ts:30-37). Un curso sin quiz permite solicitar certificado al 0% vía API directa.

✅ VERIFICADO — La métrica HQ sigue mal: `server/routes/hq.ts:80-83` cuenta `certificates_issued` por `isNotNull(certificateRequests.pdfUrl)`, no por `status='emitido'`. Es incorrecto porque: (a) el upload setea pdfUrl ANTES de emitir (certificates.ts:210) → solicitudes en_proceso cuentan como emitidas; (b) una solicitud rechazada después del upload conserva pdfUrl (el PATCH nunca lo limpia, certificates.ts:115-118) → rechazados cuentan como emitidos. El admin dashboard sí lo hace bien: `status = 'emitido'` (server/routes/admin.ts:85-86), igual que routes.ts:649-650. El status real (`certRequestStatusEnum`, shared/schema.ts:285) SÍ es confiable — la máquina de transiciones lo protege (emitido es terminal, certificates.ts:98-103); el que no es confiable es pdfUrl como proxy.

💡 RECOMENDACIONES certificados:
1. hq.ts:83 → `where(eq(certificateRequests.status, "emitido"))` (one-liner, alinea HQ con admin.ts:86).
2. certificates.ts:13 → agregar validación server-side `courseUsers.completed === 100` antes de crear la solicitud (defensa aunque no haya quiz).
3. Unificar el conteo del stat "Certificados" del Overview (dashboard.tsx:414) con emitidos reales o usar el `certCount` dc3/sep ya calculado en dashboard.tsx:322 (hoy dead code).
4. Menor: el dropdown de solicitud muestra `courseSlug.replace(/-/g," ")` (certificates-tab.tsx:147) en vez del título real, y solo lista cursos STPS (no Tutor IA).

Nota: `academy-course.tsx` es solo catálogo/landing (CTA "Contactar gestor académico", academy-course.tsx:327-354); no tiene enrollment ni progreso, no participa en la confusión. `certificationType` nft/dc3/sep vive en cursos de instructor (shared/schema.ts:1237,1247) y hoy solo se usa en instructor-dashboard.tsx, sin conexión al flujo certificate_requests.

Archivos clave: `client/src/pages/dashboard.tsx`, `client/src/pages/certificates-tab.tsx`, `server/routes/certificates.ts`, `server/routes/hq.ts`, `server/storage.ts`, `shared/schema.ts`.