# Voz del instructor con ElevenLabs — diseño

Fecha: 2026-07-22
Estado: aprobado (secciones 1-4 validadas con David en sesión)

## 1. Objetivo

Que el audio de las clases suene con la **voz real del instructor que firma el curso**, en lugar
de una voz genérica de catálogo. Hoy `shared/instructor-voice.ts` mapea cada instructor a una voz
de OpenAI (Medina→`ash`, Yuridia→`coral`, David→`verse`, Daniel→`onyx`): suena a locutor de stock.
Con voz clonada, la clase que firma Medina suena a Medina, lo que refuerza la trazabilidad de quién
respalda el DC-3.

## 2. Estado actual — medido, no supuesto (2026-07-22)

Verificado contra la base de producción (`.env.seed.txt`) y contra el código en `fork/main`:

| Hecho | Valor |
|---|---|
| Punto de integración TTS | **uno solo**: `server/audio-generator.ts` |
| Uso de `voiceForInstructor()` | únicamente en `audio-generator.ts:73` |
| `speechSynthesis` en el cliente | **no existe** — todo el TTS es de servidor |
| Modelo actual | `gpt-4o-mini-tts` (OpenAI), audio cacheado en R2 |
| `generated_content` | 127 filas · 9 usuarios · 28 cursos |
| Módulos con audio ya generado | **17** (13%) → 264 min, 226,499 caracteres |
| Caracteres por módulo (promedio) | **13,367** |
| Filas con `personalized_for` real | **127 de 127** |
| Cursos del Studio por instructor | Medina 31 · Yuridia 20 · David 4 · Daniel 4 |

Dos consecuencias que mandan sobre el diseño:

1. **El guion es distinto para cada alumno.** Se comprobó por `md5(class_script)` agrupando por
   `(course_slug, module_index)`: cada usuario tiene un guion propio en todos los casos con más de
   una fila. El audio **no es cacheable entre alumnos**, así que el costo de TTS escala con el
   número de alumnos, no con el catálogo.
2. **El audio ya es de facto bajo demanda** (13% de los módulos lo tienen). Ese comportamiento es
   lo que hace que la cuota del plan alcance, y este diseño lo preserva a propósito.

Corrección de documentación: el comentario en `shared/instructor-voice.ts:2` afirma que
`qa-openai.ts::synthesizeAnswer` consume el mapa de voces. **Ese consumidor no existe**; el
comentario se corrige como parte de este trabajo.

## 3. Plan de ElevenLabs y modelos

Plan contratado: **Creator — 121,000 créditos/mes**. Incluye Professional Voice Cloning (PVC) e
Instant Voice Cloning (IVC).

| Clonación | Audio requerido | Uso en este diseño |
|---|---|---|
| **IVC** | 1–5 min | **Fase 1** — arranca sin bloquear a nadie |
| **PVC** | 30 min mínimo, 2–3 h ideal | Fase 2 opcional, si la fidelidad de IVC no basta |

| Modelo | Costo por caracter | Uso |
|---|---|---|
| **Multilingual v2** | 1× | Contenido compartido (se genera una vez, lo oyen todos) |
| **Flash v2.5** | **0.5×** | Audio personalizado por alumno |

Capacidad del plan con 13,367 caracteres por módulo: **~9 módulos/mes** con Multilingual v2,
**~18 módulos/mes** con Flash v2.5, sumando todos los alumnos. Un alumno que completa un curso de
5 módulos consume ~67,000 caracteres, es decir **55% de la cuota mensual**.

Riesgo aceptado explícitamente por David: se eligió voz clonada en **todo** el audio, incluido el
personalizado, con pleno conocimiento de esta aritmética. La mitigación es el disparador bajo
demanda (§6) más el medidor y tope (§8). El día que entre una empresa con decenas de colaboradores
habrá que subir de plan; el medidor existe para que eso se vea venir y no aparezca en la factura.

## 4. Arquitectura

Cinco componentes nuevos, dos modificados.

**Nuevos**

1. `server/services/elevenlabs.ts` — cliente del proveedor, con el mismo patrón ya probado en
   `server/services/heygen.ts`: getter `isConfigured` (sin `ELEVENLABS_API_KEY` el sistema sigue con
   OpenAI y lo registra) y `safeFetch` con log y traducción de errores. Operaciones: clonar voz
   (IVC), listar voces de la cuenta, sintetizar, borrar voz.
