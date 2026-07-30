# Frontend and product experience specification

## Design direction

Calm, spacious, non-clinical, and non-gamified. Avoid hospital-blue clichés, cartoon therapy mascots, streaks, confetti, and emotionally manipulative notifications.

The product should feel inspectable rather than mystical.

## Routes

```text
/dashboard
/call
/calls
/calls/[sessionId]
/journal
/journal/[journalId]
/graph
/settings/memory
/settings/checkins
```

## Dashboard

Required components:

- `StartCallCard`
- `SupportModePicker`
- `UpcomingMomentCard`
- `LatestJournalCard`
- `MemoryInsightCard`
- `CheckInDecisionCard`

## Voice call screen

Required:

- connection status
- listening/speaking indicator
- waveform or volume visualisation
- elapsed time
- captions
- mute/end controls
- clear permission explanation
- reconnect/error state
- “do not create memories from this call” toggle

Do not display speculative emotion labels derived from voice.

## Session detail

Tabs:

- Journal
- Transcript
- Proposed memories
- Trace, hidden outside demo mode

Transcript should support:

- speaker separation
- timestamp navigation
- source highlighting when opened from a memory
- copy/export

## Journal editor

- Autosave or explicit save with clear state.
- User edits visibly outrank generated text.
- Deleting a session warns which derived memories will be revoked.

## Candidate memory card

Display:

- statement
- type
- source quote
- confidence
- duration
- permission
- contradiction/supersession warning

Actions:

- confirm
- edit and confirm
- make temporary
- ask before use
- never proactively reference
- reject

## Graph explorer

Use `@xyflow/react`.

Required controls:

- pan/zoom
- fit view
- mini-map
- current/history toggle
- node-type filters
- date range
- reset
- graph chat panel

Custom nodes:

- Event
- Person
- Preference
- Strategy
- Intervention
- Outcome
- Boundary
- Journal
- Upcoming moment

Node inspector:

- current statement
- stored vs inferred badge
- validity period
- confidence
- evidence links
- connected nodes
- edit/forget

## Graph chat

UI response sections:

- Answer
- Stored facts
- Inferences
- Uncertainty
- Evidence

Evidence chip opens the relevant node and transcript excerpt.

## Silence receipt

Prominent but calm component:

```text
No check-in scheduled
You asked for space tomorrow morning.
Earliest possible follow-up: 1:00 PM, only if you request it.
```

## Loading and error states

Every API-backed screen must have:

- loading state
- empty state
- retryable error state
- permission/auth state
- demo fallback when `DEMO_MODE=true`

## Accessibility

- Keyboard navigable controls.
- Captions available during calls.
- Graph semantics not encoded by colour alone.
- Focus-visible styling.
- Adequate contrast.
- Reduced-motion support.
- Plain language for privacy actions.

## Mock-first rule

The product agent builds each paired slice against contract-shaped mocks before the backend is ready. Mocks live in `lib/mock-data` and must be replaceable through the client adapter without changing components.
