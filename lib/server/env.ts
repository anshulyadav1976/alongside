import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_PROCESSING_MODEL: z.string().default("gpt-5.4-mini"),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default("gpt-audio"),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default("JBFqnCBsd6RMkjVDRZzb"),
  ELEVENLABS_TTS_MODEL: z.string().default("eleven_flash_v2_5"),
  DATABASE_PATH: z.string().default("./data/alongside.db"),
  DEMO_USER_ID: z.string().default("demo-user"),
  DEMO_MODE: z.string().default("true"),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
