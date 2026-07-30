import { getDatabase } from "../../../../../lib/server/db";
import { fail, ok, userId } from "../../../../../lib/server/http";
import { updateMemory } from "../../../../../lib/server/memory";

export async function PATCH(request: Request, { params }: { params: Promise<{ memoryId: string }> }) { const { memoryId } = await params; const body = await request.json() as { action?: string; content?: string; expiresAt?: string; reusePermission?: string }; const row = updateMemory(getDatabase(), userId(), memoryId, body.action ?? "confirm", body.content, body.expiresAt, body.reusePermission); return row ? ok(row) : fail("memory not found", 404, "MEMORY_NOT_FOUND"); }
