import type { Express } from "express";
import multer from "multer";
import crypto from "crypto";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import {
  riskFindings,
  teamUsers,
  teams,
  users,
  profiles,
  studioEnrollments,
  achievementUsers,
  achievements,
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { r2Storage } from "../services/r2-storage";
import { assembleReferences } from "@shared/playbook-assemble";
import { totalPoints } from "@shared/playbook-points";
import {
  EVIDENCE_MAX_MB,
  isImageMimetype,
  extensionForMimetype,
  safeEvidenceContentType,
  validateEvidenceFile,
  isUniqueViolation,
} from "../lib/playbook-upload";
import { toCompanyView, findingPhotoKey, type FindingRow } from "../lib/risk-anonymity";
import { pickAllowedNorm } from "../lib/norm-validate";
import { resolveTeamSelection } from "../lib/team-selection";
import { suggestNorm } from "../risk-norm-suggest";
import {
  canTransition,
  validateTransition,
  pointsForTransition,
  isRiskStatus,
  RIESGO_VALIDADO_PUNTOS,
  type RiskStatus,
} from "../lib/risk-status";
import { riskAchievementThreshold, riskAchievementSlug } from "../lib/risk-achievements";
import { getEmpresaAdminTeamIds } from "./empresa";

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
 * server/routes/playbook.ts handleEvidenceUpload.
 *
 * Factory por nombre de campo: la subida del reporte usa el campo "photo" y
 * el cierre de la empresa usa "resolutionPhoto" (multipart opcional) —
 * misma allowlist/límite/errores para ambas, una sola copia de la lógica de
 * traducción de errores. */
function handleRiesgoImageUpload(fieldName: string) {
  return (req: any, res: any, next: any) => {
    riesgoUpload.single(fieldName)(req, res, (err: unknown) => {
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
  };
}

const handleRiesgoUpload = handleRiesgoImageUpload("photo");

/** Los equipos A LOS QUE PERTENECE el trabajador que reporta — a diferencia
 * de getEmpresaAdminTeamIds (server/routes/empresa.ts), aquí cualquier rol
 * de membresía cuenta (member/admin/empresa_rh): quien reporta un riesgo no
 * necesita ser admin de su empresa, solo trabajar ahí.
 *
 * Devuelve TODOS los team_id, sin elegir uno: la elección (cuando hay más de
 * uno) la hace resolveTeamSelection (server/lib/team-selection.ts) con un
 * teamId explícito del cliente, nunca aquí en silencio — ver el comentario
 * de esa función para el porqué (un worker que cambió de empleador no debe
 * poder reportar, sin darse cuenta, al empleador viejo). */
async function getWorkerTeamIds(userId: string): Promise<string[]> {
  const memberships = await db.select({ teamId: teamUsers.teamId })
    .from(teamUsers)
    .where(eq(teamUsers.userId, userId));
  return memberships.map((m) => m.teamId);
}

/** id + name de un conjunto de equipos, para presentarle al cliente la
 * lista de empresas entre las que debe elegir (mis-empresas, y el 400 de
 * ambigüedad de POST /api/riesgos). */
async function listTeams(teamIds: string[]): Promise<{ id: string; name: string }[]> {
  if (teamIds.length === 0) return [];
  const rows = await db.select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(inArray(teams.id, teamIds));
  return rows;
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
    resolvedAt: row.resolvedAt,
    resolutionNote: row.resolutionNote,
    resolutionPhotoKey: row.resolutionPhotoKey,
  };
}

export function registerRiesgosRoutes(app: Express) {
  // Crear un hallazgo. Orden de operaciones (deliberado, ver spec §12):
  // 1) validar TODO lo que no requiere escribir nada (archivo, descripción,
  //    anonymous, curso, EQUIPO DEL TRABAJADOR — incluida la ambigüedad de
  //    equipo cuando pertenece a más de uno) — sin equipo resuelto sin
  //    ambigüedad, 400 honesto y ninguna escritura, ni en R2 ni en la base;
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

      // Equipo del trabajador: con una sola membresía se usa esa (como
      // antes). Con más de una, NUNCA se elige en silencio — se exige un
      // teamId explícito, validado contra las membresías reales de este
      // mismo usuario (nunca se confía en lo que mande el cliente tal cual).
      // Ver server/lib/team-selection.ts para el porqué. Esto ocurre ANTES
      // de tocar R2: un 400 de ambigüedad nunca deja un objeto huérfano.
      const workerTeamIds = await getWorkerTeamIds(userId);
      const rawTeamId = typeof req.body.teamId === "string" ? req.body.teamId.trim() : "";
      const teamSelection = resolveTeamSelection(workerTeamIds, rawTeamId || null);
      if (!teamSelection.ok) {
        if (teamSelection.error === "no_membership") {
          return res.status(400).json({ message: "Esta función requiere pertenecer a una empresa" });
        }
        const empresas = await listTeams(workerTeamIds);
        return res.status(400).json({
          message: "Perteneces a varias empresas; especifica a cuál reportar este hallazgo",
          empresas,
        });
      }
      const teamId = teamSelection.teamId;

      // La norma que manda el cliente NUNCA se guarda tal cual: solo se acepta
      // si coincide EXACTO con una referencia real disponible para este
      // trabajador (del curso, o de sus cursos tomados si reportó fuera de uno).
      const allowedRefs = await resolveAllowedNormRefs(userId, courseSlug);
      const rawNormRef = typeof req.body.normRef === "string" ? req.body.normRef : null;
      const normRef = pickAllowedNorm(rawNormRef, allowedRefs);
      // El cliente sí mandó una norma no vacía, pero no coincidió con
      // ninguna referencia real permitida: se guarda null (correcto, cero
      // invención), pero la respuesta debe decirlo explícito — si no, el
      // cliente ve 201 y asume que su norma se guardó, y la UI queda
      // desincronizada en silencio con lo que realmente hay en la base.
      const normRefRejected = rawNormRef != null && rawNormRef.trim().length > 0 && normRef === null;

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
        teamId,
        courseSlug,
        photoKey: key,
        description,
        normRef,
        status: "nuevo",
        pointsAwarded: 0,
      }).returning();

      const row = await toFindingRow(inserted);
      res.status(201).json({ finding: toCompanyView(row), normRefRejected });
    } catch (err) { next(err); }
  });

  // Empresas del trabajador que reporta — el cliente la usa para: (a) saber
  // si necesita pedirle al trabajador que elija equipo antes de reportar
  // (más de una empresa), y (b) construir el selector con id+name cuando
  // POST /api/riesgos responde 400 por ambigüedad. Cualquier rol de
  // membresía cuenta, igual que getWorkerTeamIds: reportar un riesgo no
  // requiere ser admin de la empresa, solo trabajar ahí.
  app.get("/api/riesgos/mis-empresas", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const teamIds = await getWorkerTeamIds(userId);
      const empresas = await listTeams(teamIds);
      res.json({ empresas });
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
  //
  // Task 9 (docs/superpowers/plans/2026-07-18-detector-riesgos.md): además de
  // la lista, esta misma respuesta trae el total acumulado de puntos del
  // trabajador (spec, decisión del dueño del producto 2026-07-19) — se
  // extiende ESTE endpoint en vez de agregar uno nuevo porque "Mis hallazgos"
  // es la única pantalla que hoy necesita el número, y la página ya pide
  // esta ruta para pintar la lista; un segundo roundtrip solo para el total
  // no le compra nada al cliente. totalPoints() (shared/playbook-points.ts)
  // agrega dos fuentes — PURA, sin decidir aquí cómo sumarlas, solo qué
  // filas trae cada una:
  //   1) risk_findings.points_awarded de este usuario (0 en las no
  //      validadas — pointsForTransition solo paga al entrar a "atendido",
  //      así que sumarlas tal cual ya excluye lo no validado);
  //   2) achievements.value vía achievement_users de este usuario — aquí
  //      viven, sin tabla aparte, los certificados/diplomas de curso que el
  //      dueño del producto pidió contar.
  // Task 10 retiró la tercera fuente (playbook_evidence.points — la actividad
  // de campo del playbook, reemplazada por este mismo flujo de hallazgos): ya
  // no se lee esa tabla aquí. Ver shared/playbook-points.ts para el porqué.
  // El desglose por fuente se manda también (points.breakdown): la UI de hoy
  // solo pinta el total, pero el dueño puede querer premiar fuentes distinto
  // más adelante y no debe requerir otro cambio de contrato para eso.
  app.get("/api/riesgos/mios", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const rows = await db.select().from(riskFindings)
        .where(eq(riskFindings.userId, userId))
        .orderBy(desc(riskFindings.createdAt));

      const achievementRows = await db.select({ value: achievements.value })
        .from(achievementUsers)
        .innerJoin(achievements, eq(achievementUsers.achievementId, achievements.id))
        .where(eq(achievementUsers.userId, userId));

      const findingsPoints = rows.map((r) => r.pointsAwarded);
      const achievementValues = achievementRows.map((a) => a.value);

      const findingsSum = findingsPoints.reduce((s, p) => s + p, 0);
      const achievementSum = achievementValues.reduce((s, v) => s + v, 0);

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
          // Solo un booleano, nunca la llave — igual que hasSolutionPhoto en
          // toCompanyView (server/lib/risk-anonymity.ts). El trabajador pide
          // la imagen real vía GET /api/riesgos/:id/foto-solucion (más abajo
          // en este archivo), que sí es SU proxy autenticado (a diferencia
          // de /api/empresa/riesgos/:id/foto-solucion, que solo autoriza
          // admins).
          hasSolutionPhoto: Boolean(r.resolutionPhotoKey && r.resolutionPhotoKey.trim().length > 0),
        })),
        points: {
          total: totalPoints({ findingsPoints, achievementValues }),
          breakdown: {
            findings: findingsSum,
            achievements: achievementSum,
          },
        },
      });
    } catch (err) { next(err); }
  });

  // Proxy autenticado de la foto del hallazgo — nunca se expone la URL pública
  // de R2 ni la llave. Autorizado si el solicitante es el autor, O si es
  // admin/empresa_rh del equipo AL QUE PERTENECE EL HALLAZGO (row.teamId,
  // nunca un team_id que mande el cliente): getEmpresaAdminTeamIds resuelve
  // TODOS los equipos que el SOLICITANTE administra por membresía real, y se
  // prueba pertenencia contra ese conjunto — no un solo equipo "resuelto"
  // arbitrariamente. Un admin de varias empresas (A y B) debe poder ver
  // fotos de hallazgos de cualquiera de las dos, no solo de la que gane un
  // desempate interno que al admin ni le consta.
  app.get("/api/riesgos/:id/foto", requireAuth, async (req, res, next) => {
    try {
      const id = String(req.params.id);
      if (!UUID_RE.test(id)) return res.status(404).json({ message: "Hallazgo no encontrado" });

      const [row] = await db.select().from(riskFindings).where(eq(riskFindings.id, id));
      if (!row) return res.status(404).json({ message: "Hallazgo no encontrado" });

      const requesterId = req.supabaseUserId!;
      let allowed = requesterId === row.userId;
      if (!allowed) {
        const adminTeamIds = await getEmpresaAdminTeamIds(requesterId);
        allowed = adminTeamIds.includes(row.teamId);
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
      // Si el cliente aborta la descarga a medias (navegación fuera,
      // conexión caída), "close" en req dispara igual — sin esto el stream
      // de R2 se queda leyendo hacia un response que ya nadie consume.
      const destroyStream = () => {
        if (typeof stream.destroy === "function") stream.destroy();
      };
      req.on("close", destroyStream);
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

  // Proxy autenticado de la foto de SOLUCIÓN para el trabajador que reportó
  // el hallazgo (Task 9). Existe /api/empresa/riesgos/:id/foto-solucion más
  // abajo, pero ESE solo autoriza admins — el reportante (que no es admin de
  // su empresa la mayoría de las veces) quedaría sin forma de ver la foto
  // que la empresa subió al corregir su propio reporte, justo el dato que
  // hace que valga la pena seguir reportando. Mismo patrón que
  // GET /api/riesgos/:id/foto: autorizado si el solicitante es el autor
  // (row.userId), O si administra el equipo del hallazgo — nunca se expone
  // la URL pública de R2 ni la llave.
  app.get("/api/riesgos/:id/foto-solucion", requireAuth, async (req, res, next) => {
    try {
      const id = String(req.params.id);
      if (!UUID_RE.test(id)) return res.status(404).json({ message: "Hallazgo no encontrado" });

      const [row] = await db.select().from(riskFindings).where(eq(riskFindings.id, id));
      if (!row) return res.status(404).json({ message: "Hallazgo no encontrado" });
      if (!row.resolutionPhotoKey) {
        return res.status(404).json({ message: "Este hallazgo todavía no tiene foto de solución" });
      }

      const requesterId = req.supabaseUserId!;
      let allowed = requesterId === row.userId;
      if (!allowed) {
        const adminTeamIds = await getEmpresaAdminTeamIds(requesterId);
        allowed = adminTeamIds.includes(row.teamId);
      }
      if (!allowed) return res.status(403).json({ message: "No tienes acceso a esta foto" });

      if (!r2Storage.isConfigured) {
        return res.status(503).json({ message: "Almacenamiento de fotos no configurado" });
      }

      const obj = await r2Storage.getObject(row.resolutionPhotoKey);
      if (!obj) return res.status(404).json({ message: "Foto no encontrada" });

      res.set("Content-Type", safeEvidenceContentType(obj.contentType));
      res.set("X-Content-Type-Options", "nosniff");
      if (obj.contentLength) res.set("Content-Length", String(obj.contentLength));
      // Privada: nunca cacheable por proxies/CDN compartidos ni por el navegador
      // en disco compartido.
      res.set("Cache-Control", "private, no-store");
      const stream = obj.body as any;
      const destroyStream = () => {
        if (typeof stream.destroy === "function") stream.destroy();
      };
      req.on("close", destroyStream);
      stream.on("error", (streamErr: unknown) => {
        if (res.headersSent) {
          console.error("R2 stream error after headers sent (foto de solución, trabajador):", streamErr);
          return;
        }
        next(streamErr);
      });
      stream.pipe(res);
    } catch (err) { next(err); }
  });

  // ---------------------------------------------------------------------
  // Endpoints de la empresa (Task 6 del plan
  // docs/superpowers/plans/2026-07-18-detector-riesgos.md). Ver spec §4, §6,
  // §8, §12.
  //
  // Alcance: SIEMPRE por getEmpresaAdminTeamIds (plural) del SOLICITANTE —
  // TODAS las empresas que administra, nunca un solo equipo "resuelto"
  // arbitrariamente con orderBy+limit(1) (getEmpresaAdminTeam, singular, de
  // server/routes/empresa.ts). Ese resuelve-uno fue precisamente el bug que
  // 403'ba a un admin de varias empresas fuera de sus propios hallazgos: un
  // admin de A y B tiene acceso legítimo a ambas, y comparar contra un único
  // equipo elegido arbitrariamente niega en falso el acceso a la que no ganó
  // el desempate. Sin ningún equipo administrado → 403; jamás la lista de
  // otra empresa; jamás "todos los hallazgos".
  // ---------------------------------------------------------------------

  // Tablero de la empresa: hallazgos de TODAS las empresas que administra el
  // solicitante. Cada fila SIEMPRE pasa por toCompanyView (nunca se arma la
  // respuesta a mano ni con un spread del row — ver el comentario al inicio
  // del archivo y server/lib/risk-anonymity.ts): un hallazgo anónimo no
  // puede traer nombre, correo ni user id en ninguna parte de esta lista.
  app.get("/api/empresa/riesgos", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const adminTeamIds = await getEmpresaAdminTeamIds(userId);
      if (adminTeamIds.length === 0) {
        return res.status(403).json({ message: "No tienes una organización" });
      }

      const rows = await db.select().from(riskFindings)
        .where(inArray(riskFindings.teamId, adminTeamIds))
        .orderBy(desc(riskFindings.createdAt));

      const hallazgos = await Promise.all(rows.map(async (row) => toCompanyView(await toFindingRow(row))));
      res.json({ hallazgos });
    } catch (err) { next(err); }
  });

  // Cierra el ciclo del hallazgo (spec §4, §8, §12): en_revision -> atendido
  // (con foto de la corrección, acredita puntos) o descartado (con motivo,
  // 0 puntos); también permite reabrir atendido/descartado -> en_revision.
  //
  // Orden de operaciones deliberado — nada se escribe (ni en R2 ni en la
  // base) hasta que TODO lo anterior ya se validó:
  //   1) el solicitante administra al menos una empresa (si no, 403, nada
  //      tocado);
  //   2) el id tiene formato válido y el hallazgo existe (404 si no);
  //   3) el hallazgo pertenece a una de las empresas que administra el
  //      solicitante — comparado contra el team_id YA PERSISTIDO en la fila,
  //      NUNCA contra un teamId que mande el cliente (403 si no coincide);
  //   4) el estado destino tiene formato válido y la transición está
  //      permitida por canTransition (400 si no);
  //   5) si llegó un archivo, pasa la misma validación de imagen que la
  //      subida del trabajador (400 si no);
  //   6) validateTransition confirma que la evidencia que exige el estado
  //      destino ya está presente — usando un marcador (no la llave real,
  //      que aún no existe) si llegó una foto nueva, o la que el hallazgo ya
  //      tenía si se está re-cerrando sin volver a adjuntarla (400 si falta).
  // Solo después de que 1-6 pasaron se sube la foto nueva a R2 (si la hay) y
  // se actualiza la fila. Así una falla de validación nunca deja un objeto
  // huérfano en R2, y una falla de R2 nunca deja un hallazgo a medio
  // actualizar.
  app.patch(
    "/api/empresa/riesgos/:id",
    requireAuth,
    handleRiesgoImageUpload("resolutionPhoto"),
    async (req, res, next) => {
      try {
        const userId = req.supabaseUserId!;
        const id = String(req.params.id);
        if (!UUID_RE.test(id)) return res.status(404).json({ message: "Hallazgo no encontrado" });

        const adminTeamIds = await getEmpresaAdminTeamIds(userId);
        if (adminTeamIds.length === 0) {
          return res.status(403).json({ message: "No tienes una organización" });
        }

        const [row] = await db.select().from(riskFindings).where(eq(riskFindings.id, id));
        if (!row) return res.status(404).json({ message: "Hallazgo no encontrado" });

        // Membresía del hallazgo verificada por su team_id YA PERSISTIDO —
        // jamás por un teamId que mande el cliente en el body/query.
        if (!adminTeamIds.includes(row.teamId)) {
          return res.status(403).json({ message: "No tienes acceso a este hallazgo" });
        }

        const rawStatus = req.body.status;
        if (!isRiskStatus(rawStatus)) {
          return res.status(400).json({ message: "Estado inválido" });
        }
        const toStatus: RiskStatus = rawStatus;
        // row.status viene de la base, no del cliente, pero una fila con un
        // valor viejo/corrupto que ya no está en RISK_STATUSES no debe
        // colarse a TRANSITIONS[from] (undefined ahí truena con un 500). El
        // dato está mal, no la petición: 409, no 500.
        if (!isRiskStatus(row.status)) {
          return res.status(409).json({ message: "El hallazgo tiene un estado inválido; contacta soporte" });
        }
        const fromStatus: RiskStatus = row.status;

        if (!canTransition(fromStatus, toStatus)) {
          return res.status(400).json({ message: `No se puede pasar de "${fromStatus}" a "${toStatus}".` });
        }

        if (req.file) {
          const fileCheck = validateEvidenceFile(req.file);
          if (!fileCheck.ok) return res.status(400).json({ message: fileCheck.message });
        }

        const resolutionNoteInput = typeof req.body.resolutionNote === "string" ? req.body.resolutionNote.trim() : "";
        // Reabrir (destino "en_revision") nunca toca la nota existente — se
        // conserva tal cual para que, si se vuelve a cerrar con el MISMO
        // significado (ver abajo), siga disponible sin tener que retipearla.
        //
        // Al cerrar (destino "atendido" o "descartado") solo se hereda la
        // nota existente cuando el destino es "descartado" — el único
        // estado que la exige, y el único caso legítimo de "reabrir y
        // volver a descartar sin repetir el motivo". Heredarla hacia
        // "atendido" es el bug que encontró la revisión: la nota de rechazo
        // de un descartado anterior aparecería como si explicara una
        // corrección real, y el registro de cumplimiento leería "corregido"
        // con el motivo de por qué se había descartado antes. Un destino de
        // cierre con significado distinto ("atendido") nunca hereda.
        const effectiveResolutionNote =
          toStatus === "en_revision"
            ? (row.resolutionNote ?? null)
            : resolutionNoteInput || (toStatus === "descartado" ? row.resolutionNote : null) || null;

        // Una foto de resolución solo cuenta como evidencia cuando el
        // DESTINO es "atendido" — permitir que una foto adjunta a un cierre
        // como "descartado" quede guardada en resolution_photo_key es
        // precisamente el hueco que la revisión encontró: descartar con foto
        // (para lo que sea) deja una llave no vacía que luego, al reabrir y
        // cerrar como atendido SIN foto nueva, validateTransition confunde
        // con evidencia real de corrección. Por eso, fuera de "atendido":
        // el marcador de validación es null (nunca cuenta como evidencia,
        // exista o no una llave previa) y más abajo la foto adjunta, si la
        // hay, ni se sube a R2 ni se persiste.
        const photoPresenceForValidation =
          toStatus === "atendido"
            ? (req.file ? "nueva-foto-pendiente-de-subir" : row.resolutionPhotoKey)
            : null;

        const transitionCheck = validateTransition(toStatus, {
          resolutionPhotoKey: photoPresenceForValidation,
          resolutionNote: effectiveResolutionNote,
        });
        if (!transitionCheck.ok) {
          return res.status(400).json({ message: transitionCheck.message });
        }

        const willUploadPhoto = Boolean(req.file) && toStatus === "atendido";

        if (!r2Storage.isConfigured && willUploadPhoto) {
          return res.status(503).json({ message: "Almacenamiento de fotos no configurado" });
        }

        // Todo validado — recién ahora se sube la foto nueva a R2, si la hay
        // y el destino es "atendido". La llave usa el id del hallazgo
        // (findingPhotoKey), igual que la foto original: nunca el user id de
        // quien la sube. Si llegó un archivo pero el destino no es
        // "atendido", se ignora deliberadamente: ni se sube a R2 (nada
        // huérfano) ni se guarda su llave (nada que luego se confunda con
        // evidencia de corrección).
        let resolutionPhotoKey = row.resolutionPhotoKey;
        if (willUploadPhoto) {
          const ext = extensionForMimetype(req.file!.mimetype);
          const key = findingPhotoKey(row.id, ext);
          await r2Storage.uploadBuffer(req.file!.buffer, key, req.file!.mimetype);
          resolutionPhotoKey = key;
        }

        const points = pointsForTransition(fromStatus, toStatus, row.pointsAwarded);
        const isClosing = toStatus === "atendido" || toStatus === "descartado";
        const now = new Date();

        const [updated] = await db.update(riskFindings)
          .set({
            status: toStatus,
            resolutionPhotoKey,
            resolutionNote: effectiveResolutionNote,
            // pointsForTransition ya devuelve 0 si alreadyAwarded > 0, así
            // que sumar aquí nunca duplica el pago aunque se reabra y se
            // vuelva a cerrar (Task 2, risk-status.ts).
            pointsAwarded: row.pointsAwarded + points,
            resolvedBy: isClosing ? userId : null,
            resolvedAt: isClosing ? now : null,
            updatedAt: now,
          })
          .where(eq(riskFindings.id, row.id))
          .returning();

        // El id ya se validó (existe, pertenece a una empresa administrada
        // por el solicitante) apenas unas líneas arriba, así que un
        // .returning() vacío aquí solo puede significar que la fila
        // desapareció entre el SELECT y este UPDATE (borrado concurrente) —
        // no algo que el cliente pueda corregir reenviando la misma
        // petición. Sin este guard, updated.userId de la siguiente sección
        // truena con un 500 poco claro.
        if (!updated) {
          return res.status(409).json({ message: "El hallazgo ya no existe; probablemente fue eliminado." });
        }

        // Logro acumulado (spec §8): solo se considera cuando ESTA
        // transición de verdad pagó puntos (points > 0) — reabrir y volver a
        // cerrar no debe re-disparar el conteo, porque pointsForTransition ya
        // devolvió 0 en ese caso. Mismo patrón tolerante a colisión única que
        // el bono de finalización del Playbook (server/routes/playbook.ts):
        // si dos cierres concurrentes chocan al crear el logro o al
        // otorgarlo, el perdedor de la carrera relee lo que ya quedó
        // persistido en vez de responder 500 — el hallazgo ya se actualizó
        // con éxito arriba, así que esta parte nunca debe tumbar la request.
        //
        // El slug otorgado (si lo hay) NUNCA se guarda en una variable que
        // llegue a la respuesta HTTP de este endpoint: ver el comentario
        // junto a res.json() más abajo para el porqué (CRITICAL — filtración
        // de conteo acumulado del reportante a la empresa).
        if (points > 0) {
          const validated = await db.select({ id: riskFindings.id }).from(riskFindings)
            .where(and(eq(riskFindings.userId, updated.userId), eq(riskFindings.status, "atendido")));
          const threshold = riskAchievementThreshold(validated.length);
          if (threshold !== null) {
            const achSlug = riskAchievementSlug(threshold);
            let achievement = await storage.getAchievementBySlug(achSlug);
            if (!achievement) {
              try {
                achievement = await storage.createAchievement({
                  slug: achSlug,
                  name: threshold === 1
                    ? "Detector de riesgos: primer hallazgo validado"
                    : `Detector de riesgos: ${threshold} hallazgos validados`,
                  shortDescription: "La empresa validó tus hallazgos de riesgo con evidencia de corrección",
                  description: "Reportaste incumplimientos reales en tu lugar de trabajo y la empresa los corrigió, documentando la evidencia.",
                  category: "Academy",
                  // Proporcional al umbral: el logro de 100 hallazgos
                  // representa muchísimo más esfuerzo/impacto sostenido que
                  // el del primero, y no debe valer lo mismo en el perfil
                  // del trabajador.
                  value: RIESGO_VALIDADO_PUNTOS * threshold,
                  icon: "shield-check",
                });
              } catch (err) {
                if (!isUniqueViolation(err)) throw err;
                // Carrera: otro request concurrente ganó la creación del
                // logro (colisión en achievements.slug, único). Relee el que
                // ya quedó persistido.
                achievement = await storage.getAchievementBySlug(achSlug);
                if (!achievement) throw err;
              }
            }
            const alreadyHasIt = (await storage.getUserAchievements(updated.userId))
              .some((a) => a.achievementId === achievement.id);
            if (!alreadyHasIt) {
              try {
                await storage.awardAchievement({
                  userId: updated.userId,
                  achievementId: achievement.id,
                  isActive: true,
                  status: "active",
                  certType: "diploma",
                });
              } catch (err) {
                if (!isUniqueViolation(err)) throw err;
                // Carrera: otro request concurrente ya otorgó el logro
                // (colisión en uq_achievement_users_cert). El hallazgo ya se
                // actualizó con éxito arriba — esto no es un error real.
              }
            }
          }
        }

        // El slug del logro otorgado arriba (si lo hay) NUNCA sale en esta
        // respuesta: es `detector-riesgos-<n>` donde n es el conteo GLOBAL Y
        // ACUMULADO de hallazgos validados del reportante — un dato derivado
        // del reportante, ni más ni menos que su nombre. Devolvérselo a la
        // empresa (que ve esta respuesta, no el trabajador) filtraría,
        // incluso en un reporte anónimo, cuántos hallazgos previos tiene esa
        // persona, y volvería identificables/vinculables entre sí sus
        // reportes anónimos en un taller chico. El logro SÍ se otorga arriba
        // (server-side); el trabajador lo ve en su propia vista
        // (GET /api/me/achievements), nunca aquí.
        const finalRow = await toFindingRow(updated);
        res.json({
          finding: toCompanyView(finalRow),
          pointsAwarded: points,
        });
      } catch (err) { next(err); }
    },
  );

  // Proxy autenticado de la foto de SOLUCIÓN (el riesgo ya corregido) —
  // mismo patrón que GET /api/riesgos/:id/foto: nunca se expone la URL
  // pública de R2 ni la llave, y el alcance se prueba contra
  // getEmpresaAdminTeamIds del solicitante (TODAS las empresas que
  // administra), nunca contra un solo equipo resuelto arbitrariamente ni
  // contra un team_id que mande el cliente.
  app.get("/api/empresa/riesgos/:id/foto-solucion", requireAuth, async (req, res, next) => {
    try {
      const id = String(req.params.id);
      if (!UUID_RE.test(id)) return res.status(404).json({ message: "Hallazgo no encontrado" });

      const [row] = await db.select().from(riskFindings).where(eq(riskFindings.id, id));
      if (!row) return res.status(404).json({ message: "Hallazgo no encontrado" });
      if (!row.resolutionPhotoKey) {
        return res.status(404).json({ message: "Este hallazgo todavía no tiene foto de solución" });
      }

      const requesterId = req.supabaseUserId!;
      const adminTeamIds = await getEmpresaAdminTeamIds(requesterId);
      // Explícito por simetría con GET /api/empresa/riesgos y PATCH
      // /api/empresa/riesgos/:id: sin esto el 403 de un solicitante sin
      // ninguna organización sale correcto solo por accidente
      // ([].includes(...) === false), no porque el código lo declare.
      if (adminTeamIds.length === 0 || !adminTeamIds.includes(row.teamId)) {
        return res.status(403).json({ message: "No tienes acceso a esta foto" });
      }

      if (!r2Storage.isConfigured) {
        return res.status(503).json({ message: "Almacenamiento de fotos no configurado" });
      }

      const obj = await r2Storage.getObject(row.resolutionPhotoKey);
      if (!obj) return res.status(404).json({ message: "Foto no encontrada" });

      res.set("Content-Type", safeEvidenceContentType(obj.contentType));
      res.set("X-Content-Type-Options", "nosniff");
      if (obj.contentLength) res.set("Content-Length", String(obj.contentLength));
      // Privada: nunca cacheable por proxies/CDN compartidos ni por el navegador
      // en disco compartido.
      res.set("Cache-Control", "private, no-store");
      const stream = obj.body as any;
      const destroyStream = () => {
        if (typeof stream.destroy === "function") stream.destroy();
      };
      req.on("close", destroyStream);
      stream.on("error", (streamErr: unknown) => {
        if (res.headersSent) {
          console.error("R2 stream error after headers sent (foto de solución):", streamErr);
          return;
        }
        next(streamErr);
      });
      stream.pipe(res);
    } catch (err) { next(err); }
  });
}
