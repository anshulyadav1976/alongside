import { getDatabase, seedDemo } from "../../../../lib/server/db";
import { ok, userId } from "../../../../lib/server/http";
import { graphProjection } from "../../../../lib/server/memory";

export function GET(request: Request) { const db = getDatabase(); seedDemo(db); const view = new URL(request.url).searchParams.get("view") === "history" ? "history" : "current"; return ok(graphProjection(db, userId(), view)); }
