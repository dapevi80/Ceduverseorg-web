# DC-3 y SEP en el Tutor IA — Design

**Fecha:** 2026-07-17
**Estado:** Aprobado por David (secciones 1-4). Punto legal resuelto por Daniel Zavala (CLO).
**Alcance:** Spec **C** de tres. Ver "Fuera de alcance" al final.

> **ACTUALIZACIÓN 2026-07-17 (David):** dos decisiones que amplían el alcance original:
> 1. **El SEP tampoco se cobra en el Aula Virtual.** La regla aplica a **AMBOS** certificados de pago (DC-3 **y** SEP), no solo al DC-3. Donde este documento diga "DC-3", léase "DC-3 y SEP" salvo que se indique lo contrario.
> 2. **Las solicitudes de certificado se anclan a Studio, no al catálogo legacy.** Hoy `certificate_requests.course_id` es FK a `courses` (legacy, 29 filas), y ~20 cursos del Tutor IA no tienen espejo legacy → no podían anclar solicitud. Como ambos certificados nacen ahora del Tutor IA, el ancla se mueve a los cursos de Studio. Esto **repara** el hueco de los 20 huérfanos de raíz y hace que el Aula Virtual pierda DC-3 **y** SEP de un solo golpe. Seguro sin migración de datos: David confirmó que **nadie ha solicitado ni pagado ningún certificado**.

## Problema

El **Tutor IA** —el curso real, con contenido personalizado y evaluación— **no puede emitir DC-3**. La pestaña "Certificado" muestra un texto hardcodeado (`client/src/pages/studio-course.tsx:1045`):

> *"Tu constancia DC-3 STPS estará disponible próximamente para los cursos elegibles."*

No hay ninguna referencia a `/api/me/certificates` en toda esa superficie: **el camino no existe**, y esa frase es una promesa que se le hace a cada alumno que termina un curso.

Al mismo tiempo, el **Aula Virtual** —que son **conferencias que se escuchan**— **sí puede emitir DC-3** hoy: escribe `completed: 100` en `course_users` (`curso-virtual.tsx:1217`) y su catálogo legacy trae `dc3Disponible: true`. El endpoint valida contra esa tabla (`server/routes/certificates.ts`), así que **hoy se puede obtener una constancia oficial ante la STPS por haber escuchado una conferencia**.

**Están invertidos:** el producto que debe cobrar no puede, y el que no debe cobrar sí puede.

## Decisión de producto (David)

- **Aula Virtual** = escuchar clases → **diploma de asistencia** ("de que lo escuchaste") + invitación a tomar el curso en el Tutor IA. **No cobra nada — ni DC-3 ni SEP.**
- **Tutor IA** = estudiar el curso → **aprobar el quiz** → **DC-3 y/o SEP**.

La conferencia acredita que **escuchaste**; el curso acredita que **aprendiste**. Un certificado oficial (DC-3 STPS / SEP) certifica competencia, no asistencia.

## Arquitectura: la regla de elegibilidad

**Un DC-3 se puede solicitar si, y solo si:**

1. El curso está marcado como **elegible para DC-3** (`studio_courses.dc3_available = true`; ya existe en la BD y el seed lo persiste desde `studio-courses-meta.ts`), **y**
2. Existe un **intento de quiz aprobado**, **calificado por el servidor**, de ese socio para ese curso.

**No mira inscripciones. No mira módulos. No mira progreso.**

La validación actual —*"¿tienes `course_users.completed >= 100`?"*— **se elimina**: es la pregunta del modelo viejo.

⚠️ **La condición 2 no se puede implementar hoy.** Ver "Precondiciones" — hay que construir el registro de intentos y cerrar un hoyo de seguridad **antes** de que la regla signifique algo. `quiz_attempts` **no sirve**: su FK apunta a `course_quizzes` (legacy), no a `studio_quizzes`.

### Por qué esta regla y no otra

Se consideraron y descartaron:

- **Extender el endpoint para aceptar ambos sistemas** (validar contra `studio_enrollments` o `course_users` según el origen): funciona, pero perpetúa los dos sistemas dentro del código de certificados y deja al Aula Virtual **todavía capaz de emitir** si alguien enciende un flag.
- **Espejear Studio → legacy al aprobar** (escribir un `course_users` con `completed: 100`): el cambio más chico y el peor — **inventa datos falsos** (afirma que completaste un curso legacy que nunca tomaste) para engañar a una validación que ya no queremos.

### Consecuencias (deliberadas)

- **El Aula Virtual deja de poder emitir DC-3 por construcción, no por configuración.** Las conferencias no tienen quiz → nunca cumplen la condición 2. No hay flag que alguien pueda encender por error ni bandera que se nos olvide apagar.
- **El criterio es auditable.** Ante la pregunta *"¿con qué acreditó esta persona?"*, la respuesta es un renglón con fecha, calificación y curso — no un porcentaje de scroll.
- **Riesgo asumido a propósito:** se puede aprobar el quiz **sin haber leído los módulos**. Es correcto y deliberado: si demuestras la competencia, la acreditas.

