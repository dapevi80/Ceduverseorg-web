// Pre-genera el Playbook de uno o todos los cursos del Studio (spec 2026-07-18).
// Se corre una sola vez por curso — buildPlaybook() ya persiste en course_playbooks,
// así que reintentar es seguro (upsert). También asegura que exista el logro
// "playbook-<slug>" de antemano (el endpoint de evidencia igual lo crea al vuelo
// si falta — ver server/routes/playbook.ts — esto es solo para tenerlo listo
// antes de que el primer alumno complete el curso).
//
// Uso:
//   npx tsx server/generate-playbooks.ts            # todos los cursos del Studio
//   npx tsx server/generate-playbooks.ts <slug>      # un solo curso

import { storage } from "./storage";
import { buildPlaybook } from "./playbook-generator";
import { PLAYBOOK_COMPLETION_BONUS } from "@shared/playbook-points";
import { achievementSlugFor, selectEligibleCourses } from "./lib/generate-playbooks-logic";

async function main() {
  const onlySlug = process.argv[2];
  const singleCourse = onlySlug ? await storage.getStudioCourse(onlySlug) : undefined;
  const allCourses = onlySlug ? [] : (await storage.getStudioCourses({ limit: 1000 })).courses;
  const courses = selectEligibleCourses(onlySlug, singleCourse, allCourses);

  if (courses.length === 0) {
    console.error(onlySlug ? `Curso no encontrado: ${onlySlug}` : "No hay cursos en studio_courses.");
    process.exit(1);
  }

  console.log(`Generando playbook para ${courses.length} curso(s)...`);
  let ok = 0;
  let failed = 0;

  for (const course of courses) {
    try {
      await buildPlaybook(course.slug);

      const achSlug = achievementSlugFor(course.slug);
      const existing = await storage.getAchievementBySlug(achSlug);
      if (!existing) {
        await storage.createAchievement({
          slug: achSlug,
          name: `Playbook completado: ${course.title}`,
          shortDescription: "Completaste todos los ejercicios de campo del Playbook",
          description: `Aplicaste en tu trabajo real todos los ejercicios de campo del Playbook del curso "${course.title}", documentados con evidencia fotográfica.`,
          category: "Academy",
          value: PLAYBOOK_COMPLETION_BONUS,
          icon: "flame",
        });
      }

      console.log(`  OK   ${course.slug}`);
      ok++;
    } catch (err: any) {
      console.error(`  FAIL ${course.slug}: ${err?.message}`);
      failed++;
    }
  }

  console.log(`Listo: ${ok} ok, ${failed} fallidos.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[generate-playbooks] Error fatal:", err);
  process.exit(1);
});
