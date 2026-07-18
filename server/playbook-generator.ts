import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import { storage } from "./storage";
import { coursePlaybooks, type StudioCourse, type StudioModule } from "@shared/schema";
import { assembleReferences, hasValidExerciseCount, type PlaybookExercise } from "@shared/playbook-assemble";

export interface PlaybookContent {
  objetivos: string[];
  resumen: string[];
  estrategias: string[];
  preguntas: string[];
}

export interface BuiltPlaybook {
  content: PlaybookContent;
  exercises: PlaybookExercise[];
  references: string[];
}

const PLAYBOOK_TOOL = {
  name: "entregar_playbook",
  description: "Entrega el contenido del Playbook del curso: objetivos, resumen, estrategias, preguntas de reflexión y 3-5 ejercicios de campo.",
  input_schema: {
    type: "object" as const,
    properties: {
      objetivos: { type: "array", items: { type: "string" }, description: "3-5 objetivos de aprendizaje del curso" },
      resumen: { type: "array", items: { type: "string" }, description: "4-6 puntos clave del contenido del curso" },
      estrategias: { type: "array", items: { type: "string" }, description: "3-5 estrategias/jugadas prácticas para aplicar el tema" },
      preguntas: { type: "array", items: { type: "string" }, description: "3-4 preguntas de reflexión" },
      exercises: {
        type: "array",
        description: "3 a 5 ejercicios de campo: acciones concretas que el alumno aplica en su trabajo y documenta con una foto",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            instruction: { type: "string", description: "Qué hacer y qué fotografiar como evidencia" },
          },
          required: ["title", "instruction"],
        },
      },
    },
    required: ["objetivos", "resumen", "estrategias", "preguntas", "exercises"],
  },
};

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function fallbackPlaybook(course: StudioCourse, modules: StudioModule[]): BuiltPlaybook {
  // Sin IA disponible (o IA falló/devolvió algo inválido): playbook mínimo REAL
  // construido del contentHtml de los módulos — nunca vacío, nunca inventado
  // ([[feedback_no_silent_degradation]], [[feedback_no_claims_falsos_contenido]]).
  const plainText = modules
    .map((m) => m.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
    .join(" ");
  const sentences = plainText.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20).slice(0, 6);
  const resumen = sentences.length > 0 ? sentences : [`Repasa el contenido de "${course.title}" módulo por módulo.`];

  const baseExercises: PlaybookExercise[] = modules.slice(0, 3).map((m, i) => ({
    index: i,
    title: `Aplica: ${m.title}`,
    instruction: `Aplica en tu trabajo lo aprendido en "${m.title}" y toma una foto como evidencia de que lo hiciste.`,
  }));
  const exercises: PlaybookExercise[] = baseExercises.length >= 3
    ? baseExercises
    : [
        { index: 0, title: `Aplica: ${course.title}`, instruction: `Aplica en tu trabajo un concepto de "${course.title}" y toma una foto como evidencia.` },
        { index: 1, title: "Compártelo con tu equipo", instruction: "Explica a un compañero lo que aprendiste y toma una foto del momento." },
        { index: 2, title: "Documenta el antes/después", instruction: "Toma una foto de tu área de trabajo mostrando el cambio aplicado." },
      ];

  return {
    content: {
      objetivos: [`Aplicar en el trabajo lo aprendido en "${course.title}".`],
      resumen,
      estrategias: [`Revisa el módulo correspondiente de "${course.title}" antes de cada ejercicio de campo.`],
      preguntas: ["¿Cómo aplicaste esto en tu puesto de trabajo?", "¿Qué cambiarías la próxima vez?"],
    },
    exercises,
    references: assembleReferences(modules),
  };
}

