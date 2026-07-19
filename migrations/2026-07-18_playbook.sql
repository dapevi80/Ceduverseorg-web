-- Playbook del curso (Tutor IA) — spec docs/superpowers/specs/2026-07-18-playbook-design.md.
-- Dos tablas nuevas:
--   course_playbooks  — el playbook generado por IA, UNO POR CURSO (cacheado, pre-generable
--                       con `npx tsx server/generate-playbooks.ts`).
--   playbook_evidence — la foto que sube cada alumno por ejercicio de campo (privada al
--                       alumno + visible a su empresa/admin, nunca pública).
--
-- Aplicar manualmente en Supabase (SQL editor) antes de desplegar el código que la usa
-- (server/routes/playbook.ts), igual que el resto de las migraciones de este repo.

CREATE TABLE IF NOT EXISTS course_playbooks (
  course_slug   text PRIMARY KEY REFERENCES studio_courses(slug) ON DELETE CASCADE,
  content       jsonb NOT NULL,
  exercises     jsonb NOT NULL,
  "references"  jsonb NOT NULL,
  -- 'ai' (generación real de Claude) | 'fallback' (playbook mínimo derivado
  -- del contenido del curso, cuando la generación falló). Ver shared/schema.ts
  -- y server/playbook-generator.ts — sin esto un fallback quedaba cacheado
  -- para siempre, indistinguible de una generación real (C1).
  source        text NOT NULL DEFAULT 'ai',
  generated_at  timestamptz NOT NULL DEFAULT now()
);

-- IMPRESCINDIBLE: si course_playbooks YA existía (se creó con una versión previa
-- de este archivo, sin `source`), el CREATE TABLE IF NOT EXISTS de arriba se
-- salta ENTERO y la columna nunca se crea. Drizzle pide las columnas por nombre,
-- así que TODAS las rutas del playbook responderían 500 con
-- "column course_playbooks.source does not exist". Este ALTER lo cubre y es
-- inofensivo si la tabla se acaba de crear.
ALTER TABLE course_playbooks ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ai';

CREATE TABLE IF NOT EXISTS playbook_evidence (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug    text NOT NULL REFERENCES studio_courses(slug) ON DELETE CASCADE,
  exercise_index integer NOT NULL,
  photo_key      text NOT NULL,
  points         integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_evidence_user_course
  ON playbook_evidence (user_id, course_slug);
