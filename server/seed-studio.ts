import { db } from "./db";
import { studioCourses, studioModules, studioQuizzes } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { studioCourseMeta } from "./data/studio-courses-meta";

async function getVideoUrlsForSlug(slug: string): Promise<string[] | undefined> {
  const { videoUrls } = await import("./data/video-urls");
  return videoUrls[slug];
}

async function getModulesForSlug(slug: string): Promise<any[] | undefined> {
  const { yuridiaModules } = await import("./data/yuridia-courses");
  if (yuridiaModules[slug]) return yuridiaModules[slug];
  const { medinaModules } = await import("./data/medina-modules");
  if (medinaModules[slug]) return medinaModules[slug];
  const { procadistModules } = await import("./data/procadist-modules");
  if (procadistModules[slug]) return procadistModules[slug];
  const { procadistModulesPart2 } = await import("./data/procadist-part2");
  if (procadistModulesPart2[slug]) return procadistModulesPart2[slug];
  return undefined;
}

async function getQuizForSlug(slug: string): Promise<any | undefined> {
  const { yuridiaQuizzes } = await import("./data/yuridia-quizzes");
  if (yuridiaQuizzes[slug]) return yuridiaQuizzes[slug];
  const { medinaQuizzes } = await import("./data/medina-quizzes");
  if (medinaQuizzes[slug]) return medinaQuizzes[slug];
  const { procadistQuizzes } = await import("./data/procadist-quizzes");
  if (procadistQuizzes[slug]) return procadistQuizzes[slug];
  try {
    const { procadistQuizzesPart2 } = await import("./data/procadist-part2");
    if (procadistQuizzesPart2 && procadistQuizzesPart2[slug]) return procadistQuizzesPart2[slug];
  } catch {}
  return undefined;
}

export async function seedStudioCourses() {
  console.log("Seeding Studio courses...");
  let coursesCreated = 0;
  let modulesCreated = 0;
  let quizzesCreated = 0;

  for (const meta of studioCourseMeta) {
    const existing = await db.select().from(studioCourses).where(eq(studioCourses.slug, meta.slug));
    let courseId: string;

    if (existing.length > 0) {
      courseId = existing[0].id;
      console.log(`  ↳ Course "${meta.slug}" already exists, skipping course insert`);
      if (!existing[0].instructor && meta.instructor) {
        await db.update(studioCourses)
          .set({ instructor: meta.instructor })
          .where(eq(studioCourses.id, courseId));
        console.log(`  ✓ Backfilled instructor for "${meta.slug}": ${meta.instructor}`);
      }
    } else {
      const [course] = await db.insert(studioCourses).values({
        slug: meta.slug,
        title: meta.title,
        description: meta.description,
        category: meta.category,
        subcategory: meta.subcategory,
        durationMinutes: meta.durationMinutes,
        level: meta.level,
        tags: meta.tags,
        dc3Available: meta.dc3Available,
        icon: meta.icon,
        color: meta.color,
        source: meta.source,
        instructor: meta.instructor,
      }).returning();
      courseId = course.id;
      coursesCreated++;
      console.log(`  ✓ Created course: ${meta.title}`);
    }

    const modules = await getModulesForSlug(meta.slug);
    const videoUrlsList = await getVideoUrlsForSlug(meta.slug);
    if (modules && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        const videoUrl = videoUrlsList?.[i] || mod.videoUrl || null;
        const existingMod = await db.select().from(studioModules).where(
          eq(studioModules.courseId, courseId)
        );
        const existingModule = existingMod.find(m => m.moduleIndex === i);
        if (!existingModule) {
          await db.insert(studioModules).values({
            courseId,
            moduleIndex: i,
            title: mod.title,
            description: mod.description || "",
            contentHtml: mod.contentHtml,
            references: mod.references || [],
            durationMinutes: mod.durationMinutes || 15,
            videoUrl,
          });
          modulesCreated++;
        } else if (videoUrl && !existingModule.videoUrl) {
          await db.update(studioModules)
            .set({ videoUrl })
            .where(and(eq(studioModules.courseId, courseId), eq(studioModules.moduleIndex, i)));
        }
      }
    } else {
      console.log(`  ⚠ No modules found for ${meta.slug}`);
    }

    const quiz = await getQuizForSlug(meta.slug);
    if (quiz) {
      const existingQuiz = await db.select().from(studioQuizzes).where(eq(studioQuizzes.courseId, courseId));
      if (existingQuiz.length === 0) {
        await db.insert(studioQuizzes).values({
          courseId,
          title: quiz.title,
          passingScore: quiz.passingScore || 70,
          questions: quiz.questions,
        });
        quizzesCreated++;
      }
    } else {
      console.log(`  ⚠ No quiz found for ${meta.slug}`);
    }
  }

  console.log(`\nSeed complete: ${coursesCreated} courses, ${modulesCreated} modules, ${quizzesCreated} quizzes created.`);
}

const isMainModule = process.argv[1]?.endsWith("seed-studio.ts") || process.argv[1]?.endsWith("seed-studio.js");
if (isMainModule) {
  seedStudioCourses().then(() => process.exit(0)).catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}
