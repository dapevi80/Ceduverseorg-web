import type { Express } from "express";
import multer from "multer";
import { requireAuth, optionalAuth } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { coursePlaybooks, playbookEvidence, teamUsers, users, profiles } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { r2Storage } from "../services/r2-storage";
import { buildPlaybook } from "../playbook-generator";
import { renderPlaybookPdf } from "../playbook-pdf";
import { isPlaybookComplete, playbookProgress } from "@shared/playbook-progress";
import { PLAYBOOK_EVIDENCE_POINTS, PLAYBOOK_COMPLETION_BONUS } from "@shared/playbook-points";
import { getEmpresaTeam } from "./empresa";
import { EVIDENCE_MAX_MB, isImageMimetype, validateEvidenceFile, shouldAwardCompletionBonus } from "../lib/playbook-upload";

const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EVIDENCE_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isImageMimetype(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se aceptan imágenes"));
  },
});

/** Wraps multer's single-file upload so file-filter/size-limit failures come back as an
 * explicit 4xx instead of falling through to the app's generic 500 error handler
 * (multer.MulterError doesn't set err.status, so it would otherwise 500 — see
 * [[feedback_no_silent_degradation]]). */
function handleEvidenceUpload(req: any, res: any, next: any) {
  evidenceUpload.single("photo")(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: `La foto no puede pesar más de ${EVIDENCE_MAX_MB}MB` });
    }
    const message = err instanceof Error ? err.message : "Archivo inválido";
    return res.status(400).json({ message });
  });
}

async function getOrGeneratePlaybook(slug: string) {
  const [existing] = await db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, slug));
  if (existing) return existing;
  await buildPlaybook(slug);
  const [created] = await db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, slug));
  return created;
}

