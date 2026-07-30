# Shared implementation plan

## Objective

Deliver a reliable three-minute demo showing a voice copilot with user-controlled longitudinal memory, an inspectable temporal graph, and a check-in policy capable of deliberate silence.

## Priority levels

### Must ship

- Voice call UI connected to ElevenLabs.
- Server-issued private conversation token.
- Canonical post-call transcript and OpenAI structured processing.
- Call session and transcript viewer.
- Editable journal entry.
- Candidate memory confirm/edit/reject/forget actions.
- Temporal graph API and interactive graph view.
- Provenance from graph node to call/transcript evidence.
- A later call or simulation retrieves a confirmed memory.
- `NO_ACTION` silence receipt.
- Seeded three-call demo and fallback mode.

### Should ship

- Graph-chat query with evidence-linked answers.
- Intervention ledger and helpfulness feedback.
- Temporal slider/current-versus-history filter.
- “Why this suggestion?” panel.
- Support-mode selection UI and explanation.

### Could ship

- Real scheduled notifications.
- Embedding-based hybrid retrieval.
- Automated contradiction review UI.
- Rich graph clustering and animations.
- Multiple personas or conditions.

## Paired execution loops

Each loop has a technical half and a product half. Start the next loop only after both halves expose enough contract surface for integration.

| Slice | Technical lead | Product lead | Integration proof |
|---|---|---|---|
| `S0-foundation` | Scaffold server paths, Supabase client, env validation, contracts, seed-user strategy | Scaffold app shell, design tokens, navigation, mock service, shared types consumption | App boots; mocked dashboard renders; health endpoint passes |
| `S1-voice` | ElevenLabs token route, session creation, webhook verification, live/session metadata | Call screen, microphone consent, connected/listening/speaking states, transcript panel | A test call starts, ends, and creates a session |
| `S2-processing-journal` | OpenAI transcription/canonicalisation, Responses API structured journal and candidate memories, journal endpoints | Session detail, transcript viewer, editable journal, candidate-memory cards | Finished call becomes editable journal with actions |
| `S3-temporal-memory` | Memory versioning, provenance, graph nodes/edges, retrieval filters, graph endpoint | Temporal graph visualisation, filters, node inspector, source link, edit/forget UX | Confirmed memory appears in graph; revoked memory disappears |
| `S4-graph-chat` | Graph query planner, evidence retrieval, answer schema with fact/inference split | Graph-chat panel, evidence chips, suggested questions, uncertainty display | User asks a graph question and sees evidence-linked answer |
| `S5-support-policy` | Support-mode selector, intervention ledger, check-in decision, `NO_ACTION` | Support-choice UI, rationale card, helpfulness feedback, silence receipt | User requests space; system visibly schedules nothing |
| `S6-hardening-demo` | Safety gate, idempotency, RLS checks, seed scripts, backend evals | Product QA, accessibility, empty/error states, demo story and pitch | Full three-call demo passes twice without manual repair |

## Milestone protocol

For every slice:

1. Both agents read the peer status.
2. Technical agent confirms or updates contract.
3. Product agent builds against contract-backed mocks immediately.
4. Technical agent implements the real endpoint.
5. Both push and mark readiness.
6. Run disposable integration verification.
7. Fix defects in the owning branch.
8. Humans merge both branches into `integration` at stable checkpoints.
9. Both branches sync from `integration` before the next slice if humans have merged.

## Time-boxed hackathon plan

If the event has only a few implementation hours, use this compressed order:

### First 20 minutes

- Create repo and branches.
- Add documentation pack.
- Add `.env.example`.
- Freeze demo persona and three-call scenario.
- Freeze contracts for S1 and S2.

### Next 50 minutes

- Technical: S0 + S1 backend.
- Product: S0 + S1 UI against mocks.
- Integrate one real voice call.

### Next 45 minutes

- Technical: S2 processing and journal API.
- Product: journal/transcript/memory approval UI.
- Integrate call → journal.

### Next 40 minutes

- Technical: S3 minimal temporal graph and provenance.
- Product: graph view and node inspector.
- Integrate approved memory → graph.

### Next 25 minutes

- Technical: S5 minimal check-in policy.
- Product: silence receipt and rationale.
- Integrate `NO_ACTION` demo.

### Final time

- Seed data and demo fallback.
- Fix only demo blockers.
- Rehearse twice.
- Graph chat is implemented only if the must-ship path is stable.

## Feature freeze rule

After the first successful end-to-end run, no new framework, database, model provider, or architectural layer may be introduced. Stretch work must not alter the core contracts.
