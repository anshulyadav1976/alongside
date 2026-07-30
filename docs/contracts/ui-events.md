# Client event contract

Product-owned event names for UI/debug instrumentation. Event payloads must never include transcript text, raw journal content, memory statements, or API secrets.

## Call

- `call.permission_requested`
- `call.permission_granted`
- `call.permission_unavailable`
- `call.turn_recording_started`
- `call.turn_recording_stopped`
- `call.turn_transcribing`
- `call.turn_responded`
- `call.ended`
- `call.failed`

## Reflection and memory

- `journal.opened`
- `journal.edited`
- `journal.saved`
- `memory.confirmed`
- `memory.edited_confirmed`
- `memory.made_temporary`
- `memory.permission_changed`
- `memory.rejected`
- `memory.forgotten`

## Graph and check-ins

- `graph.view_changed`
- `graph.node_selected`
- `graph.evidence_opened`
- `graph.query_submitted`
- `graph.query_abstained`
- `checkin.decision_viewed`
- `checkin.paused`
