# Q&A al final de la conferencia (Aula Virtual) — Design

**Fecha:** 2026-07-17
**Producto:** Ceduverse — Aula Virtual (producto de "escuchar conferencias")
**Autor de la decisión:** David
**Estado:** Borrador para revisión (spec). No implementar hasta aprobación.

---

## 1. Problema y objetivo

El Aula Virtual es un producto de **escuchar conferencias** (audio pre-grabado con la voz del instructor). Hoy, al terminar una conferencia, el alumno solo ve el CTA al Tutor IA y al diploma/DC-3. No hay forma de **resolver una duda** ahí mismo.

Queremos un **espacio de preguntas y respuestas al final de la conferencia** donde el alumno pueda:
1. Tocar **preguntas frecuentes ya respondidas** (contenido curado, costo cero).
2. Hacer **su propia pregunta hablando** (push-to-talk), y que el instructor le responda **con su misma voz**.

Restricción central del dueño: **el costo en tokens debe estar acotado y ser predecible**, y **nunca** se debe inventar contenido de relleno (regla de "no mock silencioso / no claims falsos").

### Decisiones ya tomadas (David, en brainstorming)
- **Ubicación:** al final de la conferencia sin aparentar terminar el audio del reproductor, se mantienen abierto por el tiempo que haya preguntas o hasa 30 segundos despues de que el estudiante no hizo ninguna pregunta el instructor se despide (no interrumpiendo a media clase). La interrupción "levanta la mano" a media conferencia queda **fuera de alcance**.
- **Push-to-talk completo (voz→voz):** el alumno habla y el instructor responde hablado. Turn-based, **no** conversación continua tipo "active listening".
- **La voz del instructor se conserva** (Yuridia / Medina). Por eso NO se usa la Realtime API de OpenAI (traería voces ajenas); se usa un pipeline STT → LLM → TTS con la voz `ash` que ya existe.
- **Límite: 3 preguntas en vivo por alumno por conferencia.** Agotadas, se le invita al Tutor IA ("para seguir profundizando y conseguir tu DC-3").
- **Volante de contenido:** las preguntas en vivo se cachean y las buenas se promueven a FAQ grabadas que se escuchan publicamente para toda la comunidad de la cooperativa, se le da prioridad si tiene levantada la mano el usuario activo que hizo la pregunta.
- **Deflexión honesta:** fuera de tema o STT dudoso → el instructor lo dice y redirige al Tutor IA; nunca alucina.
- **Consentimiento (T&C) en el primer uso:** al presionar el botón por primera vez, el alumno debe **aceptar términos y condiciones** que autorizan usar su pregunta como **material pedagógico**. Sin aceptar, no puede grabar.
- **Moderación:** las grabaciones/preguntas con **mensajes ofensivos se eliminan de inmediato** (no se cachean, no se promueven, no se conservan) y el instructor responde con una negativa cortés.
- **Anonimato del autor:** cuando una pregunta se reutiliza como material pedagógico, la **identidad del socio queda protegida**: solo se muestra su **código de referido**, nunca su nombre.

### Corrección de supuesto
No existe un instructor "Luis" ahh si gracias jaja. Las familias de curso tienen `courses.instructor` = **"Psic. Yuridia Iturriaga"** o **"Lic. Jorge Armando Medina Castillo"**. El diseño es **instructor-agnóstico**: usa el nombre y la voz que trae cada curso.

---

## 2. Principio de costo (por qué esto sale barato)

La conferencia es **audio pre-grabado** (MP3 fijo). Reproducir/pausar/reanudar cuesta **cero tokens**. El único gasto está en la pregunta en vivo, y se acota por diseño:

| Pieza | Costo | Control |
|---|---|---|
| Reproducir la conferencia | $0 | Es un MP3 servido por `/audio/:filename` |
| FAQ curadas (tocar y escuchar) | $0 en tiempo real | Pre-generadas una vez (texto + audio) |
| Pregunta en vivo — cache HIT | ~$0 | Caché semántico contra FAQ + preguntas previas |
| Pregunta en vivo — cache MISS | STT + LLM(500 tok máx) + TTS(respuesta corta) | Tope de grabación (40 s), respuesta ≤3–4 frases, máx 3 por alumno/conferencia |

