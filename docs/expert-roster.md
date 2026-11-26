# Expert roster (agents)

**Decision (recorded):** Flood is a PWA on Netlify: a static front end, Netlify
Functions for the Claude and GitHub calls, and **no other servers**.

This roster lists the expert agents needed to design, build, test and deploy Flood and
to run its Agent Console. Each one is defined in `.claude/agents/<name>.md` (built 2026-11-26). Eleven roles
were required. One more was added because the app really needs it (see §3).

## 1. The team

| # | Agent (`name`) | Persona | One-line job | Suggested model |
|---|---|---|---|---|
| 1 | `orchestrator` | — | Runs the team. Turns goals into tasks, assigns them to the right expert, orders the work, merges results and keeps the plan and docs current. | opus |
| 2 | `agent-builder` (meta agent) | — | Writes, reviews and improves the other agents' definitions (prompts, tools, models). Retires or splits agents that underperform. | opus |
| 3 | `software-architect` | — | Owns the overall design within the "static + Functions only" decision: module boundaries, data flow, folder layout and architecture decision records. | opus |
| 4 | `open-meteo-integrator` | — | Builds and maintains every Open-Meteo forecast and marine request, the city list, unit handling and recorded test fixtures. | sonnet |
| 5 | `weather-risk-scientist` *(added)* | — | Owns the flood, power-outage and beach-day scoring rules and thresholds, their sources and the "why" text shown to users. | opus |
| 6 | `pwa-mobile-engineer` | — | Builds the front end as an installable, offline-first PWA (manifest, service worker, install flow) that works on iPhone and Android. | sonnet |
| 7 | `ui-designer-apple-liquid-glass` | **Sable** | Sets the visual design in Apple's Liquid Glass style (materials, colour, type, icons, motion) and keeps it legible and accessible. | sonnet |
| 8 | `ux-designer-apple-hig` | **Wren** | Designs flows, layout and wording to Apple's Human Interface Guidelines so a stressed user sees their risk in seconds. | sonnet |
| 9 | `agent-console-engineer` | — | Builds the Agent Console: agent list, streaming chat and long jobs over the Claude API, and propose → Approve → GitHub commit, all in Netlify Functions. | opus |
| 10 | `security-engineer` | — | Threat-models and reviews everything with a secret or a write path: password gate, token scope, path allow-list, CSP, rate limits and spend caps. | opus |
| 11 | `netlify-engineer` | — | Owns `netlify.toml`, functions config, Blobs, environment variables, headers, deploys, Deploy Previews and rollbacks. | sonnet |
| 12 | `qa-engineer` | — | Owns the test strategy and suites (unit, function, end-to-end, PWA, accessibility) and the release gate. | sonnet |

## 2. Skills

Each skill has a short definition and the agents that share it. **Lead** means the agent
that owns the skill and reviews others' work in it.

