import { NextResponse } from "next/server";
import { getEnv } from "./env";

export const userId = () => getEnv().DEMO_USER_ID;
export function ok<T>(data: T, status = 200) { return NextResponse.json({ data, error: null }, { status }); }
export function fail(message: string, status = 400, code = "BAD_REQUEST") { return NextResponse.json({ data: null, error: { code, message } }, { status }); }