2. Tabla `instructor_voices` (§5).
3. `server/routes/voz.ts` — endpoints del instructor (§6).
4. `client/src/pages/instructor-voz-tab.tsx` + entrada `{ id: "voz", label: "Mi Voz", icon: Mic }`
   en `navItems` de `client/src/pages/instructor-dashboard.tsx:1695`.
5. `server/lib/voice-resolver.ts` — módulo puro que decide qué voz usar para un curso dado.

**Modificados**

6. `server/audio-generator.ts` — la llamada directa a `openai.audio.speech.create` se vuelve un
   despachador por proveedor. Es el único punto de integración del audio por alumno, por eso el
   cambio es contenido.
7. `server/generate-ted-audio.ts` — mismo despachador, con Multilingual v2 (§6.2). Hoy no consulta
   el mapa de instructores; pasa a resolver la voz igual que el resto.
8. `generated_content` — columnas `audio_provider` y `audio_voice_id`.

### Por qué tabla propia y no columnas en `instructor_avatars`

`instructor_avatars` ya tiene el flujo de consentimiento y videos resuelto, pero está amarrada a
HeyGen (`heygen_avatar_id`, `heygen_voice_id`) y al tab Gemelo Digital, que está desactivado. La voz
debe poder funcionar aunque el Gemelo siga apagado, y su consentimiento debe estar redactado para
**voz**, no heredado de uno escrito para avatar de video. Se reusan los patrones (R2, subida,
máquina de estados), no la tabla.

## 5. Modelo de datos

### Tabla nueva `instructor_voices`

```
id                    uuid PK
instructor_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
provider              text NOT NULL DEFAULT 'elevenlabs'
external_voice_id     text
clone_type            text NOT NULL DEFAULT 'ivc'      -- 'ivc' | 'pvc'
status                text NOT NULL DEFAULT 'pending'  -- pending|processing|ready|failed
consent_accepted      boolean NOT NULL DEFAULT false
consent_accepted_at   timestamptz
consent_text_version  text
consent_ip            text
sample_r2_key         text
sample_r2_url         text
sample_duration_seconds integer
error                 text
revoked_at            timestamptz
created_at            timestamptz NOT NULL DEFAULT now()
updated_at            timestamptz
```

Índice único parcial sobre `instructor_id` donde `revoked_at IS NULL`: un instructor tiene como
máximo una voz activa, pero conserva el historial de las revocadas como prueba documental.

`consent_text_version` y `revoked_at` no son adorno: permiten probar **a qué texto exacto** consintió
cada persona y honrar una revocación.

### Columnas nuevas en `generated_content`

```
audio_provider  text   -- 'openai' | 'elevenlabs'
audio_voice_id  text   -- voz concreta usada
```

Sin ellas no hay forma de saber cuál de los 17 audios existentes quedó con voz genérica ni qué
regenerar cuando llegue la muestra de cada instructor.

### Migración

`migrations/2026-07-22_instructor_voices.sql`, con `CREATE TABLE IF NOT EXISTS` **seguido de los
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` de cada columna** — un `CREATE TABLE IF NOT EXISTS` se
salta entero si la tabla ya existe y las columnas nuevas nunca se crean (ya ocurrió con
`course_playbooks.source` y rompió el deploy).

Las migraciones de este repo **no corren solas en el deploy**: se aplica a mano en el editor SQL de
Supabase **antes** de desplegar el código que la usa, y no se da por aplicada sin pegar su
verificación.

## 6. Flujos

### 6.1 Clonación — autoservicio, una vez por instructor

```
Instructor entra a "Mi Voz"
  -> lee el consentimiento versionado y acepta
     [sella consent_accepted, consent_text_version, consent_ip, consent_accepted_at]
  -> graba o sube 3 min de audio  -> R2: voces/instructor-{id}/muestra-{ts}.webm
  -> POST /clone -> ElevenLabs IVC -> external_voice_id, status = ready
  -> escucha una frase de prueba y aprueba, o regraba
