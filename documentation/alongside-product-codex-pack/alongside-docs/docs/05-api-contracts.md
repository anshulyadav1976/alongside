# API contracts

The machine-readable source is [`contracts/openapi.yaml`](contracts/openapi.yaml). Shared TypeScript shapes are in [`contracts/shared-types.ts`](contracts/shared-types.ts).

All endpoints are under `/api/v1`.

## General rules

- JSON requests and responses except audio upload.
- Authenticated user ID is server-derived, never trusted from arbitrary body input.
- Use stable string enums.
- Return `{ data, error, meta }` envelopes for application endpoints.
- Use idempotency keys for webhook and post-call processing.
- Dates are ISO 8601 with timezone.
- Errors include a stable `code`, human-safe `message`, and optional `details`.

## Voice

### `POST /voice/token`

Creates a short-lived ElevenLabs WebRTC conversation token and a local session.

Request:

```json
{
  "requestedSupportMode": "witness",
  "memoryEnabled": true
}
```

Response:

```json
{
  "data": {
    "sessionId": "ses_123",
    "conversationToken": "short_lived_token",
    "dynamicVariables": {
      "session_id": "ses_123",
      "memory_context_id": "ctx_123"
    }
  },
  "error": null
}
```

### `POST /voice/webhooks/elevenlabs`

Signed raw-body webhook. Handles audio/transcript events idempotently. Never expose this route to browser clients.

Response: `200` after durable receipt. Heavy processing may continue through an internal job/state transition.

## Sessions

### `GET /sessions`

Returns paginated call history.

### `GET /sessions/{sessionId}`

Returns metadata, processing state, journal link, and support mode.

### `GET /sessions/{sessionId}/transcript`

Returns the canonical OpenAI transcript with speaker turns and timestamps.

### `POST /sessions/{sessionId}/process`

Idempotently starts or retries post-call processing.

## Journal

### `GET /journals/{journalId}`

Returns editable journal and proposed memories.

### `PATCH /journals/{journalId}`

Updates user-owned fields. User edits become authoritative provenance.

## Memories

### `GET /memories`

Filters:

- `status`
- `type`
- `currentOnly`
- `from`
- `to`
- `sensitivity`

### `PATCH /memories/{memoryId}`

Actions:

```json
{
  "action": "confirm | edit_confirm | reject | make_temporary | change_permission | forget",
  "content": "optional edited statement",
  "expiresAt": "optional ISO date",
  "reusePermission": "allowed | ask_first | never_proactive"
}
```

## Graph

### `GET /graph`

Query:

- `view=current|history`
- `from`
- `to`
- `types=event,person,...`
- `focusId`
- `depth`

Response contains nodes, edges, and graph metadata.

### `POST /graph/query`

Request:

```json
{
  "question": "What has helped before appointments?",
  "view": "current",
  "selectedNodeIds": []
}
```

Response contains answer, facts, inferences, uncertainty, and evidence IDs.

## Support mode

### `POST /support/select-mode`

Input includes explicit request, lightweight state, active event, and candidate context. Explicit user choice wins.

Response:

```json
{
  "data": {
    "mode": "practical",
    "reason": "The user explicitly asked for help preparing questions.",
    "confidence": 0.98,
    "alternatives": ["witness"],
    "requiresPermissionBeforeAdvice": false
  },
  "error": null
}
```

## Intervention outcome

### `POST /interventions/{interventionId}/outcome`

```json
{
  "accepted": true,
  "completed": true,
  "helpfulness": 3,
  "burden": 1,
  "laterEffect": "helped briefly",
  "reusePermission": true
}
```

## Check-ins

### `POST /checkins/decision`

```json
{
  "triggerType": "after_event",
  "eventId": "evt_123",
  "candidateTime": "2026-07-31T08:30:00+01:00"
}
```

Response:

```json
{
  "data": {
    "decision": "NO_ACTION",
    "reasonCode": "USER_REQUESTED_SPACE",
    "reason": "The user disabled morning check-ins in the previous session.",
    "earliestAllowedAt": "2026-07-31T13:00:00+01:00",
    "evidenceIds": ["boundary_42"]
  },
  "error": null
}
```

### `GET/PATCH /settings/checkins`

Manages opt-in, quiet hours, cooldown, maximum frequency, and pause state.

## Health

### `GET /health`

Returns service state without leaking keys or personal data.
