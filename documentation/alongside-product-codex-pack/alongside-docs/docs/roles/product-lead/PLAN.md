# Product lead plan

## S0 — Foundation

- App shell and navigation.
- Design tokens and accessible components.
- Client adapter interface.
- Contract-backed mock data.
- Dashboard skeleton.

## S1 — Voice

- Microphone explanation and permission flow.
- Call state machine UI.
- Start/end/mute/captions controls.
- Waveform/volume indicator.
- Live provisional transcript.
- Processing state after call.

## S2 — Processing and journal

- Calls list and session detail.
- Transcript tab with speaker turns and timestamps.
- Editable journal.
- Proposed memory cards.
- Confirm/edit/temporary/permission/reject actions.
- Processing failure and manual journal fallback.

## S3 — Temporal graph

- React Flow graph shell.
- Custom nodes and labelled edges.
- Current/history toggle.
- Date and type filters.
- Node inspector with provenance.
- Jump to transcript source.
- Edit/forget actions.

## S4 — Graph chat

- Chat panel attached to graph.
- Suggested questions.
- Fact, inference, uncertainty, evidence sections.
- Clickable evidence chips.
- Abstention UI.

## S5 — Support policy

- Support-mode chooser.
- “Why this suggestion?” card.
- Intervention helpfulness/burden feedback.
- Check-in settings.
- Silence receipt.

## S6 — Hardening and pitch

- Accessibility pass.
- Empty/error/loading states.
- Product copy pass.
- Seeded demo path.
- Backup screenshots/recording.
- Three-minute pitch rehearsal.

## Cut order under time pressure

Cut in this order:

1. rich graph animation;
2. timeline slider, retain current/history toggle;
3. graph-chat conversational history, retain one-shot query;
4. advanced settings;
5. secondary dashboard insights.

Never cut:

- call state clarity;
- journal editing;
- memory approval and forget;
- graph provenance;
- fact/inference distinction;
- silence receipt.
