export type SupportMode = "witness" | "practical" | "restore" | "open";
export type MemoryStatus = "proposed" | "confirmed" | "rejected" | "superseded" | "expired" | "revoked";
export type ReusePermission = "allowed" | "ask_first" | "never_proactive";

export interface TranscriptTurn {
  id: string;
  sessionId: string;
  speaker: "user" | "agent";
  text: string;
  startMs?: number;
  endMs?: number;
  source: "openai" | "fallback";
}

export interface Memory {
  id: string;
  type: "preference" | "boundary" | "coping_strategy" | "person" | "event" | "observation";
  statement: string;
  status: MemoryStatus;
  explicitness: "explicit" | "inferred";
  confidence: number;
  sensitivity: "low" | "medium" | "high";
  sourceSessionId: string;
  sourceQuote: string;
  validFrom?: string;
  validTo?: string;
  expiresAt?: string;
  reusePermission: ReusePermission;
}

export interface JournalEntry {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  importantMoments: string[];
  whatHelped: string[];
  whatDidNotHelp: string[];
  decisions: string[];
  nextSteps: string[];
  upcomingMoments: string[];
  candidateMemories: Memory[];
  userEdited: boolean;
  updatedAt: string;
}

export interface Session {
  id: string;
  state: "ready" | "active" | "processing" | "ready_for_review" | "failed";
  requestedSupportMode: SupportMode;
  memoryEnabled: boolean;
  startedAt: string;
  durationLabel: string;
  journalId?: string;
}

export interface TurnResponse {
  sessionId: string;
  turnId: string;
  userTranscript: string;
  assistantText: string;
  audioUrl?: string;
  transcriptSource: "openai" | "fallback";
}

export interface GraphNode {
  id: string;
  type: "event" | "person" | "strategy" | "boundary" | "preference" | "outcome";
  label: string;
  status: "confirmed" | "inferred" | "historical";
  sensitivity: "low" | "medium" | "high";
  validFrom?: string;
  validTo?: string;
  evidenceIds: string[];
  sourceQuote?: string;
  sourceSessionId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  predicate: string;
  validFrom?: string;
  validTo?: string;
  evidenceIds: string[];
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  view: "current" | "history";
  generatedAt: string;
}

export interface GraphQueryResponse {
  answer: string;
  facts: { text: string; evidenceIds: string[] }[];
  inferences: { text: string; evidenceIds: string[]; confidence?: number }[];
  uncertainty: string | null;
  abstained: boolean;
}

export interface CheckInDecision {
  decision: "CHECK_IN" | "NO_ACTION";
  reasonCode: string;
  reason: string;
  earliestAllowedAt?: string;
  evidenceIds: string[];
}

export interface DashboardData {
  latestJournal: JournalEntry;
  memoryInsight: Memory;
  upcomingMoment: { title: string; occursAt: string; note: string };
  checkIn: CheckInDecision;
}

export interface ProductClient {
  getDashboard(): Promise<DashboardData>;
  createCall(input: { requestedSupportMode: SupportMode; memoryEnabled: boolean }): Promise<Session>;
  sendTurn(sessionId: string, audio: Blob | null): Promise<TurnResponse>;
  endCall(sessionId: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session>;
  listSessions(): Promise<Session[]>;
  getTranscript(sessionId: string): Promise<TranscriptTurn[]>;
  getJournal(journalId: string): Promise<JournalEntry>;
  updateJournal(journalId: string, changes: Partial<JournalEntry>): Promise<JournalEntry>;
  updateMemory(memoryId: string, action: string, content?: string, reusePermission?: ReusePermission): Promise<Memory>;
  getGraph(view: "current" | "history"): Promise<GraphResponse>;
  queryGraph(question: string): Promise<GraphQueryResponse>;
  getCheckInDecision(): Promise<CheckInDecision>;
}
