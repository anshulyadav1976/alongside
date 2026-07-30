import type { DashboardData, GraphResponse, GraphQueryResponse, JournalEntry, Memory, Session, TranscriptTurn } from "@/lib/client/types";

export const demoSession: Session = {
  id: "ses_demo_02",
  state: "ready_for_review",
  requestedSupportMode: "practical",
  memoryEnabled: true,
  startedAt: "2026-07-30T18:20:00+01:00",
  durationLabel: "06:42",
  journalId: "journal_demo_02",
};

export const demoMemories: Memory[] = [
  {
    id: "mem_music",
    type: "coping_strategy",
    statement: "A familiar playlist can make a difficult journey feel easier.",
    status: "confirmed",
    explicitness: "explicit",
    confidence: 0.91,
    sensitivity: "medium",
    sourceSessionId: "ses_demo_01",
    sourceQuote: "Having my playlist on made the journey easier.",
    validFrom: "2026-07-24T16:00:00+01:00",
    reusePermission: "ask_first",
  },
  {
    id: "mem_questions",
    type: "boundary",
    statement: "Too many questions can feel tiring when support is needed.",
    status: "confirmed",
    explicitness: "explicit",
    confidence: 0.95,
    sensitivity: "low",
    sourceSessionId: "ses_demo_01",
    sourceQuote: "Please don't ask me too many questions right now.",
    validFrom: "2026-07-24T16:00:00+01:00",
    reusePermission: "never_proactive",
  },
  {
    id: "mem_questions_list",
    type: "preference",
    statement: "Short practical lists can make an upcoming conversation feel more manageable.",
    status: "proposed",
    explicitness: "inferred",
    confidence: 0.76,
    sensitivity: "low",
    sourceSessionId: "ses_demo_02",
    sourceQuote: "I just need to decide what to ask.",
    validFrom: "2026-07-30T18:20:00+01:00",
    reusePermission: "ask_first",
  },
];

export const demoJournal: JournalEntry = {
  id: "journal_demo_02",
  sessionId: "ses_demo_02",
  title: "Preparing for tomorrow",
  summary: "You wanted practical help rather than a deep conversation. Together, you made a short list for tomorrow and chose to keep the rest of the evening light.",
  importantMoments: ["Tomorrow feels easier with a small question list."],
  whatHelped: ["Keeping the plan short", "Remembering the playlist option"],
  whatDidNotHelp: ["Adding more questions than needed"],
  decisions: ["Save three questions in phone notes", "Use the playlist during the journey if it feels right"],
  nextSteps: ["Put the question list somewhere easy to find"],
  upcomingMoments: ["Tomorrow at 10:30 AM"],
  candidateMemories: [demoMemories[2]],
  userEdited: false,
  updatedAt: "2026-07-30T18:26:00+01:00",
};

export const demoTranscript: TranscriptTurn[] = [
  { id: "turn_1", sessionId: "ses_demo_02", speaker: "user", text: "I have an important conversation tomorrow. I don't want a deep talk. I just need help deciding what to ask.", startMs: 0, endMs: 7600, source: "openai" },
  { id: "turn_2", sessionId: "ses_demo_02", speaker: "agent", text: "Let us keep it practical. Would three short questions feel like enough to start with?", startMs: 7800, endMs: 12800, source: "openai" },
  { id: "turn_3", sessionId: "ses_demo_02", speaker: "user", text: "Yes. I can put them in my notes. And I might listen to my playlist on the way.", startMs: 13200, endMs: 18200, source: "openai" },
  { id: "turn_4", sessionId: "ses_demo_02", speaker: "agent", text: "That sounds like a manageable plan. I will leave it there unless you want to add anything else.", startMs: 18600, endMs: 23200, source: "openai" },
];

