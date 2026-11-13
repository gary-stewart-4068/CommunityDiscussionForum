#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Community Discussion Forum: Production Deployment ==="

# Deployments must come from the merged main branch.
CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "ERROR: Deployment must be run from the main branch."
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Protect tracked local changes. Untracked development records are preserved.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: Tracked local changes exist. Commit or safely resolve them before deployment."
  exit 1
fi

# Verify production configuration without displaying secrets.
if [[ ! -f backend/.env ]]; then
  echo "ERROR: backend/.env is missing."
  exit 1
fi

ENV_PERMISSIONS="$(stat -c '%a' backend/.env)"
if [[ "$ENV_PERMISSIONS" != "600" ]]; then
  echo "ERROR: backend/.env permissions are $ENV_PERMISSIONS; expected 600."
  echo "Correct them with: chmod 600 backend/.env"
  exit 1
fi

for command in git npm pm2; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: $command"
    exit 1
  fi
done

echo
echo "=== Updating main from GitHub ==="
git fetch origin
git pull --ff-only origin main

echo
echo "=== Installing backend dependencies ==="
npm ci --prefix backend

echo
echo "=== Installing frontend dependencies ==="
npm ci --prefix frontend

echo
echo "=== Building production frontend ==="
npm run build --prefix frontend

echo
echo "=== Starting/restarting PM2 applications ==="
pm2 startOrRestart ecosystem.config.js --update-env
pm2 save

echo
echo "=== Running production checks ==="
"$PROJECT_ROOT/scripts/check-production.sh"

echo
echo "Deployment completed."
