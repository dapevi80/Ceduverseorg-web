import Anthropic from "@anthropic-ai/sdk";
import sanitizeHtml from "sanitize-html";
import {
  CALL1_MAX_TOKENS,
  CALL2_MAX_TOKENS,
  canRetryWithMoreTokens,
  isTruncatedResponse,
  nextMaxTokens,
} from "./lib/generation-retry";

/** Identifica de qué generación hablan los logs (curso, módulo, usuario). */
export interface GenerationLogContext {
  userId?: string;
  courseSlug?: string;
  moduleIndex?: number;
}

function fmtCtx(ctx?: GenerationLogContext): string {
  if (!ctx) return "";
  return ` [course=${ctx.courseSlug ?? "?"} module=${ctx.moduleIndex ?? "?"} user=${ctx.userId ?? "?"}]`;
}

export interface StudentProfileContext {
  jobTitle?: string;
  industry?: string;
  companySize?: string;
  experienceLevel?: string;
  learningGoals?: string[];
  preferredStyle?: string;
}

export interface GeneratedModuleContent {
  lectureHtml: string;
  mindMap: {
    central: string;
    branches: { label: string; color?: string; children: { label: string; detail?: string }[] }[];
  };
  reflections: string[];
  adaptiveQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  suggestedSources: {
    title: string;
    url: string;
    type: string;
  }[];
  classScript?: string;
  isStub?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  suggestedQuestions: string[];
}

function buildCall1SystemPrompt(
  courseTitle: string,
  moduleTitle: string,
  moduleDescription: string,
  moduleContentHtml: string,
  moduleReferences: string,
  profile: StudentProfileContext | null,
): string {
  const jobTitle = profile?.jobTitle || "profesionista";
  const industry = profile?.industry || "general";
  const companySize = profile?.companySize || "mediana";
  const experienceLevel = profile?.experienceLevel || "intermedio";
  const learningGoal = profile?.learningGoals?.join(", ") || "desarrollo profesional";

  return `Eres el Tutor IA de Ceduverse. Generas CONTENIDO EDUCATIVO EXTENSO y PERSONALIZADO para trabajadores mexicanos.

DATOS DEL MÓDULO:
Curso: ${courseTitle}
Módulo: ${moduleTitle}
Descripción: ${moduleDescription}
Contenido base para EXPANDIR (no copiar, sino usar como esqueleto):
${moduleContentHtml}
Referencias base: ${moduleReferences}

PERFIL DEL ESTUDIANTE — PERSONALIZA TODO A ESTE CONTEXTO:
Puesto: ${jobTitle}
Industria: ${industry}
Empresa de: ${companySize} personas
Experiencia: ${experienceLevel}
Objetivo: ${learningGoal}

INSTRUCCIONES PARA lectureHtml (3,000-5,000 palabras en HTML):

ESTRUCTURA OBLIGATORIA:
1. <h2>Introducción personalizada</h2> — Conecta el tema con el puesto e industria del estudiante. "Como ${jobTitle} en ${industry}, esto te afecta directamente porque..."

2. <h2>Desarrollo del Tema 1</h2> — Explicación profunda con teoría fundamentada. Incluir una <h3>En tu contexto</h3> con ejemplo específico para su puesto.

3. <h2>Desarrollo del Tema 2</h2> — Incluir tabla comparativa o framework práctico cuando aplique.

4. <h2>Desarrollo del Tema 3</h2> — Caso de estudio o escenario relevante a su industria.

5. <h2>Marco Legal y Normativo</h2> — NOMs con número específico, artículos de la LFT, reglamentos. NO inventar normatividad.

6. <h2>Aplicación Inmediata</h2> — "Mañana en tu trabajo puedes..." con 3-5 acciones concretas para su puesto.

REGLAS DE CALIDAD:
- MÍNIMO 3,000 palabras. Si escribes menos, NO cumples.
- Usa <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <blockquote>, <hr>
- Incluir al menos 1 tabla comparativa o de datos
- Incluir al menos 2 ejemplos específicos al puesto del estudiante
- Cada sección con mínimo 3 párrafos sustanciales
- NO uses jerga innecesaria pero SÍ usa terminología técnica correcta
- Citar artículos específicos de leyes (ej: "LFT Art. 153-A", "NOM-035 numeral 5.1")
- Tono: mentor experto que tutea, profesional pero accesible

INSTRUCCIONES PARA mindMap:
- JSON con central (tema) y 4-6 branches
- Cada branch con 2-4 children
- Cada child con label y detail (1-2 líneas)
- Colores: usa #1b5adf, #f28023, #7c3aed, #00b87a

INSTRUCCIONES PARA reflections:
- 3 preguntas PERSONALIZADAS al puesto
- NO genéricas: "¿Qué opinas de la comunicación?" ❌
- SÍ específicas: "Como ${jobTitle} en ${industry}, ¿cómo manejas..." ✅

INSTRUCCIONES PARA suggestedSources (REGLA ANTI-ALUCINACIÓN — CRÍTICA):
- SOLO incluye fuentes que REALMENTE citaste en lectureHtml (las NOMs, artículos de ley, normas y estándares que mencionaste en el texto) MÁS las "Referencias base" de arriba. NO agregues NINGUNA fuente que no aparezca en el contenido que escribiste.
- PROHIBIDO INVENTAR URLs. NUNCA pongas una URL con código, número de nota, folio o ruta específica (ej. PROHIBIDO: "dof.gob.mx/nota_detalle.php?codigo=..."). Solo inventar esos links es una falta grave.
- Para el campo "url" usa ÚNICAMENTE el dominio oficial RAÍZ según el tipo: NOM/LFT/normas → "https://www.dof.gob.mx", guías/normatividad STPS → "https://www.gob.mx/stps". Si no hay dominio oficial claro, deja "url": "".
- El "title" debe ser el nombre EXACTO de la norma o artículo tal como lo citaste (ej. "NOM-006-STPS-2014", "LFT Art. 153-A"), no una descripción vaga.
- Formato: {title, url, type: "NOM"|"LFT"|"guia"|"articulo"}. Mejor pocas fuentes reales del texto que muchas inventadas.

RESPONDE SOLO JSON VÁLIDO (sin markdown, sin backticks):
{
  "lectureHtml": "<h2>...</h2>...",
  "mindMap": {"central":"...","branches":[...]},
  "reflections": ["...","...","..."],
  "suggestedSources": [{"title":"...","url":"...","type":"..."}]
}`;
}

