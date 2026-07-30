#!/usr/bin/env bash
set -euo pipefail

SLICE_ID="${1:-unspecified}"
TECH_BRANCH="origin/codex/technical-core"
PRODUCT_BRANCH="origin/codex/product-experience"
if git show-ref --verify --quiet refs/remotes/origin/integration; then
  BASE_BRANCH="origin/integration"
else
  BASE_BRANCH="origin/main"
fi
ORIGINAL_BRANCH="$(git branch --show-current)"
TEMP_BRANCH="verify/${SLICE_ID}-$(date +%Y%m%d%H%M%S)"

cleanup() {
  git merge --abort >/dev/null 2>&1 || true
  git checkout "$ORIGINAL_BRANCH" >/dev/null 2>&1 || true
  git branch -D "$TEMP_BRANCH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git fetch origin --prune
git checkout -b "$TEMP_BRANCH" "$BASE_BRANCH"
git merge --no-edit "$TECH_BRANCH"
git merge --no-edit "$PRODUCT_BRANCH"

if [[ -f package-lock.json ]]; then
  npm ci
elif [[ -f pnpm-lock.yaml ]]; then
  corepack enable
  pnpm install --frozen-lockfile
elif [[ -f yarn.lock ]]; then
  corepack enable
  yarn install --frozen-lockfile
fi

if npm run | grep -q " lint"; then npm run lint; fi
if npm run | grep -q " typecheck"; then npm run typecheck; fi
if npm run | grep -q " test"; then npm test; fi
if npm run | grep -q " build"; then npm run build; fi

echo "Integration verification passed for $SLICE_ID on temporary branch $TEMP_BRANCH"
