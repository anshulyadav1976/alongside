# Technical status

- **Branch:** `codex/technical-core`
- **Commit:** working tree
- **Active slice:** `S0-foundation`
- **State:** `IN_PROGRESS`
- **Updated:** 2026-07-30

## Completed

- Local SQLite/OpenAI/GPT-5.4 Mini/ElevenLabs-TTS-only architecture documented.
- Local API contracts and SQLite schema aligned with the own-agent turn pipeline.
- Technical branch created; no product branch dependency.

## Ready for product integration

- `/calls`, `/calls/{sessionId}/turn`, `/calls/{sessionId}/end` are the canonical voice contracts.

## Contract changes

- None.

## Tests

- Not run yet; implementation follows.

## Blockers

- None. Provider calls will have deterministic demo fallbacks for local rehearsal.

## Next action

- Commit the contract/config slice, push it, then scaffold the server and SQLite foundation.

## Request to product agent

- Product can consume the local call-turn contract; no provider token or webhook is required.
