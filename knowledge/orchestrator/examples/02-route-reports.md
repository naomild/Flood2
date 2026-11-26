# Example 2 — Route reports between experts (all hand-offs go through you)

## Report received from pwa-mobile-engineer
```
## Summary        Built the outage card in public/index.html + public/app.js.
## Files changed  public/index.html, public/app.js
## Decisions/assumptions  Used --risk-* tokens; badge text from scoreOutage().reasons[0].
## Needs review by  Sable (visuals), Wren (copy, states), qa-engineer (e2e + axe)
## Open questions   Should the card hide when gusts data is missing? (Wren)
## Verification     node verify-pwa.mjs passed; no axe run yet
```

## What the orchestrator does next
1. **Reviews in parallel** (read-only, so no file conflicts): one message with three Agent calls —
   Sable: visual sign-off of `public/index.html` card; Wren: copy + the open question;
   qa-engineer: run e2e + axe, report results.
2. **Open question → Wren**, included in her brief (not answered by the orchestrator).
3. Wait for all three. If Wren says "show the card with 'No wind forecast available'", send that
   change back to pwa-mobile-engineer with her exact wording.
4. When Sable ✓, Wren ✓, QA ✓ (tests green), **commit and push**:
   `feat: show power-outage chance on home screen` — then tell the owner what changed, what was
   verified, and that the scoring is an estimate pending real-outage calibration.

## Anti-patterns
- Letting pwa-mobile-engineer "ask Wren" directly (it can't — no Agent tool — and shouldn't).
- Merging without the reviews the sign-off rules require.
- Briefs that say "see above" — the expert has no "above".
