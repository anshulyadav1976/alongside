import OpenAI from "openai";
import { getEnv } from "./env";
import { extractionSchema, fallbackExtraction, type ConversationExtraction } from "./extraction";

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

export async function extractConversation(transcript: Array<{ speaker: string; text: string }>): Promise<{ extraction: ConversationExtraction; source: "openai" | "demo" }> {
  const fallback = fallbackExtraction(transcript);
  const openai = getClient();
  if (!openai) return { extraction: fallback, source: "demo" };
  try {
    const completion = await openai.chat.completions.create({
      model: getEnv().OPENAI_PROCESSING_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are the structured memory and journal extractor for Alongside. Return JSON only with this exact top-level shape:
{"journal":{"title":"string","summary":"string","importantMoments":["string"],"whatHelped":["string"],"whatDidNotHelp":["string"],"decisions":["string"],"nextSteps":["string"],"upcomingMoments":["string"]},"memories":[{"memoryType":"event|person|preference|boundary|coping_strategy|value|goal|upcoming_moment|observation","statement":"string","explicitness":"explicit|inferred","confidence":0.0,"sensitivity":"low|medium|high","sourceQuote":"string","reusePermission":"allowed|ask_first|never_proactive","validFrom":"ISO or omit","validTo":"ISO or omit","expiresAt":"ISO or omit"}],"entities":[{"key":"stable-key","entityType":"person|place|project|topic|strategy|event","label":"string","attributes":{}}],"relations":[{"subjectKey":"stable-key","predicate":"short relation","objectKey":"stable-key","confidence":0.0,"explicitness":"explicit|inferred"}],"safetyFlags":["string"]}
Rules: extract only facts grounded in the transcript; quote the smallest supporting phrase; do not diagnose; mark guesses inferred; keep sensitive material high sensitivity and ask_first/never_proactive; include an entity for the user when relations need one; relations must reference entity keys; candidate memories stay proposed for user review.`,
        },
        { role: "user", content: transcript.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n") },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return { extraction: fallback, source: "demo" };
    const parsed = extractionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { extraction: parsed.data, source: "openai" } : { extraction: fallback, source: "demo" };
  } catch {
    return { extraction: fallback, source: "demo" };
  }
}
