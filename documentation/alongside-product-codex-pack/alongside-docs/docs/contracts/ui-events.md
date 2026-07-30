# Client event contract

Product-owned event names used by components and analytics/debug trace.

## Voice

- `voice.permission_requested`
- `voice.permission_granted`
- `voice.permission_denied`
- `voice.session_started`
- `voice.session_connected`
- `voice.agent_listening`
- `voice.agent_speaking`
- `voice.session_ended`
- `voice.session_failed`

## Journal and memory

- `journal.opened`
- `journal.edited`
- `journal.saved`
- `memory.confirmed`
- `memory.edited_confirmed`
- `memory.made_temporary`
- `memory.permission_changed`
- `memory.rejected`
- `memory.forgotten`

## Graph

- `graph.view_changed`
- `graph.node_selected`
- `graph.evidence_opened`
- `graph.query_submitted`
- `graph.query_abstained`

## Support/check-in

- `support.mode_selected`
- `support.rationale_opened`
- `intervention.feedback_submitted`
- `checkin.decision_viewed`
- `checkin.paused`

Events must not include transcript text, raw journal content, sensitive memory statements, or API secrets.
