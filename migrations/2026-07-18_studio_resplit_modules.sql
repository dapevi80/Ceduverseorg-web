-- One-off (SOLO Studio): re-partir los módulos gigantes de los cursos medina/yuridia.
--
-- Contexto: server/seed-studio.ts::getModulesForSlug ahora parte el contentHtml gigante
-- por <h2> (medina) / <h3> (yuridia) en varios módulos sustanciales. Pero seed-studio.ts
-- NO reescribe módulos existentes (solo inserta los índices faltantes), así que hay que
-- BORRAR los studio_modules viejos (el módulo gigante único) para que el boot los
-- re-siembre YA PARTIDOS.
--
-- SEGURIDAD: este script SOLO toca tablas del Studio (studio_modules, generated_content).
-- NUNCA toca course_modules → el Aula Virtual y sus 29 MP3 pre-generados quedan intactos.
--
-- ORDEN DE EJECUCIÓN (importante):
--   1) Manual Deploy del código nuevo (para que el seed ya traiga el splitter).
--   2) Correr este SQL en Supabase.
--   3) Manual Deploy / reiniciar el servicio otra vez → seedStudioCourses() re-inserta
--      los módulos ya partidos.

-- 1) Borrar los módulos del Studio de las familias medina/yuridia.
--    En el siguiente boot, getModulesForSlug los devuelve partidos y el seed los re-inserta.
DELETE FROM studio_modules
WHERE course_id IN (
  SELECT id FROM studio_courses WHERE source IN ('medina', 'yuridia')
);

-- 2) Borrar el contenido/audio personalizado viejo de esos cursos: se generó del módulo
--    gigante (moduleIndex 0) y ya no coincide con la nueva estructura de módulos.
--    Se regenera por módulo, más corto y barato, al empezar el curso.
DELETE FROM generated_content
WHERE course_slug IN (
  SELECT slug FROM studio_courses WHERE source IN ('medina', 'yuridia')
);
