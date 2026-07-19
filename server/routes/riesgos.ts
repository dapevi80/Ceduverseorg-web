import type { Express } from "express";
import multer from "multer";
import crypto from "crypto";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { riskFindings, teamUsers, teams, users, profiles, studioEnrollments } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { r2Storage } from "../services/r2-storage";
import { assembleReferences } from "@shared/playbook-assemble";
import {
  EVIDENCE_MAX_MB,
  isImageMimetype,
  extensionForMimetype,
  safeEvidenceContentType,
  validateEvidenceFile,
} from "../lib/playbook-upload";
import { toCompanyView, findingPhotoKey, type FindingRow } from "../lib/risk-anonymity";
import { pickAllowedNorm } from "../lib/norm-validate";
import { suggestNorm } from "../risk-norm-suggest";
import { getEmpresaAdminTeam } from "./empresa";

// Detector de riesgos — endpoints del trabajador (Task 5 del plan
// docs/superpowers/plans/2026-07-18-detector-riesgos.md). Ver el spec
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md, en particular
// §4 (flujo), §6 (anonimato como regla de servidor) y §12 (manejo de errores).
//
// Este archivo NUNCA construye la respuesta de la empresa/hallazgo a mano ni
// con un spread de la fila cruda: toCompanyView() (server/lib/risk-anonymity.ts)
// es la única puerta que decide qué campos salen cuando anonymous=true. Ver
// esa pieza para el razonamiento completo de por qué existe así.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RIESGO_FILE_FILTER_ERROR = "Solo se aceptan imágenes";

const riesgoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EVIDENCE_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isImageMimetype(file.mimetype)) cb(null, true);
    else cb(new Error(RIESGO_FILE_FILTER_ERROR));
  },
});

/** Traduce fallos de multer (tamaño, mimetype) a 400 explícito en vez de dejarlos
 * caer al handler genérico de errores (500) — mismo patrón que
 * server/routes/playbook.ts handleEvidenceUpload. */
function handleRiesgoUpload(req: any, res: any, next: any) {
  riesgoUpload.single("photo")(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: `La foto no puede pesar más de ${EVIDENCE_MAX_MB}MB` });
    }
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message || "Archivo inválido" });
    }
    if (err instanceof Error && err.message === RIESGO_FILE_FILTER_ERROR) {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  });
}

/** El equipo AL QUE PERTENECE el trabajador que reporta — a diferencia de
 * getEmpresaAdminTeam (server/routes/empresa.ts), aquí cualquier rol de
 * membresía cuenta (member/admin/empresa_rh): quien reporta un riesgo no
 * necesita ser admin de su empresa, solo trabajar ahí. orderBy fija el
 * resultado cuando alguien pertenece a más de un equipo. */
async function resolveWorkerTeam(userId: string) {
  const [membership] = await db.select({ teamId: teamUsers.teamId })
    .from(teamUsers)
    .where(eq(teamUsers.userId, userId))
    .orderBy(teamUsers.teamId)
    .limit(1);
  if (!membership) return null;
  const [team] = await db.select().from(teams).where(eq(teams.id, membership.teamId));
  return team || null;
}

/** Referencias reales permitidas para la sugerencia/confirmación de norma
 * (spec §7, cero invención). Con curso: las de ESE curso. Sin curso: la
 * unión de las de los cursos que el trabajador ha tomado (studio_enrollments,
 * source='studio'), para que el canal fuera de un curso siga sin poder
 * inventar una norma que no viene de ningún contenido real que el trabajador
 * haya estudiado. Sin cursos tomados → lista vacía → pickAllowedNorm nunca
 * encuentra coincidencia → norma vacía (válido, spec §7). */
