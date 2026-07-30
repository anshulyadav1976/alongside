import { getDatabase } from "../../../../../lib/server/db";
import { fail, ok, userId } from "../../../../../lib/server/http";
import { journalFromRow } from "../../../../../lib/server/memory";

export async function GET(_request: Request, { params }: { params: Promise<{ journalId: string }> }) {
  const { journalId } = await params; const row = getDatabase().prepare("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?").get(journalId, userId()) as Record<string, unknown> | undefined;
  return row ? ok(journalFromRow(row)) : fail("journal not found", 404, "JOURNAL_NOT_FOUND");
}
export async function PATCH(request: Request, { params }: { params: Promise<{ journalId: string }> }) {
  const { journalId } = await params; const body = await request.json() as { title?: string; summary?: string; content?: Record<string, unknown> }; const db = getDatabase();
  const result = db.prepare("UPDATE journal_entries SET title = COALESCE(?, title), summary = COALESCE(?, summary), content_json = COALESCE(?, content_json), user_edited = 1, updated_at = ? WHERE id = ? AND user_id = ?").run(body.title ?? null, body.summary ?? null, body.content ? JSON.stringify(body.content) : null, new Date().toISOString(), journalId, userId());
  if (!result.changes) return fail("journal not found", 404, "JOURNAL_NOT_FOUND");
  return ok(journalFromRow(db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(journalId) as Record<string, unknown>));
}
