import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, optionalAuth, requireAdmin } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import {
  isPoisonedGeneration,
  resolveGenerationStatus,
  shouldServeCache,
  hasReachedFailureCeiling,
  canAutoRetry,
  nextRetryAt,
  canManualRegenerate,
  manualRegenerateWaitMs,
} from "../lib/generation-retry";
import path from "path";
import fs from "fs";
import {
  submitStudioQuiz,
  type StudioQuizSubmitDeps,
  type StoredQuiz,
} from "../lib/studio-quiz-submit";
import { DEFAULT_PASSING_SCORE, type GradableQuestion } from "@shared/quiz-grading";
import {
  insertCourseSchema,
  insertAchievementSchema,
  insertCourseUserSchema,
  insertLeadSchema,
  insertTeamSchema,
  insertTeamUserSchema,
  courses,
  courseUsers,
  achievements,
  achievementUsers,
  learningInterests,
  academyCoursesCache,
  studioCourses,
  accounts,
  teams,
  referralCodes,
} from "@shared/schema";
import { eq, and, sql, count, desc } from "drizzle-orm";
import { sendKitEmail } from "../email";
import { getInitialsFromName } from "./helpers";
import { getEffectiveRole } from "../lib/effective-role";
import { computeCertStatus } from "../lib/cert-status";

// Public lead form — anonymous, low-volume in legitimate use.
// 5 leads / IP / hour is generous for a real prospect (typically 1) and blocks scrapers.
const leadFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta en una hora." },
});

// A 'generating' row older than this is considered stale (e.g. process restarted
// mid-generation) and may be re-triggered instead of blocking forever.
const STALE_GENERATION_MS = 10 * 60 * 1000;

// Runs the (slow, ~3-5 min) module content generation off the request path. The
// HTTP handler returns a 'generating' placeholder immediately and the client polls;
// this writes the final content (or marks 'failed') when Claude returns.
async function runModuleGeneration(
  userId: string,
  slug: string,
  moduleIndex: number,
  result: NonNullable<Awaited<ReturnType<typeof storage.getStudioModuleBySlugAndIndex>>>,
  profile: Awaited<ReturnType<typeof storage.getStudentProfile>>,
  // Consecutive failures already on record *before* this attempt — 0 on a
  // fresh/never-failed module. Success resets to 0; failure increments it,
  // which is what drives next attempt's backoff (generation-retry.ts).
  previousConsecutiveFailures: number,
): Promise<void> {
  try {
    const { generateModuleContent } = await import("../ai-engine");
    const generated = await generateModuleContent(
      result.module.title,
      result.module.contentHtml,
      profile ? {
        jobTitle: profile.jobTitle || undefined,
        industry: profile.industry || undefined,
        companySize: profile.companySize || undefined,
        experienceLevel: profile.experienceLevel || undefined,
        learningGoals: profile.learningGoals || undefined,
        preferredStyle: profile.preferredStyle || undefined,
      } : null,
      result.course.title,
      result.module.description || undefined,
      result.module.references ? (result.module.references as string[]).join("; ") : undefined,
      { userId, courseSlug: slug, moduleIndex },
    );
    // ai-engine.ts swallows every internal failure (missing key, 401, 429,
    // truncation, timeout) and returns a stub instead of throwing — so this
    // `try` normally completes even when generation actually failed. The
    // stub IS the failure signal; the outer `catch` below only fires for
    // something unrelated blowing up (e.g. storage.saveGeneratedContent
    // itself, or getStudentProfile earlier in the caller). Both cases must
    // count towards the same consecutive-failure streak.
    const isFailure = generated.isStub === true;
    await storage.saveGeneratedContent({
      userId,
      courseSlug: slug,
      moduleIndex,
      lectureHtml: generated.lectureHtml,
      mindMap: generated.mindMap,
      reflections: generated.reflections,
      adaptiveQuiz: generated.adaptiveQuiz,
      suggestedSources: generated.suggestedSources,
      classScript: generated.classScript || null,
      personalizedFor: profile ? { jobTitle: profile.jobTitle, industry: profile.industry } : null,
      // 'complete' exige quiz Y guion: sin classScript la ruta /audio responde
      // 404 no_script, así que marcarla 'complete' sería mentir en la BD.
      generationStatus: resolveGenerationStatus({
        isStub: generated.isStub === true,
        quizCount: generated.adaptiveQuiz?.length ?? 0,
        hasClassScript: !!generated.classScript,
      }),
      isStub: generated.isStub || false,
      consecutiveFailures: isFailure ? previousConsecutiveFailures + 1 : 0,
    });
    console.log(
      `[studio-gen] ${slug}#${moduleIndex} ${isFailure ? "failed (stub)" : "done"} ` +
      `(stub=${generated.isStub === true}, consecutiveFailures=${isFailure ? previousConsecutiveFailures + 1 : 0})`,
    );
  } catch (err: any) {
    const consecutiveFailures = previousConsecutiveFailures + 1;
    console.error(
      `[studio-gen] ${slug}#${moduleIndex} (user=${userId}) background generation failed ` +
      `[status=${err?.status ?? "n/a"} type=${err?.error?.type ?? err?.name ?? "n/a"} ` +
      `request_id=${err?.request_id ?? "n/a"}] (consecutiveFailures=${consecutiveFailures}): ${err?.message}`,
      err?.stack,
    );
    try {
      await storage.saveGeneratedContent({
        userId, courseSlug: slug, moduleIndex,
        lectureHtml: null, mindMap: null, reflections: [], adaptiveQuiz: null,
        suggestedSources: null, classScript: null, personalizedFor: null,
        generationStatus: "failed", isStub: true,
        consecutiveFailures,
      });
    } catch (saveErr: any) {
      // El .catch(() => {}) anterior se tragaba incluso el fallo de guardar: la
      // fila se quedaba en 'generating' y el cliente hacía poll hasta el timeout
      // de STALE_GENERATION_MS sin que nadie supiera por qué.
      console.error(
        `[studio-gen] ${slug}#${moduleIndex} (user=${userId}) NO se pudo persistir el estado 'failed'; ` +
        `la fila queda en 'generating' hasta que expire (${STALE_GENERATION_MS}ms): ${saveErr?.message}`,
        saveErr?.stack,
      );
    }
  }
}

