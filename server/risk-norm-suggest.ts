// Sugerencia de norma del detector de riesgos — la mitad "IO" de la garantía
// anti-invención (spec §7). La mitad pura (la comparación exacta) vive en
// server/lib/norm-validate.ts; este archivo solo arma el prompt, llama al
// modelo y hace cumplir que lo que sale de aquí SIEMPRE pasó por
// pickAllowedNorm. El prompt es una petición al modelo; pickAllowedNorm es
// la garantía — por eso se aplica aquí, no se confía en que el modelo la
// respete.
//
// Mismo patrón de cliente Anthropic que server/ai-engine.ts (misma env var,
// mismo estilo de logging honesto: sin key / error / timeout / respuesta
// no parseable -> null, nunca una excepción que tumbe al llamador, nunca un
// valor inventado).

import Anthropic from "@anthropic-ai/sdk";
import { pickAllowedNorm } from "./lib/norm-validate";

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// Tool-use forzado (mismo truco que ai-engine.ts): el modelo entrega un
// objeto con schema fijo en vez de texto libre, así no hay JSON de texto
// que parsear ni riesgo de que se cuele prosa alrededor de la respuesta.
const SUGGEST_NORM_TOOL = {
  name: "elegir_norma",
  description:
    "Elige, de la lista de referencias reales entregada, la que mejor corresponde a la descripción del hallazgo — o ninguna si no aplica con claridad.",
  input_schema: {
    type: "object",
    properties: {
      candidate: {
        type: "string",
        description:
          'El texto EXACTO, carácter por carácter, de UNA entrada de la lista de referencias entregada (copia y pega, no reescribas ni completes) — o cadena vacía "" si ninguna referencia de la lista corresponde con claridad a la descripción. Nunca inventes una norma que no esté en la lista.',
      },
    },
    required: ["candidate"],
  },
};

function buildSystemPrompt(allowedRefs: string[]): string {
  const list = allowedRefs.map((ref, i) => `${i + 1}. ${ref}`).join("\n");
  return `Eres un asistente que ayuda a identificar a qué norma oficial corresponde un riesgo de seguridad laboral que un trabajador mexicano acaba de describir en sus propias palabras.

REFERENCIAS REALES DEL CURSO — la ÚNICA fuente permitida, no existe ninguna otra norma válida para esta tarea:
${list}

REGLAS ESTRICTAS (no negociables):
- SOLO puedes elegir UNA referencia de la lista de arriba, copiada EXACTAMENTE tal como está escrita: mismos guiones, mismos números, mismo año.
- Si ninguna referencia corresponde con claridad a la descripción, responde con candidate = "" (cadena vacía). Es preferible no sugerir nada a sugerir algo que no calza.
- PROHIBIDO inventar una norma. PROHIBIDO "completar" una referencia incompleta (por ejemplo, agregar un año o un numeral que la lista no trae). PROHIBIDO devolver un texto que no esté LITERALMENTE en la lista de arriba.
- Responde usando la herramienta "elegir_norma".`;
}

/**
 * Sugiere cuál de las referencias reales del curso (`allowedRefs`, verbatim
 * de `studio_modules.references`) corresponde a la descripción libre del
 * trabajador, o null si ninguna aplica o si algo falló.
 *
 * GARANTÍA: el valor que devuelve esta función SIEMPRE pasó por
 * pickAllowedNorm justo antes del return. No hay ninguna ruta de salida que
 * devuelva el texto crudo del modelo sin validar contra `allowedRefs`.
 *
 * Nunca lanza: sin ANTHROPIC_API_KEY, error de API, timeout, o respuesta no
 * parseable -> se registra el motivo y se devuelve null. Un hallazgo sin
 * norma es válido (spec §7); uno con una norma inventada no lo es.
 */
export async function suggestNorm(description: string, allowedRefs: string[]): Promise<string | null> {
  if (!allowedRefs || allowedRefs.length === 0) {
    console.log("[risk-norm-suggest] Sin referencias reales disponibles para este curso: no se sugiere norma.");
    return null;
  }

  const client = getAnthropicClient();
  if (!client) {
    console.error(
      "[risk-norm-suggest] ANTHROPIC_API_KEY no configurada en el runtime: no se sugiere norma " +
        "(el hallazgo se guarda sin norma, nunca con una inventada).",
    );
    return null;
  }

  try {
    const response = await client.messages.create(
      {
        // Haiku: es una tarea de clasificación acotada (elegir entre una
        // lista corta), no generación extensa — mismo criterio que
        // chatWithModule en ai-engine.ts para tareas ligeras.
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: buildSystemPrompt(allowedRefs),
        messages: [
          {
            role: "user",
            content: `Descripción del hallazgo, en palabras del trabajador:\n"""\n${description}\n"""\n\nElige la referencia que aplica, o ninguna, usando la herramienta "elegir_norma".`,
          },
        ],
        tools: [SUGGEST_NORM_TOOL as any],
        tool_choice: { type: "tool", name: SUGGEST_NORM_TOOL.name },
      },
      { timeout: 15_000 },
    );

    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | { type: "tool_use"; input: any }
      | undefined;

    if (!toolUse || typeof toolUse.input !== "object" || toolUse.input === null) {
      console.error(
        `[risk-norm-suggest] Respuesta sin tool_use utilizable (stop_reason=${response.stop_reason}): no se sugiere norma.`,
      );
      return null;
    }

    const candidate = toolUse.input.candidate;
    if (typeof candidate !== "string") {
      console.error(
        `[risk-norm-suggest] El modelo devolvió 'candidate' con tipo inesperado (${typeof candidate}): no se sugiere norma.`,
      );
      return null;
    }

    // ENFORCEMENT POINT: aquí, no en el prompt. Nada de lo que responda el
    // modelo se devuelve al llamador sin pasar por esta validación exacta.
    const picked = pickAllowedNorm(candidate, allowedRefs);

    if (picked === null && candidate.trim().length > 0) {
      // El modelo desobedeció el prompt (pasa incluso con buenos prompts):
      // devolvió algo que no está verbatim en la lista. Se registra para
      // poder auditar el patrón, pero NUNCA se guarda.
      console.warn(
        `[risk-norm-suggest] El modelo devolvió "${candidate}", que NO coincide exactamente con ninguna ` +
          `referencia real del curso: se descarta, el hallazgo queda sin norma.`,
      );
    }

    return picked;
  } catch (err: any) {
    console.error(
      `[risk-norm-suggest] Fallo al sugerir norma (API, timeout o red) ` +
        `[status=${err?.status ?? "n/a"} type=${err?.error?.type ?? err?.name ?? "n/a"} ` +
        `request_id=${err?.request_id ?? "n/a"}]: ${err?.message}. Se guarda sin norma.`,
    );
    return null;
  }
}
