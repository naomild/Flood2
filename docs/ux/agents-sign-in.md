# UX spec: Agent Console sign-in (`/agents`)

Owner: Wren (UX). Visuals: Sable. Behaviour and wiring: Ada (console), Kai (front end), Quinn (security).
Status: draft for review, 2026-11-26. Basis: `docs/decisions.md` D6, `docs/04-agent-console.md` §3 and §5.2 (D6 notice).
Example address everywhere: `owner@example.com`. The real owner address never appears in the repo (D6).

## 1. Principles

- One path: **Sign in with Google**. No password field, no sign-up, no "forgot" links.
- `/agents` is a public URL. Signed-out visitors see only the sign-in card: no agent names, no chat, no counts.
- Every state keeps the same page skeleton: one `<main>`, one `<h1>` "Agent Console", one status region. Only the content under the h1 changes. This keeps screen-reader orientation stable.
- Errors sit next to the thing that failed, say what happened and what to do, and never blame ("Unable to…", no "we", no "oops").
- Never lose the owner's typing. Losing a half-written instruction to an agent is the worst failure here.
- Sign out and Use another account need no confirmation (common, undoable by signing in again; HIG *Alerts*: "Avoid displaying alerts for common, undoable actions").
- No alerts or modals for any state on this page. Inline cards and banners only.

## 2. Flow

```
Signed out --(Sign in with Google)--> Redirecting --> [Google] --> Returning (processing)
   ^                                                                  |
   |                                    +-----------------------------+------------------+
   |                                    v                             v                  v
   |                               Signed in                     Not allowed          Error
   |                                    |                             |                  |
   +----------(Sign out)----------------+---(Sign out / Use another)-+---(Try again)-----+
                                        |
                              session expires mid-chat
                                        v
                               Session expired (draft kept) --(Sign in again)--> Google --> Signed in, draft restored
```

## 3. Shared rules

**Landmarks and live regions**
- `<main>` holds everything. `<h1>` is "Agent Console" in every state.
- One persistent polite live region, `<div role="status">`, present in the DOM from first paint (empty), so changes are announced. Text is replaced, never stacked.
- The one exception is "Session expired mid-chat" and the error states that block the owner's action: they use `role="alert"` (assertive), because the owner's last action failed.
- Announcements are short, one sentence, and say the new state plus the next action.

**Focus**
- Focus is moved only when the screen's main content is replaced (new state), never while the owner is typing.
- Target on state change: the state's heading or message container, which has `tabindex="-1"`, so the screen reader reads it and the next Tab lands on the first action.
- A control that was just activated is never removed while it has focus without moving focus somewhere sensible (named per state below).
- Visible focus ring on every control (WCAG 2.4.7, 2.4.11). Sable styles it; it must meet 3:1 on glass in light and dark.

