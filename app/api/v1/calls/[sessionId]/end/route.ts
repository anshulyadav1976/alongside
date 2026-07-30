import { endCall } from "../../../../../../lib/server/agent";
import { getDatabase } from "../../../../../../lib/server/db";
import { fail, ok, userId } from "../../../../../../lib/server/http";

export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await endCall(getDatabase(), sessionId, userId());
  return session ? ok(session) : fail("session not found", 404, "SESSION_NOT_FOUND");
}
