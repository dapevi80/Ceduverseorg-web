import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { studioCourses } from "@shared/schema";
import { storage } from "./storage";
import { voiceForInstructor } from "@shared/instructor-voice";
import { r2Storage } from "./services/r2-storage";

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

    // Resolve the TTS voice from the course's instructor (shared/instructor-voice.ts).
    // Falls back to the "ash" default when the course or its instructor isn't found.
    let instructor: string | null = null;
    try {
      const [course] = await db.select({ instructor: studioCourses.instructor })
        .from(studioCourses)
        .where(eq(studioCourses.slug, courseSlug));
      instructor = course?.instructor ?? null;
    } catch (lookupError: any) {
      console.warn(`[audio] Could not look up instructor for ${courseSlug}:`, lookupError?.message || lookupError);
    }
    const { voice } = voiceForInstructor(instructor);
    console.log(`[audio] Using voice "${voice}" for instructor "${instructor ?? "(none)"}" (${courseSlug})`);

    const chunks = splitTextIntoChunks(cleanScript, 4000);

    // Delivery direction — tone/pacing/emphasis, NOT content. Tune this string to
    // reshape how the class *sounds* without touching the script prompt.
    const TTS_INSTRUCTIONS =
      "Habla en español de México con la energía, la convicción y el carisma de un gran conferencista motivacional latinoamericano (al estilo de Alex Dey o Daniel Habif). Tono apasionado, humano e inspirador: proyecta seguridad total y entusiasmo genuino, como quien impulsa a la gente a superarse y a tomar acción. Varía la intensidad — eleva la energía y la fuerza en los momentos clave, y baja a un tono íntimo, cálido y reflexivo en las ideas profundas. Usa pausas dramáticas antes de las frases importantes para crear expectación y darles peso emocional. Enfatiza con determinación las palabras que inspiran a actuar. Nunca suenes monótono ni robótico: suena vivo, cercano y capaz de mantener despierta, emocionada y motivada a tu audiencia.";

    console.log(`[audio] Processing ${chunks.length} chunk(s) for TTS (en PARALELO)`);

    // Genera TODOS los chunks EN PARALELO (antes era secuencial → N×tiempo, se
    // atoraba minutos con scripts largos). Cada chunk es una llamada TTS
    // independiente; el orden se preserva por índice del map. Timeout por chunk
    // (90s) para que una llamada colgada no deje el audio en "preparando" eterno.
    const audioBuffers = await Promise.all(
      chunks.map(async (chunk, i) => {
        console.log(`[audio] Generating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        // Steerable TTS: gpt-4o-mini-tts honors `instructions`. Voice resolved per
        // the course's instructor via shared/instructor-voice.ts (default "ash").
        const response = await openai.audio.speech.create(
          {
            model: "gpt-4o-mini-tts",
            voice,
            input: chunk,
            instructions: TTS_INSTRUCTIONS,
            response_format: "mp3",
          },
          { timeout: 90_000 },
        );
        return Buffer.from(await response.arrayBuffer());
      }),
    );

    const finalBuffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(filepath, finalBuffer);

    // Upload to R2 so the audio survives Render redeploys (local disk is ephemeral).
    // Local write above is kept as a fallback for when R2 isn't configured.
    if (r2Storage.isConfigured) {
      try {
        await r2Storage.uploadBuffer(finalBuffer, `audio/${filename}`, "audio/mpeg");
        console.log(`[audio] Uploaded ${filename} to R2`);
      } catch (uploadError: any) {
        console.error(`[audio] R2 upload failed for ${filename}:`, uploadError?.message || uploadError);
      }
    } else {
      console.warn(`[audio] R2 not configured — ${filename} only saved to local disk (ephemeral on Render)`);
    }

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
