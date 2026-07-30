# Product specification

## Product name

**Alongside**

## One-line proposition

A voice copilot that helps someone through a difficult stretch by listening, offering proportionate real-world support, creating an editable journal, remembering only what the user permits, and knowing when to remain silent.

## Problem

One-off conversational agents can produce a sympathetic reply but usually fail across time. They forget context, repeat unwanted advice, reference sensitive facts inappropriately, or optimise for continued conversation rather than helping the person return to life outside the app.

## Target user

A person going through a hard but not necessarily clinically defined period, such as a new diagnosis, grief, unemployment, relationship change, caregiving, academic pressure, or another major transition.

The MVP uses a fictional “new medical diagnosis and upcoming appointment” scenario because it demonstrates emotional, practical, temporal, and privacy requirements. The product must not claim clinical treatment.

## Jobs to be done

- Let me speak without immediately fixing me.
- Help me decide whether I need listening, distraction, a plan, a small action, meaning, or human contact.
- Help me remember what happened and what helped.
- Reduce the burden of repeatedly explaining context.
- Let me inspect, correct, and delete what the system remembers.
- Help me prepare for difficult moments.
- Do not bother me when I ask for space.

## Product principles

1. **User choice before algorithmic confidence.**
2. **Personalised, not possessive.**
3. **Real-world outcomes over engagement.**
4. **Memory with provenance and permission.**
5. **Observation is not diagnosis.**
6. **A correct memory can still be inappropriate to mention.**
7. **Silence is a valid action.**
8. **The journal belongs to the user.**

## Support modes

The full model supports:

- Witness
- Regulate
- Restore/distraction
- Gentle activation
- Savour
- Meaning/values
- Narrative/identity
- Human connection
- Practical copilot

MVP implementation should deeply support four modes:

- Witness
- Restore/distraction
- Gentle activation
- Practical/human connection

## Core features

### Voice calls

- Browser-based realtime voice call.
- Clear microphone permission and call state.
- Short, natural responses.
- User can end at any time.

### Sessions and journal

- Every call is one session in a continuous relationship.
- Persisted canonical transcript.
- Editable post-call journal.
- Summary, decisions, important moments, what helped, next step, and candidate memories.

### User-controlled memory

- Confirm, edit, reject, make temporary, prevent proactive reference, or forget.
- Display provenance and confidence.
- Respect supersession and deletion.

### Temporal graph

- User-facing graph of events, people, preferences, strategies, interventions, outcomes, goals, boundaries, and journal entries.
- Time filtering and current/history modes.
- Node inspector with evidence.

### Graph chat

- Ask natural-language questions about the graph.
- Answers separate stored facts from model inference.
- Every claim links to evidence nodes/edges/session excerpts.
- The chat may say “I do not have enough evidence.”

### Support and check-in policy

- Explain selected support mode.
- Record intervention outcomes.
- Schedule a check-in only when explicitly permitted and contextually useful.
- Display a silence receipt when `NO_ACTION` is chosen.

## Non-goals for the MVP

- Diagnosis or treatment.
- Autonomous crisis management.
- Medication advice.
- Passive device sensing.
- Emotion recognition from voice as truth.
- Always-on listening.
- Social-feed or community features.
- Engagement streaks.
- Fully autonomous self-modifying prompts or reinforcement learning.

## MVP acceptance scenario

1. First call: user asks to be heard; says music helped before and too many questions are tiring.
2. Journal is created; user confirms both memories.
3. Second call: user asks for appointment preparation; agent cautiously recalls relevant context.
4. User asks for no morning check-in.
5. Graph shows the appointment, music strategy, question boundary, source calls, and preference timeline.
6. Graph chat answers “What tends to help before appointments?” with evidence.
7. Check-in engine returns `NO_ACTION`, and UI displays the reason.