```

El clon se genera **cuando el instructor revisa su curso y carga su voz**, no antes. Los estados
`pending → processing → ready | failed` se muestran explícitos en la UI, con el mensaje de error real
cuando falla: nadie se queda mirando una rueda sin saber qué pasó.

Endpoints en `server/routes/voz.ts`, todos con `requireAuth` + `requireInstructor`:

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/instructor/voz/me` | Estado de mi voz |
| POST | `/api/instructor/voz/consent` | Sella el consentimiento con su versión de texto |
| POST | `/api/instructor/voz/sample` | Sube la muestra a R2 (multer, allowlist de audio, límite de tamaño, siguiendo `server/lib/playbook-upload.ts`) |
| POST | `/api/instructor/voz/clone` | Dispara la clonación. Rechaza con 400 si falta consentimiento o muestra |
| POST | `/api/instructor/voz/preview` | Genera una frase de prueba |
| DELETE | `/api/instructor/voz` | Revoca: borra la voz en ElevenLabs y la muestra en R2, sella `revoked_at` |

### 6.2 Síntesis — dos rutas

| Contenido | Productor en el repo | Modelo | Cuándo se genera |
|---|---|---|---|
| **Plática del Aula Virtual** (fija, sin variables) | `course_modules.audio_url` | **voz real grabada**, sin TTS | La sube el instructor |
| Compartido — mismo audio para todos | `server/generate-ted-audio.ts` | Multilingual v2 | Una vez, pregenerado, cacheado en R2 |
| Personalizado por alumno (`generated_content`) | `server/audio-generator.ts` | Flash v2.5 | **Bajo demanda**: el alumno lo pide |

La distinción no es conceptual sino de archivo: `generate-ted-audio.ts` produce audio de conferencia
que oyen todos por igual y hoy ni siquiera consulta el mapa de instructores (usa `TTS_INSTRUCTIONS`
fijas); `audio-generator.ts` produce el audio por alumno. Cada uno recibe su modelo.

### 6.2.1 Voz real por encima de cualquier síntesis

La plática del Aula Virtual es **fija, sin variables**: todos los alumnos oyen exactamente lo mismo.
Por eso el instructor puede **sustituirla por su propia grabación real**, subiendo el audio desde
"Mi Voz". No es un TTS mejor: es la persona.

Esto tiene tres consecuencias que lo vuelven la opción preferente siempre que exista:

1. **Cuesta cero créditos.** Un módulo con voz real no consume nada de los 121k mensuales, lo que
   descarga justo el contenido que más se reproduce.
2. **No plantea ningún problema de biométricos.** No hay clon: hay una grabación que la persona
   entregó a propósito.
3. **Es indistinguible de lo real porque es lo real**, y refuerza que detrás del DC-3 hay un
   instructor de carne y hueso.

Se guarda en `course_modules.audio_url` (columna que ya existe), con el archivo en R2. Endpoint
`POST /api/instructor/voz/modulo/:moduleId/audio`, con la misma allowlist y límite de tamaño que la
muestra de clonación.

El disparador bajo demanda para el contenido personalizado es una decisión deliberada: preserva el
comportamiento que ya se observa (13% de los módulos) y es lo que hace que 121k créditos alcancen.

### 6.3 Resolución de voz (`server/lib/voice-resolver.ts`)

Módulo puro, sin acceso a red, que recibe el instructor del curso y el estado de su voz y devuelve
qué proveedor y qué voz usar, en este orden de precedencia:

1. **Grabación real del instructor** para ese módulo (`course_modules.audio_url`) → se sirve tal
   cual, no se sintetiza nada.
2. Voz del instructor del curso con `status = 'ready'` y `revoked_at IS NULL` → ElevenLabs.
3. En cualquier otro caso → OpenAI con la voz genérica de `shared/instructor-voice.ts`.

**Invariante que no puede fallar: jamás usar la voz clonada de un instructor en el curso de otro.**
Se prueba con tests dedicados, igual que se hizo con `server/lib/risk-anonymity.ts`.

## 7. Errores y degradación

| Situación | Comportamiento |
|---|---|
| Sin `ELEVENLABS_API_KEY` | Todo sigue con OpenAI, registrado en log. Nada truena |
| Instructor sin voz `ready` | Voz genérica actual — es exactamente lo de hoy, no es regresión |
| Voz revocada | Voz genérica, y la clonada no vuelve a usarse jamás |
| Fallo de la API de ElevenLabs | Se registra el error real y se cae a OpenAI **marcándolo** en `audio_provider` |
| Tope de créditos alcanzado | Cae a OpenAI marcándolo en `audio_provider` + log de alerta |

