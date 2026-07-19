-- Detector de riesgos — spec docs/superpowers/specs/2026-07-18-detector-riesgos-design.md.
-- Reemplaza playbook_evidence (retirada aquí: nunca tuvo datos en producción).
--
-- risk_findings — un trabajador capacitado reporta un incumplimiento real con
-- foto + descripción; la empresa lo atiende/descarta; los puntos se acreditan
-- SOLO al pasar a 'atendido' (nunca al enviar). user_id SIEMPRE se guarda
-- (puntos + "mis hallazgos"), incluso si anonymous = true: el anonimato es una
-- regla de SERVIDOR aplicada en la API (columnas omitidas en la respuesta),
-- no una omisión de columna en la base — ver §6 del spec.
--
-- team_id es text (no uuid, como dice el §5 del spec) porque teams.id es text
-- en todo el resto de este schema; una FK uuid -> text no se puede crear.
--
-- Aplicar manualmente en Supabase (SQL editor) antes de desplegar el código
-- que la usa, igual que el resto de las migraciones de este repo.

CREATE TABLE IF NOT EXISTS risk_findings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anonymous             boolean NOT NULL,
  team_id               text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  course_slug           text REFERENCES studio_courses(slug) ON DELETE SET NULL,
  photo_key             text NOT NULL,
  description           text NOT NULL,
  norm_ref              text,
  status                text NOT NULL DEFAULT 'nuevo',
  resolution_photo_key  text,
  resolution_note       text,
  points_awarded        integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz,
  resolved_at           timestamptz,
  resolved_by           uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_findings_team_status
  ON risk_findings (team_id, status);

CREATE INDEX IF NOT EXISTS idx_risk_findings_user
  ON risk_findings (user_id);

-- IMPRESCINDIBLE: si risk_findings ya existiera de una corrida previa de este
-- archivo (o de una versión anterior con menos columnas), el CREATE TABLE
-- IF NOT EXISTS de arriba se salta ENTERO y las columnas nuevas nunca se
-- crean — nos pasó con course_playbooks.source y rompió el deploy con
-- "column ... does not exist" en cada ruta. Estos ALTER cubren cada columna
-- y son inofensivos si la tabla se acaba de crear.
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS anonymous boolean NOT NULL;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS course_slug text REFERENCES studio_courses(slug) ON DELETE SET NULL;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS photo_key text NOT NULL;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS description text NOT NULL;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS norm_ref text;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'nuevo';
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS resolution_photo_key text;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS resolution_note text;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE risk_findings ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- playbook_evidence queda retirada: nunca tuvo datos en producción. El código
-- que aún la referencia (server/routes/playbook.ts, client/src/pages/dashboard.tsx)
-- se retira en una tarea posterior; esta migración solo cubre el esquema.
DROP TABLE IF EXISTS playbook_evidence;