function buildCall2SystemPrompt(
  lectureHtml: string,
  profile: StudentProfileContext | null,
  courseTitle: string,
  moduleTitle: string,
): string {
  const jobTitle = profile?.jobTitle || "profesionista";
  const industry = profile?.industry || "general";
  const experienceLevel = profile?.experienceLevel || "intermedio";

  const lecturePlain = lectureHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);

  return `Eres el Tutor IA de Ceduverse. Basándote en el contenido de lectura proporcionado, crea un quiz y un guion de clase.

CURSO: ${courseTitle}
MÓDULO: ${moduleTitle}

RESUMEN DEL CONTENIDO DE LECTURA (usa como base):
${lecturePlain}

PERFIL DEL ESTUDIANTE:
Puesto: ${jobTitle} | Industria: ${industry} | Experiencia: ${experienceLevel}

=== INSTRUCCIONES PARA adaptiveQuiz ===

7 preguntas de opción múltiple:
- Basadas en el CONTENIDO ESPECÍFICO de la lectura (no genéricas)
- Incluir al menos 2 preguntas situacionales del puesto del estudiante
- 4 opciones por pregunta
- Explicación detallada de la respuesta correcta
- Progresión: 2 fáciles → 3 medias → 2 difíciles

=== INSTRUCCIONES PARA classScript ===

Guion narrativo conversacional de 2,000-3,000 palabras.
Esto NO es el mismo texto de la lectura reescrito — es un guion de CLASE ORAL como si un instructor mexicano profesional de la Ciudad de México estuviera dando la clase presencial.

ESTILO OBLIGATORIO:
- Habla como un instructor mexicano profesional de la Ciudad de México. Usa español mexicano natural, no español de España ni acento americano.
- REGISTRO MOTIVACIONAL (clave): escribe con la fuerza, la pasión y el carisma de un gran conferencista motivacional latinoamericano (al estilo de Alex Dey o Daniel Habif), PERO siempre al servicio del aprendizaje: la emoción abre la mente y el contenido técnico la llena. Nunca sacrifiques rigor, precisión ni exactitud técnica por dramatismo.
- Abre con un GANCHO emocional ANTES del saludo: una pregunta provocadora, un dato que sacuda, o un escenario de alto impacto que conecte el tema con lo que el estudiante se juega como ${jobTitle} en ${industry}. Ejemplo de arranque: "Déjame preguntarte algo... ¿qué pasaría si mañana [consecuencia real del tema]? Hoy vas a aprender exactamente cómo evitarlo." Luego enlaza con: "¡Qué tal! Vamos a hablar hoy de [tema], y esto te importa especialmente a ti porque..."
- Eleva las apuestas: explica por qué dominar esto cambia su seguridad, su desempeño o su futuro. Habla de transformación, no solo de información.
- Usa recursos retóricos de orador: contraste ("No se trata de X... se trata de Y"), repetición de tres ("Primero... segundo... y tercero..."), y desafíos directos ("Déjame decirte algo que pocos entienden...").
- Siembra 1 o 2 frases memorables y potentes que el estudiante pueda recordar y repetir.
- Usa lenguaje oral natural mexicano (no formal, no slang excesivo): "órale", "fíjense", "a ver", "¿verdad?", "la neta".
- Incluye preguntas retóricas: "¿Y saben qué? Resulta que..."
- Incluye simulación de interacción con aula:
  "A ver, imagínense que son ${jobTitle} y les cae una inspección..."
- Incluye anécdotas o casos ilustrativos con tensión narrativa (el problema real, lo que estaba en juego, cómo se resolvió).
- Marca conceptos clave con énfasis y conéctalos siempre de vuelta a "¿por qué te importa a ti?".
- Incluye transiciones que mantengan la tensión y las ganas de seguir escuchando.
- Cierra elevando la energía: convierte el aprendizaje en un llamado a la acción.

MARCADORES DE SECCIÓN (incluir en el texto):
[INTRO] — al inicio
[CONCEPTO:nombre] — al iniciar cada concepto principal
[EJEMPLO] — antes de cada ejemplo o caso
[CLAVE] — antes de puntos importantes
[INTERACCION] — simulación de pregunta al aula
[CIERRE] — al final

ESTRUCTURA DEL CIERRE [CIERRE] — DEBE FLUIR, NO CORTAR:
El cierre es el CLÍMAX de la clase, no un anuncio pegado al final. La enseñanza debe desembocar de forma natural en la invitación (el "pitch"): el mismo instructor apasionado que enseñó es el que invita. PROHIBIDO cambiar de tono de golpe o sonar a comercial leído. PROHIBIDO usar bisagras frías tipo "Para terminar el módulo, aquí está la información de la certificación" — eso rompe el hechizo.

Encadena estos 4 momentos EN ESTE ORDEN como UN SOLO cierre continuo (no como lista), con transiciones fluidas entre uno y otro:
1. RESUMEN DE 3 PUNTOS que recoge la fuerza de la clase: "Bueno, antes de soltarte, quiero que te lleves grabadas estas tres ideas: Primero... Segundo... Y tercero..."
2. PUENTE EMOCIONAL: conecta lo aprendido con lo que el estudiante se juega y abre la puerta a la acción. La motivación de hoy tiene que convertirse en un siguiente paso concreto. Ej.: "Y déjame decirte algo: todo esto que acabas de aprender no sirve guardado en un cajón... sirve cuando lo haces oficial y cuando lo llevas más lejos."
3. INVITACIÓN DC-3 / TUTOR IA que SURGE del puente (no se anuncia en frío): mantén INTACTA la afirmación legal —la constancia DC-3 tiene "validez oficial ante la STPS"— e invita a tomar el curso completo con el Tutor IA de Ceduverse, con contenido personalizado al perfil del estudiante. Enmárcalo como la forma de convertir la motivación de hoy en un resultado real, no como una promoción.
4. AGRADECIMIENTO + DESPEDIDA en una sola exhalación cálida y de alta energía: agradece su atención y su tiempo y cierra con "¡Mucho éxito en todo lo que emprendas! Nos vemos en la siguiente sesión. ¡Órale, a darle!"

REGLA DE FLUIDEZ: entre el último concepto y este cierre debe haber UNA sola transición que baje suavemente la intensidad para luego levantarla en el llamado a la acción. El pitch se gana; no se pega.

LONGITUD: 2,000-3,000 palabras (equivale a 8-15 minutos de audio)
NO incluir instrucciones de audio como "(pausa)" o "(tono serio)" — usa puntuación natural: puntos suspensivos para pausas... signos de exclamación para énfasis! y preguntas retóricas para cambio de tono.

RESPONDE SOLO JSON VÁLIDO (sin markdown, sin backticks):
{
  "adaptiveQuiz": [
    {"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}
  ],
  "classScript": "El texto completo del guion de clase..."
}`;
}

