# Estudio del instructor — edición de cursos propios

Fecha: 2026-07-22
Estado: aprobado (validado con David en sesión)

## 1. Objetivo

Que el instructor pueda **editar sus propios cursos** después de crearlos: cambiar el texto de cada
módulo, agregar frases destacadas, insertar videos de YouTube y mantener una bibliografía cuyas
referencias él mismo confirma.

Hoy sólo puede crear (`CreateCourseTab`, `client/src/pages/instructor-dashboard.tsx:789`) y listar
(`MyCreatedCoursesTab:1130`). Una vez creado, el curso no se puede modificar desde la interfaz.

## 2. Alcance: sólo `instructor_courses`

Ceduverse tiene tres sistemas de cursos y el instructor tiene una relación distinta con cada uno:

| Sistema | Tablas | Contenido | En este spec |
|---|---|---|---|
| Aula Virtual (29) | `courses` + `course_modules` | Fijo, un módulo por curso | **No** |
| Tutor IA (59 en `studio_courses`) | `studio_courses` + `studio_modules` | Se genera por IA, distinto por alumno | **No** |
| Cursos propios | `instructor_courses` | Lo que captura el instructor | **Sí** |

**Por qué el Aula Virtual queda fuera.** Sus cursos emiten DC-3 con temario, objetivo y duración
**registrados ante la STPS**. Editarlos libremente desharía justo lo que corrigió
`migrations/2026-07-19_dc3_solo_programas_registrados.sql`, que bajó de 47 a 28 los cursos
habilitados para DC-3 para que sólo los programas registrados lo emitan. Habilitar edición ahí exige
decidir campo por campo cuál toca el programa registrado y cuál no — es un diseño propio, no un
añadido a este.

**Por qué el Tutor IA queda fuera.** Su contenido se genera por alumno (`generated_content`, 127 de
127 filas con `personalized_for` real). "Editar el módulo" ahí significa cambiar la fuente que
alimenta la generación, no el texto que ve el alumno. Es otro problema.

## 3. Estado actual — medido (2026-07-22)

```
instructor_courses:  0 filas       instructor_profiles: 0 filas
instructor_avatars:  0 filas       private_sessions:    0 filas
courses:            29 filas       studio_courses:     59 filas
course_modules:     29 filas  ->  29 con audio · 29 con content_html · 29 con references · 0 con video
```

**`instructor_courses` está vacía.** Ningún instructor ha creado un curso todavía, así que rehacer su
modelo de datos no cuesta migración. Es el momento más barato en que va a estar.

Observación que no entra en este spec pero conviene no perder: los 29 módulos del Aula Virtual ya
traen `references` pobladas, de origen no verificado. Bajo el criterio de §5 habría que revisarlas.

## 4. Modelo de datos

Los módulos salen del `jsonb` de `instructor_courses.modules` y se normalizan:

```sql
instructor_course_modules
  id            uuid PK
  course_id     uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE
  "order"       integer NOT NULL DEFAULT 1
  title         text NOT NULL
  description   text
  duration_min  integer
  content_html  text
  audio_url     text
  youtube_ids   text[] NOT NULL DEFAULT '{}'
  created_at    timestamptz NOT NULL DEFAULT now()
  updated_at    timestamptz

instructor_course_references
  id                     uuid PK
  course_id              uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE
  authors                text NOT NULL
  year                   integer
  title                  text NOT NULL
  source                 text            -- editorial, revista, organismo
  url                    text
  verified_by_instructor boolean NOT NULL DEFAULT false
  verified_at            timestamptz
  created_at             timestamptz NOT NULL DEFAULT now()

instructor_module_quotes
  id           uuid PK
  module_id    uuid NOT NULL REFERENCES instructor_course_modules(id) ON DELETE CASCADE
  "order"      integer NOT NULL DEFAULT 1
  text         text NOT NULL
  attribution  text
```

Índices: `(course_id, "order")` en módulos, `(course_id)` en referencias, `(module_id, "order")` en
quotes.

### Por qué normalizar y no extender el `jsonb`

Las citas dentro del texto deben apuntar a una referencia con **identidad estable**. Dentro de un
`jsonb`, esa liga se rompe en cuanto alguien reordena el arreglo. Con tabla propia hay FK real.

Costo asumido: hay que reescribir `POST /api/instructor/my-courses`, que hoy guarda el `jsonb`. Con
la tabla en 0 filas, no hay datos que migrar.

### Citas dentro del texto

Van como marca `[[ref:<uuid>]]` dentro de `content_html`. Al guardar un módulo se extraen todas las
marcas y **se valida que cada uuid exista** como referencia del mismo curso; si alguna no existe, el
guardado se rechaza con un mensaje que dice cuál. Al borrar una referencia citada, se avisa en qué
módulos está usada en vez de dejar citas huérfanas.

Se distinguen dos cosas que el usuario pidió por separado:

- **Frase destacada** (`instructor_module_quotes`): recuadro con una frase, con su atribución. No
  liga a bibliografía.
- **Cita a fuente** (marca `[[ref:uuid]]`): apunta a una entrada de la bibliografía del curso.

### Migración

`migrations/2026-07-22_instructor_course_editor.sql`, con `CREATE TABLE IF NOT EXISTS` **seguido de
los `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` de cada columna** — un `CREATE TABLE IF NOT EXISTS` se
salta entero si la tabla ya existe y las columnas nuevas nunca se crean (ya pasó con
`course_playbooks.source` y rompió el deploy).

La columna `instructor_courses.modules` (jsonb) **no se dropea en esta migración**. Se deja huérfana
y su eliminación se hace por separado, después de confirmar en producción que el código dejó de
leerla. Con 0 filas el riesgo es nulo, pero el orden importa: primero el código, luego el `DROP`.

