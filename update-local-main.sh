#!/usr/bin/env bash

set -euo pipefail

REMOTE="${1:-origin}"
BRANCH="${2:-main}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "This script must be run inside a Git repository." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to update with uncommitted changes in the working tree." >&2
  echo "Commit, stash, or discard local changes before running this script." >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"

if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "Current branch is '$CURRENT_BRANCH'. Expected '$BRANCH'." >&2
  echo "Switch to '$BRANCH' first or pass a different branch name as the second argument." >&2
  exit 1
fi

echo "Fetching ${REMOTE}/${BRANCH}..."
git fetch "$REMOTE"

echo "Fast-forwarding local ${BRANCH}..."
git pull --ff-only "$REMOTE" "$BRANCH"

echo "Local repository is now aligned with ${REMOTE}/${BRANCH}."
