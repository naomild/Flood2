# Example 2 — Agent Console "Approve" confirmation

Grounded in HIG *Alerts* (quoted in docs/hig-alerts.md): alerts are for "an opportunity to confirm
… another important action they initiated"; titles describe the situation; buttons are short verbs;
"Always use 'Cancel'"; the most likely button on the trailing side; don't use the destructive style
for an action the person deliberately chose.

Why an alert here: Approve is **uncommon**, **deploys straight to the live app** (D3), and is
**not one-tap undoable** — exactly the case HIG reserves alerts for.

## Flow
Proposal diff screen → **Approve** (primary, bottom glass bar) → alert → commit → status row.

## Alert
- **Title** (sentence, so sentence case + period): "Deploy this change to the live app?"
- **Message** (only because it adds value): "flood-scientist will update `src/scoring/thresholds.js`.
  Netlify deploys it in about a minute."
- **Buttons:** `Cancel` (leading) · `Deploy` (trailing, default). Not destructive-styled: the owner
  deliberately chose to approve.
- Keyboard: Esc = Cancel; Enter = Deploy. Focus starts on **Cancel** (safer default for an
  irreversible production action on the web, where Enter is easy to hit by accident).

## After
- Success: inline status, not another alert: "Deployed · commit 3f9c2a1 · View on GitHub".
- Stale: "This file changed since the proposal was made. Ask the agent to update it." + button
  **Ask agent to update**.
- Error: next to the button, specific, no blame: "Unable to commit: GitHub rejected the request
  (409). Try again in a minute." (HIG: "display it as close to the problem as possible").

## Acceptance criteria
- [ ] The diff is fully visible (or scrollable) before Approve is enabled.
- [ ] Double-tapping Deploy creates one commit (button disabled while pending).
- [ ] The alert is announced by VoiceOver/TalkBack with title and message; buttons are labelled.
