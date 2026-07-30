import { createCall } from "../../../../lib/server/agent";
import { getDatabase } from "../../../../lib/server/db";
import { ok } from "../../../../lib/server/http";

export async function POST(request: Request) {
  const input = await request.json().catch(() => ({})) as { requestedSupportMode?: string; memoryEnabled?: boolean };
  return ok(createCall(getDatabase(), input), 201);
}
