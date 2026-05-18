import type { Express } from "express";
import { requireAuth, requireInstructor, requireSuperadmin } from "../auth";
import { db } from "../db";
import multer from "multer";
import {
  instructorAvatars,
  heygenVideoJobs,
  liveAvatarSessions,
  liveAvatarMessages,
  instructorAvailability,
  instructorSessionConfig,
  privateSessions,
  sessionParticipants,
  instructorReviews,
  courseModules,
  accounts,
  users,
  profiles,
} from "@shared/schema";
import { eq, and, sql, count, desc, asc, inArray } from "drizzle-orm";
import { heygenService } from "../services/heygen";
import { r2Storage } from "../services/r2-storage";
import { liveAvatarService } from "../services/liveavatar";
import { tutorAIService } from "../services/tutor-ai";
import { dailyService } from "../services/daily";
import { z } from "zod";

export function registerHeygenRoutes(app: Express) {
  // ==================== HEYGEN DIGITAL TWIN ====================

  app.get("/api/heygen/status", requireAuth, async (req, res) => {
    res.json({ configured: heygenService.isConfigured });
  });

  app.get("/api/heygen/voices", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      if (!heygenService.isConfigured) {
        return res.json({ voices: [] });
      }
      const data = await heygenService.listVoices();
      const voices = data?.data?.voices || data?.voices || [];
      const spanishVoices = voices.filter((v: any) =>
        v.language?.toLowerCase().includes("spanish") || v.language?.toLowerCase().includes("es")
      );
      res.json(spanishVoices);
    } catch (err) {
      console.error("[heygen/voices] Error fetching voices:", err);
      res.json([]);
    }
  });

  app.get("/api/heygen/avatar/me", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      res.json({ avatar: avatar || null, hasAvatar: !!avatar, heygenConfigured: heygenService.isConfigured });
    } catch (err) { next(err); }
  });

  const registerAvatarSchema = z.object({
    heygen_avatar_id: z.string().min(3).max(200),
    heygen_voice_id: z.string().min(3).max(200),
    consent_accepted: z.literal(true, { errorMap: () => ({ message: "Debes aceptar el consentimiento" }) }),
  });

  const generateModuleVideoSchema = z.object({
    course_id: z.string().min(1),
    module_id: z.string().min(1),
    script_text: z.string().min(50, "El guión debe tener al menos 50 caracteres").max(10000),
    title: z.string().optional(),
  });

  app.post("/api/heygen/avatar/register", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const parsed = registerAvatarSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Datos inválidos" });
      }
      const { heygen_avatar_id, heygen_voice_id } = parsed.data;

      const existing = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (existing.length > 0) {
        await db.update(instructorAvatars).set({
          heygenAvatarId: heygen_avatar_id,
          heygenVoiceId: heygen_voice_id,
          avatarStatus: "ready",
          voiceStatus: "ready",
          consentAccepted: true,
          consentAcceptedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(instructorAvatars.instructorId, userId));
        const [updated] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
        return res.json({ success: true, message: "Digital Twin actualizado", avatar: updated });
      }

      const [avatar] = await db.insert(instructorAvatars).values({
        instructorId: userId,
        heygenAvatarId: heygen_avatar_id,
        heygenVoiceId: heygen_voice_id,
        avatarStatus: "ready",
        voiceStatus: "ready",
        consentAccepted: true,
        consentAcceptedAt: new Date(),
      }).returning();

      res.json({ success: true, message: "Digital Twin registrado exitosamente", avatar });
    } catch (err) { next(err); }
  });

  const twinVideoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

  app.post("/api/heygen/avatar/upload-consent", requireAuth, requireInstructor, twinVideoUpload.single("video"), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No se recibió el video" });
      if (!r2Storage.isConfigured) return res.status(503).json({ message: "Almacenamiento no configurado" });

      const userId = req.supabaseUserId!;
      const r2Key = `avatars/instructor-${userId}/consent-${Date.now()}.webm`;
      const r2Url = await r2Storage.uploadBuffer(req.file.buffer, r2Key, "video/webm");

      const existing = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (existing.length > 0) {
        await db.update(instructorAvatars).set({
          consentVideoR2Url: r2Url,
          consentVideoR2Key: r2Key,
          consentAccepted: true,
          consentAcceptedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(instructorAvatars.instructorId, userId));
      } else {
        await db.insert(instructorAvatars).values({
          instructorId: userId,
          consentVideoR2Url: r2Url,
          consentVideoR2Key: r2Key,
          consentAccepted: true,
          consentAcceptedAt: new Date(),
        });
      }

      res.json({ success: true, url: r2Url });
    } catch (err) { next(err); }
  });

  app.post("/api/heygen/avatar/upload-training", requireAuth, requireInstructor, twinVideoUpload.single("video"), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No se recibió el video" });
      if (!r2Storage.isConfigured) return res.status(503).json({ message: "Almacenamiento no configurado" });

      const userId = req.supabaseUserId!;
      const r2Key = `avatars/instructor-${userId}/training-${Date.now()}.webm`;
      const r2Url = await r2Storage.uploadBuffer(req.file.buffer, r2Key, "video/webm");

      const existing = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (existing.length > 0) {
        await db.update(instructorAvatars).set({
          trainingVideoR2Url: r2Url,
          trainingVideoR2Key: r2Key,
          updatedAt: new Date(),
        }).where(eq(instructorAvatars.instructorId, userId));
      } else {
        await db.insert(instructorAvatars).values({
          instructorId: userId,
          trainingVideoR2Url: r2Url,
          trainingVideoR2Key: r2Key,
        });
      }

      res.json({ success: true, url: r2Url });
    } catch (err) { next(err); }
  });

  app.post("/api/heygen/avatar/create-twin", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      if (!heygenService.isConfigured) return res.status(503).json({ message: "HeyGen API no configurada" });

      const userId = req.supabaseUserId!;
      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (!avatar?.consentVideoR2Url || !avatar?.trainingVideoR2Url) {
        return res.status(400).json({ message: "Debes grabar el video de consentimiento y el video de entrenamiento primero" });
      }

      const [userRow] = await db.select({ email: users.email, fullName: profiles.fullName })
        .from(users).leftJoin(profiles, eq(users.id, profiles.id)).where(eq(users.id, userId));
      const instructorName = userRow?.fullName || userRow?.email?.split("@")[0] || "Instructor";

      const twinResult = await heygenService.createDigitalTwin(
        avatar.trainingVideoR2Url,
        avatar.consentVideoR2Url,
        `Ceduverse - ${instructorName}`
      );

      let voiceResult = { voice_id: "" };
      try {
        voiceResult = await heygenService.cloneVoice(
          avatar.trainingVideoR2Url,
          `Ceduverse Voice - ${instructorName}`
        );
      } catch (e) {
        console.error("Voice clone failed (non-blocking):", e);
      }

      await db.update(instructorAvatars).set({
        heygenAvatarId: twinResult.avatar_id,
        heygenVoiceId: voiceResult.voice_id || null,
        heygenCreationRequestId: twinResult.request_id,
        avatarStatus: "processing",
        voiceStatus: voiceResult.voice_id ? "processing" : "pending",
        processingStartedAt: new Date(),
        processingError: null,
        updatedAt: new Date(),
      }).where(eq(instructorAvatars.instructorId, userId));

      res.json({
        success: true,
        message: "Tu Digital Twin está siendo creado. Esto puede tomar 5-30 minutos.",
        avatar_id: twinResult.avatar_id,
      });
    } catch (err: any) {
      const userId = req.supabaseUserId!;
      const detailedError = err.message || "Error desconocido";
      console.error("[create-twin] Error creating Digital Twin:", detailedError, err);
      await db.update(instructorAvatars).set({
        avatarStatus: "failed",
        processingError: detailedError,
        updatedAt: new Date(),
      }).where(eq(instructorAvatars.instructorId, userId));
      res.status(500).json({ message: detailedError, success: false });
    }
  });

  app.get("/api/heygen/avatar/creation-status", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));

      if (!avatar?.heygenAvatarId) {
        return res.json({ status: "not_started" });
      }

      if (avatar.avatarStatus === "ready") {
        return res.json({ status: "ready", avatar_id: avatar.heygenAvatarId });
      }

      try {
        const heygenStatus = await heygenService.checkDigitalTwinStatus(avatar.heygenAvatarId);

        if (heygenStatus.status === "complete" && avatar.avatarStatus !== "ready") {
          await db.update(instructorAvatars).set({
            avatarStatus: "ready",
            voiceStatus: "ready",
            updatedAt: new Date(),
          }).where(eq(instructorAvatars.instructorId, userId));
          return res.json({ status: "ready", avatar_id: avatar.heygenAvatarId });
        } else if (heygenStatus.status === "failed") {
          await db.update(instructorAvatars).set({
            avatarStatus: "failed",
            processingError: heygenStatus.error || "Error desconocido en HeyGen",
            updatedAt: new Date(),
          }).where(eq(instructorAvatars.instructorId, userId));
          return res.json({ status: "failed", error: heygenStatus.error });
        }

        res.json({
          status: heygenStatus.status,
          avatar_id: avatar.heygenAvatarId,
          started_at: avatar.processingStartedAt,
        });
      } catch {
        res.json({
          status: avatar.avatarStatus,
          avatar_id: avatar.heygenAvatarId,
          started_at: avatar.processingStartedAt,
        });
      }
    } catch (err) { next(err); }
  });

  app.get("/api/heygen/debug/test-r2-urls", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const targetUserId = (req.query.userId as string) || userId;
      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, targetUserId));
      if (!avatar) return res.json({ message: "No avatar record found", userId: targetUserId });

      const results: Record<string, any> = {
        userId: targetUserId,
        consentVideoR2Url: avatar.consentVideoR2Url || null,
        trainingVideoR2Url: avatar.trainingVideoR2Url || null,
        avatarStatus: avatar.avatarStatus,
        consentUrlAccessible: false,
        trainingUrlAccessible: false,
      };

      if (avatar.consentVideoR2Url) {
        try {
          const headRes = await fetch(avatar.consentVideoR2Url, { method: "HEAD" });
          results.consentUrlAccessible = headRes.ok;
          results.consentUrlStatus = headRes.status;
          results.consentUrlContentType = headRes.headers.get("content-type");
        } catch (e: any) {
          results.consentUrlError = e.message;
        }
      }

      if (avatar.trainingVideoR2Url) {
        try {
          const headRes = await fetch(avatar.trainingVideoR2Url, { method: "HEAD" });
          results.trainingUrlAccessible = headRes.ok;
          results.trainingUrlStatus = headRes.status;
          results.trainingUrlContentType = headRes.headers.get("content-type");
        } catch (e: any) {
          results.trainingUrlError = e.message;
        }
      }

      res.json(results);
    } catch (err) { next(err); }
  });

  app.post("/api/heygen/avatar/regenerate", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));

      if (avatar?.heygenAvatarId) {
        try { await heygenService.deleteDigitalTwin(avatar.heygenAvatarId); } catch {}
      }

      await db.update(instructorAvatars).set({
        heygenAvatarId: null,
        heygenVoiceId: null,
        avatarStatus: "pending",
        voiceStatus: "pending",
        processingError: null,
        consentVideoR2Url: null,
        trainingVideoR2Url: null,
        consentVideoR2Key: null,
        trainingVideoR2Key: null,
        heygenCreationRequestId: null,
        processingStartedAt: null,
        updatedAt: new Date(),
      }).where(eq(instructorAvatars.instructorId, userId));

      res.json({ success: true, message: "Puedes grabar tu Digital Twin de nuevo" });
    } catch (err) { next(err); }
  });

  const avatarPreferencesSchema = z.object({
    avatarStyle: z.enum(["normal", "circle", "closeUp"]).optional(),
    backgroundType: z.enum(["color", "image"]).optional(),
    backgroundColor: z.string().optional(),
    backgroundImageUrl: z.string().url().optional().or(z.literal("")),
    voiceSpeed: z.number().min(0.5).max(2.0).optional(),
    orientation: z.enum(["landscape", "portrait", "square"]).optional(),
    selectedVoiceId: z.string().optional(),
    useClonedVoice: z.boolean().optional(),
  });

  app.patch("/api/heygen/avatar/preferences", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const parsed = avatarPreferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Datos inválidos" });
      }

      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (!avatar) {
        return res.status(404).json({ message: "No tienes un registro de Digital Twin" });
      }

      const currentPrefs = avatar.avatarPreferences || {};
      const newPrefs = { ...currentPrefs, ...parsed.data };
      if (newPrefs.backgroundImageUrl === "") delete newPrefs.backgroundImageUrl;

      await db.update(instructorAvatars).set({
        avatarPreferences: newPrefs,
        updatedAt: new Date(),
      }).where(eq(instructorAvatars.instructorId, userId));

      const [updated] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      res.json({ success: true, avatar: updated });
    } catch (err) { next(err); }
  });

  app.post("/api/heygen/avatar/generate-preview", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      if (!heygenService.isConfigured) {
        return res.status(503).json({ message: "HeyGen API no configurada" });
      }
      const userId = req.supabaseUserId!;
      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (!avatar || avatar.avatarStatus !== "ready") {
        return res.status(400).json({ message: "Primero debes registrar tu Digital Twin" });
      }

      const [userRow] = await db.select({ email: users.email, fullName: profiles.fullName })
        .from(users).leftJoin(profiles, eq(users.id, profiles.id)).where(eq(users.id, userId));
      const instructorName = userRow?.fullName || userRow?.email?.split("@")[0] || "Instructor";

      const previewScript = `Hola, soy ${instructorName}, o mejor dicho, soy tu gemelo digital. ` +
        `Probablemente te preguntes qué es un gemelo digital. Déjame explicarte: gracias a la inteligencia artificial de HeyGen, ` +
        `se ha creado una réplica digital de mi apariencia y mi voz. Esto significa que puedo generar videolecciones de forma automática ` +
        `para cada módulo de mis cursos, sin necesidad de grabar cada video manualmente. ` +
        `Además, mis estudiantes pueden tener sesiones de tutoría en vivo conmigo, bueno, con mi gemelo digital, ` +
        `a través de LiveAvatar. Es como tener una clase particular con tu instructor disponible cuando la necesites. ` +
        `Te invito a crear tu primer curso conmigo en Ceduverse. ¡Será una experiencia increíble de aprendizaje!`;

      const prefs = avatar.avatarPreferences || {};
      const voiceId = (!prefs.useClonedVoice && prefs.selectedVoiceId)
        ? prefs.selectedVoiceId
        : avatar.heygenVoiceId!;

      const result = await heygenService.generateAvatarVideo(
        avatar.heygenAvatarId!,
        voiceId,
        previewScript,
        `Preview - ${instructorName}`,
        prefs
      );

      if (result.data?.video_id) {
        await db.insert(heygenVideoJobs).values({
          instructorId: userId,
          heygenVideoId: result.data.video_id,
          jobStatus: "processing",
          scriptText: previewScript,
        });

        await db.update(instructorAvatars).set({
          previewVideoId: result.data.video_id,
          updatedAt: new Date(),
        }).where(eq(instructorAvatars.instructorId, userId));

        return res.json({ success: true, video_id: result.data.video_id, message: "Video de presentación en generación (~60 segundos)" });
      }

      res.status(500).json({ message: "No se pudo iniciar la generación del video" });
    } catch (err) { next(err); }
  });

  app.post("/api/heygen/video/generate-module", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      if (!heygenService.isConfigured) {
        return res.status(503).json({ message: "HeyGen API no configurada" });
      }
      const userId = req.supabaseUserId!;
      const parsed = generateModuleVideoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Datos inválidos" });
      }
      const { course_id, module_id, script_text, title } = parsed.data;

      const [avatar] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, userId));
      if (!avatar || avatar.avatarStatus !== "ready") {
        return res.status(400).json({ message: "No tienes un Digital Twin activo" });
      }

      const prefs = avatar.avatarPreferences || {};
      const voiceId = (!prefs.useClonedVoice && prefs.selectedVoiceId)
        ? prefs.selectedVoiceId
        : avatar.heygenVoiceId!;

      const result = await heygenService.generateAvatarVideo(
        avatar.heygenAvatarId!,
        voiceId,
        script_text,
        `${title || "Módulo"} - Curso ${course_id}`,
        prefs
      );

      if (result.data?.video_id) {
        await db.insert(heygenVideoJobs).values({
          instructorId: userId,
          courseId: course_id,
          moduleId: module_id,
          heygenVideoId: result.data.video_id,
          jobStatus: "processing",
          scriptText: script_text,
        });
        return res.json({ success: true, video_id: result.data.video_id, message: "Video del módulo en generación" });
      }

      res.status(500).json({ message: "No se pudo iniciar la generación" });
    } catch (err) { next(err); }
  });

  app.get("/api/heygen/video/status/:videoId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      if (!heygenService.isConfigured) {
        return res.status(503).json({ message: "HeyGen API no configurada" });
      }
      const userId = req.supabaseUserId!;
      const { videoId } = req.params as Record<string, string>;

      const [job] = await db.select().from(heygenVideoJobs).where(
        and(eq(heygenVideoJobs.heygenVideoId, videoId), eq(heygenVideoJobs.instructorId, userId))
      );
      if (!job) return res.status(404).json({ message: "Video no encontrado" });

      const status = await heygenService.getVideoStatus(videoId);

      if (status.data?.status === "completed") {
        await db.update(heygenVideoJobs).set({
          jobStatus: "completed",
          videoUrl: status.data.video_url,
          videoDurationSeconds: Math.round(status.data.duration || 0),
          completedAt: new Date(),
        }).where(eq(heygenVideoJobs.heygenVideoId, videoId));

        if (job.moduleId && job.courseId) {
          await db.update(courseModules).set({
            heygenVideoUrl: status.data.video_url,
            heygenVideoId: videoId,
            videoStatus: "completed",
          }).where(and(eq(courseModules.id, job.moduleId), eq(courseModules.courseId, job.courseId)));
        }

        if (!job.moduleId && !job.courseId && job.instructorId) {
          const [avatarRow] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, job.instructorId));
          if (avatarRow?.previewVideoId === videoId) {
            await db.update(instructorAvatars).set({
              previewVideoUrl: status.data.video_url,
              updatedAt: new Date(),
            }).where(eq(instructorAvatars.instructorId, job.instructorId));
          }
        }
      } else if (status.data?.status === "failed") {
        await db.update(heygenVideoJobs).set({
          jobStatus: "failed",
          errorMessage: status.data.error || "Error desconocido",
        }).where(eq(heygenVideoJobs.heygenVideoId, videoId));
      }

      res.json(status);
    } catch (err) { next(err); }
  });

  app.get("/api/heygen/video/module/:courseId/:moduleId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { courseId, moduleId } = req.params as Record<string, string>;
      const jobs = await db.select().from(heygenVideoJobs).where(
        and(
          eq(heygenVideoJobs.courseId, courseId),
          eq(heygenVideoJobs.moduleId, moduleId),
          eq(heygenVideoJobs.instructorId, userId),
          eq(heygenVideoJobs.jobStatus, "completed")
        )
      ).orderBy(desc(heygenVideoJobs.createdAt)).limit(1);
      res.json({ video: jobs[0] || null });
    } catch (err) { next(err); }
  });

  app.get("/api/heygen/jobs", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const jobs = await db.select().from(heygenVideoJobs)
        .where(eq(heygenVideoJobs.instructorId, userId))
        .orderBy(desc(heygenVideoJobs.createdAt))
        .limit(50);
      res.json(jobs);
    } catch (err) { next(err); }
  });

  app.post("/api/heygen/webhook", async (req, res) => {
    const { event_type, data } = req.body;
    if (!event_type || !data?.video_id) return res.status(400).json({ message: "Invalid payload" });

    const [job] = await db.select().from(heygenVideoJobs).where(eq(heygenVideoJobs.heygenVideoId, data.video_id));
    if (!job) return res.status(404).json({ message: "Unknown video_id" });

    if (event_type === "avatar_video.success") {
      await db.update(heygenVideoJobs).set({
        jobStatus: "completed",
        videoUrl: data.video_url,
        videoDurationSeconds: Math.round(data.duration || 0),
        completedAt: new Date(),
      }).where(eq(heygenVideoJobs.heygenVideoId, data.video_id));

      if (job.moduleId && job.courseId) {
        await db.update(courseModules).set({
          heygenVideoUrl: data.video_url,
          heygenVideoId: data.video_id,
          videoStatus: "completed",
        }).where(and(eq(courseModules.id, job.moduleId), eq(courseModules.courseId, job.courseId)));
      }

      if (!job.moduleId && !job.courseId && job.instructorId) {
        const [avatarRow] = await db.select().from(instructorAvatars).where(eq(instructorAvatars.instructorId, job.instructorId));
        if (avatarRow?.previewVideoId === data.video_id) {
          await db.update(instructorAvatars).set({
            previewVideoUrl: data.video_url,
            updatedAt: new Date(),
          }).where(eq(instructorAvatars.instructorId, job.instructorId));
        }
      }
    }

    if (event_type === "avatar_video.fail") {
      await db.update(heygenVideoJobs).set({
        jobStatus: "failed",
        errorMessage: data.error || "Error en generación de video",
      }).where(eq(heygenVideoJobs.heygenVideoId, data.video_id));
    }

    res.json({ received: true });
  });

  app.get("/api/heygen/usage", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const jobs = await db.select().from(heygenVideoJobs);
      const completed = jobs.filter(j => j.jobStatus === "completed");
      const totalDuration = completed.reduce((sum, j) => sum + (j.videoDurationSeconds || 0), 0);
      const totalCredits = completed.reduce((sum, j) => sum + (j.creditsConsumed || 0), 0);
      const avatars = await db.select().from(instructorAvatars);

      res.json({
        total_videos_generated: completed.length,
        total_duration_minutes: Math.round(totalDuration / 60),
        total_credits_consumed: totalCredits,
        estimated_monthly_cost_usd: totalCredits * 0.5,
        jobs_pending: jobs.filter(j => j.jobStatus === "processing").length,
        jobs_failed: jobs.filter(j => j.jobStatus === "failed").length,
        total_avatars: avatars.length,
        avatars_ready: avatars.filter(a => a.avatarStatus === "ready").length,
      });
    } catch (err) { next(err); }
  });

  // ==================== LIVEAVATAR (TUTOR IA EN VIVO) ====================

  app.post("/api/liveavatar/token", requireAuth, async (_req, res, next) => {
    try {
      if (!liveAvatarService.isConfigured) return res.status(503).json({ message: "LiveAvatar no está configurado" });
      const token = await liveAvatarService.getSessionToken();
      res.json({ token });
    } catch (err) { next(err); }
  });

  app.post("/api/liveavatar/session", requireAuth, async (req, res, next) => {
    try {
      const schema = z.object({ courseId: z.string(), instructorId: z.string().uuid() });
      const { courseId, instructorId } = schema.parse(req.body);
      const userId = req.supabaseUserId!;

      const session = await db.insert(liveAvatarSessions).values({
        studentId: userId,
        instructorId,
        courseId,
        sessionStatus: "active",
        startedAt: new Date(),
      }).returning();

      res.json(session[0]);
    } catch (err) { next(err); }
  });

  app.post("/api/liveavatar/chat", requireAuth, async (req, res, next) => {
    try {
      const schema = z.object({
        sessionId: z.string().uuid(),
        question: z.string().min(1).max(2000),
        courseTitle: z.string().optional(),
      });
      const { sessionId, question, courseTitle } = schema.parse(req.body);
      const userId = req.supabaseUserId!;

      const [session] = await db.select().from(liveAvatarSessions)
        .where(and(eq(liveAvatarSessions.id, sessionId), eq(liveAvatarSessions.studentId, userId)));
      if (!session) return res.status(404).json({ message: "Sesión no encontrada" });

      await db.insert(liveAvatarMessages).values({ sessionId, role: "user", content: question });

      const history = await db.select().from(liveAvatarMessages)
        .where(eq(liveAvatarMessages.sessionId, sessionId));

      const courseContext = await tutorAIService.getCourseContext(session.courseId);
      const answer = await tutorAIService.generateResponse(
        question, courseTitle || "Curso de Capacitación", courseContext,
        history.map(m => ({ role: m.role, content: m.content }))
      );

      await db.insert(liveAvatarMessages).values({ sessionId, role: "assistant", content: answer });
      await db.update(liveAvatarSessions)
        .set({ messagesCount: sql`${liveAvatarSessions.messagesCount} + 2` })
        .where(eq(liveAvatarSessions.id, sessionId));

      res.json({ answer });
    } catch (err) { next(err); }
  });

  app.post("/api/liveavatar/end", requireAuth, async (req, res, next) => {
    try {
      const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(req.body);
      const userId = req.supabaseUserId!;

      const [session] = await db.select().from(liveAvatarSessions)
        .where(and(eq(liveAvatarSessions.id, sessionId), eq(liveAvatarSessions.studentId, userId)));
      if (!session) return res.status(404).json({ message: "Sesión no encontrada" });

      const durationSeconds = session.startedAt
        ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0;

      await db.update(liveAvatarSessions).set({
        sessionStatus: "completed",
        endedAt: new Date(),
        durationSeconds,
      }).where(eq(liveAvatarSessions.id, sessionId));

      res.json({ success: true, durationSeconds });
    } catch (err) { next(err); }
  });

  app.get("/api/liveavatar/history/:courseId", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const courseId = (req.params.courseId as string);
      const sessions = await db.select().from(liveAvatarSessions)
        .where(and(eq(liveAvatarSessions.studentId, userId), eq(liveAvatarSessions.courseId, courseId)))
        .orderBy(desc(liveAvatarSessions.createdAt));
      res.json(sessions);
    } catch (err) { next(err); }
  });

  // ==================== PRIVATE SESSIONS (DAILY.CO) ====================

  app.get("/api/instructor-session-config/:instructorId", requireAuth, async (req, res, next) => {
    try {
      const instructorId = (req.params.instructorId as string);
      const [config] = await db.select().from(instructorSessionConfig)
        .where(eq(instructorSessionConfig.instructorId, instructorId));
      res.json(config || null);
    } catch (err) { next(err); }
  });

  app.put("/api/instructor-session-config", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId));
      if (!acct.length || (!acct[0].isInstructor && acct[0].userRole !== "socio_instructor" && !["admin", "superadmin"].includes(acct[0].userRole))) return res.status(403).json({ message: "Solo instructores" });

      const schema = z.object({
        acceptsPrivateSessions: z.boolean(),
        sessionTypes: z.array(z.object({
          name: z.string(),
          durationMinutes: z.number().min(15).max(240),
          priceMxn: z.number().min(0),
          description: z.string().optional(),
        })).optional(),
        bioForSessions: z.string().max(1000).optional(),
        specialties: z.array(z.string()).optional(),
      });
      const data = schema.parse(req.body);

      const [existing] = await db.select().from(instructorSessionConfig)
        .where(eq(instructorSessionConfig.instructorId, userId));

      if (existing) {
        const [updated] = await db.update(instructorSessionConfig)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(instructorSessionConfig.instructorId, userId))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db.insert(instructorSessionConfig)
          .values({ instructorId: userId, ...data })
          .returning();
        res.json(created);
      }
    } catch (err) { next(err); }
  });

  app.get("/api/instructor-availability/:instructorId", requireAuth, async (req, res, next) => {
    try {
      const slots = await db.select().from(instructorAvailability)
        .where(and(
          eq(instructorAvailability.instructorId, (req.params.instructorId as string)),
          eq(instructorAvailability.isActive, true)
        ));
      res.json(slots);
    } catch (err) { next(err); }
  });

  app.put("/api/instructor-availability", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId));
      if (!acct.length || (!acct[0].isInstructor && acct[0].userRole !== "socio_instructor" && !["admin", "superadmin"].includes(acct[0].userRole))) return res.status(403).json({ message: "Solo instructores" });

      const schema = z.object({
        slots: z.array(z.object({
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string(),
          endTime: z.string(),
          timezone: z.string().optional(),
        })),
      });
      const { slots } = schema.parse(req.body);

      await db.delete(instructorAvailability).where(eq(instructorAvailability.instructorId, userId));

      if (slots.length > 0) {
        await db.insert(instructorAvailability).values(
          slots.map(s => ({ instructorId: userId, ...s }))
        );
      }

      const result = await db.select().from(instructorAvailability)
        .where(eq(instructorAvailability.instructorId, userId));
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/private-sessions", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId));
      if (!acct.length || (!acct[0].isInstructor && acct[0].userRole !== "socio_instructor" && !["admin", "superadmin"].includes(acct[0].userRole))) return res.status(403).json({ message: "Solo instructores" });

      const schema = z.object({
        courseId: z.string().optional(),
        sessionType: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        scheduledDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        timezone: z.string().optional(),
        durationMinutes: z.number().min(15).max(240),
        priceMxn: z.number().min(0),
        maxStudents: z.number().min(1).max(50).optional(),
      });
      const data = schema.parse(req.body);

      const instructorPayout = +(data.priceMxn * 0.50).toFixed(2);
      const ceduverseCommission = +(data.priceMxn * 0.50).toFixed(2);

      if (!dailyService.isConfigured) return res.status(503).json({ message: "Videollamadas no configuradas" });

      const room = await dailyService.createRoom({
        isPrivate: true,
        maxParticipants: (data.maxStudents || 1) + 1,
        expiresInSeconds: 86400,
      });

      const ownerToken = await dailyService.createMeetingToken({
        roomName: room.name,
        userName: "Instructor",
        isOwner: true,
      });

      const [session] = await db.insert(privateSessions).values({
        instructorId: userId,
        courseId: data.courseId,
        sessionType: data.sessionType,
        title: data.title,
        description: data.description,
        scheduledDate: data.scheduledDate,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone || "America/Monterrey",
        durationMinutes: data.durationMinutes,
        priceMxn: data.priceMxn.toString(),
        instructorPayoutMxn: instructorPayout.toString(),
        ceduverseCommissionMxn: ceduverseCommission.toString(),
        maxStudents: data.maxStudents || 1,
        dailyRoomName: room.name,
        dailyRoomUrl: room.url,
        dailyRoomToken: ownerToken,
        sessionStatus: "scheduled",
        createdBy: userId,
      }).returning();

      res.json(session);
    } catch (err) { next(err); }
  });

  app.get("/api/private-sessions", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acct = await db.select().from(accounts).where(eq(accounts.id, userId));
      const isInstructor = acct.length && (acct[0].isInstructor || acct[0].userRole === "socio_instructor" || ["admin", "superadmin"].includes(acct[0].userRole));

      let sessions;
      if (isInstructor) {
        sessions = await db.select().from(privateSessions)
          .where(eq(privateSessions.instructorId, userId))
          .orderBy(desc(privateSessions.createdAt));
      } else {
        const participations = await db.select().from(sessionParticipants)
          .where(eq(sessionParticipants.studentId, userId));
        const sessionIds = participations.map(p => p.sessionId);
        if (sessionIds.length === 0) return res.json([]);
        sessions = await db.select().from(privateSessions)
          .where(inArray(privateSessions.id, sessionIds))
          .orderBy(desc(privateSessions.createdAt));
      }
      const sanitized = sessions.map(s => {
        const { dailyRoomToken, ...safe } = s;
        return isInstructor && s.instructorId === userId ? s : safe;
      });
      res.json(sanitized);
    } catch (err) { next(err); }
  });

  app.get("/api/private-sessions/available", requireAuth, async (req, res, next) => {
    try {
      const sessions = await db.select().from(privateSessions)
        .where(eq(privateSessions.sessionStatus, "scheduled"))
        .orderBy(asc(privateSessions.scheduledDate));

      const sessionsWithInstructor = await Promise.all(sessions.map(async (s) => {
        const [user] = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, s.instructorId));
        const enrolled = await db.select({ count: count() }).from(sessionParticipants)
          .where(eq(sessionParticipants.sessionId, s.id));
        return {
          ...s,
          dailyRoomToken: undefined,
          instructorName: user?.fullName?.trim() || "Instructor",
          enrolledCount: enrolled[0]?.count || 0,
        };
      }));

      res.json(sessionsWithInstructor);
    } catch (err) { next(err); }
  });

  app.post("/api/private-sessions/:id/book", requireAuth, async (req, res, next) => {
    try {
      const sessionId = (req.params.id as string);
      const userId = req.supabaseUserId!;

      const [session] = await db.select().from(privateSessions).where(eq(privateSessions.id, sessionId));
      if (!session) return res.status(404).json({ message: "Sesión no encontrada" });
      if (session.sessionStatus !== "scheduled") return res.status(400).json({ message: "Sesión no disponible" });
      if (session.instructorId === userId) return res.status(400).json({ message: "No puedes inscribirte en tu propia sesión" });

      const existing = await db.select().from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.studentId, userId)));
      if (existing.length) return res.status(400).json({ message: "Ya estás inscrito en esta sesión" });

      const enrolled = await db.select({ count: count() }).from(sessionParticipants)
        .where(eq(sessionParticipants.sessionId, sessionId));
      if ((enrolled[0]?.count || 0) >= session.maxStudents) {
        return res.status(400).json({ message: "Sesión llena" });
      }

      const [participant] = await db.insert(sessionParticipants).values({
        sessionId,
        studentId: userId,
        paymentStatus: "confirmed",
        paymentAmountMxn: session.priceMxn,
      }).returning();

      res.json(participant);
    } catch (err) { next(err); }
  });

  app.get("/api/private-sessions/:id/join", requireAuth, async (req, res, next) => {
    try {
      const sessionId = (req.params.id as string);
      const userId = req.supabaseUserId!;

      const [session] = await db.select().from(privateSessions).where(eq(privateSessions.id, sessionId));
      if (!session) return res.status(404).json({ message: "Sesión no encontrada" });

      if (session.instructorId === userId) {
        return res.json({ roomUrl: session.dailyRoomUrl, token: session.dailyRoomToken, role: "instructor" });
      }

      const [participant] = await db.select().from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.studentId, userId)));
      if (!participant) return res.status(403).json({ message: "No estás inscrito en esta sesión" });

      if (!dailyService.isConfigured || !session.dailyRoomName) {
        return res.status(503).json({ message: "Sala no disponible" });
      }

      const [userRow] = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, userId));
      const userName = userRow?.fullName?.trim() || "Estudiante";

      const token = await dailyService.createMeetingToken({
        roomName: session.dailyRoomName,
        userName,
        isOwner: false,
      });

      await db.update(sessionParticipants).set({ joinedAt: new Date() })
        .where(eq(sessionParticipants.id, participant.id));

      res.json({ roomUrl: session.dailyRoomUrl, token, role: "student" });
    } catch (err) { next(err); }
  });

  app.post("/api/private-sessions/:id/end", requireAuth, async (req, res, next) => {
    try {
      const sessionId = (req.params.id as string);
      const userId = req.supabaseUserId!;

      const [session] = await db.select().from(privateSessions).where(eq(privateSessions.id, sessionId));
      if (!session) return res.status(404).json({ message: "Sesión no encontrada" });
      if (session.instructorId !== userId) return res.status(403).json({ message: "Solo el instructor puede finalizar" });

      await db.update(privateSessions).set({
        sessionStatus: "completed",
        updatedAt: new Date(),
      }).where(eq(privateSessions.id, sessionId));

      if (session.dailyRoomName) {
        try { await dailyService.deleteRoom(session.dailyRoomName); } catch {}
      }

      res.json({ success: true });
    } catch (err) { next(err); }
  });

  app.post("/api/private-sessions/:id/cancel", requireAuth, async (req, res, next) => {
    try {
      const sessionId = (req.params.id as string);
      const userId = req.supabaseUserId!;

      const [session] = await db.select().from(privateSessions).where(eq(privateSessions.id, sessionId));
      if (!session) return res.status(404).json({ message: "Sesión no encontrada" });
      if (session.instructorId !== userId && session.createdBy !== userId) {
        return res.status(403).json({ message: "No tienes permisos para cancelar" });
      }

      await db.update(privateSessions).set({
        sessionStatus: "cancelled",
        updatedAt: new Date(),
      }).where(eq(privateSessions.id, sessionId));

      if (session.dailyRoomName) {
        try { await dailyService.deleteRoom(session.dailyRoomName); } catch {}
      }

      res.json({ success: true });
    } catch (err) { next(err); }
  });

  app.post("/api/instructor-reviews", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const schema = z.object({
        instructorId: z.string().uuid(),
        sessionId: z.string().uuid().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      });
      const data = schema.parse(req.body);

      const [review] = await db.insert(instructorReviews).values({
        instructorId: data.instructorId,
        studentId: userId,
        sessionId: data.sessionId,
        rating: data.rating,
        comment: data.comment,
      }).returning();

      res.json(review);
    } catch (err) { next(err); }
  });

  app.get("/api/instructor-reviews/:instructorId", requireAuth, async (req, res, next) => {
    try {
      const reviews = await db.select().from(instructorReviews)
        .where(eq(instructorReviews.instructorId, (req.params.instructorId as string)))
        .orderBy(desc(instructorReviews.createdAt));

      const reviewsWithNames = await Promise.all(reviews.map(async (r) => {
        const [student] = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, r.studentId));
        return { ...r, studentName: student?.fullName?.trim() || "Estudiante" };
      }));

      const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      res.json({ reviews: reviewsWithNames, averageRating: +avg.toFixed(1), totalReviews: reviews.length });
    } catch (err) { next(err); }
  });
}
