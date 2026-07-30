import { getDatabase } from "../../../../../lib/server/db";
import { fail, ok, userId } from "../../../../../lib/server/http";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; const db = getDatabase(); const session = db.prepare("SELECT sessions.*, journal_entries.id AS journal_id FROM sessions LEFT JOIN journal_entries ON journal_entries.session_id = sessions.id WHERE sessions.id = ? AND sessions.user_id = ?").get(sessionId, userId()); return session ? ok(session) : fail("session not found", 404, "SESSION_NOT_FOUND"); }
