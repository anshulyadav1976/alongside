"use client";

import { dashboardData, demoJournal, demoMemories, demoSession, demoTranscript, graphAnswer, graphCurrent, graphHistory } from "@/lib/mock-data/seed";
import type { CheckInDecision, GraphQueryResponse, GraphResponse, JournalEntry, Memory, ProductClient, Session, SupportMode, TranscriptTurn, TurnResponse } from "./types";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function makeWavUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const sampleRate = 8000; const samples = 1600; const bytes = new ArrayBuffer(44 + samples * 2); const view = new DataView(bytes);
  const write = (offset: number, text: string) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); write(8, "WAVE"); write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, samples * 2, true);
  for (let index = 0; index < samples; index += 1) view.setInt16(44 + index * 2, Math.sin((2 * Math.PI * 440 * index) / sampleRate) * Math.exp(-index / 800) * 5000, true);
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { ...init, headers: { ...(init?.headers ?? {}) } });
  const envelope = await response.json() as { data: T | null; error: { message: string } | null };
  if (!response.ok || envelope.error || envelope.data == null) throw new Error(envelope.error?.message ?? "The request could not be completed.");
  return envelope.data;
}

type ApiRow = Record<string, unknown>;
const text = (value: unknown, fallback = "") => value == null ? fallback : String(value);
const bool = (value: unknown) => value === true || value === 1 || value === "1";

function toMemory(row: ApiRow): Memory {
  return { id: text(row.id), type: text(row.type ?? row.memory_type, "observation") as Memory["type"], statement: text(row.statement), status: text(row.status, "proposed") as Memory["status"], explicitness: text(row.explicitness, "inferred") as Memory["explicitness"], confidence: Number(row.confidence ?? 0.65), sensitivity: text(row.sensitivity, "low") as Memory["sensitivity"], sourceSessionId: text(row.sourceSessionId ?? row.source_session_id), sourceQuote: text(row.sourceQuote ?? row.source_quote), validFrom: row.validFrom ? text(row.validFrom) : row.valid_from ? text(row.valid_from) : undefined, validTo: row.validTo ? text(row.validTo) : row.valid_to ? text(row.valid_to) : undefined, expiresAt: row.expiresAt ? text(row.expiresAt) : row.expires_at ? text(row.expires_at) : undefined, reusePermission: text(row.reusePermission ?? row.reuse_permission, "ask_first") as Memory["reusePermission"] };
}

function toJournal(row: ApiRow): JournalEntry {
  const candidateMemories = Array.isArray(row.candidateMemories) ? row.candidateMemories.map((item) => toMemory(item as ApiRow)) : [];
  return { id: text(row.id), sessionId: text(row.sessionId ?? row.session_id), title: text(row.title, "A reflection from your call"), summary: text(row.summary), importantMoments: Array.isArray(row.importantMoments) ? row.importantMoments.map(String) : [], whatHelped: Array.isArray(row.whatHelped) ? row.whatHelped.map(String) : [], whatDidNotHelp: Array.isArray(row.whatDidNotHelp) ? row.whatDidNotHelp.map(String) : [], decisions: Array.isArray(row.decisions) ? row.decisions.map(String) : [], nextSteps: Array.isArray(row.nextSteps) ? row.nextSteps.map(String) : [], upcomingMoments: Array.isArray(row.upcomingMoments) ? row.upcomingMoments.map(String) : [], candidateMemories, userEdited: bool(row.userEdited ?? row.user_edited), updatedAt: text(row.updatedAt ?? row.updated_at) };
}

