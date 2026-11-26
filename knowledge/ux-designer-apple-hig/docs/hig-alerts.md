# Apple HIG — Alerts

Source: Apple Human Interface Guidelines, *Alerts* —
<https://developer.apple.com/design/human-interface-guidelines/alerts> (read 2026-11-26)

> "An alert gives people critical information they need right away." It can "warn them when
> their action might destroy data, and give them an opportunity to confirm a purchase or
> another important action they initiated."

## Titles and messages
- **"Write a title that clearly and succinctly describes the situation."** Avoid "Error" or
  "Error 329347 occurred"; avoid titles over two lines. Sentence → sentence case + punctuation;
  fragment → title case, no ending punctuation.
- **"Include informative text only if it adds value."**

## Buttons
- **"Create succinct, logical button titles."** One or two words describing the result;
  verbs. "Always use 'Cancel' to title a button that cancels the alert's action." Title-style
  capitalisation, no ending punctuation.
- **"Place buttons where people expect."** Most likely / default button on the **trailing**
  side of a row (top of a stack); Cancel on the **leading** side (bottom of a stack).
- **"Use the destructive style to identify a button that performs a destructive action people
  didn't deliberately choose."** If the person deliberately chose the action, the confirming
  button isn't styled destructive.

## Best practices
- **"Use alerts sparingly."**
- **"Avoid using an alert merely to provide information."**
- **"Avoid displaying alerts for common, undoable actions, even when they're destructive."**
- **"Avoid showing an alert when your app starts."** "If your app detects a problem at startup,
  like no network connection … show cached or placeholder data and a nonintrusive label".

## Flood consequences
- Offline at launch → cached forecast + an "Offline · Updated 3:10 PM" label, never an alert.
- Approve in the Agent Console is uncommon, deploys to production, and isn't one-tap
  undoable → it gets a confirmation alert (see `examples/approve-confirmation.md`).
