import { getDatabase, seedDemo } from "../../../../lib/server/db";
import { ok } from "../../../../lib/server/http";

export function GET() {
  const db = getDatabase();
  seedDemo(db);
  return ok({ status: "ok", database: "sqlite", agent: "server-owned", tts: "elevenlabs-only" });
}
