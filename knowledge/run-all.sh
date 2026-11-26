#!/usr/bin/env bash
# Runs every code example in knowledge/. Usage: cd knowledge && npm install && npm run verify
# (Playwright: uses the installed Chromium; pin @playwright/test to the same version as the browser build.)
set -euo pipefail
cd "$(dirname "$0")"
run() { echo "── $1"; (cd "$(dirname "$1")" && shift_cmd="${2:-node}" && $shift_cmd "$(basename "$1")"); }
run open-meteo-integrator/examples/01-build-urls.mjs
run open-meteo-integrator/examples/02-parse-forecast.mjs
run open-meteo-integrator/examples/03-fetch-with-timeout.mjs
run weather-risk-scientist/examples/01-flood-score.mjs
run weather-risk-scientist/examples/02-outage-score.mjs
run pwa-mobile-engineer/examples/verify-pwa.mjs
run ui-designer-apple-liquid-glass/examples/check-contrast.mjs
run agent-console-engineer/examples/01-list-agents.mjs
run agent-console-engineer/examples/02-chat-sse-tool-loop.mjs
run agent-console-engineer/examples/03-approve-commit.mjs
run security-engineer/examples/01-path-allowlist.mjs
run security-engineer/examples/02-password-and-session.mjs
run netlify-engineer/examples/01-check-netlify-toml.py python3
run netlify-engineer/examples/02-function-with-rate-limit.mjs
run netlify-engineer/examples/03-idempotent-background-job.mjs
echo "── qa-engineer: vitest"; (cd qa-engineer/examples && ../../node_modules/.bin/vitest run 01-flood-score.test.mjs)
echo "── qa-engineer: playwright"; (cd qa-engineer/examples && ../../node_modules/.bin/playwright test --config playwright.config.mjs --trace off --reporter=line)
if command -v claude >/dev/null; then
  echo "── agent-builder: validate samples"
  claude plugin validate agent-builder/examples/sample/agents && claude plugin validate agent-builder/examples/sample/skills
fi
echo "All knowledge examples passed."
