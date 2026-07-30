#!/usr/bin/env bash
set -euo pipefail

TECH_BRANCH="codex/technical-core"
PRODUCT_BRANCH="codex/product-experience"
CURRENT="$(git branch --show-current)"

git fetch origin --prune

echo "Current branch: $CURRENT"
echo

echo "Recent technical commits:"
git log --oneline -5 "origin/$TECH_BRANCH" 2>/dev/null || echo "  remote branch not found yet"
echo

echo "Recent product commits:"
git log --oneline -5 "origin/$PRODUCT_BRANCH" 2>/dev/null || echo "  remote branch not found yet"
echo

if [[ "$CURRENT" == "$TECH_BRANCH" ]]; then
  echo "Peer status from product branch:"
  git show "origin/$PRODUCT_BRANCH:docs/coordination/PRODUCT_STATUS.md" 2>/dev/null || echo "  product status not available"
elif [[ "$CURRENT" == "$PRODUCT_BRANCH" ]]; then
  echo "Peer status from technical branch:"
  git show "origin/$TECH_BRANCH:docs/coordination/TECHNICAL_STATUS.md" 2>/dev/null || echo "  technical status not available"
else
  echo "Warning: current branch is not a role branch."
fi
