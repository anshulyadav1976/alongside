import { getDatabase, seedDemo } from "../../../../lib/server/db";
import { ok, userId } from "../../../../lib/server/http";

export function GET() { const db = getDatabase(); seedDemo(db); return ok(db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC").all(userId())); }
