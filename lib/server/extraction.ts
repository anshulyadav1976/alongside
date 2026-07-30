import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { id, now } from "./ids";

const memorySchema = z.object({
  memoryType: z.enum(["event", "person", "preference", "boundary", "coping_strategy", "value", "goal", "upcoming_moment", "observation"]).catch("observation"),
  statement: z.string().min(3),
  explicitness: z.enum(["explicit", "inferred"]).catch("inferred"),
  confidence: z.coerce.number().min(0).max(1).catch(0.65),
  sensitivity: z.enum(["low", "medium", "high"]).catch("low"),
  sourceQuote: z.string().default(""),
  reusePermission: z.enum(["allowed", "ask_first", "never_proactive"]).catch("ask_first"),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  expiresAt: z.string().optional(),
});

const entitySchema = z.object({
  key: z.string().min(1),
  entityType: z.string().min(1).catch("topic"),
  label: z.string().min(1),
  attributes: z.record(z.unknown()).default({}),
});

const relationSchema = z.object({
  subjectKey: z.string().min(1),
  predicate: z.string().min(1),
  objectKey: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1).catch(0.7),
  explicitness: z.enum(["explicit", "inferred"]).catch("inferred"),
});

export const extractionSchema = z.object({
  journal: z.object({
    title: z.string().min(1).catch("A reflection from your call"),
    summary: z.string().min(1).catch("A reflection from the conversation."),
    importantMoments: z.array(z.string()).default([]),
    whatHelped: z.array(z.string()).default([]),
    whatDidNotHelp: z.array(z.string()).default([]),
    decisions: z.array(z.string()).default([]),
    nextSteps: z.array(z.string()).default([]),
    upcomingMoments: z.array(z.string()).default([]),
  }),
  memories: z.array(memorySchema).default([]),
  entities: z.array(entitySchema).default([]),
  relations: z.array(relationSchema).default([]),
  safetyFlags: z.array(z.string()).default([]),
});

export type ConversationExtraction = z.infer<typeof extractionSchema>;

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

