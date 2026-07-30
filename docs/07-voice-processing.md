# Voice and AI processing pipeline

## Provider responsibilities

### Browser and Next.js

- Capture one microphone turn with browser media APIs.
- Upload audio to the local `/api/v1/calls/{sessionId}/turn` route.
- Display recording/transcribing/thinking/speaking states.
- Play server-returned audio and render captions.

### OpenAI-compatible gateway

- GPT audio transcription for the user turn and post-call canonical transcript.
- GPT-5.4 Mini response generation.
- Strict structured journal, memory, state, and intervention extraction.
- Graph-query answer generation over bounded evidence.
- Optional moderation signal as one part of the fixed safety policy.

### ElevenLabs

- Text-to-Speech only.
- Use the server-side `/v1/text-to-speech/{voice_id}/stream` API.
- Prefer `eleven_flash_v2_5` for low-latency streaming.
- Keep `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` server-only.

## Turn pipeline

```text
record audio
→ POST /calls/{sessionId}/turn
→ GPT audio transcription
→ bounded context retrieval
→ GPT-5.4 Mini response
→ ElevenLabs streaming TTS
→ persist transcript turns
→ return assistant text + audio URL/stream
```

The MVP is turn-based and interruptible between turns. Full-duplex barge-in and a custom WebSocket protocol are out of scope unless the demo is already stable.

Before response generation, a deterministic high-risk phrase gate can short-circuit the creative model and return the fixed emergency-support boundary. The canonical user and assistant turns are still persisted for the local demo.

## Post-call extraction

Use GPT-5.4 Mini with a validated JSON contract to produce:

- journal draft;
- explicit decisions;
- upcoming moments;
- candidate memories;
- candidate graph entities/relations;
- intervention offers/outcomes;
- uncertain observations;
- safety flags for review.

Application code validates output before writing SQLite. Durable memory remains proposed until user review.

The extractor persists an editable journal, proposed memories with source quotes and permissions, entity nodes, and relation edges. Relations are only written when both endpoint entity keys resolve; the graph JSON is rebuilt from those SQLite records. If the provider is unavailable, the same contract falls back to a deterministic, clearly lower-confidence extractor for local rehearsal.

## Failure modes

- GPT transcription failure: show processing failure or a visibly marked ElevenLabs transcript fallback; never invent a journal.
- GPT response failure: show text/demo fallback and keep the session usable.
- ElevenLabs TTS failure: keep the assistant text/captions and expose a replayable text fallback.
- Schema validation failure: retry once, then preserve the transcript for manual editing.
