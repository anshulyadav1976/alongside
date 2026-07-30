# Requests from product to technical

## REQ-P-001 — Publish the provisional turn-based call contract

- **Slice:** S1-voice
- **Status:** OPEN
- **Needed by:** Before swapping the product adapter out of demo mode.
- **Requested endpoint or contract change:** Publish matching backend/shared types for `POST /api/v1/calls`, `POST /api/v1/calls/{sessionId}/turn` (multipart recorded audio), and `POST /api/v1/calls/{sessionId}/end`, including response state names and audio URL lifetime.
- **User impact:** The existing UI works from deterministic mocks, but needs exact status/error shapes to connect live voice safely.
- **Backward compatibility:** New endpoints supersede the older voice-token flow described in the original pack.
- **Resolution:** Pending technical implementation.