function toSession(row: ApiRow): Session {
  const started = text(row.startedAt ?? row.started_at, new Date().toISOString());
  const ended = row.endedAt ?? row.ended_at;
  const seconds = ended ? Math.max(0, Math.round((Date.parse(text(ended)) - Date.parse(started)) / 1000)) : 0;
  const state = text(row.state ?? row.processing_state, "ready");
  return { id: text(row.id ?? row.sessionId), state: state === "call_completed" ? "ready_for_review" : state === "extracting" ? "processing" : state as Session["state"], requestedSupportMode: text(row.requestedSupportMode ?? row.requested_support_mode, "open") as SupportMode, memoryEnabled: bool(row.memoryEnabled ?? row.memory_enabled ?? true), startedAt: started, durationLabel: seconds ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` : "00:00", journalId: row.journalId ? text(row.journalId) : row.journal_id ? text(row.journal_id) : undefined };
}

function toTurn(row: ApiRow): TranscriptTurn { return { id: text(row.id), sessionId: text(row.sessionId ?? row.session_id), speaker: text(row.speaker) as TranscriptTurn["speaker"], text: text(row.text), startMs: row.start_ms == null ? undefined : Number(row.start_ms), endMs: row.end_ms == null ? undefined : Number(row.end_ms), source: text(row.source, "demo") as TranscriptTurn["source"] }; }
function toGraph(row: ApiRow): GraphResponse { return { view: text(row.view, "current") as GraphResponse["view"], generatedAt: text(row.generatedAt, new Date().toISOString()), nodes: Array.isArray(row.nodes) ? row.nodes.map((node) => ({ ...(node as object), type: text((node as ApiRow).type, "observation"), status: text((node as ApiRow).status, "historical"), label: text((node as ApiRow).label), id: text((node as ApiRow).id), sensitivity: text((node as ApiRow).sensitivity, "low") } as GraphResponse["nodes"][number])) : [], edges: Array.isArray(row.edges) ? row.edges as GraphResponse["edges"] : [] }; }
function toCheckIn(row: ApiRow): CheckInDecision { return { decision: text(row.decision, "NO_ACTION") as CheckInDecision["decision"], reasonCode: text(row.reasonCode ?? row.reason_code), reason: text(row.reason), earliestAllowedAt: row.earliestAllowedAt ? text(row.earliestAllowedAt) : undefined, evidenceIds: Array.isArray(row.evidenceIds) ? row.evidenceIds.map(String) : [] }; }

const mockClient: ProductClient = {
  async getDashboard() { await wait(120); return dashboardData; },
  async createCall(input) { await wait(380); return { ...demoSession, id: `ses_local_${Date.now()}`, state: "ready", requestedSupportMode: input.requestedSupportMode, memoryEnabled: input.memoryEnabled, startedAt: new Date().toISOString(), durationLabel: "00:00" }; },
  async sendTurn(sessionId) { await wait(1150); return { sessionId, turnId: `turn_local_${Date.now()}`, userTranscript: "I would like to keep this practical and make a short plan for tomorrow.", assistantText: "Let us keep it practical. Would three short questions feel like enough to start with?", audioUrl: makeWavUrl(), transcriptSource: "openai" }; },
  async endCall(sessionId) { await wait(800); return { ...demoSession, id: sessionId, state: "ready_for_review", journalId: demoJournal.id }; },
  async getSession(sessionId) { await wait(180); return { ...demoSession, id: sessionId }; },
  async listSessions() { await wait(120); return [demoSession, { ...demoSession, id: "ses_demo_01", requestedSupportMode: "witness", durationLabel: "08:11", startedAt: "2026-07-24T16:00:00+01:00" }]; },
  async getTranscript() { await wait(180); return demoTranscript; },
  async getJournal() { await wait(180); return demoJournal; },
  async updateJournal(_journalId, changes) { await wait(280); return { ...demoJournal, ...changes, userEdited: true, updatedAt: new Date().toISOString() }; },
  async updateMemory(memoryId, action, content, reusePermission) { await wait(220); const memory = demoMemories.find((item) => item.id === memoryId) ?? demoMemories[2]; const status = action === "reject" ? "rejected" : action === "forget" ? "revoked" : "confirmed"; return { ...memory, statement: content || memory.statement, status, reusePermission: reusePermission ?? memory.reusePermission }; },
  async getGraph(view) { await wait(240); return view === "history" ? graphHistory : graphCurrent; },
  async queryGraph() { await wait(520); return graphAnswer; },
  async getCheckInDecision() { await wait(120); return dashboardData.checkIn; },
  async getCheckInSettings() { await wait(120); return { enabled: false, maxPerWeek: 0, cooldownHours: 24 }; },
  async updateCheckInSettings(changes) { await wait(160); return { enabled: false, maxPerWeek: 0, cooldownHours: 24, ...changes }; },
};

const apiClient: ProductClient = {
  async getDashboard() { const [latest, memories, checkIn] = await Promise.all([request<ApiRow>("/journals/latest"), request<ApiRow[]>("/memories?view=current"), request<ApiRow>("/checkins/decision", { method: "POST" })]); return { latestJournal: toJournal(latest), memoryInsight: toMemory(memories[0] ?? {}), upcomingMoment: { title: "No upcoming moment", occursAt: "", note: "" }, checkIn: toCheckIn(checkIn) }; },
  async createCall(input) { return toSession(await request<ApiRow>("/calls", { method: "POST", body: JSON.stringify(input), headers: { "Content-Type": "application/json" } })); },
  async sendTurn(sessionId, audio) { const body = new FormData(); body.set("audio", audio ?? new Blob(["demo turn"], { type: "audio/webm" }), "turn.webm"); const result = await request<ApiRow>(`/calls/${sessionId}/turn`, { method: "POST", body }); return { sessionId: text(result.sessionId, sessionId), turnId: text(result.turnId), userTranscript: text(result.userTranscript), assistantText: text(result.assistantText), audioUrl: result.audioUrl ? text(result.audioUrl) : undefined, transcriptSource: text(result.transcriptSource, "demo") as TurnResponse["transcriptSource"] }; },
  async endCall(sessionId) { return toSession(await request<ApiRow>(`/calls/${sessionId}/end`, { method: "POST" })); },
  async getSession(sessionId) { return toSession(await request<ApiRow>(`/sessions/${sessionId}`)); },
  async listSessions() { return (await request<ApiRow[]>("/sessions")).map(toSession); },
  async getTranscript(sessionId) { return (await request<ApiRow[]>(`/sessions/${sessionId}/transcript`)).map(toTurn); },
  async getJournal(journalId) { return toJournal(await request<ApiRow>(journalId ? `/journals/${journalId}` : "/journals/latest")); },
  async updateJournal(journalId, changes) { return toJournal(await request<ApiRow>(`/journals/${journalId}`, { method: "PATCH", body: JSON.stringify({ title: changes.title, summary: changes.summary, content: { importantMoments: changes.importantMoments, whatHelped: changes.whatHelped, whatDidNotHelp: changes.whatDidNotHelp, decisions: changes.decisions, nextSteps: changes.nextSteps, upcomingMoments: changes.upcomingMoments } }), headers: { "Content-Type": "application/json" } })); },
  async updateMemory(memoryId, action, content, reusePermission) { return toMemory(await request<ApiRow>(`/memories/${memoryId}`, { method: "PATCH", body: JSON.stringify({ action, content, reusePermission }), headers: { "Content-Type": "application/json" } })); },
  async getGraph(view) { return toGraph(await request<ApiRow>(`/graph?view=${view}`)); },
  async queryGraph(question) { return request<GraphQueryResponse>("/graph/query", { method: "POST", body: JSON.stringify({ question, view: "current" }), headers: { "Content-Type": "application/json" } }); },
  async getCheckInDecision() { return toCheckIn(await request<ApiRow>("/checkins/decision", { method: "POST" })); },
  async getCheckInSettings() { const row = await request<ApiRow>("/settings/checkins"); return { enabled: bool(row.enabled), maxPerWeek: Number(row.max_per_week ?? row.maxPerWeek ?? 0), cooldownHours: Number(row.cooldown_hours ?? row.cooldownHours ?? 24), pausedUntil: row.paused_until ? text(row.paused_until) : null }; },
  async updateCheckInSettings(changes) { const row = await request<ApiRow>("/settings/checkins", { method: "PATCH", body: JSON.stringify({ enabled: changes.enabled, maxPerWeek: changes.maxPerWeek, cooldownHours: changes.cooldownHours, pausedUntil: changes.pausedUntil }), headers: { "Content-Type": "application/json" } }); return { enabled: bool(row.enabled), maxPerWeek: Number(row.max_per_week ?? row.maxPerWeek ?? 0), cooldownHours: Number(row.cooldown_hours ?? row.cooldownHours ?? 24), pausedUntil: row.paused_until ? text(row.paused_until) : null }; },
};

export const productClient: ProductClient = isDemo() ? mockClient : apiClient;
export const supportModes: { id: SupportMode; label: string; detail: string }[] = [
  { id: "witness", label: "Talk it out", detail: "Be heard, without rushing to solve it." },
  { id: "practical", label: "Make a plan", detail: "Turn one thing into a manageable next step." },
  { id: "restore", label: "Take a breather", detail: "Choose a little relief without avoiding what matters." },
  { id: "open", label: "See where it goes", detail: "Start naturally; you can guide it as you go." },
];
