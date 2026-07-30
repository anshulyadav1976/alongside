# Architecture and product decisions

Human/integration-owned. Append new ADR-style entries.

## ADR-001 — Single Next.js TypeScript repository

- **Status:** Accepted
- **Decision:** Use Next.js App Router for product UI and Route Handlers for MVP backend.
- **Reason:** Lowest integration overhead for a two-person, time-constrained hackathon.
- **Consequence:** Technical and product ownership is separated by directories and contracts rather than services.

## ADR-002 — Supabase temporal graph projection

- **Status:** Accepted
- **Decision:** Store graph nodes/relations in Postgres with valid/system time rather than adding Neo4j.
- **Reason:** Fewer moving parts and easier provenance/RLS.
- **Consequence:** React Flow visualises API-provided graph data; graph can migrate later.

## ADR-003 — User-approved durable memory

- **Status:** Accepted
- **Decision:** LLM-created durable memories remain proposed until user confirmation, with limited exceptions for explicit low-sensitivity operational preferences.
- **Reason:** Trust, privacy, and prevention of false memory.

## ADR-004 — OpenAI canonical persisted transcript

- **Status:** Accepted
- **Decision:** ElevenLabs handles live voice; OpenAI creates the persisted canonical transcript from short-lived audio.
- **Reason:** Matches provider split and enables consistent downstream processing.

## ADR-005 — No-action policy

- **Status:** Accepted
- **Decision:** `NO_ACTION` is a first-class, explainable check-in outcome.
- **Reason:** Avoid burden and dependency; support real-world life rather than engagement.