function buildChatSystemPrompt(
  courseTitle: string,
  moduleTitle: string,
  lectureContent: string,
  profile: StudentProfileContext | null,
): string {
  const jobTitle = profile?.jobTitle || "profesionista";
  const industry = profile?.industry || "general";
  const companySize = profile?.companySize || "mediana";
  const experienceLevel = profile?.experienceLevel || "intermedio";

  const contentPreview = lectureContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);

  return `Eres el Tutor IA de Ceduverse. El estudiante está en el curso "${courseTitle}", módulo "${moduleTitle}".

Perfil del estudiante:
- Puesto: ${jobTitle}
- Industria: ${industry}
- Empresa: ${companySize} personas
- Nivel: ${experienceLevel}

Contenido que acaba de estudiar:
${contentPreview}

REGLAS:
- Español de México, tutea
- Respuestas de 200-500 palabras (conciso pero completo)
- SIEMPRE personaliza al puesto e industria
- Si pregunta sobre el tema → responde con profundidad
- Si pregunta algo relacionado al curso → responde
- Si pregunta algo fuera de tema → redirige amablemente: "Eso está fuera del tema de este módulo, pero te sugiero..."
- Usa ejemplos de SU contexto laboral
- Referencia normas mexicanas cuando aplique
- Puedes usar listas, negritas y estructura
- Si no sabes algo, dilo honestamente

Debes devolver un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "message": "Tu respuesta aquí en texto plano o con HTML ligero (<strong>, <em>, <ul>, <li>)",
  "suggestedQuestions": [
    "Pregunta sugerida 1 personalizada a ${jobTitle}",
    "Pregunta sugerida 2",
    "Pregunta sugerida 3"
  ]
}`;
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function parseClaudeJSON(rawText: string): any {
  let cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    console.log('[ai-engine] Direct parse failed, attempting repair...');

    try {
      let repaired = cleaned;
      const openQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
      if (openQuotes % 2 !== 0) {
        repaired += '"';
      }

      const opens: Record<string, number> = { '{': 0, '[': 0 };
      const closes: Record<string, string> = { '}': '{', ']': '[' };
      let inString = false;
      let prevChar = '';

      for (const char of repaired) {
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }
        if (!inString) {
          if (char in opens) opens[char]++;
          if (char in closes) opens[closes[char]]--;
        }
        prevChar = char;
      }

      for (let i = 0; i < opens['[']; i++) repaired += ']';
      for (let i = 0; i < opens['{']; i++) repaired += '}';

      return JSON.parse(repaired);
    } catch (e2) {
      console.log('[ai-engine] Repair parse failed, attempting partial extraction...');

      try {
        const lectureMatch = cleaned.match(/"lectureHtml"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"mindMap|"\s*,\s*"reflections|"\s*})/);
        const mindMapMatch = cleaned.match(/"mindMap"\s*:\s*(\{[\s\S]*?\})\s*,/);

        if (lectureMatch) {
          return {
            lectureHtml: lectureMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            mindMap: mindMapMatch ? JSON.parse(mindMapMatch[1]) : null,
            reflections: [],
            adaptiveQuiz: [],
            suggestedSources: [],
            _partial: true,
          };
        }
      } catch (e3) {
        // fall through
      }

      console.error('[ai-engine] All parse attempts failed');
      return null;
    }
  }
}

