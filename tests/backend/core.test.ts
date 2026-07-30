import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase, seedDemo } from "../../lib/server/db";
import { graphProjection, listMemories, updateMemory } from "../../lib/server/memory";
import { endCall, processTurn } from "../../lib/server/agent";
import { safetyLevel } from "../../lib/server/safety";
import { fallbackExtraction, persistExtraction } from "../../lib/server/extraction";

const paths: string[] = [];
afterEach(() => { for (const path of paths.splice(0)) rmSync(path, { recursive: true, force: true }); });
function fixture() { const path = mkdtempSync(join(tmpdir(), "alongside-test-")); paths.push(path); const db = createDatabase(join(path, "test.db")); seedDemo(db, "test-user"); return db; }

describe("SQLite memory lifecycle", () => {
  it("returns current confirmed memories and hides revoked ones", () => {
    const db = fixture(); const memory = listMemories(db, "test-user")[0]; assert.ok(memory); updateMemory(db, "test-user", memory.id, "forget"); assert.equal(listMemories(db, "test-user").some((item) => item.id === memory.id), false); assert.equal(listMemories(db, "test-user", "history").some((item) => item.id === memory.id), false); db.close();
  });
  it("projects an approved memory graph", () => { const db = fixture(); const graph = graphProjection(db, "test-user"); assert.ok(graph.nodes.length >= 1); assert.equal(graph.view, "current"); db.close(); });
});

describe("own-agent fallback", () => {
  it("creates a transcript, response, and extracted journal without provider keys", async () => { const db = fixture(); const sessionId = String((db.prepare("SELECT id FROM sessions WHERE user_id = ? LIMIT 1").get("test-user") as { id: string }).id); const initialTurns = (db.prepare("SELECT COUNT(*) AS count FROM transcript_turns WHERE session_id = ?").get(sessionId) as { count: number }).count; db.prepare("UPDATE sessions SET processing_state = 'ready' WHERE id = ?").run(sessionId); const result = await processTurn(db, sessionId, "test-user", new File(["hello"], "voice.webm", { type: "audio/webm" })); assert.ok("data" in result); assert.equal(result.data?.sessionId, sessionId); assert.match(result.data?.assistantText ?? "", /hear you|one small step/i); assert.equal((db.prepare("SELECT COUNT(*) AS count FROM transcript_turns WHERE session_id = ?").get(sessionId) as { count: number }).count, initialTurns + 2); await endCall(db, sessionId, "test-user"); const journal = db.prepare("SELECT content_json FROM journal_entries WHERE session_id = ?").get(sessionId) as { content_json: string }; assert.ok(JSON.parse(journal.content_json).importantMoments.length >= 1); db.close(); });
});

describe("safety boundary", () => {
  it("uses deterministic urgent classification", () => { assert.equal(safetyLevel("I might hurt myself tonight"), "urgent"); assert.equal(safetyLevel("I had a difficult day"), "normal"); });
});

describe("structured journal and graph extraction", () => {
  it("persists grounded memories, entities, and relations", () => {
    const db = fixture();
    const sessionId = String((db.prepare("SELECT id FROM sessions WHERE user_id = ? LIMIT 1").get("test-user") as { id: string }).id);
    const extraction = fallbackExtraction([{ speaker: "user", text: "I work with my mentor Maya on a launch. Walking after dinner helps, and I want calmer evenings." }]);
    const persisted = persistExtraction(db, "test-user", sessionId, extraction);
    assert.ok(persisted.memoryIds.length >= 2);
    assert.ok(persisted.entityIds.length >= 2);
    const graph = graphProjection(db, "test-user", "history");
    assert.ok(graph.nodes.some((node) => node.label === "Maya"));
    assert.ok(graph.edges.some((edge) => edge.predicate.includes("mentor")));
    const journal = db.prepare("SELECT content_json FROM journal_entries WHERE session_id = ?").get(sessionId) as { content_json: string };
    assert.equal(JSON.parse(journal.content_json).candidateMemories.length, extraction.memories.length);
    db.close();
  });
});
