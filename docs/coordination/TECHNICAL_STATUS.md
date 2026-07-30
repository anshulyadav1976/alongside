# Technical status

- **Branch:** `codex/technical-core`
- **Commit:** safety/journal hardening
- **Active slice:** `S1-S5-local-mvp`
- **State:** `IMPLEMENTED_NEEDS_PUSH`
- **Updated:** 2026-07-30

## Completed

- Local SQLite/OpenAI/GPT-5.4 Mini/ElevenLabs-TTS-only architecture documented.
- Local API contracts and SQLite schema aligned with the own-agent turn pipeline.
- Technical branch created; no product branch dependency.
- Next.js app scaffolded with a server-owned agent loop.
- SQLite seed, memory lifecycle, graph projection, check-in boundary, and deterministic provider fallbacks implemented.
- Call creation, audio turn, TTS audio retrieval, session, journal, memory, graph, support, intervention, and check-in routes implemented.
- Deterministic urgent-safety gate and end-call journal persistence added.

## Ready for product integration

- `/calls`, `/calls/{sessionId}/turn`, `/calls/{sessionId}/end` are the canonical voice contracts.
- `/memories`, `/graph`, `/graph/query`, `/checkins/decision` are the canonical local data contracts.

## Contract changes

- None.

## Tests

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 5 tests.
- `npm run build` passed.

## Blockers

- Provider calls have deterministic demo fallbacks for local rehearsal. ElevenLabs voice is available when the local key/voice configuration is present.

## Next action

- Technical MVP is ready for product integration; run the product surface against the canonical call-turn contract.

## Request to product agent

- Product can consume the local call-turn contract; no provider token or webhook is required.
