# Three-minute demo script

## Roles

### Product lead

- Problem and user story.
- Live voice interaction.
- Journal, graph, and user control.

### Technical lead

- Temporal validity and provenance.
- Outcome-aware retrieval.
- Graph chat evidence.
- Silence policy and safety architecture.

## 0:00–0:25 — Problem

> Most agents optimise one sympathetic answer. People going through something hard need continuity, but ordinary memory systems either forget everything or remember too much in the wrong moment.

## 0:25–1:05 — Voice call

User says:

> I have another appointment tomorrow. I do not want a deep conversation. I just need help deciding what to ask.

Agent selects practical support and helps create three questions. It may cautiously reference the previously confirmed music strategy.

## 1:05–1:35 — Journal

End call. Show:

- transcript;
- editable journal;
- proposed memory;
- source quote;
- confirm/edit/temporary/forget controls.

Say:

> The model proposes memory. The user decides what becomes durable.

## 1:35–2:10 — Temporal graph

Show:

- appointment event;
- music coping strategy;
- “too many questions” boundary;
- relationship to source calls;
- current/history toggle.

Change the check-in preference. Show the old edge closed and the new edge current.

## 2:10–2:35 — Graph chat

Ask:

> What has helped before appointments, and how sure are you?

Show fact, inference, uncertainty, and evidence links.

## 2:35–2:55 — Silence policy

Display:

> No check-in scheduled. The user asked for space tomorrow morning.

Technical explanation:

> `NO_ACTION` is a first-class policy outcome. We optimise for appropriate support and real-world action, not app engagement.

## 2:55–3:00 — Close

> Most agents prove intelligence by saying something. Alongside also knows when the respectful action is to say nothing and let the person return to their life.

## Backup plan

If live providers fail:

- Switch to seeded session.
- Play a 15-second call recording or use the transcript replay.
- Continue journal, graph, graph-chat, and silence demo live.
