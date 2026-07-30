# Technical lead plan

## S0 — Foundation

- Validate repository branch.
- Create server env validation.
- Configure server OpenAI and ElevenLabs TTS clients.
- Add health endpoint.
- Add initial migration and seed strategy.
- Finalise shared types and OpenAPI for S1/S2.

## S1 — Voice

- `POST /api/v1/calls`.
- Create local session before browser recording.
- Accept short audio turns and return transcript, response text, and TTS audio.
- Keep the agent loop in our server; ElevenLabs is TTS-only.
- Record turn idempotency and expose session status.

## S2 — Processing and journal

- Receive short-lived audio turns.
- Transcribe through OpenAI and generate the response with GPT-5.4 Mini.
- Delete raw audio after transcription where possible.
- Use validated JSON for journal/candidate extraction.
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

- SQLite integrity verification.
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

- turn idempotency;
- user memory approval;
- revocation filtering;
- provenance;
- current/history validity;
- `NO_ACTION`.