**Presupuesto por pregunta MISS (estimado grueso):** transcripción ~una fracción de centavo por &lt;40 s; respuesta Claude Haiku ≤500 tokens; TTS de 3–4 frases. El tope de 3 por alumno acota el peor caso.

---

## 3. Arquitectura

### 3.1 Flujo de una pregunta en vivo (push-to-talk)

```
[Primer uso] → modal T&C ("autorizo el uso de mi pregunta como material
               pedagógico; se me identifica solo por mi código de referido")
            → aceptar → se registra el consentimiento (una vez por versión de T&C)
[Alumno mantiene presionado 🎤] → MediaRecorder (audio-only, máx 40 s)
   → suelta → sube blob (multipart) a  POST /api/aula/:slug/qa
      → STT (OpenAI transcriptions) → texto de la pregunta
      → MODERACIÓN del transcript (OpenAI moderation, gratis)
           ofensivo → se descarta TODO de inmediato (audio + transcript, sin persistir)
                    → respuesta cortés de rechazo. No cuenta al límite. No se promueve.
      → embed(pregunta) [text-embedding-3-small]
      → ¿similitud ≥ umbral con una FAQ o una pregunta previa cacheada?
           SÍ  → sirve respuesta cacheada (texto + audioUrl). cacheHit=true. NO consume del límite de 3.
           NO  → ¿el alumno ya usó 3 generaciones?
                    SÍ → deflexión: "consigue tu DC-3 en el Tutor IA". No genera.
                    NO → tutorAIService.generateResponse(...) (Claude Haiku, ≤4 frases)
                            // el system prompt YA redirige lo fuera de tema en la misma
                            // llamada (una sola generación, sin clasificador aparte)
                            → TTS (voz del instructor) → sube a R2 (audio/qa-<hash>.mp3)
                            → cachea {pregunta, embedding, respuesta, audioUrl}
      → responde JSON {transcript, answerText, answerAudioUrl, cacheHit, deflected, remaining}
   → cliente muestra el transcript, reproduce el audio de la respuesta, actualiza "quedan N"
   → la SESIÓN sigue ABIERTA: el instructor NO se despide y el reproductor NO aparenta
     que "terminó la conferencia". El alumno puede volver a preguntar (hasta su límite de 3).
[Inactividad] → si pasan AULA_QA_IDLE_FAREWELL_SEC (30 s) sin una nueva pregunta →
     el instructor reproduce su DESPEDIDA (audio pre-grabado por instructor) → la sesión
     cierra con gracia → recién ENTONCES aparece el CTA de diploma/DC-3 (`stps-next-steps`).
```

### 3.2 Reúso (nada de esto es nuevo)

| Necesidad | Se reutiliza | Ref |
|---|---|---|
| LLM + grounding del curso | `tutorAIService.getCourseContext(courseId)` + `generateResponse(question, courseTitle, courseContext, history, onChunk?)` | `server/services/tutor-ai.ts` (Claude Haiku 4.5, ≤500 tok, ≤3–4 frases, ya redirige off-topic) |
| Texto de la conferencia (RAG) | tabla DB `course_modules.contentHtml` (lo que ya lee `getCourseContext`) | `shared/schema.ts:447-463` |
| Patrón de endpoint Q&A | `POST /api/liveavatar/chat` (valida sesión, historial, SSE, persiste) | `server/routes/heygen.ts:660-718` |
| TTS con voz del instructor | patrón de `openai.audio.speech.create` (`gpt-4o-mini-tts`, voz `ash`, `instructions`) | `server/audio-generator.ts:64-76` |
| Servir el audio de la respuesta | ruta `/audio/:filename` (R2 primero, key `audio/<filename>`, fallback local) | `server/index.ts:99-124` |
| Captura de micrófono (referencia UX) | `MediaRecorder` audio-only (adaptar el patrón de video de acreditación) | `client/src/pages/instructor-acreditacion.tsx:799-901` |
| Punto de inserción UI | tras `allCompleted`, en el bloque `stps-tutor-cta` | `client/src/pages/curso-virtual.tsx:841-865`, antes de `stps-next-steps` (:867) |

