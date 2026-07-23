import type { Express } from "express";
import { and, asc, eq } from "drizzle-orm";
import { requireAuth, requireInstructor } from "../auth";
import { db } from "../db";
import {
  instructorCourses,
  instructorCourseModules,
  instructorCourseReferences,
  instructorModuleQuotes,
} from "@shared/schema";
import { extractYoutubeId } from "../lib/youtube-id";
import { validateCitations, findModulesCiting } from "../lib/course-citations";
import { sanitizeCourseHtml } from "../lib/course-html";

// El curso debe pertenecer a quien llama. Se resuelve SIEMPRE contra la base:
// nunca se confía en un id de instructor que venga del cliente. Curso ajeno o
// inexistente responden igual (404) para no confirmar que existe.
async function ownedCourse(courseId: string, userId: string) {
  const [course] = await db
    .select()
    .from(instructorCourses)
    .where(and(eq(instructorCourses.id, courseId), eq(instructorCourses.instructorId, userId)));
  return course ?? null;
}

async function refIdsOf(courseId: string): Promise<string[]> {
  const rows = await db
    .select({ id: instructorCourseReferences.id })
    .from(instructorCourseReferences)
    .where(eq(instructorCourseReferences.courseId, courseId));
  return rows.map((r) => r.id);
}

async function ownedModule(courseId: string, moduleId: string, userId: string) {
  const course = await ownedCourse(courseId, userId);
  if (!course) return null;
  const [mod] = await db.select().from(instructorCourseModules).where(
    and(eq(instructorCourseModules.id, moduleId), eq(instructorCourseModules.courseId, course.id)));
  return mod ?? null;
}

