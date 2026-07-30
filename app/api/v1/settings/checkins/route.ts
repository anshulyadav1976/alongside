import { getDatabase } from "../../../../../lib/server/db";
import { ok, userId } from "../../../../../lib/server/http";
import { now } from "../../../../../lib/server/ids";

export function GET() { const db = getDatabase(); return ok(db.prepare("SELECT * FROM checkin_policies WHERE user_id = ?").get(userId()) ?? { user_id: userId(), enabled: 0, max_per_week: 0, cooldown_hours: 24 }); }
export async function PATCH(request: Request) { const body = await request.json() as { enabled?: boolean; maxPerWeek?: number; cooldownHours?: number; pausedUntil?: string | null }; const db = getDatabase(); const uid = userId(); db.prepare("INSERT INTO checkin_policies (user_id, enabled, max_per_week, cooldown_hours, paused_until, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, max_per_week = excluded.max_per_week, cooldown_hours = excluded.cooldown_hours, paused_until = excluded.paused_until, updated_at = excluded.updated_at").run(uid, Number(body.enabled ?? false), body.maxPerWeek ?? 0, body.cooldownHours ?? 24, body.pausedUntil ?? null, now()); return ok(db.prepare("SELECT * FROM checkin_policies WHERE user_id = ?").get(uid)); }
