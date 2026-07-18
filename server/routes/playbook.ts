import type { Express } from "express";
import multer from "multer";
import crypto from "crypto";
import { requireAuth } from "../auth";
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
import { EVIDENCE_MAX_MB, isImageMimetype, extensionForMimetype, safeEvidenceContentType, validateEvidenceFile, shouldAwardCompletionBonus, evidencePointsToAward, isUniqueViolation } from "../lib/playbook-upload";
import { canViewEvidence } from "../lib/playbook-evidence-access";
import { shouldRetryFallbackPlaybook } from "../lib/playbook-retry";

/** UUID v4-ish check para no golpear la DB con un id de evidencia con formato inválido
 * (evita depender de que Postgres tire un error de sintaxis que llegaría como 500). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ruta pública (nunca la URL directa de R2) para servir una foto de evidencia — el
 * cliente siempre recibe esto en el campo `photoUrl`, autenticado por
 * GET /api/playbook/evidencia/:evidenceId/foto. */
function evidencePhotoPath(evidenceId: string): string {
  return `/api/playbook/evidencia/${evidenceId}/foto`;
}

const EVIDENCE_FILE_FILTER_ERROR = "Solo se aceptan imágenes";

const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EVIDENCE_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isImageMimetype(file.mimetype)) cb(null, true);
    else cb(new Error(EVIDENCE_FILE_FILTER_ERROR));
  },
});

/** Wraps multer's single-file upload so file-filter/size-limit failures come back as an
 * explicit 4xx instead of falling through to the app's generic 500 error handler
 * (multer.MulterError doesn't set err.status, so it would otherwise 500 — see
 * [[feedback_no_silent_degradation]]). Only the known rejection shapes (MulterError,
 * the fileFilter rejection above) become a 400 — any other error (e.g. a genuine
 * busboy/stream failure) still propagates to next(err) instead of being swallowed as
 * a generic 400. */
function handleEvidenceUpload(req: any, res: any, next: any) {
  evidenceUpload.single("photo")(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: `La foto no puede pesar más de ${EVIDENCE_MAX_MB}MB` });
    }
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message || "Archivo inválido" });
    }
    if (err instanceof Error && err.message === EVIDENCE_FILE_FILTER_ERROR) {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  });
}

/** IDs de usuarios miembros de un equipo — única fuente compartida para las dos
 * decisiones de PRIVACY que dependen de "quién es parte de este equipo": la lista de
 * evidencia de /api/empresa/playbook-evidencias y el proxy autenticado de foto. Antes
 * esta query vivía duplicada en ambos endpoints; una sola copia evita que diverjan. */
async function getTeamMemberIds(teamId: string): Promise<string[]> {
  const members = await db.select({ userId: teamUsers.userId })
    .from(teamUsers).where(eq(teamUsers.teamId, teamId));
  return members.map((m) => m.userId);
}

/** Lee (o genera) el playbook cacheado de un curso. C1: una fila cacheada con
 * source = 'fallback' NUNCA se trata como definitiva — se reintenta la
 * generación real cuando la fila lleva más del cooldown
 * (PLAYBOOK_FALLBACK_RETRY_COOLDOWN_MS) sin actualizarse, para no convertir un
 * fallo transitorio de Anthropic en contenido genérico permanente. El
 * cooldown evita reintentar (billable) en cada request mientras la falla
 * sigue vigente; buildPlaybook() siempre reescribe generatedAt, así que si el
 * reintento vuelve a caer en fallback el cooldown reinicia solo. */
async function getOrGeneratePlaybook(slug: string) {
  const [existing] = await db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, slug));
  if (!existing) {
    await buildPlaybook(slug);
    const [created] = await db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, slug));
    return created;
  }
  if (shouldRetryFallbackPlaybook(existing)) {
    await buildPlaybook(slug);
    const [retried] = await db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, slug));
    return retried;
  }
  return existing;
}

