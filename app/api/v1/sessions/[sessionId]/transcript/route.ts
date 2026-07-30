import { getDatabase } from "../../../../../../lib/server/db";
import { fail, ok, userId } from "../../../../../../lib/server/http";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; const db = getDatabase(); const session = db.prepare("SELECT id FROM sessions WHERE id = ? AND user_id = ?").get(sessionId, userId()); if (!session) return fail("session not found", 404, "SESSION_NOT_FOUND"); return ok(db.prepare("SELECT * FROM transcript_turns WHERE session_id = ? ORDER BY turn_index").all(sessionId)); }
