# Technical status

- **Branch:** `main`
- **Commit:** merged with product experience and integration fixes
- **Active slice:** `S1-S5-local-mvp`
- **State:** `INTEGRATED_AND_BROWSER_VERIFIED`
- **Updated:** 2026-07-30

## Completed

- Local SQLite/OpenAI/GPT-5.4 Mini/ElevenLabs-TTS-only architecture and API contracts.
- Server-owned agent loop with deterministic provider fallbacks, rich journal/entity/relation extraction, memory lifecycle, graph projection, check-in boundary, and end-call persistence.
- Call creation, audio turn, TTS retrieval, session, journal, memory, graph, support, intervention, and check-in routes.

## Product integration completed

- Product consumes the canonical call-turn contract; no provider token or webhook is required.
- The merged UI uses the server-owned agent, SQLite persistence, local temporal graph, and ElevenLabs-only TTS boundary.
- Endpoint smoke and browser smoke passed on the merged `main` branch.

## Tests

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass: 6 backend + 2 frontend tests.
- `npm run build` — pass.
- Configured-model synthetic conversation passed: bounded responses, extracted memories/entities, and graph edges persisted.