### 3.3 Piezas 100% nuevas
- **STT** (voz→texto): no existe en el repo. Servidor: `openai.audio.transcriptions.create({ model, file })`.
- **Caché semántico** de Q→A→audio (embeddings + umbral de similitud).
- **Componente cliente** `<ConferenceQA>` (FAQ + push-to-talk).
- **Endpoint** `POST /api/aula/:slug/qa` y `GET /api/aula/:slug/faqs`.
- **Extensión** del system prompt de `generateResponse` para recibir `instructorName` (consistencia de persona/voz).

---

## 4. Modelo de datos (nuevas tablas)

### `conference_faqs` — FAQ curadas + promovidas
| Columna | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| course_slug | text FK → courses.slug | |
| question | text | pregunta mostrada |
| answer_text | text | respuesta **real** curada (voz del instructor) |
| answer_audio_url | text null | audio pre-renderizado (`audio/faq-<hash>.mp3`) |
| embedding | vector(1536) | text-embedding-3-small (para el caché semántico) |
| source | text | `'curated'` \| `'promoted'` |
| author_referral_code | text null | si `source='promoted'`: **código de referido** del socio autor. **NUNCA su nombre ni user_id visible.** null para `'curated'` |
| is_public | boolean | default false. `true` cuando una promovida se publica **para toda la comunidad de la cooperativa** (grabada, audible por todos), no solo en su curso |
| sort_order | int | orden de despliegue |
| active | boolean | default true |
| created_at | timestamptz | |

> **Promoción a comunidad:** una pregunta buena (`source='promoted'`) puede marcarse `is_public=true` → se vuelve una **FAQ grabada pública** que escucha toda la comunidad, atribuida al **código de referido** del autor. La promoción sigue siendo una acción **curada/administrativa** (no automática) para v1.

### `conference_qa_log` — preguntas en vivo (flywheel + rate limit)
| Columna | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| course_slug | text FK | |
| question_transcript | text | lo que dijo el alumno (texto, **no** se guarda el audio de su voz) |
| referral_code | text | **código de referido** del alumno — es lo único que se usa si la pregunta se promueve a FAQ. Nunca se expone su nombre |
| embedding | vector(1536) | para el caché de las siguientes |
| answer_text | text null | null si fue deflexión pura |
| answer_audio_url | text null | |
| was_cache_hit | boolean | si vino de caché no cuenta al límite |
| deflected | boolean | fuera de tema / límite alcanzado |
| created_at | timestamptz | |

> **Moderación:** las preguntas marcadas como **ofensivas por el moderador NO se insertan aquí** — se descartan de inmediato (audio + transcript) y no dejan rastro reutilizable. `conference_qa_log` solo contiene preguntas limpias.

### `conference_qa_consent` — consentimiento T&C (una vez por versión)
| Columna | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| tc_version | text | versión de los T&C aceptada (p.ej. `"2026-07-qa-v1"`) |
| accepted_at | timestamptz | |

Único por `(user_id, tc_version)`. El endpoint de Q&A **rechaza** grabar si el alumno no tiene consentimiento para la versión vigente.

### `qa_presence` — "mano levantada" (efímero, para el boost de visibilidad)
| Columna | Tipo | Nota |
|---|---|---|
| user_id | uuid PK | |
| hand_raised_until | timestamptz | mientras `> now`, el autor cuenta como "activo con la mano levantada" |

Es una señal transitoria (se refresca por heartbeat y expira sola). No guarda historial. Alimenta únicamente el orden del feed de FAQ públicas (§5).

**Rate limit:** `count(conference_qa_log where user_id=? and course_slug=? and was_cache_hit=false)` — máximo **3**. Configurable vía constante `AULA_QA_LIVE_LIMIT = 3`.

**Privacidad:** el **audio de la voz del alumno se transcribe y se descarta** (no se persiste). Solo se guarda el transcript de texto, y toda atribución pública usa **código de referido**, nunca el nombre. (Consistente con la postura de privacidad y anonimato del proyecto — mismo criterio que BrainShield.)