La degradación **nunca es silenciosa**: siempre queda registrada en `audio_provider`, de modo que se
puede listar exactamente qué audio salió con qué voz y regenerar lo que corresponda. Dejar al alumno
sin audio se consideró peor que darle temporalmente otra voz, siempre que quede marcado.

## 8. Medidor y tope de consumo

- Contador de caracteres sintetizados por mes, por proveedor.
- Tope mensual en variable de entorno (`ELEVENLABS_MONTHLY_CHAR_LIMIT`), calibrado por debajo de los
  121,000 créditos del plan Creator.
- Al alcanzar el tope: fallback marcado a OpenAI (§7), no interrupción del servicio.
- El consumo se puede consultar para saber cuándo toca subir de plan.

## 9. Consentimiento y marco legal

La voz clonada de una persona identificada es **dato biométrico** bajo la LFPDPPP. Además, tres de
los cuatro instructores (Medina, Yuridia, Daniel) son terceros que deben otorgar autorización.

- El consentimiento es **específico para voz**, versionado en `consent_text_version`, con IP y fecha.
- Debe cubrir: para qué se usa la voz, en qué cursos, por cuánto tiempo y cómo se revoca.
- El aviso de privacidad de la plataforma debe mencionar el tratamiento de voz como biométrico.
- La revocación (`DELETE /api/instructor/voz`) borra la voz en el proveedor y la muestra en R2.

**Decisiones que van a la lista viva de decisiones legales, no al chat:**

1. Redacción y validación del texto de consentimiento de voz — le toca a Daniel Zavala (CLO), que
   además es uno de los cuatro a clonar.
2. Actualización del aviso de privacidad para incluir datos biométricos de voz.

## 10. Pruebas

**Unitarias (TDD, módulos puros):**

- `voice-resolver`: instructor con voz `ready` → ElevenLabs; sin voz → OpenAI genérica; voz revocada
  → OpenAI genérica; **voz de A nunca aparece en curso de B**.
- Contador de créditos: al superar el tope dispara el fallback y lo marca.

**Verificación en producción (la que cierra el trabajo):**

1. Clonar la voz de David — la única que no depende de terceros.
2. Generar un módulo real y confirmar `audio_provider = 'elevenlabs'` y `audio_voice_id` poblado.
3. Escuchar el resultado y confirmar que es reconociblemente su voz.
4. Revocar y confirmar que la voz desaparece del proveedor y que el siguiente audio sale con OpenAI.
5. Confirmar la migración pegando su verificación (`information_schema.columns`).

## 11. Fuera de alcance

**Llamada 1:1 con el gemelo del instructor** ($249 MXN por 5 minutos) — proyecto siguiente, con su
propio spec. Decisiones ya tomadas que quedan asentadas aquí para no perderlas:

- Será **sólo voz en tiempo real, sin video**. Descarta HeyGen y su API de streaming
  (`server/services/liveavatar.ts`, `client/src/pages/live-tutor.tsx`, hoy apagados) y se apoya en
  ElevenLabs Conversational AI, reusando la voz clonada que produce este spec.
- Depende de este proyecto: sin voz clonada no hay nada que vender como "el doble del instructor".
- **Rotulado obligatorio**: debe decir en el momento de pagar que se habla con un gemelo digital de
  IA, nunca "asesoría con el instructor". Riesgo de publicidad engañosa ante PROFECO y erosión del
  valor del DC-3 respaldado por un instructor de carne y hueso.
- Pendiente legal para Daniel: quién responde si el gemelo de un instructor con DC-5 da un consejo
  equivocado sobre una norma STPS.

**Tampoco entra aquí:** el tab Gemelo Digital y su migración fuera de HeyGen; la acreditación DC-5
(sigue autodeclarada, `instructorBadgeType` no gatea permisos); el panel de empresas.

## 12. Trabajo en paralelo que no depende del código

Recabar **3 minutos de audio limpio** de Medina, Yuridia y Daniel — sin ruido de fondo, leyendo
cualquier texto. Es el camino crítico: Medina y Yuridia concentran 51 de los 59 cursos del Studio,
así que sin sus muestras el efecto del proyecto se queda en el 14% del catálogo.

Inventariar además el material ya grabado de cada instructor (`video_url` en varias tablas): si hay
30+ minutos de voz real, habilita el salto a PVC sin pedirles nada nuevo.
