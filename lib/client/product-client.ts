"use client";

import { dashboardData, demoJournal, demoMemories, demoSession, demoTranscript, graphAnswer, graphCurrent, graphHistory } from "@/lib/mock-data/seed";
import type { CheckInDecision, DashboardData, GraphQueryResponse, GraphResponse, JournalEntry, Memory, ProductClient, Session, SupportMode, TranscriptTurn, TurnResponse } from "./types";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

function makeWavUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const sampleRate = 8000;
  const samples = 1600;
  const bytes = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(bytes);
  const write = (offset: number, text: string) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, samples * 2, true);
  for (let index = 0; index < samples; index += 1) {
    const value = Math.sin((2 * Math.PI * 440 * index) / sampleRate) * Math.exp(-index / 800) * 5000;
    view.setInt16(44 + index * 2, value, true);
  }
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { ...init, headers: { ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error("The request could not be completed. Please try again.");
  const envelope = await response.json() as { data: T | null; error: { message: string } | null };
  if (envelope.error || !envelope.data) throw new Error(envelope.error?.message ?? "No data returned.");
  return envelope.data;
}

const mockClient: ProductClient = {
  async getDashboard(): Promise<DashboardData> { await wait(120); return dashboardData; },
  async createCall(input): Promise<Session> { await wait(380); return { ...demoSession, id: `ses_local_${Date.now()}`, state: "ready", requestedSupportMode: input.requestedSupportMode, memoryEnabled: input.memoryEnabled, startedAt: new Date().toISOString(), durationLabel: "00:00" }; },
  async sendTurn(sessionId): Promise<TurnResponse> {
    await wait(1150);
    return { sessionId, turnId: `turn_local_${Date.now()}`, userTranscript: "I would like to keep this practical and make a short plan for tomorrow.", assistantText: "Let us keep it practical. Would three short questions feel like enough to start with?", audioUrl: makeWavUrl(), transcriptSource: "openai" };
  },
  async endCall(sessionId): Promise<Session> { await wait(800); return { ...demoSession, id: sessionId, state: "ready_for_review", journalId: demoJournal.id }; },
  async getSession(sessionId): Promise<Session> { await wait(180); return { ...demoSession, id: sessionId }; },
  async listSessions(): Promise<Session[]> { await wait(120); return [demoSession, { ...demoSession, id: "ses_demo_01", requestedSupportMode: "witness", durationLabel: "08:11", startedAt: "2026-07-24T16:00:00+01:00" }]; },
  async getTranscript(): Promise<TranscriptTurn[]> { await wait(180); return demoTranscript; },
  async getJournal(): Promise<JournalEntry> { await wait(180); return demoJournal; },
  async updateJournal(_journalId, changes): Promise<JournalEntry> { await wait(280); return { ...demoJournal, ...changes, userEdited: true, updatedAt: new Date().toISOString() }; },
  async updateMemory(memoryId, action, content, reusePermission): Promise<Memory> {
    await wait(220);
    const memory = demoMemories.find((item) => item.id === memoryId) ?? demoMemories[2];
    const status = action === "reject" ? "rejected" : action === "forget" ? "revoked" : "confirmed";
    return { ...memory, statement: content || memory.statement, status, reusePermission: reusePermission ?? memory.reusePermission };
  },
  async getGraph(view): Promise<GraphResponse> { await wait(240); return view === "history" ? graphHistory : graphCurrent; },
  async queryGraph(): Promise<GraphQueryResponse> { await wait(520); return graphAnswer; },
  async getCheckInDecision(): Promise<CheckInDecision> { await wait(120); return dashboardData.checkIn; },
};

const apiClient: ProductClient = {
  getDashboard: () => Promise.all([request<JournalEntry>("/journals/latest"), request<Memory[]>("/memories?status=confirmed"), request<CheckInDecision>("/checkins/decision")]).then(([latestJournal, memories, checkIn]) => ({ latestJournal, memoryInsight: memories[0], upcomingMoment: { title: "No upcoming moment", occursAt: "", note: "" }, checkIn })),
  createCall: (input) => request<Session>("/calls", { method: "POST", body: JSON.stringify(input), headers: { "Content-Type": "application/json" } }),
  sendTurn: (sessionId, audio) => { const body = new FormData(); if (audio) body.set("audio", audio, "turn.webm"); return request<TurnResponse>(`/calls/${sessionId}/turn`, { method: "POST", body }); },
  endCall: (sessionId) => request<Session>(`/calls/${sessionId}/end`, { method: "POST" }),
  getSession: (sessionId) => request<Session>(`/sessions/${sessionId}`),
  listSessions: () => request<Session[]>("/sessions"),
  getTranscript: (sessionId) => request<TranscriptTurn[]>(`/sessions/${sessionId}/transcript`),
  getJournal: (journalId) => request<JournalEntry>(`/journals/${journalId}`),
  updateJournal: (journalId, changes) => request<JournalEntry>(`/journals/${journalId}`, { method: "PATCH", body: JSON.stringify(changes), headers: { "Content-Type": "application/json" } }),
  updateMemory: (memoryId, action, content, reusePermission) => request<Memory>(`/memories/${memoryId}`, { method: "PATCH", body: JSON.stringify({ action, content, reusePermission }), headers: { "Content-Type": "application/json" } }),
  getGraph: (view) => request<GraphResponse>(`/graph?view=${view}`),
  queryGraph: (question) => request<GraphQueryResponse>("/graph/query", { method: "POST", body: JSON.stringify({ question, view: "current", selectedNodeIds: [] }), headers: { "Content-Type": "application/json" } }),
  getCheckInDecision: () => request<CheckInDecision>("/checkins/decision"),
};

export const productClient: ProductClient = isDemo() ? mockClient : apiClient;
export const supportModes: { id: SupportMode; label: string; detail: string }[] = [
  { id: "witness", label: "Talk it out", detail: "Be heard, without rushing to solve it." },
  { id: "practical", label: "Make a plan", detail: "Turn one thing into a manageable next step." },
  { id: "restore", label: "Take a breather", detail: "Choose a little relief without avoiding what matters." },
  { id: "open", label: "See where it goes", detail: "Start naturally; you can guide it as you go." },
];