> Nota de reúso alternativo: existe `liveAvatarSessions`/`liveAvatarMessages`. Se evaluó reusarlas; se opta por tablas propias más delgadas porque el modelo (FAQ curadas + caché por embedding + límite por curso) no encaja con el de sesiones de avatar. Se **copia el patrón** del handler, no las tablas.

---

## 5. Endpoints

### `GET /api/aula/:slug/faqs`
Devuelve las FAQ activas del curso **más las FAQ públicas de la comunidad** (`is_public=true`): `[{ id, question, answerAudioUrl, authorReferralCode?, isPublic }]` (el texto se puede incluir para subtítulo; si es promovida se muestra "aportada por {código}"). Costo cero, cacheable en el cliente.

**Orden (prioridad de visibilidad por "mano levantada"):** las FAQ públicas cuyo **autor está ahora mismo activo con la mano levantada** (`qa_presence.hand_raised_until > now`) suben al **principio** del feed; el resto sigue por `sort_order`/recencia. Es un boost de visibilidad al autor presente, **asincrónico** — no hay sala en vivo compartida.

### `GET /api/aula/qa/consent` · `POST /api/aula/qa/consent`
- `GET` → `{ accepted: boolean, tcVersion }` para la versión vigente del alumno.
- `POST` → registra el consentimiento del alumno para `AULA_QA_TC_VERSION` (inserta en `conference_qa_consent`). Se llama cuando el alumno acepta el modal de T&C en el primer uso.

### `POST /api/aula/qa/hand`  (heartbeat de "mano levantada")
Mientras el alumno tiene la mano levantada en su sesión, el cliente late este endpoint cada ~`AULA_QA_HAND_TTL_SEC/2` s → refresca `qa_presence.hand_raised_until = now + AULA_QA_HAND_TTL_SEC`. Al bajar la mano o salir, deja de latir y la señal expira sola. Es la única fuente del boost de visibilidad de arriba.

### `POST /api/aula/:slug/qa`  (multipart: `audio` blob)
1. Auth requerida (alumno inscrito). Si no hay `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` → **503 con mensaje honesto** ("El Q&A por voz no está disponible ahora"), **no** respuesta falsa.
2. **Consentimiento:** si el alumno no aceptó `AULA_QA_TC_VERSION` → **403 `{ needsConsent:true }`** (el cliente muestra el modal T&C). No graba nada.
3. Valida tamaño/duración (≤40 s, ≤ ~4 MB). Si excede → 413.
4. STT. Si transcript vacío/baja confianza → `{ needsRetry:true }` (no cuenta al límite).
5. **Moderación** del transcript (OpenAI moderation, gratis). Si es ofensivo → **descarta audio + transcript de inmediato** (no se inserta en `conference_qa_log`), responde `{ moderated:true, answerText: <rechazo cortés> }`. **No cuenta al límite. No se promueve.**
6. Embed + búsqueda de caché (FAQ + qa_log del curso). HIT ≥ umbral → responde cacheado (`cacheHit:true`, no descuenta).
7. MISS → checa límite. Alcanzado → `{ deflected:true, answerText: <invitación Tutor IA>, remaining:0 }`.
8. Genera con `generateResponse(...)` + `instructorName` (una sola llamada; el propio prompt redirige lo fuera de tema, sin clasificador aparte) → TTS → sube a R2 → cachea en `conference_qa_log` (con el `referral_code` del alumno para atribución anónima).
9. Responde `{ transcript, answerText, answerAudioUrl, cacheHit, deflected, moderated, remaining }`.

Todo —consentimiento, moderación, descuento del límite, caché— es **server-side** (el cliente no puede saltarse el tope de 3, ni el consentimiento, ni la moderación).

---

## 6. Cliente — `<ConferenceQA slug instructor courseId />`

Insertado en `curso-virtual.tsx` cuando `user && allCompleted`. La sesión de Q&A **reemplaza** la sensación de "conferencia terminada": el `stps-next-steps` (diploma/DC-3) **solo aparece después** de que la sesión se cierra (tras la despedida).