| Skill | What it covers | Lead | Also used by |
|---|---|---|---|
| **S1 Official-docs research** | Read the current official docs before building, cite them, and flag anything unverified | orchestrator | all agents |
| **S2 Team orchestration** | Break goals into tasks, sequence and hand off work, track status, settle conflicts, keep `docs/` current | orchestrator | agent-builder, software-architect |
| **S3 Agent authoring** | `.claude/agents/*.md` format (front matter: `name`, `description`, `model`, `tools`), persona and system prompts, least-privilege tool lists, measuring agent output | agent-builder | orchestrator, agent-console-engineer |
| **S4 Architecture and decision records** | Module boundaries, data flow, trade-offs, writing and honouring architecture decision records | software-architect | orchestrator, netlify-engineer, security-engineer, agent-console-engineer |
| **S5 Code review and Git workflow** | Small reviewable changes, branch/PR hygiene, commit messages, review checklists | software-architect | orchestrator, security-engineer, qa-engineer |
| **S6 Open-Meteo APIs** | Forecast and marine endpoints, variables, units, time zones, multi-location requests, fair-use limits, attribution, coastal caveats | open-meteo-integrator | weather-risk-scientist, qa-engineer |
| **S7 Weather and flood-risk science** | Rain rate vs drainage, antecedent rain, king tides, wind-gust and thunderstorm outage drivers, NWS threat vocabulary, communicating uncertainty | weather-risk-scientist | open-meteo-integrator, ux-designer-apple-hig |
| **S8 Pure-function scoring code** | Deterministic, side-effect-free scoring modules with one tunable `THRESHOLDS` object and fixture-driven tests | weather-risk-scientist | open-meteo-integrator, qa-engineer |
| **S9 Vanilla web front end** | Semantic HTML, modern CSS, ES modules, no framework, small payloads for phones | pwa-mobile-engineer | ui-designer-apple-liquid-glass, agent-console-engineer, qa-engineer |
| **S10 PWA platform** | Web app manifest, service worker caching, offline data with "last updated", install flows and their iPhone vs Android differences, storage eviction | pwa-mobile-engineer | netlify-engineer, ux-designer-apple-hig, qa-engineer |
| **S11 Apple visual design (Liquid Glass)** | Translucent materials (`backdrop-filter`) with solid fallbacks, depth, SF-style type scale, colour tokens, light/dark, icons, motion | ui-designer-apple-liquid-glass | pwa-mobile-engineer |
| **S12 Apple HIG interaction design** | Information hierarchy, navigation, tap targets, iOS conventions, empty/error/offline states, install hints, plain-language copy | ux-designer-apple-hig | ui-designer-apple-liquid-glass, pwa-mobile-engineer, agent-console-engineer |
| **S13 Accessibility (WCAG 2.2 AA)** | Contrast, not colour alone, reduced transparency and motion, screen-reader semantics, live regions, zoom/reflow, keyboard | ux-designer-apple-hig | ui-designer-apple-liquid-glass, pwa-mobile-engineer, qa-engineer |
| **S14 Netlify Functions** | Modern function syntax, 60 s sync/streaming limit, 15 min background functions, `config.path`, `config.rateLimit`, bundling `included_files` | netlify-engineer | agent-console-engineer, security-engineer, software-architect |
| **S15 Netlify Blobs** | Stores, keys, JSON values, strong vs eventual reads, conditional writes (`onlyIfNew`/`onlyIfMatch`) for jobs, proposals, audit and counters | netlify-engineer | agent-console-engineer, security-engineer |
| **S16 Netlify deploy and config** | `netlify.toml`, headers, env-var scopes and secret flags, deploy contexts, Deploy Previews, auto-deploy on push, rollbacks | netlify-engineer | software-architect, security-engineer |
| **S17 Claude API** | Messages API, model IDs and aliases, streaming, tool use (strict schemas, input validation), effort, refusals and fallbacks, prompt caching, usage/cost tracking | agent-console-engineer | agent-builder, security-engineer |
| **S18 GitHub REST (contents)** | Read and update files with a fine-grained token, `sha` conflict checks, serial writes, commit messages | agent-console-engineer | security-engineer, netlify-engineer |
| **S19 Auth and secrets** | Password hashing, signed `HttpOnly` cookies, CSRF, lockouts, keeping keys in Function env vars only, token rotation | security-engineer | agent-console-engineer, netlify-engineer |
| **S20 Threat modelling and AI-agent safety** | Abuse cases, path allow-lists, prompt-injection defence, human approval gates, spend caps, audit logs | security-engineer | agent-console-engineer, agent-builder, software-architect |
| **S21 Web security headers** | CSP, `connect-src` allow-list, `frame-ancestors`, referrer and permissions policies | security-engineer | netlify-engineer, pwa-mobile-engineer |
| **S22 Automated testing** | Vitest unit and function tests with mocked APIs, Playwright end-to-end (offline, mocked network), CI gate | qa-engineer | weather-risk-scientist, agent-console-engineer, security-engineer, open-meteo-integrator |
| **S23 Accessibility and PWA auditing** | axe-core, Lighthouse, manual VoiceOver/TalkBack checks, iPhone and Android install checks | qa-engineer | ux-designer-apple-hig, pwa-mobile-engineer |

### Skill folders

Each skill is a project skill at `.claude/skills/<folder>/SKILL.md`, and each agent in
`.claude/agents/` lists its skills in the `skills:` field exactly as in the matrix below.

| Skill | Folder |
|---|---|
| S1 | `official-docs-research` |
| S2 | `team-orchestration` |
| S3 | `agent-authoring` |
| S4 | `architecture-decisions` |
| S5 | `code-review-git` |
| S6 | `open-meteo-api` |
| S7 | `flood-risk-science` |
| S8 | `risk-scoring-code` |
| S9 | `vanilla-web-frontend` |
| S10 | `pwa-platform` |
| S11 | `liquid-glass-visual-design` |
| S12 | `apple-hig-ux` |
| S13 | `accessibility-wcag` |
| S14 | `netlify-functions` |
| S15 | `netlify-blobs` |
| S16 | `netlify-deploy-config` |
| S17 | `claude-messages-api` |
| S18 | `github-contents-api` |
| S19 | `auth-and-secrets` |
| S20 | `agent-safety` |
| S21 | `web-security-headers` |
| S22 | `automated-testing` |
| S23 | `a11y-pwa-auditing` |

### Skill matrix

