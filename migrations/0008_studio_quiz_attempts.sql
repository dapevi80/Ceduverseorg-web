-- Migration: Create studio_quiz_attempts table
-- Historial append-only de intentos de quiz del Tutor IA: rastro auditable del
-- certificado y base del cooldown. quiz_attempts no sirve: su FK apunta a course_quizzes (legacy).

CREATE TABLE IF NOT EXISTS "studio_quiz_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_identifier" text NOT NULL,
  "module_index" integer NOT NULL,
  "score" integer NOT NULL,
  "passed" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_studio_quiz_attempts_user_course" ON "studio_quiz_attempts" ("user_id", "course_identifier");
CREATE INDEX IF NOT EXISTS "idx_studio_quiz_attempts_user" ON "studio_quiz_attempts" ("user_id");