export function registerPlaybookRoutes(app: Express) {
  // requireAuth (I3): el playbook destila objetivos/resumen/estrategias del
  // contenido de los módulos del curso, y GET .../modules/:index ya exige
  // login para ese mismo contenido — dejar esta ruta anónima permitía leer
  // ese resumen sin cuenta/inscripción, y además dejaba disparar una
  // generación real (billable) por cualquier slug sin autenticar.
  app.get("/api/playbook/:slug", requireAuth, async (req, res, next) => {
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
          bucket.photoUrls.push(evidencePhotoPath(row.id));
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
          // C1: expone la procedencia para que el UI pueda distinguir un
          // playbook real de un fallback degradado (nunca lo trata como
          // silenciosamente equivalente).
          source: playbook.source,
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

      // I2 (antifarming): se decide ANTES de insertar si esta es la primera
      // evidencia de este (userId, courseSlug, exerciseIndex) — solo esa
      // otorga puntos (evidencePointsToAward, server/lib/playbook-upload.ts).
      // Subidas adicionales del mismo ejercicio se guardan igual (el álbum
      // muestra varias fotos por diseño) pero con points=0, así el endpoint
      // no puede loopearse para inflar puntos sin tope escribiendo objetos de
      // hasta 8MB en R2.
      const existingForExercise = await db.select().from(playbookEvidence)
        .where(and(
          eq(playbookEvidence.userId, userId),
          eq(playbookEvidence.courseSlug, slug),
          eq(playbookEvidence.exerciseIndex, exerciseIndex),
        ));
      const pointsToAward = evidencePointsToAward(existingForExercise.length === 0, PLAYBOOK_EVIDENCE_POINTS);

      // Sube primero, inserta después: si el upload falla, la excepción se propaga a
      // next(err) (500 explícito) y NUNCA se crea una fila de evidencia apuntando a un
      // archivo que no se guardó ([[feedback_no_silent_degradation]]).
      // El key incluye un token aleatorio (no Date.now(), adivinable) y la extensión
      // real del mimetype subido (no siempre .jpg) — nunca se persiste ni se devuelve
      // la URL pública de R2; solo este key privado, servido por el proxy autenticado.
      const token = crypto.randomBytes(16).toString("hex");
      const ext = extensionForMimetype(req.file!.mimetype);
      const key = `evidence/${slug}/${userId}/${exerciseIndex}-${token}.${ext}`;
      await r2Storage.uploadBuffer(req.file!.buffer, key, req.file!.mimetype);

      const [evidence] = await db.insert(playbookEvidence).values({
        userId,
        courseSlug: slug,
        exerciseIndex,
        photoKey: key,
        points: pointsToAward,
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
          try {
            achievement = await storage.createAchievement({
              slug: achSlug,
              name: `Playbook completado: ${playbookCourse?.title || slug}`,
              shortDescription: "Completaste todos los ejercicios de campo del Playbook",
              description: "Aplicaste en tu trabajo real todos los ejercicios de campo del Playbook del curso, documentados con evidencia fotográfica.",
              category: "Academy",
              value: PLAYBOOK_COMPLETION_BONUS,
              icon: "flame",
            });
          } catch (err) {
            if (!isUniqueViolation(err)) throw err;
            // Carrera: otro request concurrente ganó la creación del logro (colisión
            // en achievements.slug, único). Releer el que ya quedó persistido en vez
            // de convertir esto en un 500 — la evidencia de este request ya se guardó.
            achievement = await storage.getAchievementBySlug(achSlug);
            if (!achievement) throw err;
          }
        }
        const alreadyAwarded = (await storage.getUserAchievements(userId))
          .some((a) => a.achievementId === achievement.id);
        // Dedupe: el bono se otorga a lo más una vez por usuario+curso — volver a
        // subir evidencia (p.ej. re-subir un ejercicio ya completado) nunca lo repite.
        if (shouldAwardCompletionBonus(complete, alreadyAwarded)) {
          try {
            await storage.awardAchievement({
              userId,
              achievementId: achievement.id,
              isActive: true,
              status: "active",
              certType: "diploma",
            });
            bonusAwarded = true;
          } catch (err) {
            if (!isUniqueViolation(err)) throw err;
            // Carrera: otro request concurrente ya otorgó el bono (colisión en
            // uq_achievement_users_cert). El DB ya garantiza que no hay doble bono;
            // este request simplemente perdió la carrera — no es un error real, y la
            // fila de evidencia ya se insertó y comitió con éxito arriba.
            bonusAwarded = false;
          }
        }
      }

      res.status(201).json({
        evidence: { exerciseIndex: evidence.exerciseIndex, photoUrl: evidencePhotoPath(evidence.id), points: evidence.points, createdAt: evidence.createdAt },
        // I2: refleja honestamente lo que de verdad se otorgó (evidence.points,
        // ya decidido por evidencePointsToAward) — 0 en subidas adicionales del
        // mismo ejercicio, nunca el máximo fijo aunque no se haya otorgado.
        pointsAwarded: evidence.points,
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
        evidence: rows.map((r) => ({ exerciseIndex: r.exerciseIndex, photoUrl: evidencePhotoPath(r.id), points: r.points, createdAt: r.createdAt })),
      });
    } catch (err) { next(err); }
  });

  // requireAuth (I3): mismo motivo que GET /:slug — además de exponer
  // contenido gateado sin login, dejar esto anónimo permitía forzar el
  // render de pdfkit+QR (no cacheado) en cada request, CPU sin costo alguno
  // para quien lo dispara. El navegador manda la cookie de sesión en
  // window.open (mismo origen), así que un alumno logueado sigue
  // descargando el PDF sin fricción.
  app.get("/api/playbook/:slug/export.pdf", requireAuth, async (req, res, next) => {
    try {
      const slug = String(req.params.slug);
      const course = await storage.getStudioCourse(slug);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const playbook = await getOrGeneratePlaybook(slug);
      if (!playbook) return res.status(503).json({ message: "No se pudo generar el playbook" });

      const pdf = await renderPlaybookPdf(
        { content: playbook.content as any, exercises: playbook.exercises as any, references: playbook.references as any, source: playbook.source as any },
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

      const memberIds = await getTeamMemberIds(team.id);
      if (memberIds.length === 0) return res.json({ team: { id: team.id, name: team.name }, evidence: [] });

      // Privacidad: SOLO evidencia de userIds que son miembros de team.id (obtenido de
      // getEmpresaTeam, ligado al propio equipo del solicitante) — WHERE userId IN memberIds.
      const rows = await db.select({
        id: playbookEvidence.id,
        userId: playbookEvidence.userId,
        courseSlug: playbookEvidence.courseSlug,
        exerciseIndex: playbookEvidence.exerciseIndex,
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

      const evidence = rows.map((r) => ({
        userId: r.userId,
        courseSlug: r.courseSlug,
        exerciseIndex: r.exerciseIndex,
        photoUrl: evidencePhotoPath(r.id),
        points: r.points,
        createdAt: r.createdAt,
        fullName: r.fullName,
        email: r.email,
      }));

      res.json({ team: { id: team.id, name: team.name }, evidence });
    } catch (err) { next(err); }
  });

  // Proxy autenticado de la foto de evidencia: nunca se expone la URL pública de R2.
  // Autorización (predicado puro testeado en server/lib/playbook-evidence-access.ts):
  // el dueño siempre puede verla; empresa/admin puede verla SOLO si el dueño es
  // miembro de su propio equipo (getEmpresaTeam del solicitante); cualquier otro caso
  // → 403. Un equipo ausente o vacío jamás se traduce en acceso.
  app.get("/api/playbook/evidencia/:evidenceId/foto", requireAuth, async (req, res, next) => {
    try {
      const evidenceId = String(req.params.evidenceId);
      if (!UUID_RE.test(evidenceId)) return res.status(404).json({ message: "Evidencia no encontrada" });

      const [row] = await db.select().from(playbookEvidence).where(eq(playbookEvidence.id, evidenceId));
      if (!row) return res.status(404).json({ message: "Evidencia no encontrada" });

      const requesterId = req.supabaseUserId!;
      let requesterTeamMemberIds: string[] | null = null;
      if (requesterId !== row.userId) {
        const team = await getEmpresaTeam(requesterId);
        if (team) {
          requesterTeamMemberIds = await getTeamMemberIds(team.id);
        }
      }

      const allowed = canViewEvidence({ requesterId, ownerId: row.userId, requesterTeamMemberIds });
      if (!allowed) return res.status(403).json({ message: "No tienes acceso a esta evidencia" });

      if (!r2Storage.isConfigured) {
        return res.status(503).json({ message: "Almacenamiento de evidencia no configurado" });
      }

      const obj = await r2Storage.getObject(row.photoKey);
      if (!obj) return res.status(404).json({ message: "Foto no encontrada" });

      // El Content-Type nunca se refleja tal cual desde lo guardado en DB — solo se
      // sirve un valor del mismo allowlist de subida (o application/octet-stream), y
      // nosniff evita que el navegador "adivine" un tipo ejecutable a partir de los
      // bytes aunque el Content-Type declarado sea otro (defensa en profundidad contra
      // el shape de stored-XSS descrito en playbook-upload.ts).
      res.set("Content-Type", safeEvidenceContentType(obj.contentType));
      res.set("X-Content-Type-Options", "nosniff");
      if (obj.contentLength) res.set("Content-Length", String(obj.contentLength));
      // Privada: nunca cacheable por proxies/CDNs compartidos ni por el navegador en
      // disco compartido — a diferencia de /audio/:filename, esto es contenido personal.
      res.set("Cache-Control", "private, no-store");
      const stream = obj.body as any;
      stream.on("error", (streamErr: unknown) => {
        // Una falla de R2 a mitad de stream no debe quedar como un 'error' sin manejar
        // en el proceso. Si ya se mandaron headers/bytes no hay forma de convertir esto
        // en un 5xx limpio (la respuesta ya empezó) — el error handler global también
        // chequea res.headersSent, pero se evita aquí ya el intento redundante de
        // responder dos veces.
        if (res.headersSent) {
          console.error("R2 stream error after headers sent (foto de evidencia):", streamErr);
          return;
        }
        next(streamErr);
      });
      stream.pipe(res);
    } catch (err) { next(err); }
  });
}
