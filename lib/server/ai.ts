import OpenAI from "openai";
import WebSocket from "ws";
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
  if (!openai || !env.OPENAI_API_KEY) return { text: "I'm here. I'd like to talk through what's on my mind.", source: "demo" as const };

  try {
    const pcm = wavPcm16(Buffer.from(await file.arrayBuffer()));
    const text = await transcribeWithRealtime(pcm, env.OPENAI_BASE_URL, env.OPENAI_API_KEY, env.OPENAI_TRANSCRIPTION_MODEL);
    if (!text || text.toLowerCase() === "[inaudible]") throw new Error("No intelligible speech was detected.");
    return { text, source: "openai" as const };
  } catch (error) {
    console.error("OpenAI audio transcription failed", safeError(error));
    throw new Error("We could not understand that recording. Please try speaking again.");
  }
}

function wavPcm16(wav: Buffer): Buffer {
  if (wav.length < 44 || wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("The recording is not a valid WAV file.");
  }

  let offset = 12;
  let format: { encoding: number; channels: number; sampleRate: number; bits: number } | undefined;
  let audio: Buffer | undefined;
  while (offset + 8 <= wav.length) {
    const id = wav.toString("ascii", offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = Math.min(start + size, wav.length);
    if (id === "fmt " && end - start >= 16) {
      format = { encoding: wav.readUInt16LE(start), channels: wav.readUInt16LE(start + 2), sampleRate: wav.readUInt32LE(start + 4), bits: wav.readUInt16LE(start + 14) };
    } else if (id === "data") {
      audio = wav.subarray(start, end);
    }
    offset = start + size + (size % 2);
  }

  if (!format || !audio?.length) throw new Error("The WAV recording is missing audio data.");
  if (format.encoding !== 1 || format.channels !== 1 || format.sampleRate !== 24_000 || format.bits !== 16) {
    throw new Error("The recording must be 24 kHz mono PCM16 audio.");
  }
  return audio;
}

function transcribeWithRealtime(pcm: Buffer, baseUrl: string, apiKey: string, model: string): Promise<string> {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const basePath = url.pathname.replace(/\/$/, "");
  url.pathname = basePath.endsWith("/v1") ? `${basePath}/realtime` : `${basePath}/v1/realtime`;
  url.search = new URLSearchParams({ model }).toString();

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, { headers: { Authorization: `Bearer ${apiKey}`, "OpenAI-Beta": "realtime=v1" } });
    let transcript = "";
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Realtime transcription timed out.")), 20_000);

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      if (error) reject(error);
      else resolve(transcript.trim());
    }

    socket.on("open", () => {
      socket.send(JSON.stringify({ type: "session.update", session: { modalities: ["text"], instructions: "Return only an exact transcript of the user's audio. Do not answer the speaker or add commentary.", input_audio_format: "pcm16", turn_detection: null } }));
      for (let offset = 0; offset < pcm.length; offset += 48_000) {
        socket.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(offset, offset + 48_000).toString("base64") }));
      }
      socket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      socket.send(JSON.stringify({ type: "response.create", response: { instructions: "Transcribe the audio exactly. Return only the transcript, or [inaudible] if no speech is intelligible." } }));
    });
    socket.on("message", (raw) => {
      const event = JSON.parse(raw.toString()) as { type?: string; delta?: string; text?: string; error?: { message?: string }; response?: { status?: string } };
      if (event.type === "response.text.delta") transcript += event.delta ?? "";
      if (event.type === "response.text.done") transcript = event.text ?? transcript;
      if (event.type === "error") finish(new Error(event.error?.message ?? "Realtime transcription failed."));
      if (event.type === "response.done") {
        if (event.response?.status !== "completed") finish(new Error("Realtime transcription did not complete."));
        else finish();
      }
    });
    socket.on("error", (error) => finish(error));
    socket.on("close", () => { if (!settled) finish(new Error("Realtime transcription connection closed early.")); });
  });
}

function safeError(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
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
    return { text: completion.choices[0]?.message?.content?.trim() || "I'm with you. What would feel like a small next step?", source: "openai" as const };
  } catch (error) {
    console.error("OpenAI response generation failed", safeError(error));
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
  } catch (error) {
    console.error("OpenAI extraction failed", safeError(error));
    return { extraction: fallback, source: "demo" };
  }
}
