-- Estudio del instructor — spec docs/superpowers/specs/2026-07-22-estudio-instructor-edicion-design.md
--
-- Normaliza los módulos de instructor_courses (hoy en la columna jsonb "modules")
-- y agrega bibliografía y frases destacadas. instructor_courses estaba en 0 filas
-- al 2026-07-22, así que no hay datos que migrar.
--
-- instructor_courses.modules NO se dropea aquí: primero el código deja de leerla,
-- después se retira en un cambio aparte.
--
-- Aplicar manualmente en el editor SQL de Supabase antes de desplegar el código.

CREATE TABLE IF NOT EXISTS instructor_course_modules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  course_id     uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE,
  "order"       integer NOT NULL DEFAULT 1,
  title         text NOT NULL,
  description   text,
  duration_min  integer,
  content_html  text,
  audio_url     text,
  youtube_ids   text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

CREATE TABLE IF NOT EXISTS instructor_course_references (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  course_id              uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE,
  authors                text NOT NULL,
  year                   integer,
  title                  text NOT NULL,
  source                 text,
  url                    text,
  verified_by_instructor boolean NOT NULL DEFAULT false,
  verified_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instructor_module_quotes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  module_id    uuid NOT NULL REFERENCES instructor_course_modules(id) ON DELETE CASCADE,
  "order"      integer NOT NULL DEFAULT 1,
  text         text NOT NULL,
  attribution  text
);

-- IMPRESCINDIBLE: si alguna tabla ya existiera de una corrida previa, el
-- CREATE TABLE IF NOT EXISTS de arriba se salta ENTERO y las columnas nuevas
-- nunca se crean — pasó con course_playbooks.source y rompió el deploy.
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS course_id uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 1;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS title text NOT NULL;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS duration_min integer;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS content_html text;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS youtube_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE instructor_course_modules ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS course_id uuid NOT NULL REFERENCES instructor_courses(id) ON DELETE CASCADE;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS authors text NOT NULL;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS title text NOT NULL;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS verified_by_instructor boolean NOT NULL DEFAULT false;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE instructor_course_references ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS module_id uuid NOT NULL REFERENCES instructor_course_modules(id) ON DELETE CASCADE;
ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 1;
ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS text text NOT NULL;
ALTER TABLE instructor_module_quotes ADD COLUMN IF NOT EXISTS attribution text;

CREATE INDEX IF NOT EXISTS idx_instructor_course_modules_course ON instructor_course_modules (course_id, "order");
CREATE INDEX IF NOT EXISTS idx_instructor_course_references_course ON instructor_course_references (course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_module_quotes_module ON instructor_module_quotes (module_id, "order");