## El flujo

**Socio:**
1. Toma el curso en el Tutor IA y **aprueba el quiz**.
2. En la pestaña **Certificado** aparece: **"Solicita tu constancia DC-3 · $499"**.
3. Clic → Stripe → paga → regresa.
4. Solicitud en **`solicitado`**; el admin la emite.

**No se construye nada del cobro.** F0 ya existe y está en producción: precio autoritativo en el servidor (`CERT_PRICES_MXN`, `shared/cert-pricing.ts`), checkout pay-first, webhook dedicado (`/api/certificates/webhook`, secret `STRIPE_WEBHOOK_SECRET_CERTS`), estados `pending_payment` → `solicitado`, y protección contra duplicados (`shared/cert-duplicate.ts`).

**A F0 solo le falta a quién dejar pasar.** Se le cambia el criterio, no la plomería.

### Lo que sí se construye

1. **Consulta de elegibilidad** — dado (socio, curso): ¿existe intento aprobado? Lógica pura, testeable.
2. **Pestaña Certificado del Tutor IA** — quitar el `"próximamente"` hardcodeado y mostrar el estado real: *elegible* / *no elegible (aprueba el quiz para solicitar)* / *ya solicitado* / *pagado*. Cuando no se pueda solicitar, decir **por qué** — no una promesa vacía.
3. **Cooldown entre intentos** — validado **en el servidor** (el cliente no es confiable).

## Precondiciones (bloquean la regla; van primero)

Se descubrieron al revisar el spec. **Sin las dos, la condición 2 es decorativa.**

### P1 — Cerrar el fallback que deja al cliente dictar su calificación 🔴

`server/routes/courses.ts:1142` (`POST /api/studio/courses/:slug/modules/:index/quiz/submit`) califica en el servidor **solo si hay quiz generado**:

```ts
if (quiz && quiz.length > 0) {
  for (...) if (answers[i] === quiz[i].correctIndex) score++;   // ✅ servidor
} else {
  score = clientScore || 0;    // 🔴 el cliente dicta su propia calificación
  total = answers.length;
}
```

`adaptiveQuiz` es `null` **precisamente cuando la personalización falla** — es decir, hoy, en todo curso stubeado. Cualquiera puede mandar `{ score: 100 }` y aprobar. Es inofensivo **solo mientras el DC-3 no esté conectado**; en cuanto se conecte, es una fábrica de constancias federales gratis con un `curl`.

**Regla:** la calificación **siempre** se calcula en el servidor contra el quiz almacenado. Si no hay quiz que calificar, el intento **falla con error explícito** — nunca se auto-aprueba. El `score` del cliente se ignora por completo (no se acepta ni como sugerencia).

### P2 — Historial de intentos

Hoy el resultado se guarda con `upsertModuleProgress(...)` en `studio_module_progress.quizScore`: **cada intento sobrescribe al anterior**. Sin historial:
- **No hay cooldown posible** (no se sabe cuándo fue el intento reprobado).
- **No hay rastro auditable** — y la sección "Arquitectura" promete "un renglón con fecha, calificación y curso".

Se necesita una tabla de intentos de Studio con al menos: `userId`, `courseIdentifier`, `moduleIndex`, `score`, `passed`, `createdAt`. Append-only: **nunca se sobrescribe un intento**.
(`quiz_attempts` no se reutiliza: su `quizId` referencia `course_quizzes`, del sistema legacy.)

## Parámetros

| Parámetro | Valor | Razón |
|---|---|---|
| Calificación mínima | **70** | Es el default que ya traen los quizzes (`passing_score` default 70 en ambos schemas). Cero migración. **Nota:** el endpoint hoy **hardcodea** `scorePercent >= 70` (`courses.ts:1170`) e **ignora** el campo `passingScore` del quiz. Debe leer el campo, no el literal — si no, el día que un curso necesite otro umbral, el número del schema mentirá. |
| Espera entre intentos reprobados | **24 h** | Corta el brute-force sin bloquear a quien sí sabe. Ilimitados intentos, con espera. |
| Cursos elegibles | **los 47 con `dc3Available: true`** en `server/data/studio-courses-meta.ts` | Los otros 8 (RWA + onboarding) ya están correctamente en `false`. |

**Intentos ilimitados con espera** (decisión de David): nadie se queda sin poder certificarse, pero no se aprueba recargando hasta que peguen las respuestas.

## La duración declarada en el DC-3 — resuelto por el CLO

El formato **DC-3 de la STPS lleva campo obligatorio de duración en horas**, y el catálogo declara `durationMinutes: 60` en casi todos los cursos. Con la regla aprobada (quiz sin requisito de tiempo), alguien puede aprobar en minutos y recibir una constancia federal que declara 1 hora.

**Se planteó como riesgo** (una afirmación potencialmente falsa en un documento oficial). **Resolución de Daniel Zavala (CLO):**