export const dashboardData: DashboardData = {
  latestJournal: demoJournal,
  memoryInsight: demoMemories[0],
  upcomingMoment: { title: "A conversation you want to feel ready for", occursAt: "Tomorrow, 10:30 AM", note: "You chose a short question list." },
  checkIn: { decision: "NO_ACTION", reasonCode: "USER_REQUESTED_SPACE", reason: "You asked for space tomorrow morning.", earliestAllowedAt: "Tomorrow after 1:00 PM", evidenceIds: ["mem_questions"] },
};

export const graphCurrent: GraphResponse = {
  view: "current",
  generatedAt: "2026-07-30T18:30:00+01:00",
  nodes: [
    { id: "event_tomorrow", type: "event", label: "Tomorrow's conversation", status: "confirmed", sensitivity: "medium", validFrom: "2026-07-31T10:30:00+01:00", evidenceIds: ["turn_1"], sourceQuote: "I have an important conversation tomorrow.", sourceSessionId: "ses_demo_02" },
    { id: "strategy_music", type: "strategy", label: "Familiar playlist", status: "confirmed", sensitivity: "medium", validFrom: "2026-07-24T16:00:00+01:00", evidenceIds: ["mem_music"], sourceQuote: "Having my playlist on made the journey easier.", sourceSessionId: "ses_demo_01" },
    { id: "boundary_questions", type: "boundary", label: "Avoid too many questions", status: "confirmed", sensitivity: "low", validFrom: "2026-07-24T16:00:00+01:00", evidenceIds: ["mem_questions"], sourceQuote: "Please don't ask me too many questions right now.", sourceSessionId: "ses_demo_01" },
    { id: "preference_plan", type: "preference", label: "Short practical list", status: "inferred", sensitivity: "low", validFrom: "2026-07-30T18:20:00+01:00", evidenceIds: ["mem_questions_list"], sourceQuote: "I just need to decide what to ask.", sourceSessionId: "ses_demo_02" },
    { id: "outcome_reset", type: "outcome", label: "Plan feels manageable", status: "confirmed", sensitivity: "low", validFrom: "2026-07-30T18:26:00+01:00", evidenceIds: ["journal_demo_02"], sourceQuote: "Together, you made a short list for tomorrow.", sourceSessionId: "ses_demo_02" },
  ],
  edges: [
    { id: "e1", source: "strategy_music", target: "event_tomorrow", predicate: "MAY_SUPPORT", evidenceIds: ["mem_music"] },
    { id: "e2", source: "boundary_questions", target: "event_tomorrow", predicate: "GUIDES", evidenceIds: ["mem_questions"] },
    { id: "e3", source: "preference_plan", target: "event_tomorrow", predicate: "RELATES_TO", evidenceIds: ["mem_questions_list"] },
    { id: "e4", source: "preference_plan", target: "outcome_reset", predicate: "CONTRIBUTED_TO", evidenceIds: ["journal_demo_02"] },
  ],
};

export const graphHistory: GraphResponse = {
  ...graphCurrent,
  view: "history",
  nodes: [...graphCurrent.nodes, { id: "old_pref", type: "preference", label: "Morning check-ins welcome", status: "historical", sensitivity: "low", validFrom: "2026-07-10T09:00:00+01:00", validTo: "2026-07-22T09:00:00+01:00", evidenceIds: ["old_pref"], sourceQuote: "Morning check-ins are fine.", sourceSessionId: "ses_demo_00" }],
};

export const graphAnswer: GraphQueryResponse = {
  answer: "A short practical list and, if you choose, a familiar playlist appear to be the most relevant supports before tomorrow.",
  facts: [
    { text: "You chose to make three short questions for tomorrow.", evidenceIds: ["turn_1", "journal_demo_02"] },
    { text: "You previously said a playlist made a difficult journey easier.", evidenceIds: ["mem_music"] },
  ],
  inferences: [{ text: "Keeping preparation brief may be more useful than adding many questions.", evidenceIds: ["mem_questions", "mem_questions_list"], confidence: 0.76 }],
  uncertainty: "This is based on a small number of saved examples.",
  abstained: false,
};
