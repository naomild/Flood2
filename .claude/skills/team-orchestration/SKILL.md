---
name: team-orchestration
description: "How the Flood team plans, runs experts in parallel, and hands work between agents through the orchestrator. Use when planning work, assigning tasks or reporting results."
user-invocable: false
---
# Team orchestration

**All hand-offs go through the orchestrator.** Specialists do not call each other; they
return a report, and the orchestrator decides who goes next.

## Plan
- Break a goal into tasks with one **owner** each (see `docs/expert-roster.md` §1) and
  named **reviewers** (§6 sign-off rules).
- Mark dependencies. Everything without a dependency runs **in parallel**: send several
  Agent calls in one message.
- Parallel tasks that write must touch **different files**. Reviews and research are
  read-only and can always run in parallel.

## Brief (what the orchestrator sends)
Goal · owner · files in scope · relevant docs and decisions · done-criteria · reviewers next.

## Report (what every specialist returns)
```
## Summary        one paragraph
## Files changed  paths, or "none"
## Decisions/assumptions
## Needs review by  agent names, and what to check
## Open questions   for the owner or another expert
## Verification     tests run and their result, or "not run" with why
```

## Integrate
- Route each "Needs review by" to that reviewer (in parallel when independent).
- Resolve conflicts against `docs/decisions.md`, then the architect, then ask the owner.
- Only the orchestrator commits and pushes, after required sign-offs.
- Keep `docs/` current; record new owner decisions in `docs/decisions.md`.