Las migraciones de este repo **no corren solas en el deploy**: se aplica a mano en el editor SQL de
Supabase antes de desplegar el código que la usa, y no se da por aplicada sin pegar su verificación.

## 5. La regla de las referencias confirmadas

**Ninguna referencia se crea automáticamente.** La captura el instructor y él marca la casilla de
verificada, que sella `verified_at`. "Confirmada" significa que una persona respondió por ella.

**`generated_content.suggested_sources` no alimenta esta bibliografía.** Es salida de IA sin
verificar; mezclarla contaminaría justo lo que se quiere que la palabra signifique. Inventar citas
plausibles es el modo de fallo clásico de un LLM y aquí no se le da entrada.

Es el mismo criterio ya adoptado en `server/lib/norm-validate.ts`: `pickAllowedNorm` rechaza
coincidencias parciales — si la IA devuelve "NOM-006" y la lista real dice "NOM-006-STPS-2014", no
se acepta, para no inventar precisión que nadie verificó.

Una referencia sin verificar puede existir en borrador, pero **el curso no se puede publicar con
referencias sin verificar**: al pasar a `published` se listan las pendientes y se bloquea.

## 6. Interfaz

Editor en **archivo propio**: `client/src/pages/instructor-curso-editor.tsx`.

No se agrega a `client/src/pages/instructor-dashboard.tsx`, que ya tiene 1,681 líneas con el wizard
de creación y el listado dentro. Un editor completo ahí lo vuelve inmanejable. Mismo criterio con que
se separó `instructor-gemelo-tab.tsx`.

Tres zonas:

1. **Módulo** — título, descripción, duración, texto enriquecido, frases destacadas y videos de
   YouTube. Reordenar módulos.
2. **Bibliografía del curso** — alta, edición y borrado de referencias, con su casilla de verificada
   y el aviso de en qué módulos se cita cada una.
3. **Vista previa** — cómo lo verá el alumno, con las citas ya resueltas.

Se entra desde `MyCreatedCoursesTab` (botón Editar por curso). Guardado explícito, con aviso de
cambios sin guardar al salir.

### Videos de YouTube

Se guarda el **ID**, no la URL completa, normalizando las formas que la gente pega
(`youtube.com/watch?v=`, `youtu.be/`, `/embed/`, con parámetros). Si no se puede extraer un ID
válido, se rechaza con mensaje claro. Se insertan con `youtube-nocookie.com`.

## 7. Endpoints

Todos con `requireAuth` + `requireInstructor`, y **todos verifican que el curso pertenezca al
instructor que llama** — por `instructor_id` en la base, nunca por un parámetro del cliente.

| Método | Ruta |
|---|---|
| GET | `/api/instructor/my-courses/:id` (curso con módulos, referencias y quotes) |
| PATCH | `/api/instructor/my-courses/:id` (metadatos del curso) |
| POST/PATCH/DELETE | `/api/instructor/my-courses/:id/modules[/:moduleId]` |
| PATCH | `/api/instructor/my-courses/:id/modules/reorder` |
| POST/PATCH/DELETE | `/api/instructor/my-courses/:id/references[/:refId]` |
| POST/PATCH/DELETE | `/api/instructor/my-courses/:id/modules/:moduleId/quotes[/:quoteId]` |

El `content_html` se sanitiza en el servidor antes de guardarse: allowlist de etiquetas, sin
`<script>` ni manejadores de eventos. El instructor escribe contenido que verán terceros.

## 8. Errores

| Situación | Comportamiento |
|---|---|
| Marca `[[ref:uuid]]` con uuid inexistente | 400 con el uuid concreto que falla |
| Borrar referencia citada | 409 con la lista de módulos que la citan |
| URL de YouTube irreconocible | 400, no se guarda un ID inválido |
| Publicar con referencias sin verificar | 409 con la lista de pendientes |
| Curso de otro instructor | 404 (no 403: no se confirma que exista) |

## 9. Pruebas

**Unitarias (módulos puros, TDD):**

- Extracción y validación de marcas `[[ref:uuid]]`: sin marcas, una, varias, repetida, uuid ausente.
- Normalizador de YouTube: `watch?v=`, `youtu.be/`, `/embed/`, con parámetros extra, basura → `null`.
- Regla de publicación: con todas verificadas pasa; con una sin verificar se bloquea y la nombra.
- Reordenamiento: el orden resultante es estable y sin huecos.

**Verificación en producción:** crear un curso propio, editarlo, citar una referencia, intentar
borrarla (debe avisar), verificarla, publicar, y confirmar que el alumno ve las citas resueltas.

## 10. Fuera de alcance

- **Edición del Aula Virtual y del Tutor IA** (§2). Cada uno necesita su propio diseño.
- **Catálogo comercial del instructor** (proyecto C): tarifa por hora de tutoría en vivo real,
  precio de conferencias en vivo y paquetes presenciales de 8 h × día. Decisión ya tomada que queda
  asentada: **el instructor fija sus precios libremente**, sin tope ni aprobación. Nota para ese
  spec: `private_sessions` ya tiene `price_mxn`, `instructor_payout_mxn` y `ceduverse_commission_mxn`
  con Daily.co, y está en 0 filas; los paquetes presenciales no existen en absoluto y arrastran
  logística (sede, fechas, cupo, lista de asistencia).
- **Voz del instructor**: ver `docs/superpowers/specs/2026-07-22-voz-instructor-elevenlabs-design.md`.
- **Acreditación DC-5**: sigue autodeclarada, sin poder subir el documento, sin columna para el
  registro STPS, y `instructorBadgeType` no gatea ningún permiso. Vender capacitación presencial
  encima de eso (proyecto C) es lo que vuelve urgente cerrarlo.
