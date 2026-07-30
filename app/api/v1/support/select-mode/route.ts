import { ok } from "../../../../../lib/server/http";

export async function POST(request: Request) { const body = await request.json().catch(() => ({})) as { requestedMode?: string }; return ok({ supportMode: body.requestedMode || "witness", rationale: "Start with the user's explicit choice; keep the response small and optional." }); }
