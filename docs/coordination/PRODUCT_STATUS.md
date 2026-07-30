# Product status

- **Branch:** `codex/product-experience`
- **Commit:** `9439f8e` (initial product implementation; a status-only follow-up commit records the push blocker)
- **Active slice:** `S0-foundation` and `S1-voice`
- **State:** `READY_FOR_INTEGRATION`
- **Updated:** 2026-07-30

## Completed

- Inspected the empty repository and confirmed no technical branch or Next.js scaffold exists.
- Created a typed Next.js App Router frontend scaffold without touching backend-owned routes or configuration.
- Built the visual system, app shell, dashboard, mock client adapter, seeded contract-shaped demo data, and call experience.
- Added browser microphone capture, explicit call-state UI, captions, a deterministic mock turn/audio response, end-call processing, and a seeded session review experience.
- Built product screens for sessions, editable journal, transcript, memory review/approval, temporal graph, graph query, silence receipt, and settings.
- Reworked the memory map only into an interactive Cytoscape knowledge graph: meaningful node types, directional plain-language relationship labels, click-to-select node detail, connected-edge highlighting, and centre-map navigation.

## Ready for technical integration

- The client adapter centralises every real endpoint swap. Components do not import mock data directly.
- Call UI is ready for `POST /calls`, `POST /calls/{id}/turn`, and `POST /calls/{id}/end` when provided by the technical branch.
- Session, journal, memory, graph, query, and check-in display screens are ready to consume contract-shaped API responses.

## Contract changes

- No shared contracts were changed. The provisional call endpoints in the product prompt are isolated in `lib/client/product-client.ts`.

## Tests

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run build` — pass.
- Browser smoke check — dashboard, graph, and session review rendered without console errors.
- `npm test` — pass (2 frontend fallback tests).
- Memory-map interaction check — pass: selecting a graph node updates its evidence inspector and highlights connected edge(s), with no browser console errors.
- Cytoscape canvas smoke check — pass: the selected memory, inspector, and interactive graph canvas render with no browser console errors.

## Blockers

- The shared repository started with only a README; there is no `origin/codex/technical-core` branch or backend/API implementation to inspect.
- The initial push was rejected with HTTP 403 before collaborator access was granted. The product branch was subsequently pushed successfully.

## Next action

- Connect the adapter to technical endpoints once `origin/codex/technical-core` and the matching SQLite/API contract are available. No component rewrite should be necessary.
