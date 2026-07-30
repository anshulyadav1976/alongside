export type SupportMode =
  | "witness"
  | "regulate"
  | "restore"
  | "gentle_activation"
  | "savour"
  | "meaning"
  | "narrative"
  | "human_connection"
  | "practical"
  | "open";

export type MemoryStatus =
  | "proposed"
  | "confirmed"
  | "rejected"
  | "superseded"
  | "expired"
  | "revoked";

export type ReusePermission = "allowed" | "ask_first" | "never_proactive";

export type ProcessingState =
  | "created"
  | "recording"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "active"
  | "call_completed"
  | "webhook_received"
  | "extracting"
  | "awaiting_user_review"
  | "ready"
  | "failed";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiError | null;
  meta?: Record<string, unknown>;
}

export interface TranscriptTurn {
  id: string;
  sessionId: string;
  speaker: "user" | "agent";
  text: string;
  startMs?: number;
  endMs?: number;
  source: "openai" | "elevenlabs_fallback" | "demo";
}

export interface CallSession {
  sessionId: string;
  state: "ready" | "recording" | "transcribing" | "thinking" | "speaking" | "processing" | "failed";
}

export interface CallTurnResponse {
  sessionId: string;
  turnId: string;
  userTranscript: string;
  assistantText: string;
  audioUrl?: string;
  transcriptSource: "openai" | "elevenlabs_fallback" | "demo";
}

export interface Memory {
  id: string;
  type:
    | "event"
    | "person"
    | "preference"
    | "boundary"
    | "coping_strategy"
    | "value"
    | "goal"
    | "upcoming_moment"
    | "observation";
  statement: string;
  structuredContent?: Record<string, unknown>;
  status: MemoryStatus;
  explicitness: "explicit" | "inferred";
  confidence: number;
  sensitivity: "low" | "medium" | "high";
  sourceSessionId: string;
  sourceTurnId?: string;
  sourceQuote: string;
  validFrom?: string;
  validTo?: string;
  learnedAt: string;
  invalidatedAt?: string;
  expiresAt?: string;
  supersededBy?: string;
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

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  status: "confirmed" | "inferred" | "historical";
  sensitivity: "low" | "medium" | "high";
  validFrom?: string;
  validTo?: string;
  evidenceIds: string[];
  metadata?: Record<string, unknown>;
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

export interface EvidenceClaim {
  text: string;
  evidenceIds: string[];
  confidence?: number;
}

export interface GraphQueryResponse {
  answer: string;
  facts: EvidenceClaim[];
  inferences: EvidenceClaim[];
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