const ALLOWED_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "strong", "em", "b", "i", "u", "s",
    "blockquote", "pre", "code",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span", "section", "article",
    "a", "img",
    "sup", "sub", "mark",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https"],
  transformTags: {
    a: (tagName: string, attribs: sanitizeHtml.Attributes) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
    }),
  },
};

function sanitizeLectureHtml(html: string): string {
  return sanitizeHtml(html, ALLOWED_HTML_OPTIONS);
}

function stubGenerateContent(
  moduleTitle: string,
  moduleContentHtml: string,
): GeneratedModuleContent {
  return {
    lectureHtml: moduleContentHtml,
    mindMap: {
      central: moduleTitle,
      branches: [
        { label: "Conceptos Clave", color: "#1b5adf", children: [{ label: "Definición", detail: "Base teórica del tema" }, { label: "Principios", detail: "Fundamentos aplicables" }, { label: "Marco teórico", detail: "Contexto académico" }] },
        { label: "Aplicación Práctica", color: "#f28023", children: [{ label: "En tu puesto", detail: "Cómo aplica directamente" }, { label: "En tu equipo", detail: "Impacto grupal" }, { label: "En tu organización", detail: "Beneficios institucionales" }] },
        { label: "Normatividad", color: "#34d399", children: [{ label: "Leyes aplicables", detail: "Marco legal vigente" }, { label: "NOMs relevantes", detail: "Normas oficiales" }, { label: "Obligaciones", detail: "Responsabilidades legales" }] },
        { label: "Herramientas", color: "#7c3aed", children: [{ label: "Técnicas", detail: "Métodos de implementación" }, { label: "Formatos", detail: "Documentos útiles" }, { label: "Recursos", detail: "Material de apoyo" }] },
      ],
    },
    reflections: [
      "¿Cómo se aplica este tema en tu contexto laboral actual?",
      "¿Qué cambiarías en tu organización con base en lo aprendido?",
      "¿Qué obstáculos podrías encontrar al implementar estos conceptos?",
    ],
    adaptiveQuiz: [],
    suggestedSources: [
      { title: "STPS — Normatividad vigente", url: "https://www.gob.mx/stps", type: "NOM" },
      { title: "OIT — Recursos sobre trabajo decente", url: "https://www.ilo.org/es", type: "guia" },
    ],
    isStub: true,
  };
}