export function registerCourseRoutes(app: Express) {
  app.get("/api/courses", async (_req, res, next) => {
    try {
      const courses = await storage.listCourses();
      res.json(courses);
    } catch (err) { next(err); }
  });

  app.get("/api/courses/:id", async (req, res, next) => {
    try {
      const id = String((req.params.id as string));
      const course = await storage.getCourse(id);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      res.json(course);
    } catch (err) { next(err); }
  });

  app.post("/api/courses", requireAdmin, async (req, res, next) => {
    try {
      const parsed = insertCourseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const course = await storage.createCourse(parsed.data);
      res.status(201).json(course);
    } catch (err) { next(err); }
  });

  app.patch("/api/courses/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = String((req.params.id as string));
      const course = await storage.updateCourse(id, req.body);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      res.json(course);
    } catch (err) { next(err); }
  });

  app.delete("/api/courses/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = String((req.params.id as string));
      const deleted = await storage.deleteCourse(id);
      if (!deleted) return res.status(404).json({ message: "Curso no encontrado" });
      res.json({ message: "Curso eliminado" });
    } catch (err) { next(err); }
  });

  app.get("/api/achievements", async (_req, res, next) => {
    try {
      const achievements = await storage.listAchievements();
      res.json(achievements);
    } catch (err) { next(err); }
  });

  app.post("/api/achievements", requireAdmin, async (req, res, next) => {
    try {
      const parsed = insertAchievementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const achievement = await storage.createAchievement(parsed.data);
      res.status(201).json(achievement);
    } catch (err) { next(err); }
  });

  app.get("/api/teams", requireAuth, async (_req, res, next) => {
    try {
      const teams = await storage.listTeams();
      res.json(teams);
    } catch (err) { next(err); }
  });

  app.post("/api/teams", requireAuth, async (req, res, next) => {
    try {
      const parsed = insertTeamSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const team = await storage.createTeam(parsed.data);
      res.status(201).json(team);
    } catch (err) { next(err); }
  });

  app.get("/api/teams/:id/members", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const members = await storage.getTeamMembers(teamId);
      const isMember = members.some(m => m.userId === req.supabaseUserId!);
      if (!isMember) {
        return res.status(403).json({ message: "No tienes permisos en este equipo" });
      }
      res.json(members);
    } catch (err) { next(err); }
  });

  app.post("/api/teams/:id/members", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const currentMembers = await storage.getTeamMembers(teamId);
      const isTeamMember = currentMembers.some(m => m.userId === req.supabaseUserId!);
      if (!isTeamMember) {
        return res.status(403).json({ message: "No tienes permisos en este equipo" });
      }
      const data = { ...req.body, teamId };
      const parsed = insertTeamUserSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const member = await storage.addTeamMember(parsed.data);
      res.status(201).json(member);
    } catch (err) { next(err); }
  });

  app.delete("/api/teams/:id/members/:userId", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const targetUserId = String((req.params.userId as string));
      const currentMembers = await storage.getTeamMembers(teamId);
      const callerMembership = currentMembers.find(m => m.userId === req.supabaseUserId!);
      if (!callerMembership) {
        return res.status(403).json({ message: "No tienes permisos en este equipo" });
      }
      const removed = await storage.removeTeamMember(teamId, targetUserId);
      if (!removed) return res.status(404).json({ message: "Miembro no encontrado" });
      res.json({ message: "Miembro eliminado" });
    } catch (err) { next(err); }
  });

  app.get("/api/me/courses", requireAuth, async (req, res, next) => {
    try {
      const courses = await storage.getUserCourses(req.supabaseUserId!);
      res.json(courses);
    } catch (err) { next(err); }
  });

  app.post("/api/me/courses", requireAuth, async (req, res, next) => {
    try {
      const data = { ...req.body, userId: req.supabaseUserId! };
      const parsed = insertCourseUserSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const enrollment = await storage.enrollCourse(parsed.data);
      res.status(201).json(enrollment);
    } catch (err) { next(err); }
  });

  app.patch("/api/me/courses/:courseId", requireAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.courseId as string));
      const { completed } = req.body;
      if (typeof completed !== "number" || completed < 0 || completed > 100) {
        return res.status(400).json({ message: "El progreso debe ser un número entre 0 y 100" });
      }
      if (completed > 0) {
        const modules = await storage.getCourseModules(courseId);
        // Solo exigimos el audio cuando el cliente realmente puede rastrearlo:
        // el reproductor STPS monta el audio del primer módulo y NO monta cuando
        // el curso tiene video HeyGen. Si exigiéramos audio en cursos con video,
        // listeningProgress nunca subiría y el 403 bloquearía el progreso para siempre.
        const hasTrackedAudio = !!modules[0]?.audioUrl && !modules.some(m => !!m.heygenVideoUrl);
        if (hasTrackedAudio) {
          const userCourses = await storage.getUserCourses(req.supabaseUserId!);
          const enrollment = userCourses.find(uc => uc.courseId === courseId);
          if (enrollment && (enrollment.listeningProgress || 0) < 95) {
            return res.status(403).json({ message: "Debes escuchar al menos el 95% del audio antes de marcar secciones como completadas" });
          }
        }
      }
      const record = await storage.updateCourseProgress(req.supabaseUserId!, courseId, completed);
      if (!record) return res.status(404).json({ message: "Inscripción no encontrada" });

      if (completed === 100) {
        try {
          const userId = req.supabaseUserId!;
          const [courseRow] = await db.select().from(courses).where(eq(courses.id, courseId));
          if (courseRow?.slug) {
            const achievementSlug = `logro-${courseRow.slug}`;
            const [achievement] = await db.select().from(achievements).where(eq(achievements.slug, achievementSlug));
            if (achievement) {
              const [existing] = await db.select().from(achievementUsers)
                .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, achievement.id), eq(achievementUsers.certType, "diploma")));
              if (!existing) {
                await db.insert(achievementUsers).values({ userId, achievementId: achievement.id, status: "active", certType: "diploma", isActive: true });
              }
            }
            const [primerCurso] = await db.select().from(achievements).where(eq(achievements.slug, "primer-curso"));
            if (primerCurso) {
              const [ep] = await db.select().from(achievementUsers).where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, primerCurso.id)));
              if (!ep) await db.insert(achievementUsers).values({ userId, achievementId: primerCurso.id, status: "active", certType: "diploma", isActive: true });
            }
          }
        } catch (err) {
          console.error("[course-progress] Error granting achievements:", err);
        }
      }

      res.json(record);
    } catch (err) { next(err); }
  });

  const listeningRateLimit = new Map<string, number>();
  app.patch("/api/me/courses/:courseId/listening", requireAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.courseId as string));
      const userId = req.supabaseUserId!;
      const { listeningProgress } = req.body;
      if (typeof listeningProgress !== "number" || listeningProgress < 0 || listeningProgress > 100) {
        return res.status(400).json({ message: "El progreso de escucha debe ser un número entre 0 y 100" });
      }
      const rateKey = `${userId}:${courseId}`;
      const now = Date.now();
      const lastUpdate = listeningRateLimit.get(rateKey) || 0;
      if (now - lastUpdate < 3000) {
        return res.status(429).json({ message: "Demasiadas actualizaciones. Espera unos segundos." });
      }
      listeningRateLimit.set(rateKey, now);
      const userCourses = await storage.getUserCourses(userId);
      const enrollment = userCourses.find(uc => uc.courseId === courseId);
      if (!enrollment) return res.status(404).json({ message: "Inscripción no encontrada" });
      const currentPct = enrollment.listeningProgress || 0;
      const maxIncrement = 5;
      const newPct = Math.min(100, Math.max(currentPct, Math.min(listeningProgress, currentPct + maxIncrement)));
      if (newPct <= currentPct) {
        if (currentPct >= 95 && (enrollment.completed || 0) < 100) {
          try {
            await storage.updateCourseProgress(userId, courseId, 100);
            const [courseRow] = await db.select().from(courses).where(eq(courses.id, courseId));
            if (courseRow?.slug) {
              const achievementSlug = `logro-${courseRow.slug}`;
              const [achievement] = await db.select().from(achievements).where(eq(achievements.slug, achievementSlug));
              if (achievement) {
                const [existing] = await db.select().from(achievementUsers)
                  .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, achievement.id), eq(achievementUsers.certType, "diploma")));
                if (!existing) {
                  await db.insert(achievementUsers).values({ userId, achievementId: achievement.id, status: "active", certType: "diploma", isActive: true });
                }
              }
              const [primerCurso] = await db.select().from(achievements).where(eq(achievements.slug, "primer-curso"));
              if (primerCurso) {
                const [ep] = await db.select().from(achievementUsers).where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, primerCurso.id)));
                if (!ep) await db.insert(achievementUsers).values({ userId, achievementId: primerCurso.id, status: "active", certType: "diploma", isActive: true });
              }
            }
            return res.json({ ...enrollment, completed: 100, autoCompleted: true });
          } catch (err) {
            console.error("[listening] Error retroactive auto-complete:", err);
          }
        }
        return res.json(enrollment);
      }
      const record = await storage.updateListeningProgress(userId, courseId, newPct);
      if (!record) return res.status(404).json({ message: "Inscripción no encontrada" });

      const currentCompleted = enrollment.completed || 0;
      const crossedThreshold = newPct >= 95 && currentCompleted < 100;
      if (crossedThreshold) {
        try {
          await storage.updateCourseProgress(userId, courseId, 100);

          const [courseRow] = await db.select().from(courses).where(eq(courses.id, courseId));
          if (courseRow?.slug) {
            const achievementSlug = `logro-${courseRow.slug}`;
            const [achievement] = await db.select().from(achievements).where(eq(achievements.slug, achievementSlug));
            if (achievement) {
              const [existing] = await db.select().from(achievementUsers)
                .where(and(
                  eq(achievementUsers.userId, userId),
                  eq(achievementUsers.achievementId, achievement.id),
                  eq(achievementUsers.certType, "diploma")
                ));
              if (!existing) {
                await db.insert(achievementUsers).values({
                  userId,
                  achievementId: achievement.id,
                  status: "active",
                  certType: "diploma",
                  isActive: true,
                });
              }
            }

            const [primerCurso] = await db.select().from(achievements).where(eq(achievements.slug, "primer-curso"));
            if (primerCurso) {
              const [existingPrimer] = await db.select().from(achievementUsers)
                .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, primerCurso.id)));
              if (!existingPrimer) {
                await db.insert(achievementUsers).values({
                  userId,
                  achievementId: primerCurso.id,
                  status: "active",
                  certType: "diploma",
                  isActive: true,
                });
              }
            }
          }
        } catch (err) {
          console.error("[listening] Error auto-completing course:", err);
        }
      }

      res.json({ ...record, autoCompleted: crossedThreshold });
    } catch (err) { next(err); }
  });

  app.delete("/api/me/courses/:courseId", requireAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.courseId as string));
      const removed = await storage.unenrollCourse(req.supabaseUserId!, courseId);
      if (!removed) return res.status(404).json({ message: "Inscripción no encontrada" });
      res.json({ message: "Desinscrito del curso" });
    } catch (err) { next(err); }
  });

  app.get("/api/me/achievements", requireAuth, async (req, res, next) => {
    try {
      const achievements = await storage.getUserAchievements(req.supabaseUserId!);
      res.json(achievements);
    } catch (err) { next(err); }
  });

  app.get("/api/me/profile", requireAuth, async (req, res, next) => {
    try {
      const profile = await storage.getProfile(req.supabaseUserId!);
      if (!profile) return res.status(404).json({ message: "Perfil no encontrado" });
      res.json(profile);
    } catch (err) { next(err); }
  });

  app.patch("/api/me/profile", requireAuth, async (req, res, next) => {
    try {
      const allowedFields = ["fullName", "country", "city", "phoneNumber", "walletAddress", "interest", "genre"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      const profile = await storage.updateProfile(req.supabaseUserId!, updates);
      if (!profile) return res.status(404).json({ message: "Perfil no encontrado" });
      const existingCard = await storage.getContactCardByUserId(req.supabaseUserId!);
      if (existingCard) {
        const cardUpdates: Record<string, any> = {};
        if (updates.phoneNumber !== undefined) cardUpdates.phone = updates.phoneNumber;
        if (updates.fullName !== undefined) {
          cardUpdates.displayName = updates.fullName;
          cardUpdates.avatarInitials = getInitialsFromName(updates.fullName);
        }
        if (Object.keys(cardUpdates).length > 0) {
          storage.updateContactCard(existingCard.id, cardUpdates).catch(() => {});
        }
      }
      res.json(profile);
    } catch (err) { next(err); }
  });

  app.get("/api/me/account", requireAuth, async (req, res, next) => {
    try {
      const account = await storage.getAccount(req.supabaseUserId!);
      if (!account) return res.status(404).json({ message: "Cuenta no encontrada" });
      res.json(account);
    } catch (err) { next(err); }
  });

  app.post("/api/leads", leadFormLimiter, async (req, res, next) => {
    try {
      const parsed = insertLeadSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const lead = await storage.createLead(parsed.data);

      sendKitEmail(lead.email, lead.fullName).catch((err) => {
        console.error("[leads] Failed to send kit email:", err.message);
      });

      res.status(201).json(lead);
    } catch (err) { next(err); }
  });

  app.get("/api/me/teams", requireAuth, async (req, res, next) => {
    try {
      const userTeams = await storage.getUserTeams(req.supabaseUserId!);
      res.json(userTeams);
    } catch (err) { next(err); }
  });

  app.post("/api/me/team", requireAuth, async (req, res, next) => {
    try {
      const { name, description, industry, collaborators, rfc, razonSocial, regimenFiscal, codigoPostalFiscal } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "El nombre de la organización es requerido" });
      }
      const teamId = `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const teamDesc = [
        description || "",
        industry ? `Industria: ${industry}` : "",
        collaborators ? `Colaboradores: ${collaborators}` : "",
      ].filter(Boolean).join(" | ");
      const teamData: Record<string, any> = {
        id: teamId,
        name: name.trim(),
        description: teamDesc || null,
      };
      if (rfc && typeof rfc === "string" && rfc.trim().length >= 12) teamData.rfc = rfc.trim().toUpperCase();
      if (razonSocial && typeof razonSocial === "string") teamData.razonSocial = razonSocial.trim();
      if (regimenFiscal && typeof regimenFiscal === "string") teamData.regimenFiscal = regimenFiscal.trim();
      if (codigoPostalFiscal && typeof codigoPostalFiscal === "string" && codigoPostalFiscal.trim().length === 5) teamData.codigoPostalFiscal = codigoPostalFiscal.trim();
      const team = await storage.createTeam(teamData as any);
      await storage.addTeamMember({
        teamId: team.id,
        userId: req.supabaseUserId!,
        role: "admin",
      });
      res.status(201).json(team);
    } catch (err) { next(err); }
  });

  app.patch("/api/me/account", requireAuth, async (req, res, next) => {
    try {
      // Actualización crítica del onboarding: se aplica SIEMPRE, aislada del
      // referido. Antes, referredBy y accountSetup iban en el mismo UPDATE; si el
      // referido violaba el FK heredado (accounts.referred_by -> accounts.
      // referral_code, que apunta a la tabla equivocada), el 500 tumbaba también
      // el accountSetup y ATRAPABA al usuario en el onboarding.
      const coreUpdates: Record<string, any> = {};
      if (req.body.accountSetup !== undefined) {
        coreUpdates.accountSetup = req.body.accountSetup;
      }
      let account = await storage.updateAccount(req.supabaseUserId!, coreUpdates);
      if (!account) return res.status(404).json({ message: "Cuenta no encontrada" });

      // Atribución de referido: best-effort y aislada. Si falla, se registra en
      // el log pero NUNCA bloquea el onboarding. (Al corregir el FK en la BD,
      // esta misma ruta empezará a atribuir sin cambio de código.)
      if (req.body.referredBy && typeof req.body.referredBy === "string" && !account.referredBy) {
        try {
          const [ref] = await db.select().from(referralCodes).where(
            and(eq(referralCodes.code, req.body.referredBy), eq(referralCodes.isActive, true))
          );
          if (ref) {
            const updated = await storage.updateAccount(req.supabaseUserId!, { referredBy: req.body.referredBy });
            if (updated) {
              account = updated;
              // El contador solo sube si la atribución SÍ se persistió (antes se
              // inflaba en cada reintento fallido). Incremento atómico.
              await db.update(referralCodes)
                .set({ usageCount: sql`${referralCodes.usageCount} + 1` })
                .where(eq(referralCodes.id, ref.id));
            }
          }
        } catch (refErr) {
          console.error("Atribución de referido falló (no bloquea el onboarding):", refErr);
        }
      }
      res.json(account);
    } catch (err) { next(err); }
  });

  app.get("/api/courses/:id/modules", optionalAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.id as string));
      const modules = await storage.getCourseModules(courseId);
      modules.sort((a, b) => a.order - b.order);
      if (!req.supabaseUserId) {
        const gated = modules.map((m, i) => {
          if (i === 0) return m;
          return { ...m, contentHtml: null, videoUrl: null, audioUrl: null };
        });
        return res.json(gated);
      }
      res.json(modules);
    } catch (err) { next(err); }
  });

  app.get("/api/courses/:courseId/modules/:moduleId", optionalAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.courseId as string));
      const mod = await storage.getCourseModule(String((req.params.moduleId as string)));
      if (!mod || mod.courseId !== courseId) return res.status(404).json({ message: "Módulo no encontrado" });
      if (!req.supabaseUserId) {
        const allModules = await storage.getCourseModules(courseId);
        allModules.sort((a, b) => a.order - b.order);
        const modIndex = allModules.findIndex(m => m.id === mod.id);
        if (modIndex > 0) {
          return res.status(401).json({ message: "Crea una cuenta para acceder a este módulo" });
        }
      }
      res.json(mod);
    } catch (err) { next(err); }
  });

  app.get("/api/courses/:id/quiz", optionalAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.id as string));
      const quiz = await storage.getQuizByCourse(courseId);
      if (!quiz) return res.status(404).json({ message: "Este curso aún no tiene evaluación" });
      if (!req.supabaseUserId) {
        return res.json({ quiz: { id: quiz.id, title: quiz.title, description: (quiz as any).description || null, passingScore: quiz.passingScore, timeLimit: (quiz as any).timeLimit || null }, questions: [] });
      }
      const questions = await storage.getQuizQuestions(quiz.id);
      questions.sort((a, b) => a.order - b.order);
      const safeQuestions = questions.map(q => ({
        id: q.id,
        order: q.order,
        question: q.question,
        options: q.options,
      }));
      res.json({ quiz, questions: safeQuestions });
    } catch (err) { next(err); }
  });

  app.post("/api/courses/:id/quiz/submit", requireAuth, async (req, res, next) => {
    try {
      const courseId = String((req.params.id as string));
      const userId = req.supabaseUserId!;
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Se requieren las respuestas" });
      }

      const quiz = await storage.getQuizByCourse(courseId);
      if (!quiz) return res.status(404).json({ message: "Evaluación no encontrada" });

      const questions = await storage.getQuizQuestions(quiz.id);
      questions.sort((a, b) => a.order - b.order);

      let correct = 0;
      const results = questions.map((q, i) => {
        const userAnswer = answers[i] ?? -1;
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) correct++;
        return {
          questionId: q.id,
          question: q.question,
          options: q.options,
          userAnswer,
          correctIndex: q.correctIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      const passed = score >= quiz.passingScore;

      const attempt = await storage.createQuizAttempt({
        userId,
        quizId: quiz.id,
        score,
        passed,
        answers: results,
      });

      if (passed) {
        const course = await storage.getCourse(courseId);
        if (course) {
          const achievementSlug = `logro-${course.slug}`;
          let achievement = await storage.getAchievementBySlug(achievementSlug);
          if (!achievement) {
            achievement = await storage.createAchievement({
              slug: achievementSlug,
              name: `Diploma: ${course.title}`,
              shortDescription: `Aprobó la evaluación del curso "${course.title}"`,
              description: `Diploma Digital de Participación obtenido al aprobar con éxito la evaluación del curso ${course.title}. Verificable en blockchain.`,
              category: course.areaTematica || "STPS",
              value: 1000,
              icon: "award",
            });
          }
          const existing = await storage.getUserAchievements(userId);
          const alreadyHas = existing.some(a => a.achievementId === achievement!.id);
          if (!alreadyHas) {
            const profile = await storage.getProfile(userId);
            await storage.awardAchievement({
              userId,
              achievementId: achievement.id,
              isActive: true,
              status: "active",
              contractAddress: profile?.walletAddress || null,
              tokenId: null,
            });
          }
        }
      }

      res.json({ score, passed, passingScore: quiz.passingScore, results, attemptId: attempt.id });
    } catch (err) { next(err); }
  });

  app.get("/api/me/quiz-attempts", requireAuth, async (req, res, next) => {
    try {
      const attempts = await storage.getAllUserQuizAttempts(req.supabaseUserId!);
      res.json(attempts);
    } catch (err) { next(err); }
  });
  app.get("/api/academy/courses/:id/quiz", async (req, res, next) => {
    try {
      const academyCourseId = parseInt(String((req.params.id as string)));
      if (isNaN(academyCourseId)) return res.status(400).json({ message: "ID inválido" });

      let quiz = await storage.getQuizByAcademyCourse(academyCourseId);
      if (quiz) {
        const questions = await storage.getQuizQuestions(quiz.id);
        questions.sort((a, b) => a.order - b.order);
        const safeQuestions = questions.map(q => ({
          id: q.id, order: q.order, question: q.question, options: q.options,
        }));
        return res.json({ quiz, questions: safeQuestions });
      }

      const { getCachedCurriculum, getCachedCourse } = await import("../academy-sync");
      const curriculum = await getCachedCurriculum(academyCourseId);
      if (!curriculum || !curriculum.curriculum || curriculum.curriculum.length === 0) {
        return res.status(404).json({ message: "No se pudo generar evaluación para este curso" });
      }

      const courseDetails = await getCachedCourse(academyCourseId);
      const courseTitle = courseDetails?.post_title || curriculum.title || `Curso ${academyCourseId}`;

      const units = curriculum.curriculum.filter((item: any) => item.type === "unit");
      const generatedQuestions: { question: string; options: string[]; correctIndex: number; explanation: string }[] = [];

      for (const unit of units.slice(0, 8)) {
        const title = unit.title || "";
        if (title.length < 5) continue;

        generatedQuestions.push({
          question: `¿Cuál es el tema principal del módulo "${title}"?`,
          options: [
            `Comprensión y aplicación de ${title.toLowerCase()}`,
            `Historia general de la educación`,
            `Técnicas de administración financiera`,
            `Fundamentos de programación web`,
          ],
          correctIndex: 0,
          explanation: `Este módulo se enfoca en "${title}", que es parte del curriculum del curso "${courseTitle}".`,
        });
      }

      if (generatedQuestions.length === 0) {
        return res.status(404).json({ message: "El curso no tiene suficiente contenido para generar una evaluación" });
      }

      quiz = await storage.createQuiz({
        courseId: null,
        academyCourseId,
        title: `Evaluación: ${courseTitle}`,
        description: `Evaluación generada automáticamente para el curso "${courseTitle}" de Ceduverse Academy.`,
        passingScore: 70,
        timeLimit: null,
      });

      for (let i = 0; i < generatedQuestions.length; i++) {
        const gq = generatedQuestions[i];
        await storage.createQuizQuestion({
          quizId: quiz.id,
          order: i + 1,
          question: gq.question,
          options: gq.options,
          correctIndex: gq.correctIndex,
          explanation: gq.explanation,
        });
      }

      const questions = await storage.getQuizQuestions(quiz.id);
      questions.sort((a, b) => a.order - b.order);
      const safeQuestions = questions.map(q => ({
        id: q.id, order: q.order, question: q.question, options: q.options,
      }));

      res.json({ quiz, questions: safeQuestions });
    } catch (err) { next(err); }
  });

  app.post("/api/academy/courses/:id/quiz/submit", requireAuth, async (req, res, next) => {
    try {
      const academyCourseId = parseInt(String((req.params.id as string)));
      const userId = req.supabaseUserId!;
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Se requieren las respuestas" });
      }

      const quiz = await storage.getQuizByAcademyCourse(academyCourseId);
      if (!quiz) return res.status(404).json({ message: "Evaluación no encontrada" });

      const questions = await storage.getQuizQuestions(quiz.id);
      questions.sort((a, b) => a.order - b.order);

      let correct = 0;
      const results = questions.map((q, i) => {
        const userAnswer = answers[i] ?? -1;
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) correct++;
        return {
          questionId: q.id, question: q.question, options: q.options,
          userAnswer, correctIndex: q.correctIndex, isCorrect, explanation: q.explanation,
        };
      });

      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      const passed = score >= quiz.passingScore;

      const attempt = await storage.createQuizAttempt({
        userId, quizId: quiz.id, score, passed, answers: results,
      });

      if (passed) {
        const achievementSlug = `logro-academy-${academyCourseId}`;
        let achievement = await storage.getAchievementBySlug(achievementSlug);
        if (!achievement) {
          achievement = await storage.createAchievement({
            slug: achievementSlug,
            name: `Diploma Academy: ${quiz.title.replace("Evaluación: ", "")}`,
            shortDescription: `Aprobó la evaluación del curso Academy #${academyCourseId}`,
            category: "Academy",
            value: 1000,
            icon: "graduation-cap",
          });
        }
        const existing = await storage.getUserAchievements(userId);
        const alreadyHas = existing.some(a => a.achievementId === achievement!.id);
        if (!alreadyHas) {
          const profile = await storage.getProfile(userId);
          await storage.awardAchievement({
            userId, achievementId: achievement.id, isActive: true, status: "active",
            contractAddress: profile?.walletAddress || null, tokenId: null,
          });
        }
      }

      res.json({ score, passed, passingScore: quiz.passingScore, results, attemptId: attempt.id });
    } catch (err) { next(err); }
  });

  app.get("/api/academy/courses", async (req, res, next) => {
    try {
      const { getCachedCourses } = await import("../academy-sync");
      const search = req.query.search as string | undefined;
      const rawLimit = parseInt(req.query.limit as string);
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 100;
      const rawPage = parseInt(req.query.page as string);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const result = await getCachedCourses({ search: search || undefined, page, limit });
      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/academy/courses/:id", async (req, res, next) => {
    try {
      const courseId = parseInt(String((req.params.id as string)));
      if (isNaN(courseId)) return res.status(400).json({ message: "ID de curso inválido" });
      const { getCachedCourse } = await import("../academy-sync");
      const course = await getCachedCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      res.json(course);
    } catch (err) { next(err); }
  });

  app.get("/api/academy/courses/:id/curriculum", async (req, res, next) => {
    try {
      const courseId = parseInt(String((req.params.id as string)));
      if (isNaN(courseId)) return res.status(400).json({ message: "ID de curso inválido" });

      function normalizeCurriculum(raw: any): any {
        if (!raw) return null;
        const items = raw.curriculum_items || raw.curriculum || [];
        const itemsArray = Array.isArray(items) ? items : Object.values(items);
        const curriculum = itemsArray.map((item: any, idx: number) => ({
          type: item.type || "unit",
          title: item.title || item.post_title || `Lección ${idx + 1}`,
          ID: item.id || item.ID,
          unit_type: item.unit_type || item.type,
          duration: item.duration || "",
          index: idx,
          content: item.content || item.post_content || "",
        }));
        return {
          course_id: raw.course?.id || courseId,
          title: raw.course?.title || "",
          total_items: raw.total_items || curriculum.length,
          curriculum,
        };
      }

      const { getCachedCurriculum } = await import("../academy-sync");
      const rawCurriculum = await getCachedCurriculum(courseId);
      if (!rawCurriculum) {
        return res.status(404).json({ message: "Currículum no encontrado" });
      }
      res.json(normalizeCurriculum(rawCurriculum));
    } catch (err) { next(err); }
  });

  app.get("/api/academy/products", async (_req, res, next) => {
    try {
      res.json([]);
    } catch (err) { next(err); }
  });

  app.get("/api/academy/stats", async (_req, res, next) => {
    try {
      const { getSyncStatus } = await import("../academy-sync");
      const syncStatus = getSyncStatus();
      const countResult = await db.execute(sql`SELECT count(*) as total FROM academy_courses_cache WHERE status = 'publish'`);
      const cachedTotal = Number((countResult as any).rows?.[0]?.total || (countResult as any)[0]?.total || 0);
      res.json({
        site: "https://ceducap.academy",
        timestamp: new Date().toISOString(),
        courses: { total: cachedTotal, published: cachedTotal },
        sync: syncStatus,
      });
    } catch (err) { next(err); }
  });

  app.post("/api/academy/sync", requireAdmin, async (_req, res, next) => {
    try {
      const { getSyncStatus } = await import("../academy-sync");
      res.json({ status: "skipped_not_configured", synced: 0, errors: 0, removed: 0, message: "Live sync disabled — using cached data", sync: getSyncStatus() });
    } catch (err) { next(err); }
  });

  // ==================== AI STUDIO ====================

  app.get("/api/studio/courses", optionalAuth, async (req, res, next) => {
    try {
      const { category, search, page, limit } = req.query;
      const result = await storage.getStudioCourses({
        category: category as string | undefined,
        search: search as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      if (category === "Onboarding" && result.courses.length > 0) {
        let allowedSubcategories: string[] = ["Para Todos"];
        const userId = req.supabaseUserId;

        if (userId) {
          const account = await storage.getAccount(userId);
          const role = getEffectiveRole(req, account);

          if (role === "admin" || role === "superadmin") {
            allowedSubcategories = ["Para Todos", "Empresas", "Socios", "Comercial"];
          } else if (role === "socio_comercial" || role === "partner" || role === "director") {
            allowedSubcategories = ["Para Todos", "Socios", "Comercial"];
          } else if (role === "empresa" || role === "empresa_rh") {
            allowedSubcategories = ["Para Todos", "Empresas", "Comercial"];
          } else {
            // Fallback preexistente: quien administra un equipo ve los cursos de
            // "Empresas" aunque su user_role no sea empresa (el frontend cuenta
            // con esto, ver getOnboardingSlugsForUser(role, isTeamAdmin)).
            // NO recibe "Comercial": esa subcategoría lleva la capa legal-fiscal
            // y se reserva a roles comerciales/empresa explícitos.
            const userTeams = await storage.getUserTeams(userId);
            const isTeamAdmin = userTeams.some(t => t.role === "admin");
            if (isTeamAdmin) {
              allowedSubcategories = ["Para Todos", "Empresas"];
            }
          }
        }

        const filtered = result.courses.filter(c =>
          c.subcategory && allowedSubcategories.includes(c.subcategory)
        );
        return res.json({ courses: filtered, total: filtered.length });
      }

      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/studio/courses/:slug", async (req, res, next) => {
    try {
      const slug = String((req.params.slug as string));
      const course = await storage.getStudioCourse(slug);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const modules = await storage.getStudioModules(course.id);
      const quiz = await storage.getStudioQuiz(course.id);
      res.json({ course, modules, quiz });
    } catch (err) { next(err); }
  });

  // Estado real de los certificados de pago (DC-3 y SEP) para (socio, curso) del
  // Tutor IA. La pestaña Certificado lo consume: cuando no se puede solicitar,
  // dice por qué. El precio SIEMPRE sale del servidor (CERT_PRICES_MXN). Solo
  // lectura: no crea ni modifica ninguna solicitud, no toca F0. La lógica vive
  // en el seam testeable `cert-status` (RED→GREEN sin BD, Task 10).
  app.get("/api/studio/courses/:slug/certificates", requireAuth, async (req, res) => {
    const userId = req.supabaseUserId!;
    const slug = String(req.params.slug as string);
    const result = await computeCertStatus(
      {
        getStudioCourse: (s) => storage.getStudioCourse(s),
        getAttempts: (uid, s) => storage.getStudioQuizAttempts(uid, s),
        getRequestsByUser: (uid) => storage.getCertificateRequestsByUser(uid),
      },
      { userId, slug },
    );
    if (!result.ok) {
      // Sin degradación silenciosa: no se responde "no elegible" cuando lo que
      // pasó es que no se pudo calcular.
      return res.status(503).json({ message: "No pudimos verificar tus certificados. Intenta de nuevo en unos minutos.", state: "error" });
    }
    return res.json({ certs: result.certs });
  });

  app.get("/api/studio/courses/:slug/modules/:index", requireAuth, async (req, res, next) => {
    try {
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });
      const result = await storage.getStudioModuleBySlugAndIndex(slug, moduleIndex);
      if (!result) return res.status(404).json({ message: "Módulo no encontrado" });
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/studio/courses/:slug/modules/:index/generate", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });

      const regenerate = req.query.regenerate === "true";
      const cached = await storage.getGeneratedContent(userId, slug, moduleIndex);

      // A generation already in flight for this module — let the client keep polling
      // (unless it's stale from a crashed/restarted process, in which case re-trigger).
      const generatingAge = cached?.generatedAt ? Date.now() - new Date(cached.generatedAt).getTime() : Infinity;
      const isFresh = generatingAge < STALE_GENERATION_MS;
      if (cached?.generationStatus === "generating" && isFresh) {
        return res.status(202).json(cached);
      }

      // Finished content already present — return it unless the user asked to
      // regenerate. Una fila envenenada (failed / isStub) NO se sirve: un fallo
      // transitorio persistido servía el stub "Contenido genérico" para siempre y
      // sólo se curaba con "Regenerar" manual. Ahora reintenta sola — pero con
      // backoff y techo (ver server/lib/generation-retry.ts): sin eso, una falla
      // *persistente* (429 sostenido, key inválida) regeneraba en cada poll del
      // cliente (~5s), y con key válida cada intento es una llamada real y
      // facturable a Claude.
      const consecutiveFailures = cached?.consecutiveFailures ?? 0;

      if (shouldServeCache(cached, regenerate)) {
        return res.json(cached);
      }

      if (regenerate) {
        // "Regenerar" es una acción humana explícita: puede saltarse el
        // backoff/techo automático, pero se autolimita para que el botón no
        // pueda spamearse en una ráfaga de intentos facturables.
        if (!canManualRegenerate({ lastAttemptAt: cached?.generatedAt })) {
          const waitMs = manualRegenerateWaitMs({ lastAttemptAt: cached?.generatedAt });
          console.warn(
            `[studio-gen] ${slug}#${moduleIndex} (user=${userId}) "Regenerar" bloqueado por rate limit ` +
            `(faltan ${waitMs}ms).`,
          );
          return res.status(429).json({
            message: "Espera unos segundos antes de volver a regenerar este módulo.",
            retryAfterMs: waitMs,
          });
        }
      } else if (isPoisonedGeneration(cached)) {
        const ceilingReached = hasReachedFailureCeiling(consecutiveFailures);
        const eligible = !ceilingReached && canAutoRetry({
          consecutiveFailures,
          lastAttemptAt: cached!.generatedAt,
        });
        if (!eligible) {
          // Ni se sirve el stub como si fuera contenido bueno (ya no pasa,
          // ver arriba) ni se regenera sin freno: se informa el estado real
          // — fallando, cuántas veces, y cuándo (si acaso) se reintentará solo.
          console.warn(
            `[studio-gen] ${slug}#${moduleIndex} (user=${userId}) en backoff ` +
            `(fallas=${consecutiveFailures} techo=${ceilingReached}): no se regenera automáticamente.`,
          );
          return res.json({
            ...cached,
            consecutiveFailures,
            ceilingReached,
            nextRetryAt: ceilingReached ? null : nextRetryAt({ consecutiveFailures, lastAttemptAt: cached!.generatedAt }),
          });
        }
        console.warn(
          `[studio-gen] ${slug}#${moduleIndex} (user=${userId}) cache envenenada ` +
          `(status=${cached?.generationStatus} stub=${cached?.isStub} fallas=${consecutiveFailures}): ` +
          `regenerando en vez de servirla.`,
        );
      }

      const result = await storage.getStudioModuleBySlugAndIndex(slug, moduleIndex);
      if (!result) return res.status(404).json({ message: "Módulo no encontrado" });

      const profile = await storage.getStudentProfile(userId);

      // Mark in-progress immediately so concurrent loads/polls don't double-trigger,
      // then run the slow generation off the request path and return 202 right away.
      const placeholder = await storage.saveGeneratedContent({
        userId,
        courseSlug: slug,
        moduleIndex,
        lectureHtml: null,
        mindMap: null,
        reflections: [],
        adaptiveQuiz: null,
        suggestedSources: null,
        classScript: null,
        personalizedFor: profile ? { jobTitle: profile.jobTitle, industry: profile.industry } : null,
        generationStatus: "generating",
        isStub: false,
        // Preserve the streak through the placeholder — the definitive value
        // (reset on success, +1 on failure) is written by runModuleGeneration
        // once the attempt actually resolves.
        consecutiveFailures,
      });

      void runModuleGeneration(userId, slug, moduleIndex, result, profile, consecutiveFailures);

      res.status(202).json(placeholder);
    } catch (err) { next(err); }
  });

  app.delete("/api/studio/courses/:slug/modules/:index/generated", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });
      const deleted = await storage.deleteGeneratedContent(userId, slug, moduleIndex);
      res.json({ deleted });
    } catch (err) { next(err); }
  });

  app.put("/api/studio/enrollments/:enrollmentId/modules/:identifier/complete", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { enrollmentId, identifier } = req.params as Record<string, string>;
      const allEnrollments = await storage.getStudioEnrollments(userId);
      const target = allEnrollments.find(e => e.id === enrollmentId);
      if (!target) return res.status(404).json({ message: "Inscripción no encontrada" });

      const progress = await storage.upsertModuleProgress(enrollmentId, identifier, {
        completed: true,
        completedAt: new Date(),
      });

      const course = await storage.getStudioCourse(target.courseIdentifier);
      if (course) {
        const modules = await storage.getStudioModules(course.id);
        const allProgress = await storage.getModuleProgressForEnrollment(enrollmentId);
        const completedCount = allProgress.filter(p => p.completed).length;
        const progressPercent = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
        await storage.updateStudioEnrollment(enrollmentId, { progressPercent } as any);

        if (progressPercent >= 100 && (target as any).status !== "completed") {
          await storage.updateStudioEnrollment(enrollmentId, { status: "completed" } as any);
          try {
            const slug = target.courseIdentifier;
            const individualAchSlug = `logro-${slug}`;
            let individualAch = await storage.getAchievementBySlug(individualAchSlug);
            if (!individualAch) {
              const [created] = await db.insert(achievements).values({
                slug: individualAchSlug,
                name: `Diploma: ${course.title || slug}`,
                description: `Completaste el curso ${course.title || slug}`,
                value: 1000,
                icon: "trophy",
                category: "studio",
              }).returning();
              individualAch = created;
            }
            if (individualAch) {
              const existingInd = await db.select().from(achievementUsers)
                .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, individualAch.id), eq(achievementUsers.certType, "diploma")));
              if (existingInd.length === 0) {
                await db.insert(achievementUsers).values({ userId, achievementId: individualAch.id, status: "active", certType: "diploma", isActive: true });
              }
            }
            const [primerCurso] = await db.select().from(achievements).where(eq(achievements.slug, "primer-curso"));
            if (primerCurso) {
              const [ep] = await db.select().from(achievementUsers).where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, primerCurso.id)));
              if (!ep) await db.insert(achievementUsers).values({ userId, achievementId: primerCurso.id, status: "active", certType: "diploma", isActive: true });
            }
          } catch (achErr) {
            console.error("[studio-module] Error granting achievements:", achErr);
          }
        }
      }

      res.json(progress);
    } catch (err) { next(err); }
  });

  // Resolución del "quiz almacenado", en el mismo orden de precedencia que usa el
  // cliente (studio-course.tsx): quiz adaptativo del usuario para ese módulo y,
  // si no hay, el quiz del curso sembrado en studio_quizzes. Ambos viven en el
  // servidor. Si no hay ninguno, null → la ruta responde 422 y NO se aprueba nada.
  const studioQuizSubmitDeps: StudioQuizSubmitDeps = {
    async getStoredQuiz(userId, courseIdentifier, moduleIndex): Promise<StoredQuiz | null> {
      const generated = await storage.getGeneratedContent(userId, courseIdentifier, moduleIndex);
      const adaptive = (generated?.adaptiveQuiz as GradableQuestion[] | null) ?? null;
      const course = await storage.getStudioCourse(courseIdentifier);
      const courseQuiz = course ? await storage.getStudioQuiz(course.id) : undefined;
      const questions = adaptive && adaptive.length > 0
        ? adaptive
        : ((courseQuiz?.questions as GradableQuestion[] | undefined) ?? []);
      if (questions.length === 0) return null;
      return { questions, passingScore: courseQuiz?.passingScore ?? DEFAULT_PASSING_SCORE };
    },
    async recordAttempt(attempt) {
      await storage.createStudioQuizAttempt(attempt);
    },
    async listAttempts(userId, courseIdentifier) {
      return storage.getStudioQuizAttempts(userId, courseIdentifier);
    },
  };

  app.post("/api/studio/courses/:slug/modules/:index/quiz/submit", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });

      const result = await submitStudioQuiz(studioQuizSubmitDeps, {
        userId,
        courseIdentifier: slug,
        moduleIndex,
        body: req.body,
      });

      if (!result.ok) {
        const status = result.error === "respuestas_invalidas" ? 400
          : result.error === "sin_quiz_almacenado" ? 422
          : 429;
        return res.status(status).json({
          message: result.message,
          error: result.error,
          ...(result.retryAfterMs != null ? { retryAfterMs: result.retryAfterMs } : {}),
        });
      }

      const { score, total, scorePercent, passed } = result.grade;

      const allEnrollments = await storage.getStudioEnrollments(userId);
      const enrollment = allEnrollments.find(e => e.courseIdentifier === slug);

      if (enrollment) {
        await storage.upsertModuleProgress(enrollment.id, `module_${moduleIndex}`, {
          quizScore: scorePercent,
        });

        if (passed) {
          const course = await storage.getStudioCourse(slug);
          if (course) {
            const modules = await storage.getStudioModules(course.id);
            const allProgress = await storage.getModuleProgressForEnrollment(enrollment.id);
            const allCompleted = modules.every((_, idx) => {
              const mp = allProgress.find(p => p.moduleIdentifier === `module_${idx}`);
              return mp?.completed;
            });

            if (allCompleted) {
              await storage.updateStudioEnrollment(enrollment.id, { status: "completed" } as any);

              try {
                const individualAchSlug = `logro-${slug}`;
                let individualAch = await storage.getAchievementBySlug(individualAchSlug);
                if (!individualAch) {
                  const courseName = course.title || slug;
                  const [created] = await db.insert(achievements).values({
                    slug: individualAchSlug,
                    name: `Diploma: ${courseName}`,
                    description: `Completaste el curso ${courseName}`,
                    value: 1000,
                    icon: "trophy",
                    category: "studio",
                  }).returning();
                  individualAch = created;
                }
                if (individualAch) {
                  const existingInd = await db.select().from(achievementUsers)
                    .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, individualAch.id), eq(achievementUsers.certType, "diploma")));
                  if (existingInd.length === 0) {
                    await db.insert(achievementUsers).values({ userId, achievementId: individualAch.id, status: "active", certType: "diploma", isActive: true });
                  }
                }

                const [primerCurso] = await db.select().from(achievements).where(eq(achievements.slug, "primer-curso"));
                if (primerCurso) {
                  const [ep] = await db.select().from(achievementUsers).where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, primerCurso.id)));
                  if (!ep) await db.insert(achievementUsers).values({ userId, achievementId: primerCurso.id, status: "active", certType: "diploma", isActive: true });
                }

                const ONBOARDING_SLUGS = ["bienvenido-ceduverse", "guia-empresas", "guia-socios", "modelo-cooperativo", "programa-elite", "como-ganar-ceduverse", "cripto-blockchain-vaultcard"];
                if (ONBOARDING_SLUGS.includes(slug)) {
                  const ROLE_ONBOARDING_MAP: Record<string, { slugs: string[]; graduationSlug: string }> = {
                    socio_estudiante: { slugs: ["bienvenido-ceduverse", "modelo-cooperativo"], graduationSlug: "onboarding-estudiante-completo" },
                    socio_instructor: { slugs: ["bienvenido-ceduverse", "modelo-cooperativo"], graduationSlug: "onboarding-estudiante-completo" },
                    socio_comercial: { slugs: ["bienvenido-ceduverse", "modelo-cooperativo", "guia-socios", "programa-elite"], graduationSlug: "onboarding-socio-completo" },
                    director: { slugs: ["bienvenido-ceduverse", "modelo-cooperativo", "guia-socios", "programa-elite"], graduationSlug: "onboarding-director-completo" },
                    empresa: { slugs: ["bienvenido-ceduverse", "modelo-cooperativo", "guia-empresas"], graduationSlug: "onboarding-empresa-completo" },
                    empresa_rh: { slugs: ["bienvenido-ceduverse", "modelo-cooperativo", "guia-empresas"], graduationSlug: "onboarding-empresa-completo" },
                  };

                  const allEnrollmentsForAch = await storage.getStudioEnrollments(userId);
                  const completedSlugs = allEnrollmentsForAch
                    .filter(e => (e as any).status === "completed")
                    .map(e => e.courseIdentifier);

                  const account = await storage.getAccount(userId);
                  if (account) {
                    const roleConfig = ROLE_ONBOARDING_MAP[account.userRole];
                    if (roleConfig) {
                      const allRoleCoursesCompleted = roleConfig.slugs.every(s => completedSlugs.includes(s));
                      if (allRoleCoursesCompleted) {
                        const gradAch = await storage.getAchievementBySlug(roleConfig.graduationSlug);
                        if (gradAch) {
                          const existingGrad = await db.select().from(achievementUsers)
                            .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, gradAch.id), eq(achievementUsers.certType, "diploma")));
                          if (existingGrad.length === 0) {
                            await db.insert(achievementUsers).values({ userId, achievementId: gradAch.id, status: "active", certType: "diploma", isActive: true });
                          }
                        }
                      }
                    }
                  }

                  const completedOnboarding = new Set(completedSlugs.filter(s => ONBOARDING_SLUGS.includes(s))).size;
                  if (completedOnboarding >= ONBOARDING_SLUGS.length) {
                    const expertoAch = await storage.getAchievementBySlug("experto-ceduverse");
                    if (expertoAch) {
                      const existing = await db.select().from(achievementUsers)
                        .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, expertoAch.id), eq(achievementUsers.certType, "diploma")));
                      if (existing.length === 0) {
                        await db.insert(achievementUsers).values({ userId, achievementId: expertoAch.id, status: "active", certType: "diploma", isActive: true });
                      }
                    }
                  }
                }
              } catch (achErr) {
                console.error("[studio-quiz] Error granting achievements:", achErr);
              }
            }
          }
        }
      }

      res.json({ score, total, scorePercent, passed });
    } catch (err) { next(err); }
  });

  // Used by the client to sequentially gate module unlocking: a module's
  // personalized content must not auto-generate (and its nav must stay
  // locked) until the PREVIOUS module's quiz was passed. Returns every
  // attempt (append-only, most recent first) so the client can derive which
  // module indexes have at least one passed attempt.
  app.get("/api/studio/courses/:slug/quiz-attempts", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const attempts = await storage.getStudioQuizAttempts(userId, slug);
      res.json(attempts.map(a => ({ moduleIndex: a.moduleIndex, passed: a.passed })));
    } catch (err) { next(err); }
  });

  app.get("/api/studio/courses/:slug/modules/:index/chat/history", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });
      const session = await storage.getChatSession(userId, slug, moduleIndex);
      res.json({ messages: (session?.messages as any[]) || [] });
    } catch (err) { next(err); }
  });

  app.get("/api/studio/courses/:slug/modules/:index/audio", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });

      const generated = await storage.getGeneratedContent(userId, slug, moduleIndex);
      if (!generated || !generated.classScript) {
        return res.status(404).json({ status: "no_script", message: "No hay guion de clase disponible. Genera el contenido primero." });
      }

      if (generated.audioUrl) {
        const { getAudioDir } = await import("../audio-generator");
        const audioPath = path.join(getAudioDir(), generated.audioUrl);
        if (fs.existsSync(audioPath)) {
          return res.json({
            status: "ready",
            audioUrl: `/audio/${generated.audioUrl}`,
            duration: generated.audioDurationSeconds,
          });
        }
      }

      if (generated.generationStatus === "generating_audio") {
        return res.json({ status: "generating", estimatedSeconds: 30 });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ status: "unavailable", message: "Servicio de audio no configurado (se requiere OPENAI_API_KEY para TTS)" });
      }

      const { generateAudioAsync } = await import("../audio-generator");
      generateAudioAsync(generated.id, generated.classScript, slug, moduleIndex, userId)
        .catch(err => console.error("[audio] Background generation failed:", err));

      return res.json({ status: "generating", estimatedSeconds: 30 });
    } catch (err) { next(err); }
  });

  app.get("/api/studio/courses/:slug/modules/:index/audio/status", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });

      const generated = await storage.getGeneratedContent(userId, slug, moduleIndex);
      if (!generated) return res.status(404).json({ status: "not_found" });

      if (generated.audioUrl) {
        const { getAudioDir } = await import("../audio-generator");
        const audioPath = path.join(getAudioDir(), generated.audioUrl);
        if (fs.existsSync(audioPath)) {
          return res.json({
            status: "ready",
            audioUrl: `/audio/${generated.audioUrl}`,
            duration: generated.audioDurationSeconds,
          });
        }
      }

      if (generated.generationStatus === "generating_audio") {
        return res.json({ status: "generating" });
      }

      return res.json({ status: "pending" });
    } catch (err) { next(err); }
  });

  app.post("/api/studio/courses/:slug/modules/:index/audio/regenerate", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });

      const generated = await storage.getGeneratedContent(userId, slug, moduleIndex);
      if (!generated || !generated.classScript) {
        return res.status(404).json({ message: "No hay guion de clase disponible." });
      }

      if (generated.audioUrl) {
        const { getAudioDir } = await import("../audio-generator");
        const oldPath = path.join(getAudioDir(), generated.audioUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await storage.updateGeneratedContent(generated.id, {
        audioUrl: null,
        audioDurationSeconds: null,
        audioGeneratedAt: null,
      } as any);

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ status: "unavailable", message: "Servicio de audio no configurado (se requiere OPENAI_API_KEY para TTS)" });
      }

      const { generateAudioAsync } = await import("../audio-generator");
      generateAudioAsync(generated.id, generated.classScript, slug, moduleIndex, userId)
        .catch(err => console.error("[audio] Regeneration failed:", err));

      return res.json({ status: "generating" });
    } catch (err) { next(err); }
  });

  app.get("/api/studio/enrollments/:enrollmentId/progress", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { enrollmentId } = req.params as Record<string, string>;
      const allEnrollments = await storage.getStudioEnrollments(userId);
      const target = allEnrollments.find(e => e.id === enrollmentId);
      if (!target) return res.status(404).json({ message: "Inscripción no encontrada" });
      const progress = await storage.getModuleProgressForEnrollment(enrollmentId);
      res.json(progress);
    } catch (err) { next(err); }
  });

  app.post("/api/studio/courses/:slug/modules/:index/chat", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const slug = String((req.params.slug as string));
      const moduleIndex = Number((req.params.index as string));
      if (!Number.isFinite(moduleIndex) || moduleIndex < 0) return res.status(400).json({ message: "Índice inválido" });
      const { message } = req.body;
      if (!message || typeof message !== "string") return res.status(400).json({ message: "Mensaje requerido" });

      const result = await storage.getStudioModuleBySlugAndIndex(slug, moduleIndex);
      if (!result) return res.status(404).json({ message: "Módulo no encontrado" });

      const session = await storage.getChatSession(userId, slug, moduleIndex);
      const history = (session?.messages as any[]) || [];

      const profile = await storage.getStudentProfile(userId);
      const { chatWithModule } = await import("../ai-engine");
      const response = await chatWithModule(
        slug,
        moduleIndex,
        result.module.title,
        result.module.contentHtml,
        message,
        history,
        profile ? {
          jobTitle: profile.jobTitle || undefined,
          industry: profile.industry || undefined,
          companySize: profile.companySize || undefined,
          experienceLevel: profile.experienceLevel || undefined,
          learningGoals: profile.learningGoals || undefined,
          preferredStyle: profile.preferredStyle || undefined,
        } : null,
        result.course.title,
      );

      const updatedMessages = [
        ...history,
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: response.message, timestamp: new Date().toISOString() },
      ];
      await storage.upsertChatSession(userId, slug, moduleIndex, updatedMessages);

      res.json(response);
    } catch (err) { next(err); }
  });

  app.post("/api/studio/enroll", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { courseSlug } = req.body;
      if (!courseSlug) return res.status(400).json({ message: "courseSlug requerido" });
      const course = await storage.getStudioCourse(courseSlug);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const enrollment = await storage.createStudioEnrollment({
        userId,
        source: "studio",
        courseIdentifier: courseSlug,
      });
      res.json(enrollment);
    } catch (err) { next(err); }
  });

  app.get("/api/studio/enrollments", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const enrollments = await storage.getStudioEnrollments(userId);
      res.json(enrollments);
    } catch (err) { next(err); }
  });

  app.delete("/api/studio/enrollments/:courseSlug", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const courseSlug = String((req.params.courseSlug as string));
      const removed = await storage.deleteStudioEnrollment(userId, courseSlug);
      if (!removed) return res.status(404).json({ message: "Inscripción no encontrada" });
      res.json({ message: "Desinscrito del curso" });
    } catch (err) { next(err); }
  });

  app.post("/api/studio/enrollments/:enrollmentId/reset", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { enrollmentId } = req.params as Record<string, string>;
      const allEnrollments = await storage.getStudioEnrollments(userId);
      const target = allEnrollments.find(e => e.id === enrollmentId);
      if (!target) return res.status(404).json({ message: "Inscripción no encontrada" });
      await storage.resetStudioEnrollmentProgress(enrollmentId);
      res.json({ message: "Progreso reiniciado" });
    } catch (err) { next(err); }
  });

  app.get("/api/me/student-profile", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const profile = await storage.getStudentProfile(userId);
      res.json(profile || null);
    } catch (err) { next(err); }
  });

  app.put("/api/me/student-profile", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { jobTitle, industry, companySize, experienceLevel, learningGoals, preferredStyle } = req.body;
      const profile = await storage.upsertStudentProfile(userId, {
        jobTitle, industry, companySize, experienceLevel, learningGoals, preferredStyle,
      });
      res.json(profile);
    } catch (err) { next(err); }
  });

  const LEARNING_TOPICS = [
    { id: "seguridad-industrial", label: "Seguridad Industrial", icon: "🦺", category: "Seguridad" },
    { id: "normas-stps", label: "Normas STPS", icon: "📋", category: "Normatividad" },
    { id: "liderazgo", label: "Liderazgo", icon: "👑", category: "Desarrollo" },
    { id: "comunicacion", label: "Comunicación", icon: "💬", category: "Desarrollo" },
    { id: "trabajo-equipo", label: "Trabajo en Equipo", icon: "🤝", category: "Desarrollo" },
    { id: "recursos-humanos", label: "Recursos Humanos", icon: "👥", category: "Empresarial" },
    { id: "capacitacion", label: "Capacitación", icon: "🎓", category: "Empresarial" },
    { id: "ergonomia", label: "Ergonomía", icon: "🪑", category: "Seguridad" },
    { id: "primeros-auxilios", label: "Primeros Auxilios", icon: "🏥", category: "Seguridad" },
    { id: "montacargas", label: "Montacargas", icon: "🏗️", category: "Seguridad" },
    { id: "incendios", label: "Prevención de Incendios", icon: "🔥", category: "Seguridad" },
    { id: "autoestima", label: "Autoestima", icon: "💪", category: "Desarrollo" },
    { id: "conflictos", label: "Manejo de Conflictos", icon: "⚖️", category: "Desarrollo" },
    { id: "inteligencia-artificial", label: "Inteligencia Artificial", icon: "🤖", category: "Tecnología" },
    { id: "derechos-laborales", label: "Derechos Laborales", icon: "📜", category: "Normatividad" },
    { id: "higiene-alimentos", label: "Higiene y Alimentos", icon: "🍽️", category: "Seguridad" },
    { id: "epp", label: "Equipo de Protección", icon: "🥽", category: "Seguridad" },
    { id: "soldadura", label: "Soldadura y Corte", icon: "⚡", category: "Seguridad" },
    { id: "planeacion-vida", label: "Planeación de Vida", icon: "🗺️", category: "Desarrollo" },
    { id: "valores", label: "Valores y Ética", icon: "⭐", category: "Desarrollo" },
    { id: "productividad", label: "Productividad", icon: "📈", category: "Empresarial" },
    { id: "idiomas", label: "Idiomas", icon: "🌎", category: "Educación" },
    { id: "programacion", label: "Programación", icon: "💻", category: "Tecnología" },
    { id: "marketing", label: "Marketing Digital", icon: "📱", category: "Empresarial" },
    { id: "finanzas", label: "Finanzas", icon: "💰", category: "Empresarial" },
    { id: "emprendimiento", label: "Emprendimiento", icon: "🚀", category: "Empresarial" },
    { id: "salud-trabajo", label: "Salud en el Trabajo", icon: "❤️", category: "Seguridad" },
    { id: "electricidad", label: "Seguridad Eléctrica", icon: "⚡", category: "Seguridad" },
    { id: "calidad", label: "Control de Calidad", icon: "✅", category: "Empresarial" },
    { id: "diseno", label: "Diseño", icon: "🎨", category: "Tecnología" },
    { id: "pedagogia", label: "Pedagogía", icon: "📚", category: "Educación" },
    { id: "cocina", label: "Cocina y Gastronomía", icon: "👨‍🍳", category: "Oficios" },
    { id: "fotografia", label: "Fotografía", icon: "📷", category: "Creatividad" },
    { id: "psicologia", label: "Psicología", icon: "🧠", category: "Desarrollo" },
    { id: "relaciones-humanas", label: "Relaciones Humanas", icon: "🫂", category: "Desarrollo" },
    { id: "construccion", label: "Construcción", icon: "🏗️", category: "Seguridad" },
  ];

  const TOPIC_SEARCH_KEYWORDS: Record<string, string[]> = {
    "seguridad-industrial": ["seguridad", "industrial", "riesgo", "prevención", "accidente"],
    "normas-stps": ["nom", "stps", "norma", "regulación", "oficial"],
    "liderazgo": ["líder", "liderazgo", "dirección", "gerencia", "directivo"],
    "comunicacion": ["comunicación", "comunicar", "asertiva", "efectiva", "verbal"],
    "trabajo-equipo": ["equipo", "grupo", "integración", "colaboración", "team"],
    "recursos-humanos": ["recursos humanos", "rh", "talento", "personal", "nómina"],
    "capacitacion": ["capacitación", "formación", "instructor", "entrenamiento", "adiestramiento"],
    "ergonomia": ["ergonomía", "musculoesquelético", "postura", "tme"],
    "primeros-auxilios": ["primeros auxilios", "emergencia", "brigada", "evacuación"],
    "montacargas": ["montacargas", "carretilla", "carga"],
    "incendios": ["incendio", "fuego", "extintor", "brigada contra incendios"],
    "autoestima": ["autoestima", "autoconocimiento", "confianza", "autodependencia"],
    "conflictos": ["conflicto", "negociación", "mediación", "decisión"],
    "inteligencia-artificial": ["inteligencia artificial", "ia", "ai", "machine learning", "automatización"],
    "derechos-laborales": ["derecho laboral", "reforma", "ley federal", "contrato"],
    "higiene-alimentos": ["alimento", "higiene", "sanitario", "haccp", "manipulación"],
    "epp": ["equipo protección", "epp", "casco", "guantes", "lentes"],
    "soldadura": ["soldadura", "corte", "arco", "metal"],
    "planeacion-vida": ["planeación", "plan de vida", "metas", "carrera"],
    "valores": ["valores", "ética", "integridad", "cultura organizacional"],
    "productividad": ["productividad", "eficiencia", "tiempo", "procesos"],
    "idiomas": ["inglés", "idioma", "english", "francés", "language"],
    "programacion": ["programación", "código", "software", "web", "python", "javascript"],
    "marketing": ["marketing", "mercadotecnia", "redes sociales", "publicidad", "ventas"],
    "finanzas": ["finanzas", "contabilidad", "inversión", "economía", "presupuesto"],
    "emprendimiento": ["emprendimiento", "negocio", "startup", "empresa", "emprender"],
    "salud-trabajo": ["salud", "bienestar", "hábitos saludables", "estrés"],
    "electricidad": ["electricidad", "eléctrica", "energía", "voltaje"],
    "calidad": ["calidad", "mejora continua", "lean", "six sigma", "iso"],
    "diseno": ["diseño", "gráfico", "ilustración", "ux", "ui"],
    "pedagogia": ["pedagogía", "enseñanza", "educación", "didáctica", "aprendizaje"],
    "cocina": ["cocina", "gastronomía", "chef", "culinaria", "repostería"],
    "fotografia": ["fotografía", "cámara", "foto", "imagen", "video"],
    "psicologia": ["psicología", "mente", "emociones", "terapia", "comportamiento"],
    "relaciones-humanas": ["relaciones humanas", "interpersonal", "social", "empatía"],
    "construccion": ["construcción", "obra", "edificación", "estructura"],
  };

  app.get("/api/learning/topics", (_req, res) => {
    res.json(LEARNING_TOPICS);
  });

  app.get("/api/learning/interests", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const existing = await db.select().from(learningInterests)
        .where(eq(learningInterests.userId, userId))
        .orderBy(desc(learningInterests.createdAt))
        .limit(1);
      if (existing.length > 0) {
        res.json(existing[0]);
      } else {
        res.json(null);
      }
    } catch (err) { next(err); }
  });

  const VALID_TOPIC_IDS = new Set(LEARNING_TOPICS.map(t => t.id));

  app.post("/api/learning/discover", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { topics } = req.body;
      if (!Array.isArray(topics) || topics.length < 1 || topics.length > 5) {
        return res.status(400).json({ message: "Selecciona entre 1 y 5 temas" });
      }
      const validTopics = topics.filter((t: string) => VALID_TOPIC_IDS.has(t));
      if (validTopics.length === 0) {
        return res.status(400).json({ message: "Ningún tema válido seleccionado" });
      }

      const searchTerms = validTopics.flatMap((t: string) => TOPIC_SEARCH_KEYWORDS[t] || [t]);
      const searchPattern = searchTerms.map((t: string) => t.toLowerCase()).join("|");

      const academyResults = await db.select({
        id: academyCoursesCache.id,
        academyId: academyCoursesCache.academyId,
        title: academyCoursesCache.title,
        excerpt: academyCoursesCache.excerpt,
        url: academyCoursesCache.url,
      }).from(academyCoursesCache)
        .where(sql`(LOWER(${academyCoursesCache.title}) ~* ${searchPattern} OR LOWER(${academyCoursesCache.excerpt}) ~* ${searchPattern})`)
        .limit(20);

      const shuffled = academyResults.sort(() => Math.random() - 0.5);
      const topAcademy = shuffled.slice(0, 5);

      const studioResults = await db.select({
        id: studioCourses.id,
        slug: studioCourses.slug,
        title: studioCourses.title,
        description: studioCourses.description,
        category: studioCourses.category,
        icon: studioCourses.icon,
        color: studioCourses.color,
        tags: studioCourses.tags,
        dc3Available: studioCourses.dc3Available,
      }).from(studioCourses)
        .where(sql`(LOWER(${studioCourses.title}) ~* ${searchPattern} OR LOWER(${studioCourses.category}) ~* ${searchPattern} OR array_to_string(${studioCourses.tags}, ' ') ~* ${searchPattern})`)
        .limit(5);

      const topStudio = studioResults.length > 0 ? studioResults[Math.floor(Math.random() * studioResults.length)] : null;

      const stpsSuggestion = {
        type: "stps-instructor",
        title: "Clase personalizada con instructor STPS certificado",
        description: "Recibe capacitación 1-on-1 con un instructor certificado por la STPS, enfocada en tus temas de interés. Incluye constancia DC-3.",
        topics: topics.map((t: string) => LEARNING_TOPICS.find(lt => lt.id === t)?.label || t),
        ctaUrl: "https://calendly.com/ceduverse",
        ctaLabel: "Agendar clase",
        price: "$1,999 MXN",
      };

      const recommendations = {
        academy: topAcademy,
        tutorIa: topStudio,
        stpsInstructor: stpsSuggestion,
        selectedTopics: topics,
        generatedAt: new Date().toISOString(),
      };

      await db.delete(learningInterests).where(eq(learningInterests.userId, userId));

      await db.insert(learningInterests).values({
        userId,
        topics,
        recommendations,
      });

      res.json(recommendations);
    } catch (err) { next(err); }
  });

  app.delete("/api/learning/interests", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      await db.delete(learningInterests).where(eq(learningInterests.userId, userId));
      res.json({ ok: true });
    } catch (err) { next(err); }
  });
}
