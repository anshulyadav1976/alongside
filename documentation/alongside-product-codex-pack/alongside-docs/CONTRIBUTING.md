# Contributing and integration workflow

## Branches

```text
main                       protected release branch
integration                combined human-managed test branch
codex/technical-core       technical lead and technical Codex
codex/product-experience   product lead and product Codex
```

## Creating branches

```bash
git checkout main
git pull --ff-only
git checkout -b codex/technical-core
git push -u origin codex/technical-core

# In the friend's clone:
git checkout main
git pull --ff-only
git checkout -b codex/product-experience
git push -u origin codex/product-experience
```

Create `integration` once:

```bash
git checkout main
git checkout -b integration
git push -u origin integration
```

## Merge cadence

Do not wait until the end to combine everything. Merge stable paired slices into `integration` in order: S0, S1, S2, S3, S5, then optional S4.

Recommended human integration:

```bash
git checkout integration
git pull --ff-only
git merge --no-ff origin/codex/technical-core
git merge --no-ff origin/codex/product-experience
npm ci
npm run lint
npm run typecheck
npm test
npm run build
git push origin integration
```

If conflicts occur, preserve documented ownership. Do not casually accept “ours” or “theirs” for contract files.

## Syncing role branches after an integration merge

```bash
git checkout codex/technical-core
git fetch origin
git merge origin/integration

# or on product branch
git checkout codex/product-experience
git fetch origin
git merge origin/integration
```

## Pull request checklist

- Scope matches one paired slice.
- Owned paths only, or exceptions explained.
- Contract updated before implementation.
- Status file updated.
- Tests listed with results.
- No secrets or personal demo data.
- User deletion and revocation paths considered.
- Empty/error/loading states exist where relevant.
- Demo acceptance criterion is satisfied.
