# Voice and AI processing pipeline

## Provider responsibilities

### Browser and Next.js

- Capture one microphone turn with `MediaRecorder`.
- Decode and resample the recording to 24 kHz mono PCM16 WAV with Web Audio.
- Upload it to `/api/v1/calls/{sessionId}/turn`.
- Display recording, transcription, thinking, speaking, and actionable failure states.
- Play the server-returned ElevenLabs MP3 while rendering captions.

### OpenAI-compatible gateway

- GPT Realtime 2.1 transcribes the user turn over the server-side WebSocket endpoint.
- GPT-5.4 Mini generates the agent response and structured journal/memory extraction.
- The configured gateway error is surfaced when transcription fails; placeholder speech is never persisted.

### ElevenLabs

- Text-to-Speech only through `/v1/text-to-speech/{voice_id}/stream`.
- `eleven_flash_v2_5` is the low-latency model.
- `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` stay server-only.
- The API key must include `text_to_speech` permission.

## Turn pipeline

```text
record microphone turn
-> decode and resample to 24 kHz mono WAV
-> POST /calls/{sessionId}/turn
-> GPT Realtime 2.1 transcription
-> bounded memory context retrieval
-> GPT-5.4 Mini response
-> ElevenLabs TTS
-> persist canonical transcript turns and MP3 path
-> return assistant text plus audio URL
```

The MVP is turn-based. Full-duplex barge-in remains out of scope. A deterministic urgent-risk gate may short-circuit creative response generation and return the fixed emergency-support boundary.

## Post-call extraction

GPT-5.4 Mini produces a validated journal draft, decisions, upcoming moments, candidate memories, graph entities/relations, and safety flags. Durable memories remain proposed until user review. If structured extraction fails, the same contract uses a deterministic, lower-confidence local extractor.

## Failure modes

- GPT transcription failure: return `TRANSCRIPTION_FAILED`, show a retryable UI error, and persist no invented user turn.
- GPT response failure: preserve the real transcript and show the bounded text fallback.
- ElevenLabs TTS failure: keep captions and show the actionable TTS error; do not substitute another voice provider.
- Audio playback failure: keep Replay disabled and show that the generated audio could not be loaded.