export function fallbackExtraction(transcript: Array<{ speaker: string; text: string }>): ConversationExtraction {
  const userText = clean(transcript.filter((turn) => turn.speaker === "user").map((turn) => turn.text).join(" "));
  const firstSentence = userText.split(/[.!?]/).map(clean).find(Boolean) || "The user shared a reflection.";
  const memories: ConversationExtraction["memories"] = [];
  const entities: ConversationExtraction["entities"] = [{ key: "user", entityType: "person", label: "The user", attributes: {} }];
  const relations: ConversationExtraction["relations"] = [];

  const mentorMatch = userText.match(/(?:my|with my)\s+(mentor|friend|partner|manager)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (mentorMatch) {
    const label = mentorMatch[2];
    entities.push({ key: label.toLowerCase().replace(/\s+/g, "-"), entityType: mentorMatch[1].toLowerCase(), label, attributes: {} });
    relations.push({ subjectKey: "user", predicate: `works with ${mentorMatch[1].toLowerCase()}`, objectKey: label.toLowerCase().replace(/\s+/g, "-"), confidence: 0.86, explicitness: "explicit" });
    memories.push({ memoryType: "person", statement: `The user works with ${label}.`, explicitness: "explicit", confidence: 0.86, sensitivity: "low", sourceQuote: mentorMatch[0], reusePermission: "ask_first" });
  }
  const helpsMatch = userText.match(/([^.!?]{2,80})\s+(?:helps|has been helping)\b/i);
  if (helpsMatch) {
    const strategy = clean(helpsMatch[1]);
    memories.push({ memoryType: "coping_strategy", statement: `${strategy} helps the user.`, explicitness: "explicit", confidence: 0.8, sensitivity: "low", sourceQuote: helpsMatch[0], reusePermission: "ask_first" });
    entities.push({ key: "strategy-1", entityType: "coping_strategy", label: strategy, attributes: {} });
    relations.push({ subjectKey: "user", predicate: "benefits from", objectKey: "strategy-1", confidence: 0.8, explicitness: "explicit" });
  }
  const wantMatch = userText.match(/\b(?:I|we)\s+want\s+([^.!?]{3,120})/i);
  if (wantMatch) memories.push({ memoryType: "goal", statement: `The user wants ${clean(wantMatch[1])}.`, explicitness: "explicit", confidence: 0.82, sensitivity: "low", sourceQuote: wantMatch[0], reusePermission: "ask_first" });
  if (memories.length === 0) memories.push({ memoryType: "observation", statement: firstSentence, explicitness: "inferred", confidence: 0.55, sensitivity: "low", sourceQuote: firstSentence, reusePermission: "ask_first" });

  return {
    journal: { title: "A reflection from your call", summary: firstSentence, importantMoments: [firstSentence], whatHelped: memories.filter((memory) => memory.memoryType === "coping_strategy").map((memory) => memory.statement), whatDidNotHelp: [], decisions: [], nextSteps: [], upcomingMoments: [] },
    memories,
    entities,
    relations,
    safetyFlags: [],
  };
}

export function persistExtraction(db: DatabaseSync, userId: string, sessionId: string, extraction: ConversationExtraction) {
  const timestamp = now();
  const memoryIds: string[] = [];
  for (const memory of extraction.memories) {
    const memoryId = id("memory");
    memoryIds.push(memoryId);
    db.prepare("INSERT INTO memories (id, user_id, memory_type, statement, content_json, status, explicitness, confidence, sensitivity, source_session_id, source_quote, valid_from, valid_to, learned_at, expires_at, reuse_permission, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'proposed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(memoryId, userId, memory.memoryType, memory.statement, JSON.stringify({}), memory.explicitness, memory.confidence, memory.sensitivity, sessionId, memory.sourceQuote, memory.validFrom ?? null, memory.validTo ?? null, timestamp, memory.expiresAt ?? null, memory.reusePermission, timestamp, timestamp);
  }
  const entityIds = new Map<string, string>();
  const entityMemoryIds = new Map<string, string | null>();
  for (const entity of extraction.entities) {
    const entityId = id("entity");
    entityIds.set(entity.key, entityId);
    const labelWords = entity.label.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    const matchedIndex = extraction.memories.findIndex((memory) => labelWords.some((word) => memory.statement.toLowerCase().includes(word)));
    const sourceMemoryId = matchedIndex >= 0 ? memoryIds[matchedIndex] : entity.key === "user" ? (memoryIds[0] ?? null) : null;
    entityMemoryIds.set(entity.key, sourceMemoryId);
    db.prepare("INSERT INTO entities (id, user_id, entity_type, label, attributes_json, source_memory_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(entityId, userId, entity.entityType, entity.label, JSON.stringify(entity.attributes), sourceMemoryId, timestamp);
  }
  for (const relation of extraction.relations) {
    const subjectId = entityIds.get(relation.subjectKey);
    const objectId = entityIds.get(relation.objectKey);
    if (!subjectId || !objectId) continue;
    db.prepare("INSERT INTO relations (id, user_id, subject_id, predicate, object_id, learned_at, confidence, explicitness, source_memory_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id("relation"), userId, subjectId, relation.predicate, objectId, timestamp, relation.confidence, relation.explicitness, entityMemoryIds.get(relation.subjectKey) ?? entityMemoryIds.get(relation.objectKey) ?? null);
  }
  const content = { ...extraction.journal, candidateMemories: memoryIds.map((memoryId, index) => ({ id: memoryId, ...extraction.memories[index] })) };
  db.prepare("INSERT INTO journal_entries (id, user_id, session_id, title, summary, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET title = excluded.title, summary = excluded.summary, content_json = excluded.content_json, updated_at = excluded.updated_at").run(id("journal"), userId, sessionId, extraction.journal.title, extraction.journal.summary, JSON.stringify(content), timestamp, timestamp);
  return { memoryIds, entityIds: [...entityIds.values()] };
}