● = lead, ○ = uses. Column codes: **Or** orchestrator · **AB** agent-builder ·
**Ar** software-architect · **OM** open-meteo-integrator · **WR** weather-risk-scientist ·
**PW** pwa-mobile-engineer · **Sa** Sable (UI) · **Wr** Wren (UX) · **AC**
agent-console-engineer · **Se** security-engineer · **Ne** netlify-engineer · **QA**
qa-engineer.

| Skill | Or | AB | Ar | OM | WR | PW | Sa | Wr | AC | Se | Ne | QA |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 Docs research | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| S2 Orchestration | ● | ○ | ○ | | | | | | | | | |
| S3 Agent authoring | ○ | ● | | | | | | | ○ | | | |
| S4 Architecture | ○ | | ● | | | | | | ○ | ○ | ○ | |
| S5 Review & Git | ○ | | ● | | | | | | | ○ | | ○ |
| S6 Open-Meteo | | | | ● | ○ | | | | | | | ○ |
| S7 Risk science | | | | ○ | ● | | | ○ | | | | |
| S8 Scoring code | | | | ○ | ● | | | | | | | ○ |
| S9 Front end | | | | | | ● | ○ | | ○ | | | ○ |
| S10 PWA | | | | | | ● | | ○ | | | ○ | ○ |
| S11 Liquid Glass UI | | | | | | ○ | ● | | | | | |
| S12 HIG UX | | | | | | ○ | ○ | ● | ○ | | | |
| S13 Accessibility | | | | | | ○ | ○ | ● | | | | ○ |
| S14 Functions | | | ○ | | | | | | ○ | ○ | ● | |
| S15 Blobs | | | | | | | | | ○ | ○ | ● | |
| S16 Deploy/config | | | ○ | | | | | | | ○ | ● | |
| S17 Claude API | | ○ | | | | | | | ● | ○ | | |
| S18 GitHub REST | | | | | | | | | ● | ○ | ○ | |
| S19 Auth & secrets | | | | | | | | | ○ | ● | ○ | |
| S20 Agent safety | | ○ | ○ | | | | | | ○ | ● | | |
| S21 Headers/CSP | | | | | | ○ | | | | ● | ○ | |
| S22 Testing | | | | ○ | ○ | | | | ○ | ○ | | ● |
| S23 A11y/PWA audit | | | | | | ○ | | ○ | | | | ● |

## 3. Why one extra role, and what was left out

**Added: `weather-risk-scientist`.** The core promise ("will it flood, will my power go
out") is a scoring judgement, not an API call. The Open-Meteo expert knows *how to fetch*
the data. Deciding which values mean danger is a different skill (hydrology, outage
drivers, NWS vocabulary, uncertainty). If one agent did both, it would mark its own
homework on the most safety-relevant part of the app.

**Considered and not added** (covered by existing roles):

| Possible role | Covered by |
|---|---|
| Accessibility specialist | Wren (lead), Sable, QA |
| Copywriter / content | Wren (plain-language copy), weather-risk-scientist ("why" text) |
| DevOps / SRE | netlify-engineer (no servers to run) |
| Backend / database engineer | netlify-engineer + agent-console-engineer (Functions + Blobs only) |
| Native iOS/Android (Capacitor) | Not needed while Flood stays a PWA; pwa-mobile-engineer flags if that changes |
| Data / analytics | Not in scope; no user data is collected |
| Translator (Spanish, Haitian Creole) | Later, if localisation is approved |

## 4. Who owns which doc

| Doc | Owner | Reviewers |
|---|---|---|
| `01-use-case-and-scoring.md` | weather-risk-scientist | open-meteo-integrator, ux-designer-apple-hig |
| `02-pwa-installability.md` | pwa-mobile-engineer | ux-designer-apple-hig, qa-engineer |
| `03-architecture.md` | software-architect | netlify-engineer, security-engineer |
| `04-agent-console.md` | agent-console-engineer | security-engineer, agent-builder |
| `05-testing-and-accessibility.md` | qa-engineer | ux-designer-apple-hig |
| `expert-roster.md` (this file) | agent-builder | orchestrator |

## 5. Hand-off rules

- The orchestrator assigns every task to one **owner** and names its reviewers.
- Any change touching secrets, auth, the path allow-list, headers or GitHub writes needs
  **security-engineer** sign-off.
- Any user-facing screen needs **Wren** (flow/copy) and **Sable** (visuals) sign-off,
  and **qa-engineer** runs the accessibility checks before release.
- Scoring threshold changes need **weather-risk-scientist** sign-off plus a
  fixture test from **qa-engineer**.
- Only **agent-builder** edits `.claude/agents/*.md`. The orchestrator approves the
  edits, and the Agent Console never lets agents change those files themselves.
