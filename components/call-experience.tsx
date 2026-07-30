"use client";

import Link from "next/link";
import { ArrowLeft, Captions, Check, CircleStop, Mic, MicOff, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { productClient, supportModes } from "@/lib/client/product-client";
import type { SupportMode, TranscriptTurn } from "@/lib/client/types";

type CallState = "permission" | "ready" | "recording" | "transcribing" | "thinking" | "speaking" | "ending" | "processing" | "failed";

const stateCopy: Record<CallState, { label: string; detail: string }> = {
  permission: { label: "Before we begin", detail: "Alongside uses your microphone only while you choose to record a turn." },
  ready: { label: "Whenever you're ready", detail: "Press and speak naturally. You can pause or end the call whenever you like." },
  recording: { label: "Listening", detail: "Take your time. Press stop when you are ready to send this turn." },
  transcribing: { label: "Turning your words into text", detail: "This should only take a moment." },
  thinking: { label: "Considering a response", detail: "Alongside is keeping the response brief and relevant." },
  speaking: { label: "Alongside is responding", detail: "Captions are available below. You can replay this response." },
  ending: { label: "Ending this call", detail: "Wrapping up safely…" },
  processing: { label: "Making your reflection", detail: "Your journal and any proposed memories are being prepared." },
  failed: { label: "That did not quite work", detail: "No session has been lost. You can retry or continue with text later." },
};

function elapsed(total: number) { return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }

export function CallExperience({ initialMode = "open" }: { initialMode?: SupportMode }) {
  const [state, setState] = useState<CallState>("permission");
  const [mode, setMode] = useState<SupportMode>(initialMode);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [assistantText, setAssistantText] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!["ready", "recording", "transcribing", "thinking", "speaking"].includes(state)) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  const active = useMemo(() => ["recording", "transcribing", "thinking", "speaking"].includes(state), [state]);

  async function begin() {
    setState("ready");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const session = await productClient.createCall({ requestedSupportMode: mode, memoryEnabled });
      setSessionId(session.id);
      setState("ready");
    } catch {
      // The demo remains usable if microphone permission is unavailable.
      const session = await productClient.createCall({ requestedSupportMode: mode, memoryEnabled });
      setSessionId(session.id);
      setState("ready");
    }
  }

  function startRecording() {
    if (!sessionId) return;
    chunksRef.current = [];
    if (streamRef.current && typeof MediaRecorder !== "undefined") {
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => void sendTurn(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      recorderRef.current = recorder;
      recorder.start();
    }
    setState("recording");
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else void sendTurn(null);
  }

  async function sendTurn(audio: Blob | null) {
    if (!sessionId) return;
    try {
      abortRef.current = new AbortController();
      setState("transcribing");
      window.setTimeout(() => setState("thinking"), 450);
      const response = await productClient.sendTurn(sessionId, audio);
      setTurns((current) => [...current, { id: `${response.turnId}-user`, sessionId, speaker: "user", text: response.userTranscript, source: response.transcriptSource }, { id: response.turnId, sessionId, speaker: "agent", text: response.assistantText, source: "openai" }]);
      setAssistantText(response.assistantText);
      setState("speaking");
      if (response.audioUrl) {
        const audioElement = new Audio(response.audioUrl);
        audioRef.current = audioElement;
        setHasAudio(true);
        audioElement.onended = () => setState("ready");
        await audioElement.play().catch(() => window.setTimeout(() => setState("ready"), 1200));
      } else {
        window.setTimeout(() => setState("ready"), 1700);
      }
    } catch { setState("failed"); }
  }

  async function finishCall() {
    if (!sessionId) return;
    abortRef.current?.abort();
    audioRef.current?.pause();
    setState("ending");
    try {
      const session = await productClient.endCall(sessionId);
      setState("processing");
      window.setTimeout(() => { window.location.assign(`/calls/${session.id}`); }, 1100);
    } catch { setState("failed"); }
  }

  return <div className="call-page">
    <header className="call-header"><Link href="/" className="back-link"><ArrowLeft size={17} /> Back home</Link><span className="call-timer">{active ? "LIVE" : "CALL"} · {elapsed(seconds)}</span><button className="quiet-button" onClick={finishCall} disabled={!sessionId || state === "processing"}>End call <X size={16} /></button></header>
    <main className="call-stage">
      <div className={`orb-wrap ${state}`} aria-hidden="true"><div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb"><span>{state === "recording" ? <Mic size={30} /> : state === "speaking" ? <Volume2 size={30} /> : <Sparkles size={28} />}</span></div></div>
      <p className="eyebrow gold">{state === "recording" ? "YOUR TURN" : state === "speaking" ? "ALONGSIDE" : "ALONGSIDE CALL"}</p>
      <h1>{stateCopy[state].label}</h1><p className="call-detail">{stateCopy[state].detail}</p>
      {state === "permission" && <div className="call-mode-picker"><p>Choose a starting point</p><div>{supportModes.map((item) => <button key={item.id} className={mode === item.id ? "selected" : ""} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><label className="memory-toggle"><input type="checkbox" checked={memoryEnabled} onChange={(event) => setMemoryEnabled(event.target.checked)} /> Keep this call out of memory</label><button className="primary-action" onClick={begin}>Allow microphone & begin <Mic size={18} /></button></div>}
      {state === "ready" && <button className="record-button" onClick={startRecording}><Mic size={23} /><span>Press to speak</span></button>}
      {state === "recording" && <button className="record-button recording" onClick={stopRecording}><CircleStop size={23} /><span>Send this turn</span></button>}
      {["transcribing", "thinking"].includes(state) && <div className="processing-dots" aria-label="Processing"><i /><i /><i /></div>}
      {state === "speaking" && <div className="caption-card"><p className="eyebrow">Caption</p><p>{assistantText}</p></div>}
      {state === "failed" && <div className="error-card"><p>We could not send that turn. You can try again—nothing has been added to your journal.</p><button className="secondary-action" onClick={() => setState("ready")}>Try again</button></div>}
      {state === "processing" && <div className="caption-card"><Check size={18} /> <p>Your reflection is almost ready.</p></div>}
    </main>
    <footer className="call-controls"><button onClick={() => setMuted((value) => !value)} disabled={!sessionId} aria-pressed={muted}>{muted ? <MicOff size={18} /> : <Mic size={18} />} {muted ? "Unmute" : "Mute"}</button><button onClick={() => setCaptions((value) => !value)} aria-pressed={captions}><Captions size={18} /> Captions {captions ? "on" : "off"}</button><button onClick={() => { void audioRef.current?.play(); }} disabled={!hasAudio}><RotateCcw size={18} /> Replay</button></footer>
    {captions && turns.length > 0 && <aside className="call-transcript" aria-live="polite"><p className="eyebrow">This call</p>{turns.slice(-2).map((turn) => <p key={turn.id} className={turn.speaker}><span>{turn.speaker === "user" ? "You" : "Alongside"}</span>{turn.text}</p>)}</aside>}
  </div>;
}