async function generateWithClaude(course: StudioCourse, modules: StudioModule[]): Promise<BuiltPlaybook | null> {
  const client = getAnthropicClient();
  if (!client) {
    console.error(`[playbook-generator] ANTHROPIC_API_KEY no configurada: usando playbook mínimo real para "${course.slug}".`);
    return null;
  }
  if (modules.length === 0) {
    console.error(`[playbook-generator] Curso "${course.slug}" sin módulos: usando playbook mínimo real.`);
    return null;
  }

  const contentDigest = modules
    .map((m) => `## ${m.title}\n${m.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500)}`)
    .join("\n\n")
    .slice(0, 12000);

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `Eres el Tutor IA de Ceduverse. Generas el "Playbook" de un curso: un libro de jugadas estilo fútbol americano con objetivos, resumen, estrategias, preguntas de reflexión y 3-5 EJERCICIOS DE CAMPO que el alumno aplica en su trabajo real y documenta con una foto. Los ejercicios deben ser específicos y accionables (no genéricos), conectados al contenido real del curso. NO inventes normatividad ni datos: usa solo lo que está en el contenido proporcionado.`,
      messages: [{
        role: "user",
        content: `Curso: ${course.title}\n\nContenido de los módulos:\n${contentDigest}\n\nGenera el Playbook completo con la herramienta.`,
      }],
      tools: [PLAYBOOK_TOOL as any],
      tool_choice: { type: "tool", name: PLAYBOOK_TOOL.name },
    });
    const response = await stream.finalMessage();
    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | { type: "tool_use"; input: any }
      | undefined;
    if (!toolUse?.input) {
      console.error(`[playbook-generator] Claude no devolvió tool_use utilizable para "${course.slug}" (stop_reason=${response.stop_reason}).`);
      return null;
    }

    const raw = toolUse.input;
    const exercises: PlaybookExercise[] = (raw.exercises || []).map((e: any, i: number) => ({
      index: i,
      title: String(e.title || `Ejercicio ${i + 1}`),
      instruction: String(e.instruction || ""),
    }));

    if (!hasValidExerciseCount(exercises)) {
      console.error(`[playbook-generator] Claude devolvió ${exercises.length} ejercicios (fuera de 3-5) para "${course.slug}": usando playbook mínimo real.`);
      return null;
    }

    const content: PlaybookContent = {
      objetivos: raw.objetivos || [],
      resumen: raw.resumen || [],
      estrategias: raw.estrategias || [],
      preguntas: raw.preguntas || [],
    };

    // Aunque los ejercicios cuenten bien, un cuerpo pedagógico totalmente vacío
    // NO es una generación exitosa: aceptarla sería un "éxito" fabricado con un
    // playbook hueco. Mejor caer al mínimo real (derivado del contenido del
    // curso) que guardar vacío (regla §5: falla IA → versión mínima real, no vacía).
    const contentIsEmpty =
      content.objetivos.length === 0 &&
      content.resumen.length === 0 &&
      content.estrategias.length === 0 &&
      content.preguntas.length === 0;
    if (contentIsEmpty) {
      console.error(`[playbook-generator] Claude devolvió contenido pedagógico vacío para "${course.slug}": usando playbook mínimo real.`);
      return null;
    }

    return {
      content,
      exercises,
      // Las referencias NUNCA vienen del LLM: siempre las verbatim del curso.
      references: assembleReferences(modules),
    };
  } catch (err: any) {
    console.error(`[playbook-generator] Generación falló para "${course.slug}" [status=${err?.status ?? "n/a"}]: ${err?.message}. Usando playbook mínimo real.`);
    return null;
  }
}

/** Genera (o regenera) el playbook de un curso y lo persiste en course_playbooks.
 * Idempotente: se puede llamar varias veces para el mismo curso (upsert). */
export async function buildPlaybook(courseSlug: string): Promise<BuiltPlaybook> {
  const course = await storage.getStudioCourse(courseSlug);
  if (!course) throw new Error(`Curso no encontrado: ${courseSlug}`);
  const modules = await storage.getStudioModules(course.id);

  const built = (await generateWithClaude(course, modules)) || fallbackPlaybook(course, modules);

  await db.insert(coursePlaybooks)
    .values({
      courseSlug,
      content: built.content,
      exercises: built.exercises,
      references: built.references,
    })
    .onConflictDoUpdate({
      target: coursePlaybooks.courseSlug,
      set: {
        content: built.content,
        exercises: built.exercises,
        references: built.references,
        generatedAt: new Date(),
      },
    });

  return built;
}
