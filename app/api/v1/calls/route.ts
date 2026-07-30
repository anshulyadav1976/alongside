import { createCall } from "../../../../lib/server/agent";
import { getDatabase } from "../../../../lib/server/db";
import { ok } from "../../../../lib/server/http";

export function POST() { return ok(createCall(getDatabase()), 201); }
