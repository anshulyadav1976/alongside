# Product status

- **Branch:** `main`
- **Commit:** merged with technical core and integration fixes
- **Active slice:** `S0-foundation` and `S1-voice`
- **State:** `INTEGRATED_AND_BROWSER_VERIFIED`
- **Updated:** 2026-07-30

## Completed

- Built the typed Next.js App Router frontend, visual system, app shell, dashboard, call experience, sessions, journal, transcript, memory review, temporal graph, graph query, silence receipt, and settings screens.
- Kept the client adapter as the single boundary so components do not import mock data directly.

## Integration completed

- Call UI is connected to `POST /calls`, multipart `POST /calls/{id}/turn`, and `POST /calls/{id}/end`.
- Session, journal, memory, graph, query, and check-in screens consume local SQLite API responses.
- Settings check-in preferences persist through `GET/PATCH /settings/checkins`.
- The adapter maps server envelopes into product view models; `/journals/latest` supplies the demo-friendly latest-journal read.

## Tests

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run build` — pass.
- `npm test` — pass (6 backend + 2 frontend tests).
- Browser smoke — Home, graph, sessions, settings, and call setup rendered without console errors.

## Next action

- Keep product and technical contract changes together on `main`; future UI refinements should continue through the shared adapter.
