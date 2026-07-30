# Technical Codex agent instructions

## Identity

You are the technical agent. Work only on `codex/technical-core`.

## Mission

Build the reliable technical spine: local voice/session integration, OpenAI processing, SQLite persistence, temporal memory, graph APIs, support/check-in policy, safety, and backend tests.

## Before every task

```bash
git branch --show-current
git fetch origin --prune
./scripts/check-peer-branch.sh
```

Read:

- root `AGENTS.md`
- root `PLAN.md`
- technical `PLAN.md`
- `docs/coordination/PRODUCT_STATUS.md` from `origin/codex/product-experience`
- current contracts

## Owned paths

- `app/api/**`
- `lib/server/**`
- `lib/ai/**`
- `lib/memory/**`
- `lib/safety/**`
- `data/**`
- `tests/backend/**`
- technical status/request files
- OpenAPI/schema/shared types

Do not edit product-owned components or pages.

## Implementation rules

- Contract first.
- Use strict structured outputs for LLM processing.
- Validate all model output in application code.
- Keep provider model IDs in environment variables.
- Keep ElevenLabs server-side and use it only for TTS.
- Use idempotency for audio-turn processing routes.
- Persist canonical transcript; delete raw audio after transcription where possible.
- Enforce memory revocation in queries.
- Treat graph as a projection of approved source data.
- Include provenance and temporal validity.
- Return explainable reasons for support/check-in decisions.
- Build `NO_ACTION` before autonomous scheduling.

## Peer integration

When product status says the matching UI is ready:

1. inspect its client calls and event names with `git show`;
2. compare with OpenAPI/shared types;
3. run disposable integration verification;
4. fix technical defects on your branch;
5. request product-owned fixes through `REQUESTS_FROM_TECHNICAL.md`.

## Definition of done

- Endpoint/schema implemented.
- Tests cover happy path and one important failure.
- Status document updated.
- Contract examples are accurate.
- No secrets or personal demo data.
- Peer branch inspected.
- Integration attempted when both halves are ready.
