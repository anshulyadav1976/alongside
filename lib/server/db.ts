import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getEnv } from "./env";
import { id, now } from "./ids";

export const schemaSql = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY, timezone TEXT NOT NULL DEFAULT 'Europe/London', onboarding_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, requested_support_mode TEXT, selected_support_mode TEXT, processing_state TEXT NOT NULL DEFAULT 'created', memory_enabled INTEGER NOT NULL DEFAULT 1, safety_level TEXT NOT NULL DEFAULT 'normal', started_at TEXT, ended_at TEXT, processing_error_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS transcript_turns (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, turn_index INTEGER NOT NULL, speaker TEXT NOT NULL CHECK (speaker IN ('user', 'agent')), text TEXT NOT NULL, start_ms INTEGER, end_ms INTEGER, source TEXT NOT NULL CHECK (source IN ('openai', 'elevenlabs_fallback', 'demo')), model TEXT, created_at TEXT NOT NULL, audio_path TEXT, UNIQUE(session_id, turn_index));
CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE, title TEXT NOT NULL, summary TEXT NOT NULL, content_json TEXT NOT NULL DEFAULT '{}', user_edited INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, memory_type TEXT NOT NULL, statement TEXT NOT NULL, content_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL, explicitness TEXT NOT NULL, confidence REAL NOT NULL, sensitivity TEXT NOT NULL, source_session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL, source_turn_id TEXT REFERENCES transcript_turns(id) ON DELETE SET NULL, source_quote TEXT, valid_from TEXT, valid_to TEXT, learned_at TEXT NOT NULL, invalidated_at TEXT, expires_at TEXT, superseded_by TEXT REFERENCES memories(id), reuse_permission TEXT NOT NULL DEFAULT 'ask_first', revoked_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, entity_type TEXT NOT NULL, label TEXT NOT NULL, attributes_json TEXT NOT NULL DEFAULT '{}', source_memory_id TEXT REFERENCES memories(id) ON DELETE SET NULL, revoked_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS relations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, subject_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE, predicate TEXT NOT NULL, object_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE, valid_from TEXT, valid_to TEXT, learned_at TEXT NOT NULL, invalidated_at TEXT, confidence REAL NOT NULL DEFAULT 1, explicitness TEXT NOT NULL DEFAULT 'explicit', source_memory_id TEXT REFERENCES memories(id) ON DELETE SET NULL, revoked_at TEXT);
CREATE TABLE IF NOT EXISTS interventions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE, support_mode TEXT NOT NULL, intervention TEXT NOT NULL, rationale TEXT NOT NULL, context_json TEXT NOT NULL DEFAULT '{}', offered_at TEXT NOT NULL, accepted INTEGER, completed INTEGER, helpfulness INTEGER, burden INTEGER, later_effect TEXT, reuse_permission INTEGER);
CREATE TABLE IF NOT EXISTS upcoming_moments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, occurs_at TEXT NOT NULL, expected_difficulty INTEGER, followup_permission INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'upcoming', source_memory_id TEXT REFERENCES memories(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS checkin_policies (user_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, quiet_hours_json TEXT NOT NULL DEFAULT '{}', max_per_week INTEGER NOT NULL DEFAULT 0, cooldown_hours INTEGER NOT NULL DEFAULT 24, preferred_windows_json TEXT NOT NULL DEFAULT '[]', paused_until TEXT, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checkin_decisions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, upcoming_moment_id TEXT, decision TEXT NOT NULL, reason_code TEXT NOT NULL, reason TEXT NOT NULL, evidence_ids_json TEXT NOT NULL DEFAULT '[]', candidate_time TEXT, earliest_allowed_at TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user_created_idx ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transcript_session_turn_idx ON transcript_turns(session_id, turn_index);
CREATE INDEX IF NOT EXISTS memories_user_status_idx ON memories(user_id, status);
CREATE INDEX IF NOT EXISTS relations_subject_idx ON relations(user_id, subject_id, predicate);
CREATE INDEX IF NOT EXISTS relations_object_idx ON relations(user_id, object_id, predicate);
`;

let database: DatabaseSync | undefined;

export function createDatabase(databasePath: string) {
  const absolutePath = resolve(process.cwd(), databasePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  const db = new DatabaseSync(absolutePath);
  db.exec(schemaSql);
  return db;
}

export function getDatabase() {
  if (!database) database = createDatabase(getEnv().DATABASE_PATH);
  return database;
}

export function resetDatabaseForTests() {
  database?.close();
  database = undefined;
}

export function seedDemo(db = getDatabase(), userId = getEnv().DEMO_USER_ID) {
  const timestamp = now();
  db.prepare("INSERT OR IGNORE INTO profiles (user_id, created_at, updated_at) VALUES (?, ?, ?)").run(userId, timestamp, timestamp);
  db.prepare("INSERT OR IGNORE INTO checkin_policies (user_id, updated_at) VALUES (?, ?)").run(userId, timestamp);
  const existing = db.prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get(userId) as { count: number };
  if (Number(existing.count) > 0) return;
  const sessionId = id("session");
  db.prepare("INSERT INTO sessions (id, user_id, processing_state, memory_enabled, started_at, ended_at, created_at, updated_at) VALUES (?, ?, 'call_completed', 1, ?, ?, ?, ?)").run(sessionId, userId, timestamp, timestamp, timestamp, timestamp);
  const turnId = id("turn");
  db.prepare("INSERT INTO transcript_turns (id, user_id, session_id, turn_index, speaker, text, source, model, created_at) VALUES (?, ?, ?, 0, 'user', ?, 'demo', 'seed', ?)").run(turnId, userId, sessionId, "I want to keep my evenings calmer.", timestamp);
  db.prepare("INSERT INTO transcript_turns (id, user_id, session_id, turn_index, speaker, text, source, model, created_at) VALUES (?, ?, ?, 1, 'agent', ?, 'demo', 'seed', ?)").run(id("turn"), userId, sessionId, "That sounds like a kind direction. What would make tonight feel one notch calmer?", timestamp);
  db.prepare("INSERT INTO journal_entries (id, user_id, session_id, title, summary, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id("journal"), userId, sessionId, "A calmer evening", "The user wants to make evenings feel calmer.", JSON.stringify({ importantMoments: ["Named a wish for calmer evenings."], nextSteps: ["Choose one small wind-down cue."] }), timestamp, timestamp);
  const memoryId = id("memory");
  db.prepare("INSERT INTO memories (id, user_id, memory_type, statement, content_json, status, explicitness, confidence, sensitivity, source_session_id, source_turn_id, source_quote, learned_at, created_at, updated_at) VALUES (?, ?, 'preference', ?, '{}', 'confirmed', 'explicit', 0.96, 'low', ?, ?, ?, ?, ?, ?)").run(memoryId, userId, "Calmer evenings matter to the user.", sessionId, turnId, "I want to keep my evenings calmer.", timestamp, timestamp, timestamp);
  const momentId = id("moment");
  db.prepare("INSERT INTO upcoming_moments (id, user_id, title, occurs_at, expected_difficulty, followup_permission, status, source_memory_id) VALUES (?, ?, ?, ?, 2, 0, 'upcoming', ?)").run(momentId, userId, "Tonight's wind-down", new Date(Date.now() + 86400000).toISOString(), memoryId);
}
