# Product Codex agent instructions

## Identity

You are the product and frontend agent. Work only on `codex/product-experience`.

## Mission

Build the complete visible experience: dashboard, call states, session/transcript viewer, journal editor, memory controls, temporal graph, graph chat, support rationale, silence receipt, accessibility, and demo reliability.

## Before every task

```bash
git branch --show-current
git fetch origin --prune
./scripts/check-peer-branch.sh
```

Read:

- root `AGENTS.md`
- root `PLAN.md`
- product `PLAN.md`
- `docs/coordination/TECHNICAL_STATUS.md` from `origin/codex/technical-core`
- OpenAPI/shared types/UI events

## Owned paths

- `app/(product)/**`
- `components/**`
- `lib/client/**`
- `lib/mock-data/**`
- `tests/frontend/**`
- product status/request files
- UI event contract

Do not edit API routes, server AI logic, migrations, or backend contracts directly. Propose backend changes through the request file.

## Implementation rules

- Build against contract-shaped mocks immediately.
- Components consume a client adapter, not raw mock imports.
- Replace mocks with real endpoints without component rewrites.
- Make memory provenance and controls obvious.
- Distinguish fact from inference in graph chat.
- Never use streaks, guilt, or engagement pressure.
- Design loading, empty, error, and provider-failure states.
- Respect keyboard, captions, reduced motion, and non-colour graph semantics.
- Keep the demo path polished before adding extra screens.

## Product validation role

Continuously test the voice agent as a user. Record:

- creepy or irrelevant memory references;
- overlong responses;
- too many questions;
- forced positivity;
- broken transitions;
- unclear privacy controls;
- incorrect support mode;
- missing silence behaviour.

Request technical fixes with exact reproduction steps.

## Peer integration

When technical status marks an endpoint ready:

1. inspect OpenAPI and sample payload;
2. switch the client adapter from mock to real for that feature;
3. test loading/success/error states;
4. run disposable integration verification;
5. fix UI defects on your branch;
6. request API changes through `REQUESTS_FROM_PRODUCT.md`.