export function registerPlaybookRoutes(app: Express) {
  app.get("/api/playbook/:slug", optionalAuth, async (req, res, next) => {
    try {
      const slug = String(req.params.slug);
      const course = await storage.getStudioCourse(slug);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const playbook = await getOrGeneratePlaybook(slug);
      if (!playbook) return res.status(503).json({ message: "No se pudo generar el playbook. Intenta de nuevo en unos minutos." });

      const exercises = playbook.exercises as { index: number; title: string; instruction: string }[];

      let evidenceByExercise: Record<number, { count: number; photoUrls: string[] }> = {};
      let progress = playbookProgress(exercises.length, []);

      if (req.supabaseUserId) {
        // Privacidad: solo la evidencia del usuario que hace la petición (nunca de otros
        // alumnos) — WHERE userId = req.supabaseUserId AND courseSlug = slug.
        const rows = await db.select().from(playbookEvidence)
          .where(and(eq(playbookEvidence.userId, req.supabaseUserId), eq(playbookEvidence.courseSlug, slug)));
        for (const row of rows) {
          const bucket = evidenceByExercise[row.exerciseIndex] || { count: 0, photoUrls: [] };
          bucket.count += 1;
          bucket.photoUrls.push(row.photoUrl);
          evidenceByExercise[row.exerciseIndex] = bucket;
        }
        progress = playbookProgress(exercises.length, rows.map((r) => r.exerciseIndex));
      }

      res.json({
        course: { slug: course.slug, title: course.title, icon: course.icon },
        playbook: {
          content: playbook.content,
          exercises,
          references: playbook.references,
          generatedAt: playbook.generatedAt,
        },
        evidenceByExercise,
        progress,
      });
    } catch (err) { next(err); }
  });

  app.post("/api/playbook/:slug/ejercicio/:n/evidencia", requireAuth, handleEvidenceUpload, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String(req.params.slug);
      const exerciseIndex = Number(req.params.n);
      if (!Number.isFinite(exerciseIndex) || exerciseIndex < 0) return res.status(400).json({ message: "Ejercicio inválido" });

      const fileCheck = validateEvidenceFile(req.file);
      if (!fileCheck.ok) return res.status(400).json({ message: fileCheck.message });

      const [playbook] = await db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, slug));
      if (!playbook) return res.status(404).json({ message: "Playbook no encontrado" });
      const exercises = playbook.exercises as { index: number; title: string; instruction: string }[];
      if (exerciseIndex >= exercises.length) return res.status(400).json({ message: "Ejercicio inválido" });

      if (!r2Storage.isConfigured) {
        return res.status(503).json({ message: "Almacenamiento de evidencia no configurado" });
      }

      // Sube primero, inserta después: si el upload falla, la excepción se propaga a
      // next(err) (500 explícito) y NUNCA se crea una fila de evidencia apuntando a un
      // archivo que no se guardó ([[feedback_no_silent_degradation]]).
      const key = `evidence/${slug}/${userId}/${exerciseIndex}-${Date.now()}.jpg`;
      const photoUrl = await r2Storage.uploadBuffer(req.file!.buffer, key, req.file!.mimetype);

      const [evidence] = await db.insert(playbookEvidence).values({
        userId,
        courseSlug: slug,
        exerciseIndex,
        photoUrl,
        points: PLAYBOOK_EVIDENCE_POINTS,
      }).returning();

      const allEvidence = await db.select().from(playbookEvidence)
        .where(and(eq(playbookEvidence.userId, userId), eq(playbookEvidence.courseSlug, slug)));
      const complete = isPlaybookComplete(exercises.length, allEvidence.map((r) => r.exerciseIndex));

      let bonusAwarded = false;
      if (complete) {
        const achSlug = `playbook-${slug}`;
        const playbookCourse = await storage.getStudioCourse(slug);
        let achievement = await storage.getAchievementBySlug(achSlug);
        if (!achievement) {
          achievement = await storage.createAchievement({
            slug: achSlug,
            name: `Playbook completado: ${playbookCourse?.title || slug}`,
            shortDescription: "Completaste todos los ejercicios de campo del Playbook",
            description: "Aplicaste en tu trabajo real todos los ejercicios de campo del Playbook del curso, documentados con evidencia fotográfica.",
            category: "Academy",
            value: PLAYBOOK_COMPLETION_BONUS,
            icon: "flame",
          });
        }
        const alreadyAwarded = (await storage.getUserAchievements(userId))
          .some((a) => a.achievementId === achievement.id);
        // Dedupe: el bono se otorga a lo más una vez por usuario+curso — volver a
        // subir evidencia (p.ej. re-subir un ejercicio ya completado) nunca lo repite.
        if (shouldAwardCompletionBonus(complete, alreadyAwarded)) {
          await storage.awardAchievement({
            userId,
            achievementId: achievement.id,
            isActive: true,
            status: "active",
            certType: "diploma",
          });
          bonusAwarded = true;
        }
      }

      res.status(201).json({
        evidence: { exerciseIndex: evidence.exerciseIndex, photoUrl: evidence.photoUrl, points: evidence.points, createdAt: evidence.createdAt },
        pointsAwarded: PLAYBOOK_EVIDENCE_POINTS,
        completed: complete,
        bonusAwarded,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/playbook/:slug/album", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String(req.params.slug);
      // Privacidad: SOLO la evidencia del usuario autenticado (WHERE userId = userId),
      // nunca la de otros alumnos — este endpoint es el "álbum" personal.
      const rows = await db.select().from(playbookEvidence)
        .where(and(eq(playbookEvidence.userId, userId), eq(playbookEvidence.courseSlug, slug)))
        .orderBy(playbookEvidence.createdAt);
      res.json({
        evidence: rows.map((r) => ({ exerciseIndex: r.exerciseIndex, photoUrl: r.photoUrl, points: r.points, createdAt: r.createdAt })),
      });
    } catch (err) { next(err); }
  });

  app.get("/api/playbook/:slug/export.pdf", optionalAuth, async (req, res, next) => {
    try {
      const slug = String(req.params.slug);
      const course = await storage.getStudioCourse(slug);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const playbook = await getOrGeneratePlaybook(slug);
      if (!playbook) return res.status(503).json({ message: "No se pudo generar el playbook" });

      const pdf = await renderPlaybookPdf(
        { content: playbook.content as any, exercises: playbook.exercises as any, references: playbook.references as any },
        { slug: course.slug, title: course.title, icon: course.icon },
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="playbook-${slug}.pdf"`);
      res.send(pdf);
    } catch (err) { next(err); }
  });

  // Empresa/admin: evidencia del equipo. Nunca pública — gateado a admin/empresa_rh
  // del propio equipo (getEmpresaTeam, mismo criterio que el resto del panel empresa).
  // Sin equipo → 403, JAMÁS fallback a "todas las evidencias".
  app.get("/api/empresa/playbook-evidencias", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      const members = await db.select({ userId: teamUsers.userId })
        .from(teamUsers).where(eq(teamUsers.teamId, team.id));
      const memberIds = members.map((m) => m.userId);
      if (memberIds.length === 0) return res.json({ team: { id: team.id, name: team.name }, evidence: [] });

      // Privacidad: SOLO evidencia de userIds que son miembros de team.id (obtenido de
      // getEmpresaTeam, ligado al propio equipo del solicitante) — WHERE userId IN memberIds.
      const rows = await db.select({
        userId: playbookEvidence.userId,
        courseSlug: playbookEvidence.courseSlug,
        exerciseIndex: playbookEvidence.exerciseIndex,
        photoUrl: playbookEvidence.photoUrl,
        points: playbookEvidence.points,
        createdAt: playbookEvidence.createdAt,
        fullName: profiles.fullName,
        email: users.email,
      })
        .from(playbookEvidence)
        .innerJoin(users, eq(playbookEvidence.userId, users.id))
        .leftJoin(profiles, eq(profiles.id, playbookEvidence.userId))
        .where(inArray(playbookEvidence.userId, memberIds))
        .orderBy(playbookEvidence.createdAt);

      res.json({ team: { id: team.id, name: team.name }, evidence: rows });
    } catch (err) { next(err); }
  });
}
