# User flow

## 1. Onboarding

Keep onboarding under two minutes.

### Support context

- Health or diagnosis
- Grief or loss
- Work or study
- Relationship
- Family
- Major life change
- Something else
- Prefer not to label it

### What usually helps

- Talking it through
- Practical planning
- Distraction
- Doing one small thing
- Connecting with someone
- Finding meaning
- Not sure yet

### What makes support worse

- Too much advice
- Too many questions
- Forced positivity
- Repeated reminders
- Long exercises
- Bringing up old conversations without asking

### Memory controls

- Save editable journal entries.
- Suggest memories for approval.
- Ask before referencing sensitive memories.
- Delete raw audio after transcription.

### Check-in controls

- I will initiate calls.
- Check in only when I ask.
- Check in after specific events.
- Maximum check-ins per week.
- Quiet hours.

## 2. Dashboard

Primary cards:

- Start a call.
- “What would help right now?”
- Upcoming moments.
- Latest journal entry.
- Recently confirmed memory.
- Check-in state, including explicit `NO_ACTION`.

Navigation:

- Dashboard
- Calls
- Journal
- Memory graph
- Settings

## 3. Start call

Opening choice:

> What would be useful right now: talk it out, take your mind off it, make a plan, do one small thing, or just see where the conversation goes?

The user can ignore the choices and speak naturally.

Call UI states:

- Requesting microphone
- Connecting
- Listening
- Agent speaking
- Muted
- Reconnecting
- Ending
- Processing call

Visible controls:

- Mute
- End
- Captions on/off
- “Keep this call out of memory” toggle

## 4. Post-call screen

Tabs:

- Journal
- Transcript
- Proposed memories
- Technical trace, demo-only

Journal fields:

- Title
- Summary
- What felt important
- What helped
- What did not help
- Decisions
- Next step
- Upcoming moment

Actions:

- Edit
- Save
- Delete session
- Export

## 5. Memory approval

Each candidate card displays:

- Proposed statement
- Memory type
- Source quote
- Source call and timestamp
- Confidence
- Suggested duration
- Reuse policy

Actions:

- Confirm
- Edit and confirm
- Make temporary
- Ask before use
- Never reference proactively
- Reject
- Forget existing related memory

## 6. Temporal graph

Views:

- Current graph
- History
- Timeline
- “Things that help”

Filters:

- Node type
- Date range
- Current/superseded
- Confirmed/inferred
- Sensitivity
- Person or event

Node inspector:

- Human-readable statement
- Type
- Valid period
- Confidence
- Source session and quote
- Connected nodes
- Why it exists
- Edit/forget controls

## 7. Graph chat

Suggested questions:

- What tends to help before difficult appointments?
- Which suggestions have I repeatedly rejected?
- Who have I said is useful for practical support?
- What changed about my check-in preferences?
- What are you inferring rather than directly remembering?

Answers must show:

- Directly stored facts
- Model inferences
- Evidence links
- Uncertainty
- An abstention when evidence is insufficient

## 8. Check-in decision

The user can see:

- Decision: `CHECK_IN` or `NO_ACTION`
- Reason
- Trigger
- Earliest allowed time
- Permission source
- Cancel/pause controls

Silence receipt example:

> **No check-in scheduled**  
> You asked for space tomorrow morning. Alongside will not initiate contact before the selected window.

## 9. Three-call demo flow

### Call one: witness

User asks to speak without advice. Mentions that music helped during a previous journey and that too many questions felt tiring.

### Call two: practical copilot

User asks what to prepare for tomorrow’s appointment. Agent retrieves only relevant confirmed context and helps create three questions.

### Call three: restore

User says they do not want to process the appointment tonight. Agent selects distraction/restoration and does not force reflection.

The user asks for no morning check-in. The dashboard displays `NO_ACTION`.
