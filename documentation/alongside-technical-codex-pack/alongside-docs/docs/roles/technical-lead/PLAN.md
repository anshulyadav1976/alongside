# Technical lead plan

## S0 — Foundation

- Validate repository branch.
- Create server env validation.
- Configure server Supabase/OpenAI/ElevenLabs clients.
- Add health endpoint.
- Add initial migration and seed strategy.
- Finalise shared types and OpenAPI for S1/S2.

## S1 — Voice

- `POST /api/v1/voice/token`.
- Create local session before provider connection.
- Return ElevenLabs conversation token and dynamic variables.
- Implement signed post-call webhook with raw-body HMAC verification.
- Record provider conversation ID and idempotency key.
- Expose session status endpoint.

## S2 — Processing and journal

- Receive short-lived post-call audio.
- Transcribe through OpenAI.
- Delete raw audio after transcription.
- Use strict Responses API schema for journal/candidate extraction.
- Validate and persist transcript turns, journal, candidates.
- Add retry-safe processing state machine.
- Implement journal and memory action endpoints.

## S3 — Temporal memory and graph

- Implement memory lifecycle and supersession.
- Add source provenance.
- Build entities/relations projection.
- Hard-filter revoked/expired/disallowed memories.
- Add `GET /graph`.
- Add relevant-context retrieval endpoint/tool.

## S4 — Graph chat

- Build bounded graph evidence retrieval.
- Add strict graph-answer schema.
- Separate facts, inferences, uncertainty, evidence IDs.
- Add abstention.
- Add tests for unsupported claims and deleted memory.

## S5 — Support policy

- Implement explicit-choice-first support-mode selector.
- Add intervention ledger/outcome route.
- Implement check-in policy with consent, quiet hours, cooldown, event relevance, burden, and `NO_ACTION`.
- Return evidence and reason codes.

## S6 — Hardening

- RLS verification.
- Safety gate and red-team tests.
- Seed three-call demo.
- Provider-failure demo adapter.
- End-to-end integration checks.

## Cut order under time pressure

Cut in this order:

1. real notification delivery;
2. advanced embeddings/indexes;
3. graph-chat generation, retain deterministic graph insights;
4. rich intervention learning;
5. multiple support modes beyond MVP four.

Never cut:

- webhook auth/idempotency;
- user memory approval;
- revocation filtering;
- provenance;
- current/history validity;
- `NO_ACTION`.