async function resolveAllowedNormRefs(userId: string, courseSlug: string | null): Promise<string[]> {
  if (courseSlug) {
    const course = await storage.getStudioCourse(courseSlug);
    if (!course) return [];
    const modules = await storage.getStudioModules(course.id);
    return assembleReferences(modules);
  }

  const enrollments = await db.select({ courseIdentifier: studioEnrollments.courseIdentifier })
    .from(studioEnrollments)
    .where(and(eq(studioEnrollments.userId, userId), eq(studioEnrollments.source, "studio")));
  if (enrollments.length === 0) return [];

  const slugs = Array.from(new Set(enrollments.map((e) => e.courseIdentifier)));
  const seen = new Set<string>();
  const refs: string[] = [];
  for (const slug of slugs) {
    const course = await storage.getStudioCourse(slug);
    if (!course) continue;
    const modules = await storage.getStudioModules(course.id);
    for (const ref of assembleReferences(modules)) {
      if (!seen.has(ref)) {
        seen.add(ref);
        refs.push(ref);
      }
    }
  }
  return refs;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/** Fila cruda de risk_findings + los datos de reportante que toCompanyView
 * necesita para decidir si mostrar el nombre — nunca se arma la respuesta al
 * cliente a partir de esto directamente, siempre pasa por toCompanyView(). */
async function toFindingRow(row: typeof riskFindings.$inferSelect): Promise<FindingRow> {
  const [profile] = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, row.userId));
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, row.userId));
  return {
    id: row.id,
    userId: row.userId,
    anonymous: row.anonymous,
    description: row.description,
    normRef: row.normRef,
    status: row.status,
    photoKey: row.photoKey,
    createdAt: row.createdAt,
    reporterName: profile?.fullName ?? null,
    reporterEmail: user?.email ?? null,
  };
}