**Targets and text**
- All buttons at least 44 x 44 px (HIG default; WCAG 2.2 floor is 24 x 24).
- Works at 320 px width and 200 % text: the card is a single column, buttons stack and become full width, nothing truncates. The email wraps (`overflow-wrap: anywhere`), it is never cut with an ellipsis.
- Not colour alone: every state has an icon and words (info, warning, error icons from Sable's set).

**Reduced motion / transparency**
- No motion is needed. A spinner in "Redirecting" and "Processing" becomes a static "…" with the same text under `prefers-reduced-motion: reduce`.
- The sign-in card sits on a solid surface, not glass (see §10).

**Privacy**
- The email is shown only to the signed-in person, on screen. It is never put in the page title, the URL, logs, analytics or error text sent anywhere.
- After the OAuth return, remove the `code`/token parameters from the URL with `history.replaceState` (Kai/Ada to confirm what supabase-js leaves in the URL).

## 4. States

### 4.1 Signed out

**Layout (top to bottom, one column, centred card)**
1. `<h1>` Agent Console
2. Line: "Only the owner can use this page."
3. Button: **Sign in with Google** (branded, see §10)
4. Small print: "You'll go to Google to sign in. Flood never sees your Google password."

**Copy**
- Page title: "Agent Console - Flood"
- Heading: "Agent Console"
- Body: "Only the owner can use this page."
- Button: "Sign in with Google"
- Small print: "You'll go to Google to sign in. Flood never sees your Google password."

**Focus:** on load, focus stays at the top of the page (no autofocus on the button; autofocus on a page that may be a redirect target is disorienting). If arriving from "Sign out", focus goes to the `<h1>` (`tabindex="-1"`).

**Screen reader:** page title and h1 are read on load. After Sign out: status "Signed out." (the h1 gets focus and is read after it).

**Keyboard order:** Sign in with Google button. (Only one tab stop on the page body; skip link and any site chrome come before it.) Enter or Space activates.

### 4.2 Redirecting to Google (signing in)

Starts the moment the button is activated (`signInWithOAuth`).

**Layout:** same card. The button stays in place, shows a progress icon, and is `aria-disabled="true"` (not `disabled`, so focus is not lost). Second activation does nothing.

**Copy**
- Button label changes to: "Opening Google…"
- Under it: "Don't close this page."

**Focus:** stays on the button.

**Screen reader:** status "Opening Google." Because the page is about to be replaced, the announcement is brief.

**Keyboard order:** unchanged (the button is the only stop; activating again is ignored).

**If the redirect has not happened after 10 s** (assumption, tune with Kai): switch to the Error state 4.7 ("Unable to open Google").

### 4.3 Returning from Google (processing)

The page loads at `/agents` with the OAuth result in the URL. supabase-js exchanges it for a session; then the app calls a function (e.g. `/api/agents`) with the token, which checks `OWNER_EMAILS`. The owner is "processing" until that answer arrives.

**Layout:** same card. No sign-in button, no console content. A progress icon and one line.

**Copy**
- Body: "Signing you in…"

**Focus:** moves to the message container (`tabindex="-1"`) so keyboard and screen-reader users are not left on a page that no longer has their previous control.

**Screen reader:** status "Signing you in." One announcement only.

**Keyboard order:** no interactive controls. (Tab goes to browser chrome. That is fine for a few seconds.)

**Timeout:** after 10 s (assumption), replace with the Error state 4.7: "Sign-in is taking longer than usual." + **Try again**.

**Outcome routing**
- Valid owner session: go to 4.5.
- Valid Google account, function answers 403: go to 4.4.
- Google returned an error or the owner cancelled on Google's screen: go to 4.7 (cancelled variant).
- Network or Supabase failure: go to 4.7.

Do not flash console content before the function confirms the owner is allowed.

### 4.4 Not allowed (a Google account that is not on the list)

The Google sign-in worked, but the address is not in `OWNER_EMAILS` (HTTP 403). New sign-ups are off in Supabase, so this is the normal result for anyone else.

**Layout:** same card, warning icon.
1. `<h1>` Agent Console
2. Message heading (h2): "This account can't use the Agent Console"
3. Body: "You signed in as owner@example.com. Only the owner's account is allowed."
4. Buttons, stacked: **Use another account** (primary) and **Sign out** (secondary)

**Copy**
- h2: "This account can't use the Agent Console"
- Body: "You signed in as owner@example.com. Only the owner's account is allowed."
- Primary button: "Use another account"
- Secondary button: "Sign out"
- Optional line under the buttons: "Nothing was changed."

(The example address stands for whichever account the visitor chose, shown back to them so they can see which one it was. It is the visitor's own address.)

**Behaviour**
- Entering this state ends the local session immediately (`signOut({ scope: 'local' })`) so no token for a non-owner stays in the browser. The email shown is kept in memory only for this screen.
- Sign out: returns to 4.1 (Signed out).
- Use another account: signs out, then starts Google sign-in again asking Google to show the account chooser. Whether `queryParams: { prompt: 'select_account' }` works with the Supabase Google provider is **not verified**: Ada to check the Supabase and Google docs. If it does not, fall back to Sign out, then the button in 4.1.
- No hint about who the owner is, no "request access", no contact link.

**Focus:** moves to the h2 (`tabindex="-1"`).

**Screen reader:** `role="alert"`: "This account can't use the Agent Console. You signed in as owner@example.com. Only the owner's account is allowed."

**Keyboard order:** Use another account, then Sign out.

### 4.5 Signed in

**Layout (top bar, then console)**
- Top bar (control layer, Sable): left, "Agent Console" (this is the h1); right, a compact account group: text "Signed in as owner@example.com" and a **Sign out** button.
- At narrow width the account group moves under the title: line 1 the email (wraps), line 2 the Sign out button. The email is plain text, not a button.
- Below the bar: the console (agent list, then chat, proposals) as specified in the console flow.

**Copy**
- "Signed in as owner@example.com"
- Button: "Sign out"
- Status on arrival: "Signed in as owner@example.com."

**Focus**
- On arrival from Google: focus goes to the h1 (`tabindex="-1"`), then the owner Tabs into the agent list.
- On a cold load that is already signed in (returning visit): normal page start, no focus move, no announcement.

**Screen reader:** after the processing state, status "Signed in as owner@example.com." The account group is a plain `<div role="group" aria-label="Account">` (it is not navigation, so no `<nav>`).

**Sign out behaviour**
- Immediate, no confirmation. Clears the session, the in-memory chat and any saved draft (the owner chose to leave; a draft kept for the next person at a shared computer is a privacy leak). Pending proposals live on the server and stay.
- Then 4.1 with status "Signed out." and focus on the h1.

**Keyboard order:** skip link, h1 area, Sign out, then the console (agent list, chat, composer, proposal actions). The Sign out button is early in the order so it is easy to find, and it is never the default focus.

### 4.6 Session expired mid-chat (draft kept)

Trigger: a request returns 401, or the token can no longer be refreshed. First let supabase-js refresh silently; show this state only if that fails. Do not treat a 403 as expiry (that is 4.4).

**Layout:** the chat stays exactly where it is. Nothing is removed, replaced or blanked.
- A banner (warning icon) appears directly above the composer, inside the chat region.
- The composer textarea keeps the owner's text. The **Send** button is replaced by **Sign in again**.
- If the owner had just pressed Send, the message that did not go through is put back into the composer (not shown as sent, not lost).
- Earlier messages and any open proposal diff stay readable.
- While expired, Approve and Reject on open proposals are disabled with the reason beside them: "Sign in again to approve."

**Copy**
- Banner title: "You were signed out"
- Banner body: "Your session ended. Your draft is saved. Sign in again to send it."
- Button (replaces Send): "Sign in again"
- Back from Google, status: "Signed in again. Your draft is back."
- Approve/Reject disabled hint: "Sign in again to approve."

**Behaviour**
- The draft (and the failed message) is written to `sessionStorage` as the banner appears, because the Google redirect leaves the page. It is removed after it is restored, on Sign out, or on a different account signing in.
- After Google, if the account is the owner: restore the conversation view, put the draft back in the composer with the caret at the end, and do **not** send it automatically. The owner reviews and presses Send.
- If a different, non-owner account comes back: show 4.4 and delete the draft.
- If an Approve request was in flight when the session ended, do not assume it failed or succeeded. After sign-in, reload the proposal's status from the server and show it ("Deployed" or "Still waiting for approval"). Never leave a double-commit possible (the server already guards with ETag; the UI must not retry silently).
- Draft stays on the device only. It is never sent to a server for storage.

**Focus**
- The owner may be typing when expiry is detected. **Do not move focus** and do not interrupt typing. The banner is announced by the live region only.
- If the Send button had focus (the owner just pressed it), focus moves to **Sign in again** in the same place.
- After returning from Google: focus goes to the composer, caret at the end of the draft.

**Screen reader:** `role="alert"`: "You were signed out. Your draft is saved. Sign in again to send it." After return: status "Signed in again. Your draft is back."

**Keyboard order (while expired):** top bar (no Sign out button, since the owner is already out; the account group shows "Signed out" text), agent list, chat history, banner, composer textarea, Sign in again. Approve and Reject stay in the tab order but are `aria-disabled` with their hint linked by `aria-describedby`.

### 4.7 Network or Supabase error

Two kinds, same layout, different words. Neither is an alert dialog.

**Layout:** same card (signed-out position) with an error icon, a short title, one line of detail, and **Try again**. If the owner was already in the console (for example, a refresh fails while the network is down), show a banner above the composer instead and keep everything on screen, as in 4.6.

**Copy**

| Case | Title | Detail | Button |
|---|---|---|---|
| Offline or request failed | "Unable to reach Google sign-in" | "Check your internet connection, then try again." | "Try again" |
| Supabase or sign-in service error (5xx, bad response) | "Sign-in isn't working right now" | "Wait a minute, then try again. Your draft is still here." (omit the draft sentence when there is none) | "Try again" |
| Took too long (§4.2, §4.3) | "Sign-in is taking longer than usual" | "Check your connection, then try again." | "Try again" |
| Cancelled on Google's screen | "Sign-in was cancelled" | "You can try again whenever you're ready." | "Sign in with Google" (the branded button) |

- No error codes, no raw messages from Supabase on screen. The technical reason goes to the console log (without tokens or the email) for debugging.
- While offline, the card also shows the page-wide offline label used elsewhere in the app ("Offline"), so the cause is clear.
- The weather side of the app is unaffected: forecast screens never depend on sign-in (D6 limits Supabase to this page).

**Behaviour:** Try again repeats the failed step (a fresh `signInWithOAuth`, or a new session check). The button shows "Trying…" and is `aria-disabled` while pending. After 3 failed tries in a row, keep the same copy; do not escalate wording.

**Focus:** moves to the title (`tabindex="-1"`) when this card replaces another screen. When it is a banner above the composer, focus is not moved (the owner may be typing). After Try again fails again, focus stays on the button; the live region repeats nothing unless the text changed (add "Still unable to reach Google sign-in." once).

**Screen reader:** `role="alert"` with title and detail, for example "Unable to reach Google sign-in. Check your internet connection, then try again." On success, normal "Signing you in." then "Signed in as owner@example.com."

**Keyboard order:** Try again (or Sign in with Google in the cancelled case).

## 5. Copy list (all strings, for translation or review)

| Key | Text |
|---|---|
| title | Agent Console - Flood |
| h1 | Agent Console |
| signedOut.body | Only the owner can use this page. |
| signedOut.hint | You'll go to Google to sign in. Flood never sees your Google password. |
| button.google | Sign in with Google |
| redirecting.button | Opening Google… |
| redirecting.hint | Don't close this page. |
| processing | Signing you in… |
| notAllowed.title | This account can't use the Agent Console |
| notAllowed.body | You signed in as {email}. Only the owner's account is allowed. |
| notAllowed.primary | Use another account |
| notAllowed.secondary | Sign out |
| signedIn.label | Signed in as {email} |
| signedIn.signOut | Sign out |
| expired.title | You were signed out |
| expired.body | Your session ended. Your draft is saved. Sign in again to send it. |
| expired.button | Sign in again |
| expired.approveHint | Sign in again to approve. |
| error.network.title | Unable to reach Google sign-in |
| error.network.body | Check your internet connection, then try again. |
| error.service.title | Sign-in isn't working right now |
| error.service.body | Wait a minute, then try again. |
| error.slow.title | Sign-in is taking longer than usual |
| error.cancelled.title | Sign-in was cancelled |
| error.cancelled.body | You can try again whenever you're ready. |
| button.retry | Try again |

Announcements (live region text): "Opening Google." / "Signing you in." / "Signed in as {email}." / "Signed out." / "Signed in again. Your draft is back."

## 6. Summary table: focus and announcement

| State | Focus goes to | Announced (type) |
|---|---|---|
| Signed out (fresh) | none (page start) | page title + h1 |
| Signed out (after Sign out) | h1 | "Signed out." (status) |
| Redirecting | stays on button | "Opening Google." (status) |
| Processing | message container | "Signing you in." (status) |
| Not allowed | h2 | title + body (alert) |
| Signed in (after Google) | h1 | "Signed in as {email}." (status) |
| Expired mid-chat | unchanged (Send moves to Sign in again if it had focus) | banner text (alert) |
| Back after re-auth | composer, caret at end | "Signed in again. Your draft is back." (status) |
| Error (card) | title | title + detail (alert) |
| Error (banner while typing) | unchanged | title + detail (alert) |

## 7. Acceptance criteria

- [ ] Signed out: the only content is the h1, one line, the branded Google button and the small print. No agent data is in the HTML or network responses before sign-in.
- [ ] Double activation of Sign in with Google starts one redirect.
- [ ] While processing, no console content is visible; it appears only after the owner check passes.
- [ ] A non-owner Google account sees 4.4, has no token left in storage, and sees nothing of the console. Both buttons work with keyboard only.
- [ ] Signed in: "Signed in as owner@example.com" and Sign out are visible at 320 px and 200 % text without clipping.
- [ ] Sign out clears chat, draft and token, shows 4.1, and focus is on the h1.
- [ ] Expiry while typing: the typed text is intact, focus did not move, the alert is announced once, Send is replaced by Sign in again.
- [ ] After re-auth the draft is in the composer, not sent, caret at the end; a different account gets 4.4 and the draft is deleted.
- [ ] An in-flight Approve is never retried automatically; its status is re-read after sign-in.
- [ ] Network off: the "Unable to reach Google sign-in" card appears with Try again; no raw error text; turning the network on and pressing Try again works.
- [ ] Every state has an icon and words (not colour alone); no state uses an alert dialog or autofocus.
- [ ] axe: zero violations in each state, light and dark, reduced transparency and reduced motion on. VoiceOver and TalkBack read each announcement in §6.
- [ ] No string contains "we", "oops", an error code, or the real owner address; tests use owner@example.com.

## 8. Open questions and assumptions

1. **10 s timeouts** (§4.2, §4.3) are my assumption. Kai/Ada to confirm against real redirect times.
2. **Account chooser on "Use another account":** whether `prompt=select_account` is supported through Supabase's Google provider is not verified. Ada to check.
3. **Draft storage:** `sessionStorage` (cleared when the tab closes) is my recommendation over `localStorage`. Quinn to confirm it is acceptable for the content that agents and the owner discuss.
4. **URL clean-up** after the OAuth return: Ada/Kai to confirm what supabase-js leaves behind and remove it.
5. **Showing the visitor's email in 4.4** is deliberate (so they know which account to switch away from). Quinn to confirm it is acceptable.
6. **Silent token refresh:** the owner should not see 4.6 during normal use. Ada to confirm the refresh window so expiry is rare.

## 9. Sources

- Apple HIG *Alerts*, *Writing*, *Accessibility* — see `knowledge/ux-designer-apple-hig/docs/` (read 2026-11-26).
- `docs/decisions.md` D6, `docs/04-agent-console.md` (read 2026-11-26).
- WCAG 2.2 criteria cited by number (1.4.1, 2.4.7, 2.4.11, 2.5.8): from the project's `accessibility-wcag` skill; not re-read from w3.org for this spec.
- Google, *Sign in with Google branding guidelines* — <https://developers.google.com/identity/branding-guidelines> — **not verified**. The fetch on 2026-11-26 failed (`developers.google.com` does not resolve in this session's allowed network domains). Nothing in §10 has been checked against the page.

## 10. Google button branding (UNVERIFIED; check before shipping)

I could not read Google's page, so these are design constraints to **check against** the official page, not facts.

Rules this spec follows, and why they are safe regardless of the details:
- Use the exact wording "Sign in with Google". Do not reword it ("Log in with Google", "Google login", "Use Google").
- Use Google's official "G" logo asset as supplied by Google, unmodified: no recolouring, stretching, outlining, cropping or effects. Do not redraw it. Do not put it in a tinted or glass-blurred container.
- Use one of Google's own button themes (light, dark or neutral) as published. Do not restyle the button's colours, text size, corner shape or padding with Liquid Glass. Sable styles everything around the button, not the button.
- Place the button on a solid surface (not translucent glass) so the logo and button keep their required contrast.
- The logo is decorative next to the visible words: `alt=""` (or inline SVG with `aria-hidden="true"`). The button's accessible name is its visible text, "Sign in with Google". No `aria-label`.
- Keep a 44 x 44 px minimum target even if Google's published size is smaller (add outer spacing, not a restyle).
- Our own text and the button are separate: no second Google logo elsewhere on the page, and no wording that suggests Google endorses Flood.

To verify (assign to Sable, with Wren): exact button themes and states, minimum size and clearance around the logo, the font and size Google prescribes for the label, whether the label may be localised, and whether the logo may appear on a dark theme in the way Sable's dark mode needs. Then replace this section's "unverified" status with a dated citation. If the page prescribes a button the app should load from Google's own script or use as an image, follow it (CSP implications go to Quinn: D6 forbids new origins beyond Supabase without review).
