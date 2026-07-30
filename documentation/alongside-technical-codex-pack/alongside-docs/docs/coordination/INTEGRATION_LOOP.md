# Integration loop

## Purpose

Keep two Codex agents building matching halves without overlapping files or discovering incompatibility at the end.

## Loop

```mermaid
flowchart LR
    C[Read contracts + both status files] --> B[Build owned half]
    B --> T[Run owned tests]
    T --> S[Update own status]
    S --> P[Push role branch]
    P --> F[Fetch peer branch]
    F --> R{Peer half ready?}
    R -- No --> M[Continue with contract-backed mocks]
    R -- Yes --> I[Disposable integration verification]
    I --> O{Combined checks pass?}
    O -- Yes --> N[Mark slice ready for human integration]
    O -- No --> X[Fix only owning branch and document defect]
```

## Status files

- Technical agent writes only `TECHNICAL_STATUS.md`.
- Product agent writes only `PRODUCT_STATUS.md`.
- Each reads the peer file directly from the peer remote branch.

## Request files

- Technical requests product changes in `REQUESTS_FROM_TECHNICAL.md`.
- Product requests contract/backend changes in `REQUESTS_FROM_PRODUCT.md`.
- Requests must identify slice, desired behaviour, contract impact, and urgency.

## Ready states

Use exactly:

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `READY_FOR_INTEGRATION`
- `INTEGRATED`

## Integration failures

Do not patch peer-owned files to make a temporary combined branch pass. Record:

- failing command;
- error output summary;
- likely owning branch;
- contract mismatch;
- minimal requested fix.

## Shared mock strategy

Product UI uses contract-backed mocks until real endpoints exist. The client adapter switches between mock and real implementations through `DEMO_MODE`, not through component rewrites.
