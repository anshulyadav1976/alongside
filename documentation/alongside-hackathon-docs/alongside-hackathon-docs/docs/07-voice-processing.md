# Voice and OpenAI processing pipeline

## Provider responsibilities

### ElevenLabs

- Realtime browser voice transport.
- Turn-taking and voice synthesis.
- Provisional live messages/captions.
- Conversation ID.
- Post-call webhook delivery.

### OpenAI

- Canonical persisted speech-to-text transcript from short-lived call audio.
- Structured journal generation.
- Candidate memory, event, state, and intervention extraction.
- Embeddings for permitted confirmed memories.
- Graph-chat answer generation over bounded evidence.
- Moderation signal as one component of safety policy.

## Important nuance

ElevenLabs necessarily performs live speech handling for the realtime conversation. To honour the project decision that persisted transcription uses OpenAI:

1. Use ElevenLabs provisional transcript only for live UI.
2. Receive post-call audio through the signed webhook or retrieve authorised call audio.
3. Transcribe with the configured OpenAI transcription model.
4. Persist the OpenAI canonical transcript.
5. Delete the raw audio immediately after successful transcription or terminal failure handling.
6. If audio is unavailable during the hackathon, clearly mark ElevenLabs transcript as a fallback and do not mislabel it as OpenAI-generated.

## Voice session start

Server endpoint obtains a short-lived conversation token. The browser must never receive the ElevenLabs API key.

Runtime dynamic variables may include:

- local session ID
- pseudonymous user ID
- requested support mode
- compact memory context ID
- locale/timezone

Do not inject a full transcript or sensitive graph into ElevenLabs dynamic variables.

## Post-call webhook

Requirements:

- Read raw request body.
- Verify HMAC signature.
- Store idempotency receipt before processing.
- Return `200` after durable receipt.
- Tolerate additive webhook fields.
- Record provider conversation and agent version IDs.
- Never log raw audio or transcript in production logs.

## OpenAI canonical transcription

Recommended configuration:

```text
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe
```

Use a model supporting diarisation if the exact API/account configuration supports it, otherwise map the known two-party call using ElevenLabs turn metadata.

Persist:

- speaker
- text
- start/end time when available
- provider/model
- source audio checksum
- transcription timestamp

## Structured post-call extraction

Use the Responses API with strict JSON Schema. Produce one object containing:

- journal draft
- explicit decisions
- upcoming moments
- candidate memories
- candidate graph entities/relations
- intervention offers/outcomes
- uncertain observations
- safety flags for review

Do not let prose parsing define application state.

## Processing stages

```text
webhook_received
→ audio_available
→ canonical_transcript_ready
→ structured_extraction_ready
→ database_validated
→ awaiting_user_review
```

## Runtime agent tools

Keep the live voice agent's tool set small:

- `get_relevant_context`
- `record_explicit_user_choice`
- `record_upcoming_moment`
- `record_intervention_offer`
- `set_checkin_preference`

Durable memory writes occur after user review, not directly from arbitrary live tool calls.

## Failure modes

### ElevenLabs unavailable

- Offer text fallback.
- Use seeded demo mode during judging if needed.

### OpenAI transcription fails

- Retry with idempotency.
- Preserve short-lived audio only for a bounded retry window.
- Show processing failure without inventing a journal.
- Optional demo fallback uses the provider transcript and visibly labels its source.

### Structured extraction fails schema validation

- Retry once with same pinned model and schema.
- If still invalid, store transcript and show manual journal editor.

### Webhook duplicated

- Return success for already-received idempotency key.
- Do not duplicate sessions or journals.
