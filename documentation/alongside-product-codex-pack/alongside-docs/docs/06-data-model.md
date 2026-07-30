# Data model

The executable reference schema is in [`contracts/schema.sql`](contracts/schema.sql).

## Core principles

- User-facing journal is authoritative and editable.
- Graph is a projection of approved records.
- Raw model output is never directly trusted.
- Temporal validity and system provenance are separate.
- Revocation is enforced in database queries, not only prompts.
- Every user-owned table has RLS.

## Main tables

### `profiles`

User settings, timezone, onboarding state.

### `sessions`

One voice call or fallback text session.

Key fields:

- provider conversation ID
- requested and selected support mode
- processing state
- safety state
- start/end time
- memory enabled

### `transcript_turns`

Canonical persisted transcript as speaker turns, not one giant blob.

Key fields:

- session
- speaker
- text
- start/end milliseconds
- transcription provider/model

### `journal_entries`

Editable post-call summary.

### `memories`

Versioned user memory and candidates.

Key fields:

- type
- statement and structured content
- status
- explicitness
- confidence
- sensitivity
- source quote/session/turn
- valid from/to
- learned/invalidated time
- expiry
- supersession
- reuse permission
- revoked timestamp

### `entities` and `relations`

Graph projection. Relations carry valid and system time plus provenance.

### `state_snapshots`

Temporary tailoring variables with source and confidence. Not diagnoses.

### `interventions` and `intervention_outcomes`

Suggestion, rationale, context, acceptance, completion, helpfulness, burden, later effect.

### `upcoming_moments`

Appointments, deadlines, anniversaries, or user-defined events.

### `checkin_policies` and `checkin_decisions`

Permissions, quiet hours, cooldowns, and auditable decisions.

### `webhook_receipts`

Idempotency and webhook audit without storing unnecessary payload indefinitely.

## State transitions

### Session processing

```text
created
→ active
→ call_completed
→ webhook_received
→ transcribing
→ extracting
→ awaiting_user_review
→ ready

Any processing state may transition to failed with retry metadata.
```

### Memory

```text
proposed → confirmed | rejected
confirmed → superseded | expired | revoked
```

## RLS policy shape

For every user table:

```sql
alter table public.<table> enable row level security;

create policy "users_select_own_rows"
on public.<table>
for select
to authenticated
using ((select auth.uid()) = user_id);
```

Service-role access is server-only. Browser code uses the authenticated user's token and must never receive the service-role key.

## Indexes

Minimum:

- user and date indexes for sessions/journals.
- status/current indexes for memories.
- subject/predicate/object indexes for relations.
- valid-time indexes.
- unique provider conversation ID.
- unique webhook idempotency key.
- vector index only after data volume justifies it; sequential search is acceptable for a hackathon demo.
