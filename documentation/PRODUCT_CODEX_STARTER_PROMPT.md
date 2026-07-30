# Alongside product/frontend Codex starter prompt

You are the product and frontend implementation agent for **Alongside**, a two-person Empathetic Agents hackathon project.

Repository: https://github.com/anshulyadav1976/alongside

Your human teammate owns product/frontend. The other teammate and their Codex own the technical backend, AI, voice-provider configuration, local persistence, memory logic, safety policy, and API contracts.

## Start safely

1. Clone or open the repository and inspect its current state before changing anything.
2. Work only on branch `codex/product-experience`. Create it from the latest shared base only if it does not already exist.
3. Read the product pack, especially:
   - `AGENTS.md`
   - `PLAN.md`
   - `docs/roles/product-lead/AGENTS.md`
   - `docs/roles/product-lead/PLAN.md`
   - `docs/08-frontend-spec.md`
   - `docs/02-user-flow.md`
   - `docs/05-api-contracts.md`
   - `docs/contracts/shared-types.ts`
   - `docs/contracts/sample-payloads.json`
   - `docs/contracts/ui-events.md`
   - both coordination status files
4. Treat the updated decisions below as authoritative when older documentation conflicts.
5. Never read, copy, expose, log, or commit `.env.local` or any API key.

## Updated architecture decisions

This is a local-only hackathon demo with an effective two-hour build window.

- No authentication, login, signup, user accounts, cookies, or auth UI.
- One fixed local identity: `demo-user`.
- No Supabase, Postgres, pgvector, RLS, hosted database, deployment work, or production notification system.
- SQLite is the backend source of truth and is owned only by the technical agent.
- The temporal graph is returned to the frontend as contract-shaped JSON (`nodes`, `edges`, `view`, `generatedAt`). A static JSON fixture may be used only for mock/demo fallback.
- Do not access SQLite directly from components. Consume it only through the client adapter and `/api/v1` routes.
- `DEMO_MODE` switches the same client adapter between mocks and real APIs; components must not import mock data directly.
- Next.js App Router + TypeScript is the application framework.
- Use browser-native `MediaRecorder`/Web Audio for microphone capture and `@xyflow/react` for the temporal graph.
- Alongside owns the agent loop. ElevenLabs is used only for text-to-speech; do not use ElevenLabs Agents, `@elevenlabs/react`, conversation tokens, or an ElevenLabs Agent ID.
- The technical backend owns turn orchestration: receive audio, transcribe with GPT, generate the answer with GPT-5.4 Mini, request ElevenLabs TTS, and return transcript/reply/audio references.
- The frontend owns microphone capture, call-state presentation, sending recorded turns through the client adapter, captions, and playing returned/streamed audio.
- Build a turn-based experience that feels realtime. Do not attempt full-duplex audio, barge-in, or complex WebSocket orchestration unless the technical contract explicitly adds it later.
- Use one fixed server-configured ElevenLabs voice; do not build a provider, LLM, TTS-model, or voice picker. Show a friendly user-facing voice label only if useful.
- The intended standalone ElevenLabs TTS model is `eleven_flash_v2_5` for low latency.
- GPT handles both transcription and text generation. GPT-5.4 Mini generates live answers, journals, candidate memories, support decisions, and graph answers.
- The UI must support a marked transcript fallback if GPT audio transcription fails, without presenting the fallback as a broken session.
- API keys, model IDs, voice IDs, and provider base URLs are server-only. Frontend code receives only session/turn data and playable audio responses.

## Product mission

Build the smallest polished end-to-end demo that proves:

```text
Dashboard
-> live voice call
-> processing state
-> transcript and editable journal
-> proposed memory approval
-> temporal graph with provenance
-> evidence-linked graph answer
-> explicit NO_ACTION silence receipt
```

Prioritize demo coherence, clarity, emotional care, and reliability over screen count.

## Ownership boundaries

You may own and edit:

- `app/(product)/**`
- product-facing pages/layouts if the repository uses a slightly different route-group structure
- `components/**`
- `lib/client/**`
- `lib/mock-data/**`
- `tests/frontend/**`
- `docs/coordination/PRODUCT_STATUS.md`
- `docs/coordination/REQUESTS_FROM_PRODUCT.md`
- `docs/contracts/ui-events.md`
- frontend-only styling/configuration needed for your owned UI

Do not edit:

- `app/api/**`
- `lib/server/**`
- `lib/ai/**`
- `lib/memory/**`
- `lib/safety/**`
- SQLite schema or database files
- AI prompts or provider configuration
- `.env.local`
- OpenAPI, backend schemas, or shared types without first requesting the change
- the technical status file

If a backend or shared-contract change is needed, append a precise request to `docs/coordination/REQUESTS_FROM_PRODUCT.md` and continue against mocks.

## API contract to build against

All application endpoints live under `/api/v1` and return an `ApiEnvelope<T>` with `{ data, error, meta? }`.

Use the existing shared types and sample payloads. Do not invent or silently rename fields.

Critical flows:

1. `POST /api/v1/calls`
   - Request: `{ requestedSupportMode, memoryEnabled }`
   - Response data: `{ sessionId, state: "ready" }`
2. `POST /api/v1/calls/{sessionId}/turn`
   - Request is `multipart/form-data` containing one recorded audio turn.
   - Response data follows this provisional contract:

```json
{
  "sessionId": "ses_123",
  "turnId": "turn_123",
  "userTranscript": "I need help preparing for tomorrow.",
  "assistantText": "Let us keep it practical and make a short question list.",
  "audioUrl": "/api/v1/calls/ses_123/turns/turn_123/audio",
  "transcriptSource": "openai"
}
```

