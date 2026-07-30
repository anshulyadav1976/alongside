import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getEnv } from "./env";

export async function synthesizeSpeech(text: string, turnId: string) {
  const env = getEnv();
  if (!env.ELEVENLABS_API_KEY) return { audioUrl: undefined, source: "demo" as const };
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(env.ELEVENLABS_VOICE_ID)}/stream`, {
      method: "POST", headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: env.ELEVENLABS_TTS_MODEL, output_format: "mp3_44100_128" }),
    });
    if (!response.ok) return { audioUrl: undefined, source: "elevenlabs_fallback" as const };
    const bytes = Buffer.from(await response.arrayBuffer());
    const relative = `data/audio/${turnId}.mp3`;
    const path = resolve(process.cwd(), relative);
    await mkdir(resolve(process.cwd(), "data/audio"), { recursive: true });
    await writeFile(path, bytes);
    return { audioUrl: `/api/v1/calls/audio/${turnId}`, source: "openai" as const };
  } catch {
    return { audioUrl: undefined, source: "elevenlabs_fallback" as const };
  }
}
