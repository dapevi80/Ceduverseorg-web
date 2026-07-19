/**
 * Reunir los datos del Cuaderno de estudio (spec
 * docs/superpowers/specs/2026-07-18-cuaderno-estudio-design.md §5/§6.3).
 *
 * Este módulo NO dibuja nada ni llama a ninguna IA: sólo junta contenido que
 * ya existe en la base para un alumno y un curso. La pieza de riesgo real —
 * la decisión de qué contenido va en cada módulo— se aísla en
 * `pickModuleContent()`, pura y probada, separada de la lectura a la base
 * (`gatherCuaderno`).
 *
 * Regla central (§6.3, [[feedback_no_silent_degradation]]): el cuaderno es la
 * **edición personal** del alumno. Un módulo se marca `personalizado = true`
 * SÓLO cuando existe una fila de `generated_content` de ESE usuario, no es
 * stub (`isStub` falsy) y trae `lectureHtml` con contenido real (no vacío ni
 * sólo espacios). En cualquier otro caso —sin fila, stub, o `lectureHtml`
 * vacío— se usa el `contentHtml` base del curso y `personalizado = false`. El
 * composer (fuera de este módulo) es quien imprime el aviso explícito; este
 * módulo sólo entrega la bandera que lo dispara.
 *
 * Las piezas ligadas a la IA por-usuario (mapa mental, reflexiones,
 * autoevaluación, fuentes sugeridas) sólo existen cuando el módulo SÍ está
 * personalizado — no tiene sentido, y sería mezclar procedencias, adjuntarlas
 * a un `lectureHtml` base. Si no está personalizado, esas listas vienen
 * vacías (nunca inventadas).
 *
 * Las referencias (`studio_modules.references`) se imprimen SIEMPRE verbatim,
 * nunca desde el contenido generado — regla anti-invención que ya atrapó un
 * bug real (una URL gubernamental fabricada que se coló a un curso).
 *
 * Sin `course_playbooks` para el curso, el cuaderno se arma igual:
 * `guiaEstudio` queda `undefined` y `ejercicios` vacío — nunca se inventan.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { coursePlaybooks, generatedContent } from "@shared/schema";
import { storage } from "../storage";
import type { MindMap } from "./mindmap";

export interface ModuloCuaderno {
  index: number;
  title: string;
  description?: string;
  /** Personalizado o base — ver `pickModuleContent`. */
  lectureHtml: string;
  /** Manda el aviso del §6.3: false = el composer debe imprimir el aviso de respaldo. */
  personalizado: boolean;
  mindMap?: MindMap;
  reflections: string[];
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  /** Verbatim de `studio_modules.references`. */
  references: string[];
  suggestedSources: { title: string; url: string; type: string }[];
}

export interface DatosCuaderno {
  course: { slug: string; title: string; icon: string | null; instructor: string | null };
  alumno: { nombre: string };
  guiaEstudio?: { objetivos: string[]; resumen: string[]; estrategias: string[]; preguntas: string[] };
  ejercicios: { index: number; title: string; instruction: string }[];
  modulos: ModuloCuaderno[];
}

/**
 * Decide, para un módulo, si se usa el contenido personalizado del alumno o
 * el contenido base del curso. Pura: sin pdfkit, sin base de datos.
 *
 * - Sin fila de `generated_content` → base, `personalizado = false`.
 * - Fila con `isStub` verdadero → base, `personalizado = false` (un stub no
 *   es contenido real, aunque tenga texto de relleno en `lectureHtml`).
 * - Fila con `lectureHtml` vacío o sólo espacios → base, `personalizado =
 *   false` (fila a medio generar; nunca se presenta un hueco como personal).
 * - Fila completa y no-stub → esa `lectureHtml`, `personalizado = true`.
 */
export function pickModuleContent(
  generated: { lectureHtml: string | null; isStub: boolean | null } | undefined,
  baseHtml: string,
): { lectureHtml: string; personalizado: boolean } {
  if (!generated || generated.isStub || !generated.lectureHtml || !generated.lectureHtml.trim()) {
    return { lectureHtml: baseHtml, personalizado: false };
  }
  return { lectureHtml: generated.lectureHtml, personalizado: true };
}

/**
 * Junta todos los datos del cuaderno de un alumno para un curso: portada,
 * guía de estudio del `course_playbooks` (si existe), y un `ModuloCuaderno`
 * por cada `studio_modules`, resolviendo personalizado-vs-base con
 * `pickModuleContent`. Cero llamadas a IA — todo el contenido ya existe.
 */
export async function gatherCuaderno(userId: string, courseSlug: string): Promise<DatosCuaderno> {
  const course = await storage.getStudioCourse(courseSlug);
  if (!course) {
    throw new Error(`Cuaderno: curso no encontrado (slug=${courseSlug})`);
  }

  const [user, profile, modules, generatedRows, playbookRows] = await Promise.all([
    storage.getUser(userId),
    storage.getProfile(userId),
    storage.getStudioModules(course.id),
    db.select().from(generatedContent).where(
      and(eq(generatedContent.userId, userId), eq(generatedContent.courseSlug, courseSlug)),
    ),
    db.select().from(coursePlaybooks).where(eq(coursePlaybooks.courseSlug, courseSlug)),
  ]);

  const generatedByIndex = new Map(generatedRows.map((row) => [row.moduleIndex, row]));
  const playbook = playbookRows[0];

  const modulos: ModuloCuaderno[] = modules.map((mod) => {
    const generated = generatedByIndex.get(mod.moduleIndex);
    const { lectureHtml, personalizado } = pickModuleContent(generated, mod.contentHtml);

    const modulo: ModuloCuaderno = {
      index: mod.moduleIndex,
      title: mod.title,
      lectureHtml,
      personalizado,
      // Sólo un módulo personalizado tiene mapa/reflexiones/quiz/fuentes reales
      // del Tutor IA — atarlos a un `lectureHtml` base sería mezclar procedencias.
      reflections: personalizado ? (generated?.reflections ?? []) : [],
      quiz: personalizado ? ((generated?.adaptiveQuiz as ModuloCuaderno["quiz"] | null) ?? []) : [],
      // Verbatim, siempre de studio_modules — nunca del contenido generado.
      references: [...(mod.references ?? [])],
      suggestedSources: personalizado
        ? ((generated?.suggestedSources as ModuloCuaderno["suggestedSources"] | null) ?? [])
        : [],
    };
    if (mod.description) modulo.description = mod.description;
    if (personalizado && generated?.mindMap) modulo.mindMap = generated.mindMap as MindMap;
    return modulo;
  });

  return {
    course: { slug: course.slug, title: course.title, icon: course.icon, instructor: course.instructor },
    alumno: { nombre: profile?.fullName || user?.email?.split("@")[0] || "Alumno" },
    guiaEstudio: playbook?.content,
    ejercicios: playbook?.exercises ?? [],
    modulos,
  };
}
