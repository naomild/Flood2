---
name: code-review-git
description: "Review and Git conventions for Flood: small changes, commit messages, review checklist. Use when reviewing a change or preparing a commit."
user-invocable: false
---
# Code review and Git workflow

- Small, single-purpose changes. One concern per commit.
- Commit message: imperative subject ≤ 72 chars, blank line, why + what.
  Agent Console commits use `agent(<name>): <summary>` (see `docs/04-agent-console.md`).
- Approve commits go **straight to `main`** (D3) and deploy immediately: review as if it
  were production, because it is.
- Only the orchestrator commits and pushes during team work.

## Review checklist
1. Does it do what the brief asked, and nothing else?
2. Tests added/updated and passing? (`automated-testing`)
3. Secrets: none in `public/`, none logged, none returned to the browser.
4. Security-sensitive paths touched (`netlify/**`, auth, allow-list, headers)? → needs
   security-engineer sign-off.
5. User-facing UI touched? → needs Wren + Sable sign-off and an accessibility check.
6. Scoring thresholds touched? → weather-risk-scientist sign-off + fixture test.
7. Docs updated where behaviour changed?

Report findings as: file:line · problem · concrete fix. Separate blockers from nits.
