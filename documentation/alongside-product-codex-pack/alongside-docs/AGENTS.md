# Global instructions for all coding agents

These rules apply to every Codex session in this repository.

## 1. Branch identity is mandatory

Before editing anything, run:

```bash
git branch --show-current
git fetch origin --prune
```

Allowed working branches:

- Technical agent: `codex/technical-core`
- Product agent: `codex/product-experience`
- Human-only integration branch: `integration`
- Release branch: `main`

If the current branch does not match the agent's assigned branch, stop and switch branches before making edits.

## 2. Read order at the start of every session

1. `README.md`
2. `AGENTS.md`
3. `PLAN.md`
4. `docs/coordination/INTEGRATION_LOOP.md`
5. Your role-specific `AGENTS.md` and `PLAN.md`
6. Your own status file
7. The peer agent's status file from the peer remote branch
8. Any shared contract relevant to the current slice

## 3. Peer-branch inspection is compulsory

Before beginning a slice, before pushing, and after a contract change:

```bash
./scripts/check-peer-branch.sh
```

The script fetches both branches, shows recent commits, and prints the peer status document. Do not assume the peer implementation exists merely because it is in the plan.

To inspect a file without merging the peer branch:

```bash
git show origin/codex/product-experience:path/to/file
git show origin/codex/technical-core:path/to/file
```

Never merge the peer branch directly into your long-lived role branch merely to test integration. Use the disposable integration verification flow in `scripts/verify-integration.sh`.

## 4. Ownership boundaries

### Technical agent owns

- `app/api/**`
- `lib/server/**`
- `lib/ai/**`
- `lib/memory/**`
- `lib/safety/**`
- `supabase/**`
- `tests/backend/**`
- `docs/coordination/TECHNICAL_STATUS.md`
- `docs/coordination/REQUESTS_FROM_TECHNICAL.md`
- `docs/contracts/openapi.yaml`
- `docs/contracts/schema.sql`

### Product agent owns

- `app/(product)/**`
- `components/**`
- `lib/client/**`
- `lib/mock-data/**`
- `tests/frontend/**`
- `docs/coordination/PRODUCT_STATUS.md`
- `docs/coordination/REQUESTS_FROM_PRODUCT.md`
- `docs/contracts/ui-events.md`

### Shared, single-writer files

- `docs/contracts/shared-types.ts`: technical agent is primary writer; product agent proposes changes in `REQUESTS_FROM_PRODUCT.md`.
- `docs/coordination/DECISIONS.md`: humans or integration agent only.
- `docs/coordination/INTEGRATION_LOG.md`: integration verifier appends results; do not rewrite history.
- Root docs: edit only when a human requests it or a contract is demonstrably stale.

If a task requires editing a peer-owned path, write a request in your own request file and continue with mocks/adapters in your owned area.

## 5. Paired-slice rule

Work only on the currently active paired slice in `PLAN.md` unless blocked. Every backend slice has a matching frontend slice.

A slice is complete only when:

- owned implementation is committed;
- contract is updated first if required;
- tests pass in the role branch;
- own status file is updated;
- peer branch was inspected;
- disposable integration verification was attempted when both halves are ready;
- failures and assumptions are written down.

## 6. Contract-first development

Before changing an endpoint, payload, database shape, client event, or graph schema:

1. Update the appropriate contract file.
2. Add an example payload.
3. Record whether the change is backward compatible.
4. Notify the peer through your request/status document.
5. Implement the change.

Do not silently change JSON field names. Do not make the frontend scrape prose from an LLM response. All processing outputs must use strict structured schemas.

## 7. Status update protocol

After every meaningful push, update your own status document with:

- timestamp;
- branch and commit;
- active slice;
- completed functionality;
- endpoints/components ready for integration;
- contract changes;
- tests run and result;
- blockers;
- next action;
- exact request for the peer, if any.

Keep status concise and factual. Never edit the peer's status file.

## 8. Disposable integration verification

When both status files mark a paired slice `READY_FOR_INTEGRATION`, run:

```bash
./scripts/verify-integration.sh <slice-id>
```

The script creates a temporary branch from `origin/integration` when available, otherwise `origin/main`, merges both remote branches without pushing, and runs configured checks. Resolve defects only in the branch that owns the faulty code. Record the result in your own status file and append to the integration log only when acting as the integration verifier.

## 9. Commit rules

Use small commits with conventional prefixes:

```text
feat(voice): add private ElevenLabs token route
feat(journal): render candidate memory approvals
fix(graph): preserve valid_to during supersession
docs(contract): add graph query response schema
test(memory): cover revoked-memory retrieval
```

Do not bundle formatting, dependency upgrades, and product features in one commit.

## 10. Product and safety invariants

These requirements override convenience:

- The system must not optimise for time spent, emotional disclosure, streaks, or return frequency.
- `NO_ACTION` is a first-class check-in decision.
- User-deleted or revoked memories must be excluded from all retrieval paths.
- Inference must be labelled as inference and linked to evidence.
- The agent must not diagnose or present inferred mental states as facts.
- Sensitive memory references require the configured permission policy.
- Raw audio is short-lived and deleted after canonical transcription.
- Secrets and service-role credentials are server-only.
- All user tables use row-level security.

## 11. Scope discipline

MVP first. Do not add authentication polish, mobile apps, autonomous notifications, Neo4j, complex reinforcement learning, or passive sensing before the required demo loop works.

When uncertain, choose the smallest implementation that preserves the documented contract and demonstrates the scientific/product principle.
