# Local SQLite data model

The executable reference schema is in [`contracts/schema.sql`](contracts/schema.sql). SQLite is the only source of truth for the local demo; the graph is derived JSON written to `data/temporal-graph.json`.

## Core principles

- The user-facing journal is editable and authoritative.
- Raw model output is never trusted without validation.
- Valid time and system time are separate.
- Revocation is enforced in SQL/application retrieval, not only prompts.
- A fixed `DEMO_USER_ID` replaces authentication.
- Graph JSON can always be rebuilt from approved records.

## Tables

- `profiles`: local demo settings and onboarding.
- `sessions`: voice call metadata and processing state.
- `transcript_turns`: user/agent turns with timestamps and source.
- `journal_entries`: editable post-call summaries.
- `memories`: proposed/confirmed/versioned memories with provenance and permissions.
- `entities` and `relations`: graph projection records.
- `state_snapshots`: temporary non-diagnostic tailoring observations.
- `interventions`: support offers and outcomes.
- `upcoming_moments`: appointments, deadlines, and anniversaries.
- `checkin_policies` and `checkin_decisions`: consent and auditable decisions.

## State transitions

### Session

```text
created → recording → transcribing → thinking → speaking → call_completed
→ extracting → awaiting_user_review → ready | failed
```

### Memory

```text
proposed → confirmed | rejected
confirmed → superseded | expired | revoked
```

## Temporal memory

Store both:

- `valid_from`/`valid_to`: when a statement was true in the user’s life.
- `learned_at`/`invalidated_at`: when the app learned or changed it.

Never overwrite a changed preference. Close the previous validity window and create a new record.

## Retrieval filters

Current retrieval excludes revoked, rejected, expired, superseded, disallowed-sensitive, and boundary-blocked records. History may show superseded records with historical styling, but revoked content must never reappear.

The MVP uses SQLite keyword/entity matching and graph neighbourhoods. Embeddings and vector search are intentionally out of scope.