export function registerInstructorCursosRoutes(app: Express) {
  // ---------------------------------------------------------------- módulos

  app.get("/api/instructor/my-courses/:id/modules", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const modules = await db
        .select()
        .from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id))
        .orderBy(asc(instructorCourseModules.order));
      res.json(modules);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses/:id/modules", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const { title, description, durationMin, contentHtml, youtubeUrls } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ message: "El titulo del modulo es obligatorio" });
      }

      const ids: string[] = [];
      for (const raw of (youtubeUrls || []) as string[]) {
        const id = extractYoutubeId(raw);
        if (!id) return res.status(400).json({ message: `No se reconocio un video de YouTube en: ${raw}` });
        ids.push(id);
      }

      const clean = sanitizeCourseHtml(contentHtml || "");
      const check = validateCitations(clean, await refIdsOf(course.id));
      if (!check.ok) {
        return res.status(400).json({
          message: "El texto cita referencias que no existen en la bibliografia de este curso",
          missing: check.missing,
        });
      }

      const existing = await db
        .select({ order: instructorCourseModules.order })
        .from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id));
      const nextOrder = existing.length === 0 ? 1 : Math.max(...existing.map((m) => m.order)) + 1;

      const [created] = await db.insert(instructorCourseModules).values({
        courseId: course.id,
        order: nextOrder,
        title,
        description: description ?? null,
        durationMin: durationMin ?? null,
        contentHtml: clean,
        youtubeIds: ids,
      }).returning();

      res.status(201).json(created);
    } catch (err) { next(err); }
  });

  // ORDEN OBLIGATORIO: /modules/reorder va ANTES que /modules/:moduleId.
  // Express toma la primera ruta que coincide, así que si :moduleId se registra
  // primero captura la palabra "reorder" como si fuera un id y el reordenamiento
  // nunca se ejecuta.
  app.patch("/api/instructor/my-courses/:id/modules/reorder", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const { moduleIds } = req.body as { moduleIds: string[] };
      if (!Array.isArray(moduleIds)) return res.status(400).json({ message: "moduleIds debe ser un arreglo" });

      const own = await db.select({ id: instructorCourseModules.id })
        .from(instructorCourseModules)
        .where(eq(instructorCourseModules.courseId, course.id));
      const ownIds = new Set(own.map((m) => m.id));
      if (moduleIds.length !== ownIds.size || moduleIds.some((id) => !ownIds.has(id))) {
        return res.status(400).json({ message: "La lista debe contener exactamente los modulos de este curso" });
      }

      for (let i = 0; i < moduleIds.length; i++) {
        await db.update(instructorCourseModules)
          .set({ order: i + 1, updatedAt: new Date() })
          .where(eq(instructorCourseModules.id, moduleIds[i]));
      }
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id/modules/:moduleId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const [mod] = await db.select().from(instructorCourseModules).where(
        and(eq(instructorCourseModules.id, req.params.moduleId as string), eq(instructorCourseModules.courseId, course.id)));
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });

      const { title, description, durationMin, contentHtml, youtubeUrls } = req.body;
      const patch: Record<string, unknown> = { updatedAt: new Date() };

      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (durationMin !== undefined) patch.durationMin = durationMin;

      if (youtubeUrls !== undefined) {
        const ids: string[] = [];
        for (const raw of youtubeUrls as string[]) {
          const id = extractYoutubeId(raw);
          if (!id) return res.status(400).json({ message: `No se reconocio un video de YouTube en: ${raw}` });
          ids.push(id);
        }
        patch.youtubeIds = ids;
      }

      if (contentHtml !== undefined) {
        const clean = sanitizeCourseHtml(contentHtml);
        const check = validateCitations(clean, await refIdsOf(course.id));
        if (!check.ok) {
          return res.status(400).json({
            message: "El texto cita referencias que no existen en la bibliografia de este curso",
            missing: check.missing,
          });
        }
        patch.contentHtml = clean;
      }

      const [updated] = await db.update(instructorCourseModules)
        .set(patch)
        .where(eq(instructorCourseModules.id, mod.id))
        .returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id/modules/:moduleId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const deleted = await db.delete(instructorCourseModules).where(
        and(eq(instructorCourseModules.id, req.params.moduleId as string), eq(instructorCourseModules.courseId, course.id))
      ).returning();
      if (deleted.length === 0) return res.status(404).json({ message: "Modulo no encontrado" });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ----------------------------------------------------------- bibliografía

  app.get("/api/instructor/my-courses/:id/references", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      const refs = await db.select().from(instructorCourseReferences)
        .where(eq(instructorCourseReferences.courseId, course.id));
      res.json(refs);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses/:id/references", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const { authors, year, title, source, url, verifiedByInstructor } = req.body;
      if (!authors || !title) {
        return res.status(400).json({ message: "Autores y titulo son obligatorios" });
      }

      // La verificación la declara el instructor. Nada la marca automáticamente.
      const verified = verifiedByInstructor === true;

      const [created] = await db.insert(instructorCourseReferences).values({
        courseId: course.id,
        authors,
        year: year ?? null,
        title,
        source: source ?? null,
        url: url ?? null,
        verifiedByInstructor: verified,
        verifiedAt: verified ? new Date() : null,
      }).returning();

      res.status(201).json(created);
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id/references/:refId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const [ref] = await db.select().from(instructorCourseReferences).where(
        and(eq(instructorCourseReferences.id, req.params.refId as string), eq(instructorCourseReferences.courseId, course.id)));
      if (!ref) return res.status(404).json({ message: "Referencia no encontrada" });

      const { authors, year, title, source, url, verifiedByInstructor } = req.body;
      const patch: Record<string, unknown> = {};
      if (authors !== undefined) patch.authors = authors;
      if (year !== undefined) patch.year = year;
      if (title !== undefined) patch.title = title;
      if (source !== undefined) patch.source = source;
      if (url !== undefined) patch.url = url;
      if (verifiedByInstructor !== undefined) {
        patch.verifiedByInstructor = verifiedByInstructor === true;
        patch.verifiedAt = verifiedByInstructor === true ? new Date() : null;
      }

      const [updated] = await db.update(instructorCourseReferences)
        .set(patch)
        .where(eq(instructorCourseReferences.id, ref.id))
        .returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id/references/:refId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const course = await ownedCourse(req.params.id as string, req.supabaseUserId!);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const [ref] = await db.select().from(instructorCourseReferences).where(
        and(eq(instructorCourseReferences.id, req.params.refId as string), eq(instructorCourseReferences.courseId, course.id)));
      if (!ref) return res.status(404).json({ message: "Referencia no encontrada" });

      // Borrar una referencia citada dejaría citas huérfanas en el texto: se avisa
      // en qué módulos está usada en vez de romperlo por dentro.
      const modules = await db.select({
        id: instructorCourseModules.id,
        title: instructorCourseModules.title,
        contentHtml: instructorCourseModules.contentHtml,
      }).from(instructorCourseModules).where(eq(instructorCourseModules.courseId, course.id));

      const citing = findModulesCiting(ref.id, modules);
      if (citing.length > 0) {
        return res.status(409).json({
          message: "Esta referencia esta citada en el texto. Quita las citas antes de borrarla.",
          modules: citing,
        });
      }

      await db.delete(instructorCourseReferences).where(eq(instructorCourseReferences.id, ref.id));
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // ------------------------------------------------------- frases destacadas
  // Una frase destacada es un recuadro con una cita textual y su atribución.
  // NO liga a la bibliografía: eso son las marcas [[ref:uuid]] del texto.

  app.get("/api/instructor/my-courses/:id/modules/:moduleId/quotes", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id as string, req.params.moduleId as string, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });
      const quotes = await db.select().from(instructorModuleQuotes)
        .where(eq(instructorModuleQuotes.moduleId, mod.id))
        .orderBy(asc(instructorModuleQuotes.order));
      res.json(quotes);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses/:id/modules/:moduleId/quotes", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id as string, req.params.moduleId as string, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });

      const { text, attribution } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "El texto de la frase es obligatorio" });
      }

      const existing = await db.select({ order: instructorModuleQuotes.order })
        .from(instructorModuleQuotes).where(eq(instructorModuleQuotes.moduleId, mod.id));
      const nextOrder = existing.length === 0 ? 1 : Math.max(...existing.map((q) => q.order)) + 1;

      const [created] = await db.insert(instructorModuleQuotes).values({
        moduleId: mod.id, order: nextOrder, text, attribution: attribution ?? null,
      }).returning();
      res.status(201).json(created);
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id/modules/:moduleId/quotes/:quoteId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id as string, req.params.moduleId as string, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });

      const [quote] = await db.select().from(instructorModuleQuotes).where(
        and(eq(instructorModuleQuotes.id, req.params.quoteId as string), eq(instructorModuleQuotes.moduleId, mod.id)));
      if (!quote) return res.status(404).json({ message: "Frase no encontrada" });

      const { text, attribution } = req.body;
      const patch: Record<string, unknown> = {};
      if (text !== undefined) patch.text = text;
      if (attribution !== undefined) patch.attribution = attribution;

      const [updated] = await db.update(instructorModuleQuotes).set(patch)
        .where(eq(instructorModuleQuotes.id, quote.id)).returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id/modules/:moduleId/quotes/:quoteId", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const mod = await ownedModule(req.params.id as string, req.params.moduleId as string, req.supabaseUserId!);
      if (!mod) return res.status(404).json({ message: "Modulo no encontrado" });
      const deleted = await db.delete(instructorModuleQuotes).where(
        and(eq(instructorModuleQuotes.id, req.params.quoteId as string), eq(instructorModuleQuotes.moduleId, mod.id))
      ).returning();
      if (deleted.length === 0) return res.status(404).json({ message: "Frase no encontrada" });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });
}
