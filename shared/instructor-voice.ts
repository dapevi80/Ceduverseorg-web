// Maps a Studio course's `instructor` (shared/schema.ts studioCourses.instructor)
// to the OpenAI gpt-4o-mini-tts voice used to narrate that instructor's
// personalized Tutor IA audio (server/audio-generator.ts).
//
// Voices are OpenAI TTS voice identities (character/gender), not delivery —
// delivery/tone is controlled separately via the `instructions` steering string.

export type TtsVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer";

const INSTRUCTOR_VOICE: Record<string, TtsVoice> = {
  // Psic. Yuridia Iturriaga — Desarrollo Humano / habilidades blandas / onboarding.
  "Psic. Yuridia Iturriaga": "nova",
  // Lic. Jorge Armando Medina Castillo — Seguridad Industrial + Normatividad.
  "Lic. Jorge Armando Medina Castillo": "onyx",
  // David Pérez — blockchain/RWA. Default TTS voice for un-mapped/legacy content too.
  "David Pérez": "ash",
  // Daniel Zavala — legal/fiscal/derechos.
  "Daniel Zavala": "echo",
};

const DEFAULT_VOICE: TtsVoice = "ash";

export function voiceForInstructor(instructor: string | null | undefined): { voice: TtsVoice } {
  if (instructor && INSTRUCTOR_VOICE[instructor]) {
    return { voice: INSTRUCTOR_VOICE[instructor] };
  }
  return { voice: DEFAULT_VOICE };
}
