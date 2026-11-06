#!/usr/bin/env bash
# Runs a command inside the Playwright image pinned to the @playwright/test version,
# so screenshot baselines and recordings render identically locally and in CI.
#   bash scripts/pw-docker.sh npx playwright test
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p 'require("./package.json").devDependencies["@playwright/test"]')
exec docker run --rm --init --ipc=host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI="${CI:-}" -e GIT_SHA="${GIT_SHA:-}" \
  -v "$PWD":/work -w /work \
  "mcr.microsoft.com/playwright:v${VERSION}-noble" \
  "$@"
