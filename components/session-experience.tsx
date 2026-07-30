"use client";

import { Check, ChevronRight, Clock3, Edit3, FileText, HeartHandshake, MessageSquareText, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { productClient } from "@/lib/client/product-client";
import type { JournalEntry, Memory, ReusePermission, Session, TranscriptTurn } from "@/lib/client/types";

type Tab = "journal" | "transcript" | "memories";

function MemoryCard({ memory, onChanged }: { memory: Memory; onChanged: (memory: Memory) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(memory.statement);
  const [busy, setBusy] = useState(false);
  async function action(action: string, permission?: ReusePermission) {
    setBusy(true);
    try { onChanged(await productClient.updateMemory(memory.id, action, action === "edit_confirm" ? text : undefined, permission)); } finally { setBusy(false); setEditing(false); }
  }
  return <article className={`memory-review-card ${memory.status}`}><div className="memory-card-head"><span className="type-badge">{memory.type.replace("_", " ")}</span><span className="confidence">{Math.round(memory.confidence * 100)}% confidence</span></div>{editing ? <textarea value={text} onChange={(event) => setText(event.target.value)} aria-label="Edit proposed memory" /> : <h3>{memory.statement}</h3>}<blockquote>“{memory.sourceQuote}”</blockquote><div className="memory-details"><span>Source: this call</span><span>Duration: {memory.expiresAt ? "temporary" : "until changed"}</span><span>Reuse: {memory.reusePermission.replace("_", " ")}</span></div>{memory.status === "proposed" && <div className="memory-actions">{editing ? <><button className="mini-primary" disabled={busy} onClick={() => action("edit_confirm")}>Save & confirm</button><button onClick={() => setEditing(false)}>Cancel</button></> : <><button className="mini-primary" disabled={busy} onClick={() => action("confirm")}>Confirm</button><button onClick={() => setEditing(true)}><Edit3 size={14} /> Edit</button><button onClick={() => action("make_temporary")}>Temporary</button><button onClick={() => action("change_permission", "ask_first")}>Ask first</button><button onClick={() => action("change_permission", "never_proactive")}>Never proactive</button><button className="danger-quiet" onClick={() => action("reject")}>Reject</button></>}</div>}{memory.status === "confirmed" && <div className="memory-actions"><button onClick={() => action("change_permission", "ask_first")}>Ask first</button><button className="danger-quiet" onClick={() => action("forget")}><Trash2 size={14} /> Forget</button></div>}</article>;
}

export function SessionExperience({ sessionId }: { sessionId: string }) {
  const [tab, setTab] = useState<Tab>("journal");
  const [session, setSession] = useState<Session | null>(null);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { Promise.all([productClient.getSession(sessionId), productClient.getJournal("journal_demo_02"), productClient.getTranscript(sessionId)]).then(([nextSession, nextJournal, nextTranscript]) => { setSession(nextSession); setJournal(nextJournal); setTranscript(nextTranscript); setMemories(nextJournal.candidateMemories); }); }, [sessionId]);
  async function saveJournal() { if (!journal) return; setSaving(true); const updated = await productClient.updateJournal(journal.id, journal); setJournal(updated); setSaved(true); setSaving(false); }
  if (!journal || !session) return <div className="page-loading">Preparing your reflection…</div>;
  return <div className="session-page"><header className="session-top"><div><p className="eyebrow">Call complete · {session.durationLabel}</p><h1>Your reflection is ready.</h1><p>This is yours to revise. Nothing proposed below becomes lasting without your say.</p></div><div className="review-complete"><Check size={18} /> Ready for your review</div></header>
    <div className="session-tabs" role="tablist">{([{ id: "journal", label: "Journal", icon: FileText }, { id: "transcript", label: "Transcript", icon: MessageSquareText }, { id: "memories", label: "Proposed memories", icon: HeartHandshake }] as const).map(({ id, label, icon: Icon }) => <button role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}><Icon size={16} /> {label}{id === "memories" && <span className="tab-count">{memories.filter((memory) => memory.status === "proposed").length}</span>}</button>)}</div>
    {tab === "journal" && <section className="journal-layout"><article className="journal-editor"><div className="journal-head"><div><p className="eyebrow">Your own words</p><input value={journal.title} onChange={(event) => { setJournal({ ...journal, title: event.target.value }); setSaved(false); }} aria-label="Journal title" /></div><span className={saved ? "saved" : "unsaved"}>{saved ? <><Check size={14} /> Saved</> : "Unsaved changes"}</span></div><textarea className="summary-editor" value={journal.summary} onChange={(event) => { setJournal({ ...journal, summary: event.target.value }); setSaved(false); }} aria-label="Journal summary" /><div className="journal-columns"><JournalList icon={<HeartHandshake size={17} />} title="What helped" items={journal.whatHelped} /><JournalList icon={<Clock3 size={17} />} title="Next, gently" items={journal.nextSteps} /><JournalList icon={<MessageSquareText size={17} />} title="Decisions" items={journal.decisions} /></div><div className="journal-save-row"><button className="primary-action" onClick={saveJournal} disabled={saving || saved}><Save size={17} /> {saving ? "Saving…" : "Save reflection"}</button><button className="secondary-action">Export</button></div></article><aside className="journal-aside"><p className="eyebrow">Coming up</p><h3>{journal.upcomingMoments[0]}</h3><p>You can keep this visible as context for a future conversation—or remove it at any time.</p><button className="text-link">Edit upcoming moment <ChevronRight size={15} /></button><div className="privacy-note"><ShieldCheck size={16} /><span>Edits you make here carry more weight than generated wording.</span></div></aside></section>}
    {tab === "transcript" && <section className="transcript-panel"><div className="transcript-note"><RotateCcw size={16} /> This is the canonical transcript for this session.</div>{transcript.map((turn) => <article key={turn.id} id={turn.id} className={`transcript-turn ${turn.speaker}`}><div><span>{turn.speaker === "user" ? "You" : "Alongside"}</span><small>{turn.startMs ? `${Math.floor(turn.startMs / 60000)}:${String(Math.floor((turn.startMs % 60000) / 1000)).padStart(2, "0")}` : ""}</small></div><p>{turn.text}</p>{turn.source === "fallback" && <em>Transcript fallback</em>}</article>)}</section>}
    {tab === "memories" && <section className="memory-review"><div className="memory-review-intro"><p className="eyebrow">Your choice, always</p><h2>Review what Alongside noticed.</h2><p>These are suggestions, not a profile. Confirm only what feels accurate and useful.</p></div>{memories.map((memory) => <MemoryCard key={memory.id} memory={memory} onChanged={(updated) => setMemories((items) => items.map((item) => item.id === updated.id ? updated : item))} />)}</section>}
  </div>;
}

function JournalList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) { return <section className="journal-list"><div>{icon}<h3>{title}</h3></div><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