- **Modelo de sesión (no termina de golpe):** al acabar el audio de la conferencia, la vista entra en modo **"sesión de preguntas abierta"** — el instructor sigue presente ("¿tienes alguna pregunta?"), NO dice "terminó". La sesión permanece abierta mientras el alumno pregunte (hasta su límite de 3). Si pasan **30 s (`AULA_QA_IDLE_FAREWELL_SEC`)** sin nueva pregunta → se reproduce la **despedida del instructor** (audio pre-grabado por instructor) y **entonces** aparece el CTA de diploma/DC-3.
- **Encabezado:** "Preguntas y respuestas con {instructor}".
- **FAQ:** chips/lista; al tocar → reproduce `answerAudioUrl` (y muestra el texto como subtítulo). Incluye las **FAQ públicas de la comunidad** (`is_public`) además de las del curso. Si es promovida, muestra "aportada por {código de referido}" — **nunca** un nombre.
- **Consentimiento (primer uso):** la **primera vez** que el alumno presiona el micrófono (o el input de texto), si aún no aceptó `AULA_QA_TC_VERSION`, se abre un **modal de T&C** que explica: (i) su pregunta puede usarse como **material pedagógico**; (ii) si se reutiliza, se le identifica **solo por su código de referido**; (iii) los mensajes **ofensivos se eliminan de inmediato**. Botón "Acepto" → `POST /api/aula/qa/consent` → recién entonces se habilita grabar. Sin aceptar, no graba.
- **Mano levantada (✋):** toggle opcional "levantar la mano". Mientras esté activo, el cliente late `POST /api/aula/qa/hand` (cada ~`AULA_QA_HAND_TTL_SEC/2` s) para que, si alguna pregunta tuya ya es FAQ pública, **suba primero** en el feed de la comunidad mientras estás presente. Se explica al alumno como "sube tu aporte para la comunidad". Al bajarla o salir, la señal expira sola.
- **Push-to-talk:** botón grande "🎤 Mantén presionado para preguntar". `MediaRecorder` audio-only, indicador de grabando + contador (máx 40 s, auto-stop). Al soltar → sube → estado "pensando…" → muestra transcript → reproduce respuesta hablada. Si el backend responde `moderated:true`, muestra el rechazo cortés y **no** descuenta.
- **Contador:** "Te quedan N preguntas en vivo". Al llegar a 0 → reemplaza el push-to-talk por CTA **"Consigue tu DC-3 en el Tutor IA"** → `/tutor-ia/${slug}`.
- **Fallback sin micrófono:** si se niega el permiso o el navegador no soporta `MediaRecorder`, mostrar un **campo de texto** para escribir la pregunta (mismo endpoint, sin el blob de audio → salta STT). Nunca dejar al alumno sin salida.

---

## 7. Manejo de errores (todo explícito, cero mock)

| Caso | Comportamiento |
|---|---|
| T&C no aceptados | 403 `needsConsent` → modal de T&C. No graba. |
| Mensaje ofensivo | Se **descarta audio + transcript de inmediato**, rechazo cortés. No persiste, no promueve, no cuenta al límite. |
| Sin permiso de micrófono | Fallback a input de texto. No cuenta al límite. |
| Navegador sin MediaRecorder | Fallback a texto. |
| STT vacío / baja confianza | "No te entendí bien, ¿lo repites?" — no cuenta al límite. |
| Fuera de tema | Deflexión honesta corta + link Tutor IA. Cuenta como generación. |
| Límite (3) alcanzado | CTA Tutor IA/DC-3. No genera. |
| Falla LLM o TTS | Error explícito ("Hubo un problema, intenta de nuevo"). **No** cuenta al límite, **no** respuesta inventada. |
| Falta `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` | Feature deshabilitada con aviso honesto (no silencioso). |

---

## 8. Consistencia de voz y persona

`generateResponse` hoy fija una persona genérica ("instructor experto…"). Se **extiende** su firma para recibir `instructorName` (de `courses.instructor`) e interpolarlo en el system prompt, para que la respuesta hablada suene coherente con quien dio la conferencia. El TTS usa la **voz e `instructions` del instructor del curso** (para las conferencias del Aula: Yuridia → `coral`, Medina → `ash`), tomadas del mismo mapa `instructor → voz + estilo` que se define para el Tutor IA, para que no se note el salto entre la clase y la respuesta.

