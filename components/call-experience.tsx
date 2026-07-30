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
  ending: { label: "Ending this call", detail: "Wrapping up safely..." },
  processing: { label: "Making your reflection", detail: "Your journal and any proposed memories are being prepared." },
  failed: { label: "That did not quite work", detail: "Nothing from the failed turn was added to your journal." },
};

function elapsed(total: number) { return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }

async function recordedAudioToWav(recording: Blob): Promise<Blob> {
  if (!recording.size) throw new Error("The recording was empty. Please try again.");
  const AudioContextConstructor = window.AudioContext;
  const context = new AudioContextConstructor();
  try {
    const decoded = await context.decodeAudioData(await recording.arrayBuffer());
    const frameCount = Math.max(1, Math.ceil(decoded.duration * 24_000));
    const offline = new OfflineAudioContext(1, frameCount, 24_000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const resampled = await offline.startRendering();
    return new Blob([encodeWav(resampled)], { type: "audio/wav" });
  } finally {
    await context.close();
  }
}

function encodeWav(audio: AudioBuffer): ArrayBuffer {
  const channels = Math.min(audio.numberOfChannels, 2);
  const bytesPerSample = 2;
  const dataSize = audio.length * channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeText = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: channels }, (_, channel) => audio.getChannelData(channel));
  let offset = 44;
  for (let frame = 0; frame < audio.length; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }
  return buffer;
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
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
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const session = await productClient.createCall({ requestedSupportMode: mode, memoryEnabled });
      setSessionId(session.id);
      setState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Microphone access is required to start a voice call.");
      setState("failed");
    }
  }

  function startRecording() {
    if (!sessionId || !streamRef.current || typeof MediaRecorder === "undefined") {
      setErrorMessage("The microphone is not available. Allow microphone access and try again.");
      setState("failed");
      return;
    }
    setErrorMessage(null);
    setVoiceError(null);
    setHasAudio(false);
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onerror = () => {
      setErrorMessage("The browser could not record your microphone. Please try again.");
      setState("failed");
    };
    recorder.onstop = () => {
      const recording = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      void recordedAudioToWav(recording).then(sendTurn).catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "The recording could not be prepared.");
        setState("failed");
      });
    };
    recorderRef.current = recorder;
    recorder.start();
    setState("recording");
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else {
      setErrorMessage("No active recording was found. Please record the turn again.");
      setState("failed");
    }
  }

  async function sendTurn(audio: Blob) {
    if (!sessionId) return;
    const thinkingTimer = window.setTimeout(() => setState("thinking"), 450);
    try {
      abortRef.current = new AbortController();
      setState("transcribing");
      const response = await productClient.sendTurn(sessionId, audio);
      window.clearTimeout(thinkingTimer);
      setTurns((current) => [...current, { id: `${response.turnId}-user`, sessionId, speaker: "user", text: response.userTranscript, source: response.transcriptSource }, { id: response.turnId, sessionId, speaker: "agent", text: response.assistantText, source: "openai" }]);
      setAssistantText(response.assistantText);
      setVoiceError(response.audioError?.message ?? null);
      setState("speaking");
      if (response.audioUrl) {
        const audioElement = new Audio(response.audioUrl);
        audioRef.current = audioElement;
        setHasAudio(true);
        audioElement.onended = () => setState("ready");
        audioElement.onerror = () => {
          setVoiceError("The ElevenLabs audio response could not be loaded.");
          setHasAudio(false);
          setState("ready");
        };
        await audioElement.play().catch(() => setState("ready"));
      } else {
        window.setTimeout(() => setState("ready"), 1700);
      }
    } catch (error) {
      window.clearTimeout(thinkingTimer);
      setErrorMessage(error instanceof Error ? error.message : "We could not send that turn.");
      setState("failed");
    }
  }

  function toggleMute() {
    const nextMuted = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The call could not be ended.");
      setState("failed");
    }
  }

  return <div className="call-page">
    <header className="call-header"><Link href="/" className="back-link"><ArrowLeft size={17} /> Back home</Link><span className="call-timer">{active ? "LIVE" : "CALL"} · {elapsed(seconds)}</span><button className="quiet-button" onClick={finishCall} disabled={!sessionId || state === "processing"}>End call <X size={16} /></button></header>
    <main className="call-stage">
      <div className={`orb-wrap ${state}`} aria-hidden="true"><div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb"><span>{state === "recording" ? <Mic size={30} /> : state === "speaking" ? <Volume2 size={30} /> : <Sparkles size={28} />}</span></div></div>
      <p className="eyebrow gold">{state === "recording" ? "YOUR TURN" : state === "speaking" ? "ALONGSIDE" : "ALONGSIDE CALL"}</p>
      <h1>{stateCopy[state].label}</h1><p className="call-detail">{stateCopy[state].detail}</p>
      {state === "permission" && <div className="call-mode-picker"><p>Choose a starting point</p><div>{supportModes.map((item) => <button key={item.id} className={mode === item.id ? "selected" : ""} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><label className="memory-toggle"><input type="checkbox" checked={!memoryEnabled} onChange={(event) => setMemoryEnabled(!event.target.checked)} /> Keep this call out of memory</label><button className="primary-action" onClick={begin}>Allow microphone & begin <Mic size={18} /></button></div>}
      {state === "ready" && <button className="record-button" onClick={startRecording}><Mic size={23} /><span>Press to speak</span></button>}
      {state === "recording" && <button className="record-button recording" onClick={stopRecording}><CircleStop size={23} /><span>Send this turn</span></button>}
      {["transcribing", "thinking"].includes(state) && <div className="processing-dots" aria-label="Processing"><i /><i /><i /></div>}
      {state === "speaking" && <div className="caption-card"><p className="eyebrow">Caption</p><p>{assistantText}</p></div>}
      {state === "failed" && <div className="error-card"><p>{errorMessage ?? "We could not send that turn. Please try again."}</p><button className="secondary-action" onClick={() => { setErrorMessage(null); setState(sessionId ? "ready" : "permission"); }}>Try again</button></div>}
      {voiceError && state !== "failed" && <div className="error-card"><p>{voiceError}</p></div>}
      {state === "processing" && <div className="caption-card"><Check size={18} /> <p>Your reflection is almost ready.</p></div>}
    </main>
    <footer className="call-controls"><button onClick={toggleMute} disabled={!sessionId} aria-pressed={muted}>{muted ? <MicOff size={18} /> : <Mic size={18} />} {muted ? "Unmute" : "Mute"}</button><button onClick={() => setCaptions((value) => !value)} aria-pressed={captions}><Captions size={18} /> Captions {captions ? "on" : "off"}</button><button onClick={() => { void audioRef.current?.play(); }} disabled={!hasAudio}><RotateCcw size={18} /> Replay</button></footer>
    {captions && turns.length > 0 && <aside className="call-transcript" aria-live="polite"><p className="eyebrow">This call</p>{turns.slice(-2).map((turn) => <p key={turn.id} className={turn.speaker}><span>{turn.speaker === "user" ? "You" : "Alongside"}</span>{turn.text}</p>)}</aside>}
  </div>;
}
