import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const AUDIO_DIR = path.join(process.cwd(), "audio-cache");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export function getAudioDir() {
  return AUDIO_DIR;
}

export async function generateAudioAsync(
  generatedContentId: string,
  classScript: string,
  courseSlug: string,
  moduleIndex: number,
  userId: string
): Promise<void> {
  const openai = getOpenAIClient();
  if (!openai) {
    console.warn("[audio] OPENAI_API_KEY not configured — TTS audio generation unavailable. Audio files are pre-generated on R2.");
    await storage.updateGeneratedContent(generatedContentId, {
      generationStatus: "partial",
    } as any);
    return;
  }

  try {
    console.log(`[audio] Starting generation for ${courseSlug}/m${moduleIndex} (user ${userId.slice(0, 8)})`);

    await storage.updateGeneratedContent(generatedContentId, {
      generationStatus: "generating_audio",
    } as any);

    const cleanScript = classScript
      .replace(/\[INTRO\]/g, "")
      .replace(/\[CONCEPTO:[^\]]*\]/g, "")
      .replace(/\[EJEMPLO\]/g, "")
      .replace(/\[CLAVE\]/g, "")
      .replace(/\[INTERACCION\]/g, "")
      .replace(/\[CIERRE\]/g, "")
      .trim();

    const filename = `${courseSlug}_m${moduleIndex}_${userId.slice(0, 8)}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    const chunks = splitTextIntoChunks(cleanScript, 4000);
    const audioBuffers: Buffer[] = [];

    console.log(`[audio] Processing ${chunks.length} chunk(s) for TTS`);

    for (let i = 0; i < chunks.length; i++) {
      console.log(`[audio] Generating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
      const response = await openai.audio.speech.create({
        // Steerable TTS: unlike tts-1-hd, gpt-4o-mini-tts honors `instructions`,
        // giving a human, TED-talk-style delivery that holds the learner's attention.
        model: "gpt-4o-mini-tts",
        // Voice identity (character/gender). Chosen after A/B: "ash" (warm male) —
        // alternatives: "onyx" (deep male), "echo"/"ballad" (male), "nova"/"coral"/"sage" (female).
        voice: "ash",
        input: chunks[i],
        // Delivery direction — tone/pacing/emphasis, NOT content. Tune this string to
        // reshape how the class *sounds* without touching the script prompt.
        instructions:
          "Habla en español de México con la energía, la convicción y el carisma de un gran conferencista motivacional latinoamericano (al estilo de Alex Dey o Daniel Habif). Tono apasionado, humano e inspirador: proyecta seguridad total y entusiasmo genuino, como quien impulsa a la gente a superarse y a tomar acción. Varía la intensidad — eleva la energía y la fuerza en los momentos clave, y baja a un tono íntimo, cálido y reflexivo en las ideas profundas. Usa pausas dramáticas antes de las frases importantes para crear expectación y darles peso emocional. Enfatiza con determinación las palabras que inspiran a actuar. Nunca suenes monótono ni robótico: suena vivo, cercano y capaz de mantener despierta, emocionada y motivada a tu audiencia.",
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      audioBuffers.push(buffer);
    }

    const finalBuffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(filepath, finalBuffer);

    const durationSeconds = Math.round(finalBuffer.length / 16000);

    await storage.updateGeneratedContent(generatedContentId, {
      audioUrl: filename,
      audioDurationSeconds: durationSeconds,
      audioGeneratedAt: new Date(),
      generationStatus: "complete",
    } as any);

    console.log(`[audio] Generated ${filename} (${durationSeconds}s, ${(finalBuffer.length / 1024).toFixed(0)}KB)`);
  } catch (error: any) {
    console.error("[audio] Generation error:", error?.message || error);
    await storage.updateGeneratedContent(generatedContentId, {
      generationStatus: "partial",
    } as any);
  }
}

function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current) chunks.push(current.trim());

  return chunks;
}
