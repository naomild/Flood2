# Architecture Decision Records (Michael Nygard)

Source: Michael Nygard, *Documenting Architecture Decisions*, Cognitect (2011-11-15) —
<https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions> (read 2026-11-26)

## Sections (quoted)
- **Title** — "short noun phrases. For example, 'ADR 1: Deployment on Ruby on Rails 3.0.10'".
- **Context** — "the forces at play, including technological, political, social, and project
  local. These forces are probably in tension … The language in this section is value-neutral."
- **Decision** — "our response to these forces. It is stated in full sentences, with active
  voice. 'We will …'"
- **Status** — "'proposed' if the project stakeholders haven't agreed with it yet, or 'accepted'
  once it is agreed. If a later ADR changes or reverses a decision, it may be marked as
  'deprecated' or 'superseded' with a reference to its replacement."
- **Consequences** — "the resulting context, after applying the decision. All consequences should
  be listed here, not just the 'positive' ones."

## Rules (quoted)
- "ADRs will be numbered sequentially and monotonically. Numbers will not be reused."
- "If a decision is reversed, we will keep the old one around, but mark it as superseded."
- "The whole document should be one or two pages long."

## Flood usage
- **Owner decisions** live in `docs/decisions.md` as D1, D2, … (the owner decides; you record).
- **Technical decisions** within those limits: `docs/adr/ADR-NNN-short-title.md` using the five
  sections above. Superseded ADRs stay, with a link to the replacement.
- See `examples/ADR-001-browser-calls-open-meteo-directly.md`.