**Despedida (asset):** cada instructor tiene un **audio de despedida pre-grabado** (una vez, misma voz/estilo), que se reproduce al cerrar la sesión por inactividad (30 s). No cuesta tokens en tiempo real.

> **Pendiente de entregable:** el **texto de los T&C** (`AULA_QA_TC_VERSION`) — corto, cubriendo uso pedagógico + anonimato por código de referido + borrado de ofensivos — lo redacta/valida quien corresponda (Daniel) antes de publicar. El spec asume que existe; no inventa su contenido legal.

---

## 9. Parámetros (una sola fuente de verdad)

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
EMBED_MODEL               = "text-embedding-3-small"
TTS_MODEL/VOICE           = "gpt-4o-mini-tts" / voz del instructor (ver reparto de voces)
```

> Nota: el TTS ya no es siempre `ash`. La voz se toma del instructor del curso (ver la decisión de "instructores y voces" del Tutor IA). Para las conferencias Yuridia/Medina del Aula la voz de la respuesta debe coincidir con la de la conferencia.

---

## 10. Testing

- **Rate limit (server):** el 4º MISS del mismo alumno/curso devuelve `deflected` sin generar; un cache HIT no descuenta; un error de LLM/TTS no descuenta.
- **Caché semántico:** dos formulaciones de la misma pregunta → la 2ª es HIT (sin generar). Pregunta distinta → MISS.
- **Deflexión de alcance:** pregunta fuera del tema → `deflected:true`, respuesta corta, sin alucinar contenido del curso.
- **Grounding:** la respuesta a una pregunta del tema cita/usa el contenido de `course_modules` del curso (no genérico).
- **STT vacío:** transcript vacío → `needsRetry`, no descuenta.
- **Consentimiento:** sin registro de `AULA_QA_TC_VERSION` → 403 `needsConsent`, no graba; tras `POST consent` sí procede; subir la versión de T&C vuelve a exigir aceptación.
- **Moderación:** transcript ofensivo → `moderated:true`, **no** se inserta en `conference_qa_log` (verificar que no queda fila), no descuenta, no se promueve.
- **Anonimato:** una FAQ promovida expone `authorReferralCode` y **nunca** el nombre/user_id del autor; `GET /faqs` no filtra PII.
- **Sesión que no termina de golpe:** al acabar el audio la vista queda en "sesión abierta" (no muestra el diploma aún); tras 30 s sin pregunta se reproduce la despedida y **luego** aparece el CTA de diploma.
- **FAQ de comunidad:** una promovida con `is_public=true` aparece en `GET /faqs` de cursos distintos al de origen; una no pública, no.
- **Mano levantada:** con `qa_presence.hand_raised_until > now` del autor, su FAQ pública sale primero en el orden; al expirar la señal, vuelve al orden normal. El heartbeat refresca la vigencia.
- **Privacidad:** el blob de audio del alumno no queda persistido tras la transcripción (ni el de los ofensivos).
- **UI:** aparece solo con `allCompleted`; primer uso abre modal T&C; al agotar las 3 muestra el CTA al Tutor IA; fallback a texto sin micrófono.

---

## 11. Fuera de alcance (v1)

- Interrupción a media conferencia ("levanta la mano"): descartada por costo/UX; el Q&A es al final.
- Conversación continua / barge-in (Realtime API): cambiaría la voz del instructor y encarece; queda como posible fase futura.
- **Sala en vivo compartida (town hall) multiusuario:** varios socios en la misma sesión sincrónica. Descartada para v1; la "mano levantada" de esta versión es solo un boost de visibilidad **asincrónico**, no una sala en tiempo real.
- Multi-idioma / escucha activa bilingüe.
- Moderación automática de las FAQ promovidas (por ahora la promoción `promoted` es una acción curada/administrativa, no automática).

---

## 12. Referencias cruzadas
- Embudo posterior a la conferencia (Tutor IA → DC-3/SEP): ver `docs/superpowers/specs/2026-07-17-dc3-tutor-ia-design.md`.
- Regla de contenido real (no mock): memoria de proyecto "No Claims Falsos en Contenido" / "No Silent Degradation".
