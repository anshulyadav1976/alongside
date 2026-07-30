import { getDatabase, seedDemo } from "../../../../../lib/server/db";
import { fail, ok, userId } from "../../../../../lib/server/http";
import { journalFromRow } from "../../../../../lib/server/memory";

export function GET() {
  const db = getDatabase();
  seedDemo(db);
  const row = db.prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1").get(userId()) as Record<string, unknown> | undefined;
  return row ? ok(journalFromRow(row)) : fail("journal not found", 404, "JOURNAL_NOT_FOUND");
}
