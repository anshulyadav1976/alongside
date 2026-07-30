import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDatabase } from "../../../../../../../../lib/server/db";
import { fail } from "../../../../../../../../lib/server/http";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string; turnId: string }> }) {
  const { sessionId, turnId } = await params;
  const row = getDatabase().prepare("SELECT id FROM transcript_turns WHERE id = ? AND session_id = ? AND speaker = 'agent'").get(turnId, sessionId) as { id: string } | undefined;
  if (!row) return fail("audio not found", 404, "AUDIO_NOT_FOUND");
  try { return new Response(await readFile(resolve(process.cwd(), "data/audio", `${turnId}.mp3`)), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" } }); }
  catch { return fail("audio is unavailable", 404, "AUDIO_NOT_FOUND"); }
}
