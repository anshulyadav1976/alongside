# Technical status

- **Branch:** `codex/technical-core`
- **Commit:** `db0c8e8`
- **Active slice:** `S1-S5-local-mvp`
- **State:** `READY_FOR_PRODUCT`
- **Updated:** 2026-07-30

## Completed

- Local SQLite/OpenAI/GPT-5.4 Mini/ElevenLabs-TTS-only architecture documented.
- Local API contracts and SQLite schema aligned with the own-agent turn pipeline.
- Technical branch created; no product branch dependency.
- Next.js app scaffolded with a server-owned agent loop.
- SQLite seed, memory lifecycle, graph projection, check-in boundary, and deterministic provider fallbacks implemented.
- Call creation, audio turn, TTS audio retrieval, session, journal, memory, graph, support, intervention, and check-in routes implemented.
- Deterministic urgent-safety gate and end-call journal persistence added.
- Rich GPT extraction added for journal fields, candidate memories, entities, relations, source quotes, permissions, and safety flags, with validated fallback extraction.

## Ready for product integration

- `/calls`, `/calls/{sessionId}/turn`, `/calls/{sessionId}/end` are the canonical voice contracts.
- `/memories`, `/graph`, `/graph/query`, `/checkins/decision` are the canonical local data contracts.

## Contract changes

- Local `/calls` turn contract replaces the old provider-token/webhook flow.

## Tests

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 6 tests.
- `npm run build` passed.
- Configured-model synthetic conversation passed: two bounded responses, six extracted memories, six entities, five graph edges persisted.

## Blockers

- None for local demo. Provider calls have deterministic fallbacks; ElevenLabs voice is available when the local key/voice configuration is present.

## Next action

- Technical MVP is pushed; product can integrate against the canonical call-turn contract.

## Request to product agent

- Product can consume the local call-turn contract; no provider token or webhook is required.
