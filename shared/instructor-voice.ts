// Voz + estilo de TTS por instructor, para que la respuesta hablada del Q&A
// (server/services/qa-openai.ts::synthesizeAnswer) suene coherente con la voz
// que dio la conferencia. Match por substring de courses.instructor (spec
// 2026-07-17-aula-virtual-qa-conferencia-design.md §8).

export interface InstructorVoice {
  voice: string;
  instructions: string;
}

const DEFAULT_INSTRUCTIONS =
  "Habla en español de México con tono cálido, profesional y cercano, como un instructor respondiendo brevemente la duda de un alumno al final de una conferencia.";

const VOICE_MAP: { match: string; voice: InstructorVoice }[] = [
  {
    match: "yuridia",
    voice: { voice: "coral", instructions: DEFAULT_INSTRUCTIONS },
  },
  {
    match: "medina",
    voice: { voice: "ash", instructions: DEFAULT_INSTRUCTIONS },
  },
  {
    match: "david pérez",
    voice: { voice: "verse", instructions: DEFAULT_INSTRUCTIONS },
  },
  {
    match: "daniel zavala",
    voice: { voice: "onyx", instructions: DEFAULT_INSTRUCTIONS },
  },
];

const DEFAULT_VOICE: InstructorVoice = { voice: "ash", instructions: DEFAULT_INSTRUCTIONS };

export function voiceForInstructor(name: string | null): InstructorVoice {
  if (!name) return DEFAULT_VOICE;
  const lower = name.toLowerCase();
  const hit = VOICE_MAP.find((entry) => lower.includes(entry.match));
  return hit ? hit.voice : DEFAULT_VOICE;
}
