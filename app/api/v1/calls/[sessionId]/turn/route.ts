import { getDatabase } from "../../../../../../lib/server/db";
import { processTurn } from "../../../../../../lib/server/agent";
import { fail, ok, userId } from "../../../../../../lib/server/http";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) return fail("audio file is required", 422, "AUDIO_REQUIRED");
  const result = await processTurn(getDatabase(), sessionId, userId(), audio, String(form.get("clientTurnId") || "") || undefined);
  if ("error" in result) return fail("session not found", 404, result.error);
  return ok(result.data);
}
