import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase, seedDemo } from "../../lib/server/db";
import { graphProjection, listMemories, updateMemory } from "../../lib/server/memory";
import { processTurn } from "../../lib/server/agent";

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
  it("creates a transcript and response without provider keys", async () => { const db = fixture(); const sessionId = String((db.prepare("SELECT id FROM sessions WHERE user_id = ? LIMIT 1").get("test-user") as { id: string }).id); db.prepare("UPDATE sessions SET processing_state = 'ready' WHERE id = ?").run(sessionId); const result = await processTurn(db, sessionId, "test-user", new File(["hello"], "voice.webm", { type: "audio/webm" })); assert.ok("data" in result); assert.equal(result.data?.sessionId, sessionId); assert.match(result.data?.assistantText ?? "", /hear you|one small step/i); assert.equal((db.prepare("SELECT COUNT(*) AS count FROM transcript_turns WHERE session_id = ?").get(sessionId) as { count: number }).count, 4); db.close(); });
});
