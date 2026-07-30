# Alongside

**A voice-based longitudinal wellbeing copilot that remembers what helps, turns calls into a user-owned journal, and knows when to support, suggest, connect, or stay quiet.**

This repository is designed for a two-person hackathon team working in parallel with Codex.

## Team and branches

| Owner | Role | Branch | Primary ownership |
|---|---|---|---|
| Technical lead | AI, voice, backend, memory, temporal graph, safety | `codex/technical-core` | `app/api/**`, `lib/server/**`, `supabase/**`, backend tests, technical status |
| Product lead | Product, UX, frontend, graph visualisation, demo | `codex/product-experience` | `app/(product)/**`, `components/**`, `lib/client/**`, product tests, product status |
| Both humans | Integration and release | `integration`, then `main` | merges, final end-to-end verification, demo release |

Agents must never commit directly to `main`. Each agent owns its role-specific branch and files. Shared contracts have a single owner defined in [`AGENTS.md`](AGENTS.md).

## Start here

1. Read [`AGENTS.md`](AGENTS.md).
2. Read [`PLAN.md`](PLAN.md).
3. Read [`docs/00-product-spec.md`](docs/00-product-spec.md).
4. Read your role-specific agent file:
   - Technical lead: [`docs/roles/technical-lead/AGENTS.md`](docs/roles/technical-lead/AGENTS.md)
   - Product lead: [`docs/roles/product-lead/AGENTS.md`](docs/roles/product-lead/AGENTS.md)
5. Copy the matching role prompt into Codex.
6. Create the branches exactly as named above.
7. Build paired slices in the order defined in `PLAN.md`.

## MVP vertical slice

The product must prove this loop before any stretch feature:

```text
Voice call
→ live transcript
→ OpenAI post-call processing
→ editable journal
→ candidate memories approved by user
→ temporal graph updated with provenance
→ later call retrieves a relevant memory
→ intervention outcome is recorded
→ check-in engine returns CHECK_IN or NO_ACTION
```

## Repository map

```text
.
├── AGENTS.md                     # Global rules for both Codex agents
├── PLAN.md                       # Shared paired-slice implementation plan
├── CONTRIBUTING.md              # Git and integration rules
├── docs/
│   ├── 00-product-spec.md
│   ├── 01-architecture.md
│   ├── 02-user-flow.md
│   ├── 03-support-science.md
│   ├── 04-memory-temporal-graph.md
│   ├── 05-api-contracts.md
│   ├── 06-data-model.md
│   ├── 07-voice-processing.md
│   ├── 08-frontend-spec.md
│   ├── 09-safety-privacy.md
│   ├── 10-testing-evaluation.md
│   ├── 11-demo-script.md
│   ├── 12-references.md
│   ├── contracts/
│   ├── coordination/
│   └── roles/
└── scripts/
    ├── check-peer-branch.sh
    └── verify-integration.sh
```

## Technology decision

The documented default is a single **Next.js App Router + TypeScript** repository with server Route Handlers, Supabase Postgres/pgvector, ElevenLabs Agents for realtime voice, and OpenAI for canonical transcription and structured post-call processing.

The model identifiers are environment-configured. Do not scatter model names through application code.

## Product boundary

Alongside is a wellbeing and reflection copilot informed by psychological research. It is not a therapist, diagnostic system, emergency service, medical device, or substitute for professional or human support.
