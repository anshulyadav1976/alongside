import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase, seedDemo } from "../../lib/server/db";
import { id, now } from "../../lib/server/ids";

describe("check-in boundary", () => {
  it("defaults to NO_ACTION until explicit opt-in", () => { const path = mkdtempSync(join(tmpdir(), "alongside-checkin-")); const db = createDatabase(join(path, "test.db")); seedDemo(db, "test-user"); const policy = db.prepare("SELECT enabled FROM checkin_policies WHERE user_id = ?").get("test-user") as { enabled: number }; assert.equal(policy.enabled, 0); const decision = policy.enabled ? "CHECK_IN" : "NO_ACTION"; db.prepare("INSERT INTO checkin_decisions (id, user_id, decision, reason_code, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id("decision"), "test-user", decision, "CHECKINS_DISABLED", "No explicit opt-in", now()); assert.equal((db.prepare("SELECT decision FROM checkin_decisions WHERE user_id = ?").get("test-user") as { decision: string }).decision, "NO_ACTION"); db.close(); rmSync(path, { recursive: true, force: true }); });
});
