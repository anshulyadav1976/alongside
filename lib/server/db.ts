import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getEnv } from "./env";
import { now } from "./ids";

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

  const demos = [
    {
      id: "demo_session_relationship",
      mode: "witness",
      startedAt: "2026-07-29T19:42:00.000Z",
      endedAt: "2026-07-29T19:53:00.000Z",
      title: "After a difficult conversation",
      summary: "Anshul slowed down after an argument with his girlfriend Priya and decided to repair the conversation without forcing an immediate resolution.",
      turns: [
        "I keep replaying the argument with Priya. I care about her, but I got defensive and made everything worse.",
        "It sounds like the relationship matters more to you than winning the argument. We can make room for both the regret and a calmer next step.",
        "I want to apologise for how I spoke, then ask if we can talk tomorrow when we are both calmer.",
        "That feels grounded: own your part, leave her room to respond, and do not demand that everything is fixed tonight.",
      ],
      memories: [
        { id: "demo_memory_priya", type: "person", statement: "Anshul is trying to repair a tense conversation with his girlfriend Priya.", quote: "I care about her, but I got defensive.", confidence: 0.98, sensitivity: "medium", permission: "allowed" },
      ],
      content: { importantMoments: ["Noticed that repair matters more than being right."], whatHelped: ["Separating an apology from an expectation of immediate forgiveness."], whatDidNotHelp: ["Replaying the argument late at night."], decisions: ["Apologise clearly and ask to talk when both feel calmer."], nextSteps: ["Send a short, pressure-free message tomorrow."], upcomingMoments: ["Conversation with Priya tomorrow evening"] },
    },
    {
      id: "demo_session_presentation",
      mode: "practical",
      startedAt: "2026-07-27T17:35:00.000Z",
      endedAt: "2026-07-27T17:47:00.000Z",
      title: "A steadier presentation plan",
      summary: "Anshul turned presentation nerves into a short plan: three core points, one rehearsal, and a calmer start.",
      turns: [
        "I have a presentation coming up and I am worried I will freeze when everyone looks at me.",
        "Let us reduce the load. You do not need a perfect performance; you need a clear opening and three points you trust.",
        "Three points and one rehearsal feels manageable. I can stop tweaking the slides after that.",
        "Good. A clear stopping point protects your energy and gives your brain a chance to settle.",
      ],
      memories: [
        { id: "demo_memory_three_steps", type: "coping_strategy", statement: "A simple three-step plan helps Anshul feel prepared for presentations.", quote: "Three points and one rehearsal feels manageable.", confidence: 0.96, sensitivity: "low", permission: "allowed" },
      ],
      content: { importantMoments: ["Changed the goal from perfect to prepared."], whatHelped: ["Reducing preparation to three clear points."], whatDidNotHelp: ["Continuously tweaking slides."], decisions: ["Rehearse once, then stop editing."], nextSteps: ["Write the opening line on a note card."], upcomingMoments: ["Presentation on Friday morning"] },
    },
    {
      id: "demo_session_evening_reset",
      mode: "restore",
      startedAt: "2026-07-24T20:05:00.000Z",
      endedAt: "2026-07-24T20:16:00.000Z",
      title: "Making evenings feel lighter",
      summary: "A short walk and a familiar lo-fi playlist helped Anshul move out of work mode without turning the evening into another task list.",
      turns: [
        "Even after I close my laptop, my head is still at work and I cannot properly relax.",
        "Your body may need a clearer bridge out of work mode. What has made that transition easier before?",
        "A ten-minute walk after dinner and my lo-fi playlist usually help more than scrolling.",
        "That is useful evidence. Keep the reset small: shoes on, one track, ten minutes, then decide what you need next.",
      ],
      memories: [
        { id: "demo_memory_walk", type: "coping_strategy", statement: "A short walk after dinner helps Anshul clear his head.", quote: "A ten-minute walk after dinner usually helps.", confidence: 0.97, sensitivity: "low", permission: "allowed" },
        { id: "demo_memory_playlist", type: "coping_strategy", statement: "A familiar lo-fi playlist helps Anshul settle after stressful days.", quote: "My lo-fi playlist usually helps more than scrolling.", confidence: 0.95, sensitivity: "low", permission: "allowed" },
      ],
      content: { importantMoments: ["Recognised the need for a bridge between work and rest."], whatHelped: ["A short walk and familiar music."], whatDidNotHelp: ["Scrolling immediately after work."], decisions: ["Keep the reset intentionally small."], nextSteps: ["Put walking shoes by the door before dinner."], upcomingMoments: ["Tonight's wind-down"] },
    },
  ] as const;

  for (const demo of demos) {
    db.prepare("INSERT OR IGNORE INTO sessions (id, user_id, requested_support_mode, selected_support_mode, processing_state, memory_enabled, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'ready', 1, ?, ?, ?, ?)").run(demo.id, userId, demo.mode, demo.mode, demo.startedAt, demo.endedAt, demo.startedAt, demo.endedAt);
    const turnIds = demo.turns.map((_, index) => `${demo.id}_turn_${index + 1}`);
    demo.turns.forEach((text, index) => {
      db.prepare("INSERT OR IGNORE INTO transcript_turns (id, user_id, session_id, turn_index, speaker, text, start_ms, end_ms, source, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', 'seed', ?)").run(turnIds[index], userId, demo.id, index, index % 2 === 0 ? "user" : "agent", text, index * 16_000, index * 16_000 + 12_000, demo.startedAt);
    });
    for (const memory of demo.memories) {
      db.prepare("INSERT OR IGNORE INTO memories (id, user_id, memory_type, statement, content_json, status, explicitness, confidence, sensitivity, source_session_id, source_turn_id, source_quote, valid_from, learned_at, reuse_permission, created_at, updated_at) VALUES (?, ?, ?, ?, '{}', 'confirmed', 'explicit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(memory.id, userId, memory.type, memory.statement, memory.confidence, memory.sensitivity, demo.id, turnIds[2], memory.quote, demo.startedAt, demo.endedAt, memory.permission, demo.endedAt, demo.endedAt);
    }
    const candidateMemories = demo.memories.map((memory) => ({ id: memory.id, type: memory.type, statement: memory.statement, status: "confirmed", explicitness: "explicit", confidence: memory.confidence, sensitivity: memory.sensitivity, sourceSessionId: demo.id, sourceQuote: memory.quote, validFrom: demo.startedAt, reusePermission: memory.permission }));
    db.prepare("INSERT OR IGNORE INTO journal_entries (id, user_id, session_id, title, summary, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(`${demo.id}_journal`, userId, demo.id, demo.title, demo.summary, JSON.stringify({ ...demo.content, candidateMemories }), demo.endedAt, demo.endedAt);
  }

  const entities = [
    ["demo_entity_anshul", "person", "Anshul", "demo_memory_priya", { role: "user" }],
    ["demo_entity_priya", "person", "Priya", "demo_memory_priya", { relationship: "girlfriend" }],
    ["demo_entity_presentation", "event", "Friday presentation", "demo_memory_three_steps", { status: "upcoming" }],
    ["demo_entity_three_step_plan", "strategy", "Three-step plan", "demo_memory_three_steps", { steps: 3 }],
    ["demo_entity_evening_reset", "strategy", "Evening reset", "demo_memory_walk", { durationMinutes: 10 }],
    ["demo_entity_playlist", "strategy", "Lo-fi playlist", "demo_memory_playlist", { familiarity: "high" }],
  ] as const;
  for (const [entityId, type, label, memoryId, attributes] of entities) {
    db.prepare("INSERT OR IGNORE INTO entities (id, user_id, entity_type, label, attributes_json, source_memory_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(entityId, userId, type, label, JSON.stringify(attributes), memoryId, timestamp);
  }

  const relations = [
    ["demo_relation_priya", "demo_entity_anshul", "IN_RELATIONSHIP_WITH", "demo_entity_priya", "demo_memory_priya", 0.99],
    ["demo_relation_plan", "demo_entity_presentation", "SUPPORTED_BY", "demo_entity_three_step_plan", "demo_memory_three_steps", 0.97],
    ["demo_relation_reset", "demo_entity_evening_reset", "HELPS", "demo_entity_anshul", "demo_memory_walk", 0.96],
    ["demo_relation_playlist", "demo_entity_playlist", "PART_OF", "demo_entity_evening_reset", "demo_memory_playlist", 0.95],
  ] as const;
  for (const [relationId, subjectId, predicate, objectId, memoryId, confidence] of relations) {
    db.prepare("INSERT OR IGNORE INTO relations (id, user_id, subject_id, predicate, object_id, valid_from, learned_at, confidence, explicitness, source_memory_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'explicit', ?)").run(relationId, userId, subjectId, predicate, objectId, "2026-07-24T20:05:00.000Z", timestamp, confidence, memoryId);
  }

  db.prepare("INSERT OR IGNORE INTO upcoming_moments (id, user_id, title, occurs_at, expected_difficulty, followup_permission, status, source_memory_id) VALUES ('demo_moment_presentation', ?, 'Friday presentation', '2026-07-31T09:30:00.000Z', 3, 1, 'upcoming', 'demo_memory_three_steps')").run(userId);
}