> Las horas del DC-3 son las del **diseño pedagógico del programa**, no las del cronómetro del alumno. Los cursos incluyen **preguntas de reflexión** que requieren análisis y tiempo libre para pensar; **responderlas mentalmente ya es estudio**, y eso ocurre fuera de la plataforma. **No es medible, porque el estudio no es relativo al tiempo de pantalla.** Medir tiempo de sesión mediría lo contrario de lo que se certifica.

**Este razonamiento queda documentado aquí a propósito: es la defensa.** El día que alguien pregunte *"¿por qué la constancia dice 1 hora si la aprobó en 10 minutos?"*, la respuesta debe estar escrita y ser del CLO, no una reconstrucción posterior.

Es además consistente con la capacitación acreditada en general: un curso "de 40 horas" lo es por diseño; nadie mide si el alumno se sentó 40.

## Qué se rompe y qué se limpia

1. **El Aula Virtual pierde la capacidad de emitir DC-3.** Muere sola al cambiar el criterio (no tiene quiz). Aprobado por David.
2. **Los `dc3Disponible: true` del catálogo legacy quedan huérfanos** — seguirían diciendo que el curso ofrece DC-3, sin efecto. **Hay que limpiarlos.** Aprobado por David. Sin esto, en seis meses alguien los va a leer como si significaran algo (precedente real de esta misma semana: seis definiciones distintas de zona, dos contradictorias).
3. **Sin migración.** David confirmó (2026-07-17) que **nadie ha solicitado ni pagado un DC-3** — no hay solicitudes vivas bajo el criterio viejo. Verificable con:
   ```sql
   select status, count(*) from certificate_requests group by status;
   ```

## Manejo de errores

- **No degradación silenciosa.** Si la consulta de elegibilidad falla, **no** se asume "no elegible" en silencio: se registra el error y se muestra un estado de error explícito. (Regla del proyecto; hoy rota en 7 sitios del pipeline de personalización — no repetirla aquí.)
- **El cooldown se valida en el servidor.** Un cliente manipulado no puede saltarlo.
- **El precio nunca viene del cliente.** Se recalcula siempre desde `CERT_PRICES_MXN` (fuente única de verdad; esta semana la landing anunciaba $399 mientras el checkout cobraba $499 — corregido, no reintroducir).

## Riesgo aceptado: las respuestas viajan al navegador

`correctIndex` se envía al cliente (`studio-course.tsx:83` y `:132`), así que cualquiera con las herramientas de desarrollador puede leer las respuestas correctas antes de contestar. Con P1 cerrado, el servidor califica de verdad — pero califica respuestas que el alumno pudo haber leído.

**David lo acepta como riesgo conocido (2026-07-17)** y queda fuera de alcance de este spec. Es práctica común en e-learning; la diferencia aquí es que este quiz emite un documento federal. Mitigaciones si algún día molesta: no mandar `correctIndex` al cliente y validar por endpoint; o bancos de preguntas grandes con selección aleatoria por intento (hoy los quizzes traen ~5-8 preguntas fijas).

**No se documenta como "resuelto".** Está abierto a propósito.

## Testing

- **Elegibilidad** (lógica pura, vitest): sin intentos → no elegible; intento reprobado → no elegible; intento aprobado → elegible; curso no elegible + intento aprobado → no elegible; aprobado en otro curso → no elegible para este.
- **Cooldown** (lógica pura): reprobado hace 1 h → bloqueado; hace 25 h → permitido; nunca ha intentado → permitido; **aprobado → no aplica cooldown**.
- **El Aula Virtual no puede emitir DC-3**: test explícito de que una conferencia completada al 100% **no** produce elegibilidad. Es la garantía estructural del diseño; debe tener test propio.
- **P1 — el `score` del cliente se ignora**: un submit con `{ score: 100 }` y respuestas incorrectas **debe reprobar**. Y sin quiz almacenado, el submit **debe fallar**, no aprobar. Es el test que impide que vuelva el hoyo.
- **P2 — los intentos no se sobrescriben**: dos intentos dejan dos renglones, no uno.

## Fuera de alcance

Estos son **specs separados**, en el orden que definió David (C → A → B):

- **A. Aula Virtual como producto de escucha** — vocabulario (clase/escuchar, no curso/completar), ventana "Clase completada" al 100% con alerta previa, diploma de asistencia, CTA al Tutor IA. Nota: hoy el umbral real es `listeningPct >= 95` (`curso-virtual.tsx:557`) y se dispara alrededor del 85% real; la causa exacta se investiga en ese spec.
- **B. Subtítulos sincronizados** — mostrar solo la oración que suena; habilita la escucha activa bilingüe. Requiere resolver la arquitectura de timestamps: hoy el audio es un MP3 concatenado sin datos de tiempo y la duración ni se mide, se **estima** por bytes (`audio-generator.ts:86`).

También fuera de alcance: unificar los catálogos legacy y Studio. **No son duplicación** — son dos productos sobre el mismo tema (la conferencia que escuchas y el curso que estudias). El catálogo espejo es deliberado.