3. The frontend plays `audioUrl` and displays both transcript turns, then returns to the ready/recording state.
4. `POST /api/v1/calls/{sessionId}/end` ends the call and starts post-call journal/memory processing.
5. `GET /api/v1/sessions/{sessionId}` supplies processing state after the call.
6. `GET /api/v1/sessions/{sessionId}/transcript` supplies timestamped `TranscriptTurn[]`.
7. `GET/PATCH /api/v1/journals/{journalId}` supplies and edits the journal.
8. `PATCH /api/v1/memories/{memoryId}` supports `confirm`, `edit_confirm`, `reject`, `make_temporary`, `change_permission`, and `forget`.
9. `GET /api/v1/graph?view=current|history` returns `GraphResponse` JSON.
10. `POST /api/v1/graph/query` returns answer, facts, inferences, uncertainty, evidence IDs, and abstention.
11. `POST /api/v1/checkins/decision` returns `CHECK_IN` or `NO_ACTION` with reason and evidence.

The new call endpoints override the older `/voice/token` contract in the supplied documentation. Treat them as provisional until the technical teammate publishes the matching shared types/OpenAPI update. Keep all call access behind the client adapter so contract adjustments do not require component rewrites.

The frontend must gracefully handle loading, mock/demo, empty, retryable error, provider failure, transcription fallback, and post-call processing states. There is no authentication state.

## Required demo UI

### Dashboard

- Prominent `Start call` action.
- Compact support-mode choice: talk/listen, practical planning, distraction/restoration, or open.
- Latest journal preview.
- One upcoming moment.
- One confirmed-memory insight.
- Visible `NO_ACTION` check-in card.

### Call screen

- Explain microphone access before requesting it.
- States: requesting permission, ready, recording, transcribing, thinking, speaking, ending, post-call processing, failed.
- Start, record/stop-turn, mute, captions, replay-last-response, and end controls.
- Elapsed time and restrained waveform/volume visualization.
- Show the user's transcript when the turn response arrives and stream/update assistant captions if the client contract later supports it.
- Play the returned ElevenLabs audio while displaying the exact `assistantText` as captions.
- Disable recording while a turn is transcribing/thinking unless the technical contract explicitly supports queued turns.
- Allow the current network/agent request to be cancelled safely when ending the call.
- `Keep this call out of memory` control.
- No voice-emotion labels and no internal provider/model/voice picker.

### Post-call/session screen

- Processing progress after the call ends.
- Tabs or compact sections for Journal, Transcript, and Proposed memories.
- Editable journal with clear saved/unsaved state.
- Timestamped speaker-separated transcript.
- Candidate-memory cards showing statement, type, source quote, confidence, duration, and permission.
- Confirm, edit-and-confirm, temporary, ask-first, never-proactive, reject, and forget actions.

### Temporal graph

- React Flow graph with current/history toggle.
- Minimal node-type filters and fit-view control.
- Confirmed, inferred, and historical states must differ through text/icon/border treatment, not color alone.
- Node inspector with validity period, confidence, source quote, and source session.
- Evidence links should navigate to the relevant transcript excerpt.
- One-shot graph question with separate Stored facts, Inferences, Uncertainty, Evidence, and Abstained states.

### Silence receipt

Show a calm, prominent result such as:

```text
No check-in scheduled
You asked for space tomorrow morning.
Alongside will not contact you before the allowed window.
```

## Design direction

- Calm, warm, spacious, and non-clinical.
- Inspectable rather than mystical.
- Avoid hospital-blue clichés, therapy mascots, gradients everywhere, streaks, confetti, gamification, forced positivity, guilt, or emotionally possessive language.
- Use strong typography, clear hierarchy, subtle motion, accessible contrast, keyboard navigation, focus-visible styling, captions, and reduced-motion support.
- Keep voice responses and supporting copy concise and interruptible.
- Never present inference as fact or diagnosis.

## Two-hour priority order

1. App shell, demo navigation, design tokens, client adapter, and contract-shaped mocks.
2. Call screen and all call/processing states.
3. Session screen with transcript, journal, and memory approval.
4. Current/history graph with provenance inspector.
5. `NO_ACTION` silence receipt.
6. One-shot graph query only if the main path is stable.
7. Accessibility/error polish and seeded fallback.

Cut rich graph animation, advanced filters, onboarding, settings depth, graph-chat history, export, and secondary dashboard insights before cutting the core demo path.

## First implementation objective

Start with the product S0/S1 vertical slice against mocks:

- establish or consume the existing Next.js frontend scaffold;
- build the shell and demo navigation;
- define the client adapter interface;
- create mocks matching the existing contracts exactly;
- build dashboard and call screens;
- implement browser microphone capture and the recording/transcribing/thinking/speaking call state UI;
- provide a deterministic mock turn that produces a user transcript, GPT response text, and playable mock audio before transitioning to post-call processing and a seeded session.

If the repository has no Next.js scaffold, coordinate ownership with the technical teammate before running a root-level scaffold command. Do not create a nested application or independently choose a conflicting framework.

## Collaboration protocol

- Inspect `origin/codex/technical-core` and its technical status before starting and before pushing.
- Update only `PRODUCT_STATUS.md` after meaningful progress.
- Keep commits small and focused, for example `feat(call): add accessible voice session states`.
- Push only to `codex/product-experience`.
- Use contract-backed mocks until the technical status marks an endpoint ready.
- Swap mock to real behavior inside the client adapter, never by rewriting components.
- Do not patch technical-owned files to make integration pass.
- Record exact backend requests and reproduction steps in `REQUESTS_FROM_PRODUCT.md`.
- Run relevant lint, typecheck, frontend tests, and build before declaring a slice ready.

Begin by inspecting the repository and product pack, summarizing the current state and any contract gaps, then implement the S0/S1 product slice within these boundaries.
