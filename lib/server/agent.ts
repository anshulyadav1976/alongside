import type { DatabaseSync } from "node:sqlite";
import { getDatabase, seedDemo } from "./db";
import { getEnv } from "./env";
import { id, now } from "./ids";
import { listMemories, recordCandidateMemory } from "./memory";
import { generateResponse, transcribeAudio } from "./ai";
import { synthesizeSpeech } from "./tts";

export function createCall(db: DatabaseSync = getDatabase()) {
  const env = getEnv();
  seedDemo(db, env.DEMO_USER_ID);
  const sessionId = id("session");
  const timestamp = now();
  db.prepare("INSERT INTO sessions (id, user_id, processing_state, memory_enabled, started_at, created_at, updated_at) VALUES (?, ?, 'ready', 1, ?, ?, ?)").run(sessionId, env.DEMO_USER_ID, timestamp, timestamp, timestamp);
  return { sessionId, state: "ready" as const };
}

export function getSession(db: DatabaseSync, sessionId: string, userId: string) {
  return db.prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?").get(sessionId, userId) as Record<string, unknown> | undefined;
}

export async function processTurn(db: DatabaseSync, sessionId: string, userId: string, file: File, clientTurnId?: string) {
  const session = getSession(db, sessionId, userId);
  if (!session) return { error: "SESSION_NOT_FOUND" as const };
  if (clientTurnId) {
    const prior = db.prepare("SELECT * FROM transcript_turns WHERE id = ? AND session_id = ? AND speaker = 'user'").get(clientTurnId, sessionId) as Record<string, unknown> | undefined;
    if (prior) return { data: await responseForExistingTurn(db, sessionId, userId, String(prior.id)) };
  }
  db.prepare("UPDATE sessions SET processing_state = 'transcribing', updated_at = ? WHERE id = ?").run(now(), sessionId);
  const transcription = await transcribeAudio(file);
  const userTurnId = clientTurnId || id("turn");
  const nextIndex = Number((db.prepare("SELECT COALESCE(MAX(turn_index), -1) AS max_index FROM transcript_turns WHERE session_id = ?").get(sessionId) as { max_index: number }).max_index) + 1;
  db.prepare("INSERT INTO transcript_turns (id, user_id, session_id, turn_index, speaker, text, source, model, created_at) VALUES (?, ?, ?, ?, 'user', ?, ?, ?, ?)").run(userTurnId, userId, sessionId, nextIndex, transcription.text, transcription.source, transcription.source === "openai" ? getEnv().OPENAI_TRANSCRIPTION_MODEL : "demo", now());
  db.prepare("UPDATE sessions SET processing_state = 'thinking', updated_at = ? WHERE id = ?").run(now(), sessionId);
  const context = listMemories(db, userId, "current").filter((memory) => memory.reusePermission !== "never_proactive").slice(0, 6).map((memory) => `- ${memory.statement}`).join("\n");
  const response = await generateResponse(transcription.text, context);
  const agentTurnId = id("turn");
  db.prepare("INSERT INTO transcript_turns (id, user_id, session_id, turn_index, speaker, text, source, model, created_at) VALUES (?, ?, ?, ?, 'agent', ?, ?, ?, ?)").run(agentTurnId, userId, sessionId, nextIndex + 1, response.text, response.source, response.source === "openai" ? getEnv().OPENAI_PROCESSING_MODEL : "demo", now());
  const speech = await synthesizeSpeech(response.text, agentTurnId);
  db.prepare("UPDATE sessions SET processing_state = 'active', updated_at = ? WHERE id = ?").run(now(), sessionId);
  recordCandidateMemory(db, userId, sessionId, userTurnId, transcription.text.length > 30 ? transcription.text.slice(0, 180) : "The user shared a brief reflection.");
  return { data: { sessionId, turnId: agentTurnId, userTranscript: transcription.text, assistantText: response.text, audioUrl: speech.audioUrl ? `/api/v1/calls/${sessionId}/turns/${agentTurnId}/audio` : undefined, transcriptSource: transcription.source } };
}

async function responseForExistingTurn(db: DatabaseSync, sessionId: string, userId: string, userTurnId: string) {
  const agent = db.prepare("SELECT * FROM transcript_turns WHERE session_id = ? AND turn_index = (SELECT turn_index + 1 FROM transcript_turns WHERE id = ?)").get(sessionId, userTurnId) as Record<string, unknown> | undefined;
  return { sessionId, turnId: String(agent?.id ?? userTurnId), userTranscript: String((db.prepare("SELECT text FROM transcript_turns WHERE id = ?").get(userTurnId) as { text: string }).text), assistantText: String(agent?.text ?? "I’m with you. What feels most important right now?"), audioUrl: undefined, transcriptSource: "demo" as const };
}

export function endCall(db: DatabaseSync, sessionId: string, userId: string) {
  const timestamp = now();
  db.prepare("UPDATE sessions SET processing_state = 'call_completed', ended_at = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(timestamp, timestamp, sessionId, userId);
  return getSession(db, sessionId, userId);
}
