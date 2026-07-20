import type { Express } from "express";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { coursePlaybooks } from "@shared/schema";
import { eq } from "drizzle-orm";
import { buildPlaybook } from "../playbook-generator";
import { shouldRetryFallbackPlaybook } from "../lib/playbook-retry";
import { gatherCuaderno } from "../cuaderno/gather";
import { renderCuadernoPdf } from "../cuaderno/render";

// El detector de riesgos (server/routes/riesgos.ts) reemplaza la actividad de
// campo de este archivo (spec docs/superpowers/specs/2026-07-18-detector-riesgos-design.md,
// plan Task 10: docs/superpowers/plans/2026-07-18-detector-riesgos.md). Los
// endpoints de evidencia (subida, álbum, proxy de foto, listado de la empresa)
// se retiraron aquí — quedan reemplazados por el flujo de hallazgos de
// riesgos.ts. Lo que SIGUE vivo: el contenido pedagógico del playbook
// (objetivos/resumen/estrategias/preguntas/referencias) y el export a PDF, que
// no dependían de la evidencia para nada.
//
// `course_playbooks.exercises` (generados por IA, server/playbook-generator.ts)
// no se descartan: el cliente los reencuadra de "tareas" a "señales de riesgo
// que puedes detectar" (spec §9) — este endpoint los sigue devolviendo tal
// cual, sólo que ya sin el estado de evidencia por ejercicio.

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

      res.json({
        course: { slug: course.slug, title: course.title, icon: course.icon },
        playbook: {
          content: playbook.content,
          exercises: playbook.exercises,
          references: playbook.references,
          generatedAt: playbook.generatedAt,
          // C1: expone la procedencia para que el UI pueda distinguir un
          // playbook real de un fallback degradado (nunca lo trata como
          // silenciosamente equivalente).
          source: playbook.source,
        },
      });
    } catch (err) { next(err); }
  });

  // requireAuth (I3): mismo motivo que GET /:slug — además de exponer
  // contenido gateado sin login, dejar esto anónimo permitía forzar el
  // render de pdfkit+QR (no cacheado) en cada request, CPU sin costo alguno
  // para quien lo dispara. El navegador manda la cookie de sesión en
  // window.open (mismo origen), así que un alumno logueado sigue
  // descargando el PDF sin fricción.
  //
  // El Cuaderno de estudio (server/cuaderno/) reemplaza al playbook resumen
  // como PDF descargable (spec docs/superpowers/specs/2026-07-18-cuaderno-estudio-design.md,
  // plan Task 9): trae el curso completo, módulo por módulo, y el
  // `lectureHtml` de CADA módulo se resuelve por alumno (personalizado si el
  // Tutor IA ya lo generó para este usuario, base con aviso si no) — es la
  // **edición personal** de quien pide la descarga, nunca de un userId
  // arbitrario. `req.supabaseUserId` (puesto por requireAuth) es la única
  // fuente del alumno; jamás se toma de query/params.
  app.get("/api/playbook/:slug/export.pdf", requireAuth, async (req, res, next) => {
    try {
      const slug = String(req.params.slug);
      const course = await storage.getStudioCourse(slug);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const userId = req.supabaseUserId!;
      const datos = await gatherCuaderno(userId, slug);
      const pdf = await renderCuadernoPdf(datos);
      // Nunca se manda una descarga vacía o a medias como si fuera éxito
      // ([[feedback_no_silent_degradation]]): un PDF real siempre empieza
      // con la cabecera `%PDF`.
      if (!pdf || pdf.length === 0 || pdf.subarray(0, 4).toString("latin1") !== "%PDF") {
        throw new Error("Cuaderno: el PDF generado salió vacío o corrupto");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="cuaderno-${slug}.pdf"`);
      res.send(pdf);
    } catch (err) { next(err); }
  });
}
