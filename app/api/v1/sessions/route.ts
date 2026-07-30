import { getDatabase, seedDemo } from "../../../../lib/server/db";
import { ok, userId } from "../../../../lib/server/http";

export function GET() { const db = getDatabase(); seedDemo(db); return ok(db.prepare("SELECT sessions.*, journal_entries.id AS journal_id, journal_entries.title AS journal_title, journal_entries.summary AS journal_summary FROM sessions INNER JOIN journal_entries ON journal_entries.session_id = sessions.id WHERE sessions.user_id = ? ORDER BY CASE WHEN sessions.id LIKE 'demo_session_%' THEN 0 ELSE 1 END, sessions.created_at DESC LIMIT 8").all(userId())); }
