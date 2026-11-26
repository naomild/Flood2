# Knowledge — `software-architect`

Architecture decision records and the platform constraints that shape Flood.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [architecture-decision-records.md](docs/architecture-decision-records.md) | Architecture Decision Records (Michael Nygard) | www.cognitect.com |
| [flood-platform-constraints.md](docs/flood-platform-constraints.md) | Platform constraints that shape Flood's architecture | developer.mozilla.org, docs.github.com, docs.netlify.com, open-meteo.com |

## examples/ (worked examples)

- [`ADR-001-browser-calls-open-meteo-directly.md`](examples/ADR-001-browser-calls-open-meteo-directly.md) — ADR 1: Browser calls Open-Meteo directly
- [`ADR-002-long-agent-jobs-in-background-functions.md`](examples/ADR-002-long-agent-jobs-in-background-functions.md) — ADR 2: Long agent jobs run in idempotent background functions
- [`day-model-contract.md`](examples/day-model-contract.md) — Example 3 — An interface contract between two experts
