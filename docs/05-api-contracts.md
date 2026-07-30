# API contracts

The machine-readable source is [`contracts/openapi.yaml`](contracts/openapi.yaml). Shared TypeScript shapes are in [`contracts/shared-types.ts`](contracts/shared-types.ts).

All endpoints are under `/api/v1`. The local demo has one server-derived identity: `DEMO_USER_ID`.

## General rules

- JSON requests/responses except audio upload and streamed audio.
- User identity is local and never accepted from arbitrary request body input.
- Use stable string enums and ISO 8601 dates.
- Return `{ data, error, meta }` envelopes for application endpoints.
- Turn IDs and session IDs make retries idempotent.
- Errors include a stable `code`, human-safe `message`, and optional `details`.

## Calls and audio turns

### `POST /calls`

Creates a local SQLite session.

Request:

```json
{
  "requestedSupportMode": "witness",
  "memoryEnabled": true
}
```

Response data:

```json
{
  "sessionId": "ses_123",
  "state": "ready"
}
```

### `POST /calls/{sessionId}/turn`

Accepts `multipart/form-data` with one `audio` file and optionally a client-generated `turnId`.

Response data:

```json
{
  "sessionId": "ses_123",
  "turnId": "turn_123",
  "userTranscript": "I need help preparing for tomorrow.",
  "assistantText": "Let us keep it practical and make a short question list.",
  "audioUrl": "/api/v1/calls/ses_123/turns/turn_123/audio",
  "audioError": null,
  "transcriptSource": "openai"
}
```

The browser sends a 24 kHz mono WAV. The server transcribes it through GPT Realtime 2.1, generates a GPT-5.4 Mini answer, persists both turns, and stores ElevenLabs TTS output. If transcription fails, the endpoint returns `TRANSCRIPTION_FAILED` without persisting invented user text. If TTS fails, the text response remains successful and `audioError` explains why voice is unavailable.

### `GET /calls/{sessionId}/turns/{turnId}/audio`

Streams the generated ElevenLabs audio for playback. The route never exposes provider credentials.

### `POST /calls/{sessionId}/end`

Ends the call and starts journal/memory extraction.

Extraction writes an editable journal plus proposed memories, entity nodes, and relation edges from the canonical transcript. Proposed memories remain reviewable until explicitly confirmed.

## Sessions

- `GET /sessions` returns local call history.
- `GET /sessions/{sessionId}` returns metadata and processing state.
- `GET /sessions/{sessionId}/transcript` returns canonical speaker turns.
- `POST /sessions/{sessionId}/process` idempotently starts or retries post-call processing.

## Journal

- `GET /journals/{journalId}` returns an editable journal and proposed memories.
- `PATCH /journals/{journalId}` updates user-owned fields; edits become authoritative provenance.

## Memories

- `GET /memories` filters by `status`, `type`, `currentOnly`, dates, and sensitivity.
- `PATCH /memories/{memoryId}` accepts `confirm`, `edit_confirm`, `reject`, `make_temporary`, `change_permission`, and `forget`.

Example action:

```json
{
  "action": "edit_confirm",
  "content": "Music helps before appointment-related journeys.",
  "reusePermission": "ask_first"
}
```

## Graph

- `GET /graph?view=current|history` returns nodes, edges, and metadata.
- `POST /graph/query` returns answer, facts, inferences, uncertainty, evidence IDs, and abstention.

Example query:

```json
{
  "question": "What has helped before appointments?",
  "view": "current",
  "selectedNodeIds": []
}
```

## Support and interventions

- `POST /support/select-mode` chooses a support mode with explicit user choice taking priority.
- `POST /interventions/{interventionId}/outcome` records acceptance, completion, helpfulness, burden, later effect, and reuse permission.

## Check-ins

- `POST /checkins/decision` returns `CHECK_IN` or `NO_ACTION` with reason and evidence.
- `GET/PATCH /settings/checkins` manages local consent, quiet hours, cooldown, maximum frequency, and pause state.

`NO_ACTION` is a first-class successful decision, not an error or empty response.

## Health

`GET /health` returns service and database state without keys or personal data.
