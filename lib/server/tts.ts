import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getEnv } from "./env";

export async function synthesizeSpeech(text: string, turnId: string) {
  const env = getEnv();
  if (!env.ELEVENLABS_API_KEY) {
    return { audioPath: undefined, source: "demo" as const, errorCode: "TTS_NOT_CONFIGURED", errorMessage: "ElevenLabs text-to-speech is not configured." };
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(env.ELEVENLABS_VOICE_ID)}/stream`, {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: env.ELEVENLABS_TTS_MODEL, output_format: "mp3_44100_128" }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { detail?: { code?: string; message?: string } } | null;
      const code = detail?.detail?.code ?? `HTTP_${response.status}`;
      console.error("ElevenLabs text-to-speech failed", { status: response.status, code, message: detail?.detail?.message });
      return {
        audioPath: undefined,
        source: "elevenlabs_fallback" as const,
        errorCode: code,
        errorMessage: code === "missing_permissions"
          ? "The ElevenLabs API key needs text-to-speech permission."
          : "ElevenLabs could not generate the voice response.",
      };
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 100) throw new Error("ElevenLabs returned an empty audio response.");
    const relative = `data/audio/${turnId}.mp3`;
    await mkdir(resolve(process.cwd(), "data/audio"), { recursive: true });
    await writeFile(resolve(process.cwd(), relative), bytes);
    return { audioPath: relative, source: "elevenlabs" as const, errorCode: undefined, errorMessage: undefined };
  } catch (error) {
    console.error("ElevenLabs text-to-speech failed", error instanceof Error ? error.message : String(error));
    return { audioPath: undefined, source: "elevenlabs_fallback" as const, errorCode: "TTS_REQUEST_FAILED", errorMessage: "ElevenLabs could not generate the voice response." };
  }
}
