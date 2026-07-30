import OpenAI from "openai";
import { getEnv } from "./env";

let client: OpenAI | undefined;
function getClient() {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return undefined;
  return client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, baseURL: env.OPENAI_BASE_URL });
}

export async function transcribeAudio(file: File) {
  const env = getEnv();
  const openai = getClient();
  if (!openai) return { text: "I’m here. I’d like to talk through what’s on my mind.", source: "demo" as const };
  try {
    const result = await openai.audio.transcriptions.create({ file, model: env.OPENAI_TRANSCRIPTION_MODEL });
    return { text: result.text, source: "openai" as const };
  } catch {
    return { text: "I’m here. I’d like to talk through what’s on my mind.", source: "demo" as const };
  }
}

export async function generateResponse(transcript: string, context: string) {
  const env = getEnv();
  const openai = getClient();
  if (!openai) return { text: `I hear you. ${transcript ? "What feels most important about that right now?" : "We can take this one small step at a time."}`, source: "demo" as const };
  try {
    const completion = await openai.chat.completions.create({ model: env.OPENAI_PROCESSING_MODEL, temperature: 0.4, messages: [
      { role: "system", content: "You are Alongside, a warm wellbeing reflection copilot. Do not diagnose, claim exclusivity, or give medical instructions. Reflect briefly, then ask at most one useful question. Use only the supplied memory context when referring to past facts." },
      { role: "system", content: `Memory context:\n${context || "No relevant memories."}` },
      { role: "user", content: transcript },
    ] });
    return { text: completion.choices[0]?.message?.content?.trim() || "I’m with you. What would feel like a small next step?", source: "openai" as const };
  } catch {
    return { text: "I hear you. What feels most important about that right now?", source: "demo" as const };
  }
}