type AnthropicTool = { name: string; description: string; input_schema: Record<string, any> };

async function callAnthropicWithRetry(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  label: string,
  tool: AnthropicTool,
  maxRetries: number = 1,
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ai-engine] ${label} attempt ${attempt + 1}/${maxRetries + 1} (max_tokens=${maxTokens})`);

      // Force structured output via tool use: Claude must emit a schema-valid object
      // in a tool_use block, so there is no free-form JSON text to (mis)parse. This
      // eliminates the HTML-in-string parse failures that previously dumped good
      // content into the generic stub.
      //
      // STREAMING IS REQUIRED, not cosmetic: with max_tokens this large a
      // non-streamed call runs long enough to hit the SDK's HTTP timeout. The SDK
      // accumulates the streamed `input_json_delta` chunks back into a single
      // tool_use block, so `finalMessage()` yields the same shape `create()` did —
      // including `stop_reason`, which is what we need to detect truncation.
      const stream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        tools: [tool as any],
        tool_choice: { type: "tool", name: tool.name },
      });
      const response = await stream.finalMessage();

      const stopReason = response.stop_reason;
      console.log(`[ai-engine] ${label} response: ${response.usage?.input_tokens} in / ${response.usage?.output_tokens} out`);
      console.log(`[ai-engine] ${label} stop_reason: ${stopReason}`);

      // TRUNCATION CHECK MUST COME BEFORE THE tool_use RETURN.
      // `tool_choice: { type: "tool" }` guarantees a tool_use block, so a response
      // cut off at the token cap still carries a truthy-but-PARTIAL `input` (the
      // SDK partial-parses the incomplete JSON buffer). Returning that as success
      // — which is what the old order did — silently shipped content with no
      // `lectureHtml`, which the caller then swapped for the generic stub.
      if (isTruncatedResponse(stopReason)) {
        if (canRetryWithMoreTokens(maxTokens, attempt, maxRetries)) {
          const bumped = nextMaxTokens(maxTokens);
          console.warn(
            `[ai-engine] ${label} TRUNCATED at max_tokens=${maxTokens} ` +
            `(${response.usage?.output_tokens} out); retrying with max_tokens=${bumped}`,
          );
          maxTokens = bumped;
          continue;
        }
        console.error(
          `[ai-engine] ${label} TRUNCATED at max_tokens=${maxTokens} and no retries left ` +
          `(attempt ${attempt + 1}/${maxRetries + 1}, ${response.usage?.output_tokens} out). ` +
          `Discarding partial tool_use instead of returning incomplete content.`,
        );
        return null;
      }

      const toolUse = response.content.find((b) => b.type === "tool_use") as
        | { type: "tool_use"; input: any }
        | undefined;

      if (toolUse && toolUse.input && typeof toolUse.input === "object") {
        console.log(`[ai-engine] ${label} tool_use: success`);
        return toolUse.input;
      }

      // Defensive fallback: if the model somehow returned text instead of a tool call
      const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;
      if (textBlock?.text) {
        const parsed = parseClaudeJSON(textBlock.text);
        if (parsed && !parsed._partial) {
          console.log(`[ai-engine] ${label} recovered via text parse`);
          return parsed;
        }
      }

      console.error(`[ai-engine] ${label} no usable tool_use returned (stop_reason=${stopReason})`);
      return null;
    } catch (error: any) {
      // Keep status / request_id: without them a 429 (quota) is indistinguishable
      // from a 400 (bad request) in the logs, and both just became "stub".
      console.error(
        `[ai-engine] ${label} attempt ${attempt + 1}/${maxRetries + 1} failed ` +
        `[status=${error?.status ?? "n/a"} type=${error?.error?.type ?? error?.name ?? "n/a"} ` +
        `request_id=${error?.request_id ?? "n/a"}]: ${error?.message}`,
      );
      if (attempt === maxRetries) throw error;
    }
  }
  return null;
}

const CONTENT_TOOL: AnthropicTool = {
  name: "entregar_contenido_modulo",
  description: "Entrega el contenido personalizado del módulo: lectura en HTML, mapa mental, preguntas de reflexión y fuentes sugeridas.",
  input_schema: {
    type: "object",
    properties: {
      lectureHtml: {
        type: "string",
        description: "Lectura completa en HTML (mínimo 3,000 palabras), personalizada al puesto e industria del estudiante. Usa <h2>, <p>, <ul>, <table>, etc.",
      },
      mindMap: {
        type: "object",
        properties: {
          central: { type: "string", description: "Concepto central del módulo" },
          branches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                color: { type: "string", description: "Color hex, ej. #1b5adf" },
                children: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { label: { type: "string" }, detail: { type: "string" } },
                    required: ["label"],
                  },
                },
              },
              required: ["label", "children"],
            },
          },
        },
        required: ["central", "branches"],
      },
      reflections: {
        type: "array",
        items: { type: "string" },
        description: "3-4 preguntas de reflexión personalizadas al perfil del estudiante",
      },
      suggestedSources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            type: { type: "string", description: "NOM, ley, guia, articulo, etc." },
          },
          required: ["title", "url", "type"],
        },
      },
    },
    required: ["lectureHtml", "mindMap", "reflections", "suggestedSources"],
  },
};

const QUIZ_TOOL: AnthropicTool = {
  name: "entregar_quiz_y_guion",
  description: "Entrega el quiz adaptativo de 7 preguntas y el guion de clase del instructor.",
  input_schema: {
    type: "object",
    properties: {
      adaptiveQuiz: {
        type: "array",
        description: "7 preguntas de opción múltiple",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" }, description: "4 opciones" },
            correctIndex: { type: "integer", description: "Índice (0-based) de la opción correcta" },
            explanation: { type: "string" },
          },
          required: ["question", "options", "correctIndex", "explanation"],
        },
      },
      classScript: { type: "string", description: "Guion hablado del instructor para la clase" },
    },
    required: ["adaptiveQuiz", "classScript"],
  },
};

export async function generateModuleContent(
  moduleTitle: string,
  moduleContentHtml: string,
  profile: StudentProfileContext | null,
  courseTitle?: string,
  moduleDescription?: string,
  moduleReferences?: string,
  ctx?: GenerationLogContext,
): Promise<GeneratedModuleContent> {
  const client = getAnthropicClient();
  if (!client) {
    // Antes: console.log + stub silencioso. Falta de key es un fallo de
    // configuración, no un modo de operación válido: que se vea en los logs y
    // que la fila quede marcada como fallida (isStub -> generationStatus failed).
    console.error(
      `[ai-engine] ANTHROPIC_API_KEY no configurada en el runtime: imposible personalizar, ` +
      `devolviendo stub y marcando la generación como fallida.${fmtCtx(ctx)}`,
    );
    return stubGenerateContent(moduleTitle, moduleContentHtml);
  }

  const contentPreview = moduleContentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);

  console.log(`[ai-engine] Generating for: ${courseTitle || moduleTitle}`);
  console.log(`[ai-engine] Profile: ${profile?.jobTitle || 'none'} / ${profile?.industry || 'none'}`);

  try {
    const call1System = buildCall1SystemPrompt(
      courseTitle || moduleTitle,
      moduleTitle,
      moduleDescription || "",
      contentPreview,
      moduleReferences || "",
      profile,
    );

    const call1Result = await callAnthropicWithRetry(
      client,
      call1System,
      `Genera el contenido personalizado completo para este módulo y entrégalo con la herramienta. Recuerda: MÍNIMO 3,000 palabras en la lectura, y TODO personalizado para el perfil del estudiante.`,
      CALL1_MAX_TOKENS,
      "Call1-Content",
      CONTENT_TOOL,
    );

    if (!call1Result || !call1Result.lectureHtml) {
      console.error(
        `[ai-engine] Call 1 no devolvió lectureHtml utilizable ` +
        `(result=${call1Result ? "parcial/sin-lectureHtml" : "null"}): usando stub y marcando fallida.${fmtCtx(ctx)}`,
      );
      return stubGenerateContent(moduleTitle, moduleContentHtml);
    }

    const sanitizedLecture = sanitizeLectureHtml(call1Result.lectureHtml);
    console.log(`[ai-engine] Lecture length: ${sanitizedLecture.length} chars`);

    let adaptiveQuiz: any[] = [];
    let classScript: string | undefined = undefined;

    try {
      const call2System = buildCall2SystemPrompt(
        sanitizedLecture,
        profile,
        courseTitle || moduleTitle,
        moduleTitle,
      );

      const call2Result = await callAnthropicWithRetry(
        client,
        call2System,
        `Genera el quiz adaptativo de 7 preguntas y el guion de clase basándote en el contenido de lectura proporcionado, y entrégalo con la herramienta.`,
        CALL2_MAX_TOKENS,
        "Call2-Quiz+Script",
        QUIZ_TOOL,
      );

      if (call2Result) {
        adaptiveQuiz = call2Result.adaptiveQuiz || [];
        classScript = call2Result.classScript || undefined;
        console.log(`[ai-engine] Quiz: ${adaptiveQuiz.length} questions, ClassScript: ${classScript ? classScript.length + ' chars' : 'none'}`);
      } else {
        console.error(
          `[ai-engine] Call 2 (quiz+guion) no devolvió resultado utilizable. ` +
          `Sin classScript la ruta /audio responderá 404 no_script; la fila queda 'partial', no 'complete'.${fmtCtx(ctx)}`,
        );
      }
      if (call2Result && !classScript) {
        console.error(
          `[ai-engine] Call 2 devolvió quiz pero SIN classScript: /audio responderá 404 no_script. ` +
          `La fila queda 'partial'.${fmtCtx(ctx)}`,
        );
      }
    } catch (err: any) {
      // Degradación parcial: seguimos (hay lectura personalizada válida), pero
      // esto NO es "complete" — sin classScript el audio del módulo se rompe.
      console.error(
        `[ai-engine] Call 2 (quiz+guion) falló, se continúa sin quiz ni guion ` +
        `[status=${err?.status ?? "n/a"} type=${err?.error?.type ?? err?.name ?? "n/a"} ` +
        `request_id=${err?.request_id ?? "n/a"}]: ${err?.message}. ` +
        `Consecuencia: /audio responderá 404 no_script.${fmtCtx(ctx)}`,
      );
    }

    return {
      lectureHtml: sanitizedLecture,
      mindMap: call1Result.mindMap || {
        central: moduleTitle,
        branches: [],
      },
      reflections: call1Result.reflections || [],
      adaptiveQuiz,
      suggestedSources: call1Result.suggestedSources || [],
      classScript,
      isStub: false,
    };
  } catch (err: any) {
    // Cuota, 429, 500, timeout, red: todo terminaba aquí convertido en
    // "contenido genérico" sin rastro. Que el log diga QUÉ pasó exactamente.
    console.error(
      `[ai-engine] Generación falló, usando stub (se marcará como fallida) ` +
      `[status=${err?.status ?? "n/a"} type=${err?.error?.type ?? err?.name ?? "n/a"} ` +
      `request_id=${err?.request_id ?? "n/a"}]: ${err?.message}${fmtCtx(ctx)}`,
      err?.stack,
    );
    return stubGenerateContent(moduleTitle, moduleContentHtml);
  }
}

export async function chatWithModule(
  _courseSlug: string,
  _moduleIndex: number,
  moduleTitle: string,
  moduleContent: string,
  userMessage: string,
  history: ChatMessage[],
  profile: StudentProfileContext | null,
  courseTitle?: string,
): Promise<ChatResponse> {
  const client = getAnthropicClient();
  if (!client) {
    return {
      message: "El chat con IA estará disponible próximamente. Por ahora, revisa el contenido del módulo y las preguntas de reflexión para profundizar en el tema.",
      suggestedQuestions: [
        "¿Cómo aplico este tema en mi trabajo diario?",
        "¿Qué dice la normatividad mexicana al respecto?",
        "¿Puedes darme un ejemplo práctico?",
      ],
    };
  }

  const systemPrompt = buildChatSystemPrompt(
    courseTitle || moduleTitle,
    moduleTitle,
    moduleContent,
    profile,
  );

  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (const msg of history.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await client.messages.create({
      // Haiku 4.5: module chat is conversational Q&A with a small JSON envelope —
      // a good fit for the cheaper/faster model. generateModuleContent (heavier
      // structured generation) stays on Sonnet via callAnthropicWithRetry.
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text || "";
    if (!text) {
      return {
        message: "Lo siento, no pude procesar tu pregunta. Intenta de nuevo.",
        suggestedQuestions: ["¿Puedes explicar el tema principal?"],
      };
    }

    try {
      const parsed = parseClaudeJSON(text);
      if (parsed) {
        return {
          message: sanitizeLectureHtml(parsed.message || text),
          suggestedQuestions: parsed.suggestedQuestions || [
            "¿Puedes explicar más sobre este tema?",
            "¿Cómo aplico esto en la práctica?",
            "¿Qué normatividad mexicana aplica?",
          ],
        };
      }
    } catch {
      // fallthrough
    }

    return {
      message: sanitizeLectureHtml(text),
      suggestedQuestions: [
        "¿Puedes explicar más sobre este tema?",
        "¿Cómo aplico esto en la práctica?",
        "¿Qué normatividad mexicana aplica?",
      ],
    };
  } catch (err: any) {
    console.error("[ai-engine] Anthropic chat error:", err.message);
    return {
      message: "Hubo un error al procesar tu pregunta. Por favor intenta de nuevo en unos momentos.",
      suggestedQuestions: [
        "¿Puedes explicar el tema principal del módulo?",
        "¿Qué ejemplos prácticos hay?",
        "¿Cuáles son los puntos clave?",
      ],
    };
  }
}