export function registerRiesgosRoutes(app: Express) {
  // Crear un hallazgo. Orden de operaciones (deliberado, ver spec §12):
  // 1) validar TODO lo que no requiere escribir nada (archivo, descripción,
  //    anonymous, curso, EQUIPO DEL TRABAJADOR) — sin equipo, 400 honesto y
  //    ninguna escritura, ni en R2 ni en la base;
  // 2) subir la foto a R2 SOLO después de que el reporte ya se sabe válido;
  // 3) insertar en risk_findings SOLO después de que la subida a R2 tuvo éxito.
  // Así una falla de R2 nunca deja un hallazgo huérfano (fila sin foto), y una
  // falla de validación nunca deja un objeto huérfano en R2 (nada se sube
  // hasta que la validación completa — incluida la del equipo — ya pasó).
  app.post("/api/riesgos", requireAuth, handleRiesgoUpload, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;

      const fileCheck = validateEvidenceFile(req.file);
      if (!fileCheck.ok) return res.status(400).json({ message: fileCheck.message });

      const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
      if (!description) return res.status(400).json({ message: "Se requiere describir el hallazgo" });

      const anonymous = parseBoolean(req.body.anonymous);
      if (anonymous === null) {
        return res.status(400).json({ message: "Se requiere indicar si el reporte es anónimo" });
      }

      const rawCourseSlug = typeof req.body.courseSlug === "string" ? req.body.courseSlug.trim() : "";
      let courseSlug: string | null = null;
      if (rawCourseSlug) {
        const course = await storage.getStudioCourse(rawCourseSlug);
        if (!course) return res.status(400).json({ message: "Curso no encontrado" });
        courseSlug = course.slug;
      }

      // Sin empresa → mensaje honesto, nada se escribe (ni foto ni fila).
      const team = await resolveWorkerTeam(userId);
      if (!team) {
        return res.status(400).json({ message: "Esta función requiere pertenecer a una empresa" });
      }

      // La norma que manda el cliente NUNCA se guarda tal cual: solo se acepta
      // si coincide EXACTO con una referencia real disponible para este
      // trabajador (del curso, o de sus cursos tomados si reportó fuera de uno).
      const allowedRefs = await resolveAllowedNormRefs(userId, courseSlug);
      const rawNormRef = typeof req.body.normRef === "string" ? req.body.normRef : null;
      const normRef = pickAllowedNorm(rawNormRef, allowedRefs);

      if (!r2Storage.isConfigured) {
        return res.status(503).json({ message: "Almacenamiento de fotos no configurado" });
      }

      // El id se genera aquí (no lo asigna el default de la base) porque
      // findingPhotoKey lo necesita para construir la llave ANTES del insert
      // — subir primero, insertar después (spec §12: nunca un hallazgo
      // apuntando a una foto que no se guardó).
      const findingId = crypto.randomUUID();
      const ext = extensionForMimetype(req.file!.mimetype);
      const key = findingPhotoKey(findingId, ext);
      await r2Storage.uploadBuffer(req.file!.buffer, key, req.file!.mimetype);

      const [inserted] = await db.insert(riskFindings).values({
        id: findingId,
        userId,
        anonymous,
        teamId: team.id,
        courseSlug,
        photoKey: key,
        description,
        normRef,
        status: "nuevo",
        pointsAwarded: 0,
      }).returning();

      const row = await toFindingRow(inserted);
      res.status(201).json({ finding: toCompanyView(row) });
    } catch (err) { next(err); }
  });

  // Sugerencia de norma (spec §7): la IA propone, siempre acotada a
  // referencias reales; el trabajador confirma o corrige, pero solo entre
  // `opciones` — la validación real de lo que termine guardado ocurre en
  // POST /api/riesgos, no aquí (este endpoint solo informa).
  app.post("/api/riesgos/sugerir-norma", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
      if (!description) return res.status(400).json({ message: "Se requiere describir el hallazgo" });

      const rawCourseSlug = typeof req.body.courseSlug === "string" ? req.body.courseSlug.trim() : "";
      const courseSlug = rawCourseSlug || null;

      const opciones = await resolveAllowedNormRefs(userId, courseSlug);
      const normRef = await suggestNorm(description, opciones);
      res.json({ normRef, opciones });
    } catch (err) { next(err); }
  });

  // "Mis hallazgos": SOLO los del propio usuario (WHERE user_id = req.supabaseUserId),
  // anónimos incluidos — el trabajador siempre puede ver su propio historial y
  // puntos aunque haya reportado sin firmar. Esta vista NO pasa por
  // toCompanyView (esa es la proyección para OTROS/la empresa): aquí no hay
  // fuga posible porque el dueño de la fila es quien la está pidiendo, así
  // que se puede mostrar más detalle (puntos, resolución) del que ve la empresa.
  app.get("/api/riesgos/mios", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const rows = await db.select().from(riskFindings)
        .where(eq(riskFindings.userId, userId))
        .orderBy(desc(riskFindings.createdAt));

      res.json({
        hallazgos: rows.map((r) => ({
          id: r.id,
          anonymous: r.anonymous,
          description: r.description,
          normRef: r.normRef,
          status: r.status,
          courseSlug: r.courseSlug,
          createdAt: r.createdAt,
          photoRef: r.id,
          pointsAwarded: r.pointsAwarded,
          resolutionNote: r.resolutionNote,
          resolvedAt: r.resolvedAt,
        })),
      });
    } catch (err) { next(err); }
  });

  // Proxy autenticado de la foto del hallazgo — nunca se expone la URL pública
  // de R2 ni la llave. Autorizado si el solicitante es el autor, O si es
  // admin/empresa_rh del equipo AL QUE PERTENECE EL HALLAZGO (row.teamId,
  // nunca un team_id que mande el cliente): getEmpresaAdminTeam resuelve el
  // equipo del SOLICITANTE por su propia membresía real, y se compara contra
  // el team_id ya persistido en la fila.
  app.get("/api/riesgos/:id/foto", requireAuth, async (req, res, next) => {
    try {
      const id = String(req.params.id);
      if (!UUID_RE.test(id)) return res.status(404).json({ message: "Hallazgo no encontrado" });

      const [row] = await db.select().from(riskFindings).where(eq(riskFindings.id, id));
      if (!row) return res.status(404).json({ message: "Hallazgo no encontrado" });

      const requesterId = req.supabaseUserId!;
      let allowed = requesterId === row.userId;
      if (!allowed) {
        const adminTeam = await getEmpresaAdminTeam(requesterId);
        allowed = !!adminTeam && adminTeam.id === row.teamId;
      }
      if (!allowed) return res.status(403).json({ message: "No tienes acceso a esta foto" });

      if (!r2Storage.isConfigured) {
        return res.status(503).json({ message: "Almacenamiento de fotos no configurado" });
      }

      const obj = await r2Storage.getObject(row.photoKey);
      if (!obj) return res.status(404).json({ message: "Foto no encontrada" });

      res.set("Content-Type", safeEvidenceContentType(obj.contentType));
      res.set("X-Content-Type-Options", "nosniff");
      if (obj.contentLength) res.set("Content-Length", String(obj.contentLength));
      // Privada: nunca cacheable por proxies/CDN compartidos ni por el navegador
      // en disco compartido.
      res.set("Cache-Control", "private, no-store");
      const stream = obj.body as any;
      stream.on("error", (streamErr: unknown) => {
        if (res.headersSent) {
          console.error("R2 stream error after headers sent (foto de riesgo):", streamErr);
          return;
        }
        next(streamErr);
      });
      stream.pipe(res);
    } catch (err) { next(err); }
  });
}
