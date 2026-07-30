# Safety, privacy, and anti-dependency requirements

## Positioning

Alongside is a wellbeing and reflection copilot. It is not a therapist, medical professional, diagnostic tool, emergency service, or replacement for human support.

## Safety architecture

Safety decisions must not rely on the creative conversation model alone.

Use layered signals:

1. deterministic high-risk phrase/rule checks;
2. OpenAI moderation signal;
3. constrained model classification;
4. fixed application policy;
5. clear user-facing escalation behaviour.

The hackathon MVP should demonstrate safe boundaries but must not claim a complete clinical crisis system.

## Prohibited behaviours

- Diagnosis.
- Medication instructions or treatment changes.
- Reinforcing delusions or paranoia.
- Claiming consciousness, love, need, jealousy, or exclusivity.
- Saying the AI is the only one who understands.
- Discouraging contact with people or professionals.
- Guilt when the user leaves or ignores a check-in.
- Emotional streaks or disclosure rewards.
- Optimising for time spent or return frequency.
- Treating inferred voice emotion as fact.
- Using sensitive memories merely to sound intimate.

## High-risk behaviour

When a user expresses immediate self-harm intent, imminent danger, abuse, or a medical emergency:

- stop ordinary support-mode selection;
- use fixed safety response policy;
- encourage immediate human/emergency support appropriate to deployment region;
- do not experiment or personalise using a bandit;
- do not promise confidentiality or emergency intervention capabilities the product does not have.

## Data minimisation

Default retention:

| Data | Treatment |
|---|---|
| Raw audio | delete immediately after canonical transcription |
| Provisional live captions | ephemeral |
| Canonical transcript | retain until user deletes; keep local to the dev database |
| Journal | user-owned and editable |
| Proposed memories | expire if not reviewed |
| Temporary states | decay/expire quickly |
| Confirmed preferences | retain with review and provenance |
| Revoked memory | remove content; retain minimal non-sensitive tombstone |
| Safety events | separate restricted data path |

## User rights inside the product

- View all stored memories.
- See sources and uses.
- Correct inaccurate data.
- Set expiry.
- Disable proactive reference.
- Forget a memory.
- Delete a call and derived records.
- Pause check-ins.
- Export journal and graph.

## Secret handling

- OpenAI and ElevenLabs keys are server-only.
- ElevenLabs is called only from the server for TTS.
- No auth is implemented in the local hackathon demo; use a fixed demo user ID.
- Never commit `.env` files.
- Scrub transcripts and audio from logs.

## Anti-dependency metrics

Positive outcomes:

- real-world action completed;
- user contacted a human when desired;
- journal accuracy;
- memory correction success;
- respectful closure;
- correct silence decision.

Negative outcomes:

- unsolicited check-in rejection;
- inappropriate memory reference;
- repeated rejected intervention;
- exclusive/anthropomorphic language;
- conversations prolonged without user benefit;
- revoked memory leakage.

Do not optimise DAU, streak length, session duration, emotional disclosure depth, or calls per week as wellbeing outcomes.
