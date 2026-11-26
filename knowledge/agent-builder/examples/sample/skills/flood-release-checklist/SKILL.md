---
name: flood-release-checklist
description: "Pre-release checklist for Flood: tests, accessibility, PWA install, offline, secrets scan. Use before tagging a release or approving a production deploy."
user-invocable: false
---
# Flood release checklist

1. `npx vitest run` and `npx playwright test --trace off` pass.
2. axe: zero violations on home, day detail and console pages.
3. `verify-pwa` style check: installable, offline shows the last forecast with its age.
4. Grep `public/` for `sk-ant-`, `github_pat_`, `ghp_` → no matches.
5. NWS links (D2) open the Miami beach and surf-zone pages.
6. Security-engineer sign-off for any change under `netlify/`.
