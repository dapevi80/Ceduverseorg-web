-- Migration: anclar certificate_requests a los cursos de Studio (spec 2026-07-17, decisión 2)
-- Cambio destructivo de FK, SEGURO porque certificate_requests está vacía (David, 2026-07-17).
-- Verificar antes:  select count(*) from certificate_requests;   -- debe ser 0
-- Deliberadamente se elimina el ancla legacy (course_id -> courses.id): el nuevo ancla
-- es studio_course_slug -> studio_courses.slug, consistente con el resto de Studio
-- (studio_enrollments.course_identifier, studio_quiz_attempts.course_identifier,
-- generated_content.course_slug), y repara los ~20 cursos solo-Studio que antes no
-- podían anclar una solicitud de certificado (estado sin_curso_legacy).
-- Aplicar DESPUÉS de 0008 y 0009 (necesita studio_courses con su slug único ya presente),
-- antes de desplegar.

-- 1) quitar la unicidad y el FK viejos, anclados al catálogo legacy.
--    OJO: uq_cert_request es un UNIQUE INDEX (CREATE UNIQUE INDEX), NO una
--    constraint de tabla -> hay que DROP INDEX, no DROP CONSTRAINT. Con
--    DROP CONSTRAINT el índice sobrevivía y el DROP COLUMN course_id fallaba
--    ("cannot drop column ... index uq_cert_request depends on it").
DROP INDEX IF EXISTS "uq_cert_request";
ALTER TABLE "certificate_requests" DROP CONSTRAINT IF EXISTS "certificate_requests_course_id_courses_id_fk";
ALTER TABLE "certificate_requests" DROP COLUMN IF EXISTS "course_id";

-- 2) nuevo ancla: slug del curso de Studio, con FK real a studio_courses(slug).
--    NOT NULL sin default es seguro: la tabla está vacía.
ALTER TABLE "certificate_requests"
  ADD COLUMN "studio_course_slug" text NOT NULL
  REFERENCES "studio_courses"("slug") ON DELETE CASCADE;

-- 3) reconstruir la unicidad sobre el nuevo ancla.
CREATE UNIQUE INDEX "uq_cert_request" ON "certificate_requests" ("user_id", "studio_course_slug", "cert_type");
