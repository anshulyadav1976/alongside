import type { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDatabase } from "./db";
import { id, now } from "./ids";

type Row = Record<string, unknown>;
const parse = (value: unknown) => { try { return value ? JSON.parse(String(value)) : {}; } catch { return {}; } };

export function listMemories(db: DatabaseSync = getDatabase(), userId: string, view: "current" | "history" = "current") {
  const rows = (view === "current"
    ? db.prepare("SELECT * FROM memories WHERE user_id = ? AND status = 'confirmed' AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) ORDER BY learned_at DESC").all(userId, now())
    : db.prepare("SELECT * FROM memories WHERE user_id = ? AND revoked_at IS NULL ORDER BY learned_at DESC").all(userId)) as Row[];
  return rows.map(memoryFromRow);
}

export function memoryFromRow(row: Row) {
  return {
    id: String(row.id), type: String(row.memory_type), statement: String(row.statement), structuredContent: parse(row.content_json),
    status: String(row.status), explicitness: String(row.explicitness), confidence: Number(row.confidence), sensitivity: String(row.sensitivity),
    sourceSessionId: String(row.source_session_id ?? ""), sourceTurnId: row.source_turn_id ? String(row.source_turn_id) : undefined,
    sourceQuote: String(row.source_quote ?? ""), validFrom: row.valid_from ? String(row.valid_from) : undefined, validTo: row.valid_to ? String(row.valid_to) : undefined,
    learnedAt: String(row.learned_at), invalidatedAt: row.invalidated_at ? String(row.invalidated_at) : undefined, expiresAt: row.expires_at ? String(row.expires_at) : undefined,
    supersededBy: row.superseded_by ? String(row.superseded_by) : undefined, reusePermission: String(row.reuse_permission),
  };
}

export function updateMemory(db: DatabaseSync, userId: string, memoryId: string, action: string, content?: string, expiresAt?: string, reusePermission?: string) {
  const existing = db.prepare("SELECT * FROM memories WHERE id = ? AND user_id = ?").get(memoryId, userId) as Row | undefined;
  if (!existing) return null;
  const timestamp = now();
  if (action === "forget") db.prepare("UPDATE memories SET status = 'revoked', revoked_at = ?, invalidated_at = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(timestamp, timestamp, timestamp, memoryId, userId);
  else if (action === "reject") db.prepare("UPDATE memories SET status = 'rejected', updated_at = ? WHERE id = ? AND user_id = ?").run(timestamp, memoryId, userId);
  else db.prepare("UPDATE memories SET status = CASE WHEN ? = 'confirm' OR ? = 'edit_confirm' THEN 'confirmed' ELSE status END, statement = COALESCE(?, statement), expires_at = COALESCE(?, expires_at), reuse_permission = COALESCE(?, reuse_permission), updated_at = ? WHERE id = ? AND user_id = ?").run(action, action, content ?? null, expiresAt ?? null, reusePermission ?? null, timestamp, memoryId, userId);
  return db.prepare("SELECT * FROM memories WHERE id = ? AND user_id = ?").get(memoryId, userId) as Row;
}

export function graphProjection(db: DatabaseSync, userId: string, view: "current" | "history" = "current") {
  const memories = listMemories(db, userId, view);
  const allowedIds = new Set(memories.map((memory) => memory.id));
  const entities = (db.prepare("SELECT * FROM entities WHERE user_id = ? AND revoked_at IS NULL").all(userId) as Row[]).filter((entity) => !entity.source_memory_id || allowedIds.has(String(entity.source_memory_id)));
  const entityIds = new Set(entities.map((entity) => String(entity.id)));
  const relations = (db.prepare("SELECT * FROM relations WHERE user_id = ? AND revoked_at IS NULL").all(userId) as Row[]).filter((relation) => entityIds.has(String(relation.subject_id)) && entityIds.has(String(relation.object_id)) && (!relation.source_memory_id || allowedIds.has(String(relation.source_memory_id))));
  const projection = {
    view,
    generatedAt: now(),
    nodes: [
      ...memories.map((memory) => ({ id: memory.id, type: memory.type, label: memory.statement, status: view === "current" ? "confirmed" : memory.status, sensitivity: memory.sensitivity, validFrom: memory.validFrom, validTo: memory.validTo, evidenceIds: [memory.sourceTurnId ?? memory.sourceSessionId], sourceQuote: memory.sourceQuote, sourceSessionId: memory.sourceSessionId })),
      ...entities.map((entity) => ({ id: String(entity.id), type: String(entity.entity_type), label: String(entity.label), status: view === "current" ? "confirmed" : "historical", sensitivity: "low", evidenceIds: entity.source_memory_id ? [String(entity.source_memory_id)] : [], metadata: parse(entity.attributes_json) })),
    ],
    edges: relations.map((relation) => ({ id: String(relation.id), source: String(relation.subject_id), target: String(relation.object_id), predicate: String(relation.predicate), validFrom: relation.valid_from ? String(relation.valid_from) : undefined, validTo: relation.valid_to ? String(relation.valid_to) : undefined, evidenceIds: relation.source_memory_id ? [String(relation.source_memory_id)] : [] })),
  };
  try {
    mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
    writeFileSync(resolve(process.cwd(), "data/temporal-graph.json"), JSON.stringify(projection, null, 2), "utf8");
  } catch { /* read-only deployments can still serve the in-memory projection */ }
  return projection;
}

export function journalFromRow(row: Row) {
  const content = parse(row.content_json) as Record<string, unknown>;
  return { id: String(row.id), sessionId: String(row.session_id), title: String(row.title), summary: String(row.summary), ...content, userEdited: Boolean(row.user_edited), updatedAt: String(row.updated_at) };
}

export function recordCandidateMemory(db: DatabaseSync, userId: string, sessionId: string, turnId: string, statement: string) {
  const timestamp = now();
  const memoryId = id("memory");
  db.prepare("INSERT INTO memories (id, user_id, memory_type, statement, content_json, status, explicitness, confidence, sensitivity, source_session_id, source_turn_id, source_quote, learned_at, created_at, updated_at) VALUES (?, ?, 'observation', ?, '{}', 'proposed', 'inferred', 0.65, 'low', ?, ?, ?, ?, ?, ?)").run(memoryId, userId, statement, sessionId, turnId, statement, timestamp, timestamp, timestamp);
  return memoryId;
}
