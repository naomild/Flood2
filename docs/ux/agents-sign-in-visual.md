# Agent Console sign-in — visual spec (Sable)

Scope: `/agents` signed-out screen ("Sign in with Google" through Supabase Auth, owner only, D6).
Flow and wording belong to Wren (`docs/ux/agents-sign-in.md`); this file gives only look and
feel. Where I need a string I write a placeholder in `[brackets]` that Wren's copy replaces.

Sources (read 2026-11-26): Apple HIG *Materials* and *Color*
(`knowledge/ui-designer-apple-liquid-glass/docs/`), WCAG 2.2 AA (1.4.1, 1.4.3, 1.4.11, 2.4.7,
2.4.11, 2.5.8). Google branding: see section 2 (not verified).

## 0. Principles

1. One glass element only: the sign-in card is a control-layer sheet floating over a plain page.
   Everything inside it is text on a near-solid fill. No glass on the Google button, chip or
   alerts.
2. Risk colours (`--risk-*`) are never used here. Not-allowed and error get their own tokens
   so one colour keeps one meaning (HIG Color). Every status has an icon shape and a word.
3. Legibility beats effect. Fill is 86% opaque and contrast is checked against the worst
   backdrop (pure black in light mode, pure white in dark mode).

## 1. Sign-in card

Layout (mobile first, 320 px up): page `--bg`, card centred vertically in the safe area,
`max-inline-size: 22.5rem`, `inline-size: calc(100% - 2rem)`, padding `--space-6` (24 px),
radius `--radius-sheet` (28 px). Stack, 16 px gap: app mark (Flood icon 48 px), title
(`--size-title2`, 600), one-line body (`--size-body`, `--text-secondary`), Google button
(full width), footnote (`--size-footnote`, `--text-secondary`). At 200% text the stack just
grows; nothing is clipped or truncated (`min-block-size`, not `block-size`).

Material: Apple's `regular` variant (more opaque, because the card holds text).

```css
.signin-card {
  background: var(--si-card-solid);            /* default = the fallback */
  color: var(--si-text);
  border: 1px solid var(--si-card-border);
  border-radius: var(--radius-sheet);
  box-shadow: var(--si-card-shadow);
  padding: var(--space-6);
}
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .signin-card {
    background: var(--si-card-fill);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  }
}
@media (prefers-reduced-transparency: reduce) {
  .signin-card { background: var(--si-card-solid); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@media (prefers-contrast: more) {
  .signin-card { background: var(--si-card-solid); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

Fallback order (safest first): the solid colour is the base rule, glass is an enhancement
inside `@supports`, and reduced transparency / more contrast switch back to solid. A browser
without `backdrop-filter` therefore never sees a see-through card with unblurred content.
The page behind the card is a plain `--bg` with an optional soft radial tint (decorative,
`background-image` only; removed under reduced transparency) so the glass has something to
refract.

## 2. Google button (keeps Google's branding, no glass)

**Source status: not verified.** `developers.google.com` did not resolve from this session
(`getaddrinfo ENOTFOUND`; the host must be added to the session's allowed domains). The
values below are from memory of
<https://developers.google.com/identity/branding-guidelines> and must be checked against
that page before build. Wren/Ada: do not ship until Sable re-reads the page and removes this
warning.

Rules to apply (confirm each on the page):

- Use the official "Sign in with Google" button style, one of three themes: **light**
  (white fill, thin neutral border), **dark** (near-black fill, thin border), **neutral**
  (light-grey fill, no border). Do not recolour, add gradients, shadows, glass or blur,
  and do not restyle the logo.
- The G logo is the official multicolour asset, used as supplied, on a plain button fill
  (never tinted by `currentColor`, never placed on a coloured or translucent backing).
  Save the official SVG from Google's asset pack as a local file (e.g.
  `public/icons/google-g.svg`, served from `'self'`; no Google-hosted scripts or images,
  because the CSP and the no-third-party rule forbid them). I am not reproducing the path
  data from memory: a redrawn G would break the guidelines.
- Label: "Sign in with Google" (the exact text Google allows; Wren may not reword it).
  Typeface Roboto Medium. We do not ship web fonts, so on devices without Roboto the label
  falls back to the system font: unverified whether that is acceptable; if Google requires
  Roboto, bundle a local Roboto Medium file (≈ 15 KB subset) rather than load Google Fonts.

Recalled spec (unverified), implemented as tokens so a correction is a one-line change:

| Part | Light theme | Dark theme |
|---|---|---|
| Fill | `#ffffff` | `#131314` |
| Border 1 px | `#747775` | `#8e918f` |
| Label | `#1f1f1f` | `#e3e3e3` |
| Height | 40 px visual, 48 px touch target (padding extends the hit area) | same |
| Logo | 20 × 20 px | same |
| Padding inline | 12 px each side | same |
| Logo to label gap | 10 px | same |
| Label | Roboto Medium 14 px / 20 px, no caps | same |
| Radius | pill (`999px`) to match the card's controls | same |

Layout inside: `display:flex; align-items:center; justify-content:center; gap:10px`, logo
`flex:none`, label centred. Full-width on the card; at narrow widths the label may wrap to
two lines and the button grows (never truncate). Touch target at least 44 × 44 px; the
visual 40 px height sits inside a 48 px `min-block-size` button with the extra 4 px as
transparent padding, so the border is still 40 px tall. If Google's page says the button
height is fixed, drop to 44 px min and tell Wren.

States (state layer overlay, not a restyle of the fill):

- Hover: 8% label-colour overlay. Pressed: 12%. Disabled: 12% fill, 38% label, logo 38%
  (matches the recalled guideline; confirm).
- Loading, after click and before the redirect to Google: button disabled with
  `aria-busy="true"`, label replaced by [Wren: "Opening Google…"], logo stays; no spinner
  is required (static text works under reduced motion).
- Focus-visible: the shared focus ring (section 5), drawn outside the border.

Theme choice: follow the page scheme: light theme in light mode, dark theme in dark mode.
The button's own fill is solid in all modes, including reduced transparency.

```css
.google-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  inline-size: 100%; min-block-size: 48px; padding-inline: 12px;
  background: var(--gbtn-fill); color: var(--gbtn-text);
  border: 1px solid var(--gbtn-border); border-radius: 999px;
  font: 500 0.875rem/1.25rem Roboto, system-ui, sans-serif;   /* Roboto Medium: verify */
  background-clip: padding-box;       /* no backdrop-filter, no box-shadow, no gradient */
  cursor: pointer;
}
.google-btn img { inline-size: 20px; block-size: 20px; flex: none; }   /* official SVG, unmodified */
.google-btn:hover:not(:disabled)  { background-image: linear-gradient(var(--gbtn-hover), var(--gbtn-hover)); }
.google-btn:active:not(:disabled) { background-image: linear-gradient(var(--gbtn-press), var(--gbtn-press)); }
.google-btn:disabled { opacity: .38; cursor: not-allowed; }
```

(The overlay is a flat translucent layer for a state, not a decorative gradient; if Google's
page forbids it, use a solid hover fill from their palette.)

## 3. Signed-in chip, not-allowed alert, error

All three sit on solid surfaces (chip: `--si-chip-bg`, alerts: their own solid tints). Radius
`--radius-control`/`--radius-card`.

**Signed-in chip** (top of the console list, in the control layer next to the title). Pill,
min height 44 px (target) with the visible pill 36 px: person glyph (16 px, `aria-hidden`),
the account text `[Signed in as owner@…]` in `--size-footnote`, single line,
ellipsised in the middle only if it truly cannot fit (full address in `title` and in the
accessible name). Then a divider (`--separator`) and a **Sign out** text button (`--accent`,
600, min 44 px target, own focus ring). The address is private: never baked into a
screenshot or doc; use `owner@example.com` in specs. At widths under 360 px the chip wraps:
account line above, Sign out below, both full width.

```css
.chip { display:inline-flex; align-items:center; gap:8px; min-block-size:44px; padding-inline:12px 4px;
  background:var(--si-chip-bg); color:var(--si-text); border:1px solid var(--si-chip-border);
  border-radius:var(--radius-control); font:500 var(--size-footnote)/1.25 var(--font); }
.chip .signout { min-block-size:44px; padding-inline:12px; background:none; border:0;
  color:var(--si-link); font:600 var(--size-footnote) var(--font); border-radius:var(--radius-control); }
```

**Not-allowed alert** (Google sign-in worked, but the address is not in `OWNER_EMAILS`).
Not an error of ours, so a calm, non-red treatment: plum tint, lock icon, title word
"Not allowed" (visible text, so it is not colour alone), body from Wren, then a secondary
action `[Try another account]` (neutral outlined button, not the Google button). Container:
`role="alert"`, solid `--notice-bg`, 1 px `--notice-border`, radius 16 px, padding 16 px,
icon 20 px at the start (inline-start), text in `--notice-text`. Never show or echo the
rejected address beyond what Wren's copy says.

**Error** (sign-in failed, network, provider error). Same container shape so the pair
reads as a family, but: circle-with-exclamation icon (different from the lock), title word
"Error", tint `--error-bg`, text `--error-text`, plus a `[Try again]` button. `role="alert"`.
The shared 4 px inline-start accent bar is dropped on purpose (decoration adds nothing
beyond icon + word).
Because `--error-*` is close to the risk-high hue, it must never appear next to a risk
badge. It lives only on this screen; if the owner prefers a different hue, tokens are the
only change.

Both alerts: one at a time, replacing each other in the same slot above the Google
button, so the card does not jump twice.

## 4. Tokens

Drop-in additions for `public/styles/tokens.css` (they reuse the existing
`--bg --surface --text --text-secondary --accent --on-accent --separator --glass-blur
--radius-* --space-*`; `--separator` and `--radius-sheet` are new if not yet defined).
Names prefixed `--si-` are sign-in only.

```css
:root {
  --radius-sheet: 28px;
  --separator: rgb(11 29 42 / 0.18);

  /* Sign-in card */
  --si-card-solid:  #ffffff;
  --si-card-fill:   rgb(255 255 255 / 0.86);
  --si-card-border: rgb(255 255 255 / 0.7);
  --si-card-shadow: 0 1px 0 rgb(255 255 255 / .6) inset, 0 12px 32px rgb(11 29 42 / .14);
  --si-text:        #0b1d2a;
  --si-text-2:      #3d4f5c;
  --si-link:        #0a5cc2;
  --si-chip-bg:     #ffffff;
  --si-chip-border: rgb(11 29 42 / .16);

  /* Not allowed (plum) and error: NOT risk colours */
  --notice-bg: #f1ecfa;  --notice-text: #4a2a80;  --notice-border: #7c5cb8;
  --error-bg:  #fdecec;  --error-text:  #9c1c1c;  --error-border:  #c4504f;

  /* Google button: values from memory, unverified (section 2) */
  --gbtn-fill: #ffffff;  --gbtn-border: #747775;  --gbtn-text: #1f1f1f;
  --gbtn-hover: rgb(31 31 31 / .08);  --gbtn-press: rgb(31 31 31 / .12);

  /* Focus */
  --focus-ring: #0a5cc2;
  --focus-halo: #ffffff;

  /* Motion */
  --motion-enter: 220ms;  --motion-fast: 120ms;  --ease-out: cubic-bezier(.2, .8, .2, 1);
}
@media (prefers-color-scheme: dark) {
  :root {
    --separator: rgb(242 245 248 / .2);
    --si-card-solid:  #1c2833;
    --si-card-fill:   rgb(28 40 51 / 0.86);
    --si-card-border: rgb(255 255 255 / .16);
    --si-card-shadow: 0 1px 0 rgb(255 255 255 / .08) inset, 0 12px 32px rgb(0 0 0 / .5);
    --si-text:   #f2f5f8;
    --si-text-2: #c3cfd9;
    --si-link:   #6cb4ff;
    --si-chip-bg: #16212b;  --si-chip-border: rgb(255 255 255 / .18);
    --notice-bg: #2a2140;  --notice-text: #d6c2ff;  --notice-border: #9d82d8;
    --error-bg:  #3d1a1a;  --error-text:  #ffb4ab;  --error-border:  #d9736d;
    --gbtn-fill: #131314;  --gbtn-border: #8e918f;  --gbtn-text: #e3e3e3;
    --gbtn-hover: rgb(227 227 227 / .08);  --gbtn-press: rgb(227 227 227 / .12);
    --focus-ring: #6cb4ff;  --focus-halo: #0b1218;
  }
}
@media (prefers-contrast: more) {
  :root { --si-text-2: #1f2f3a; --si-card-border: #0b1d2a; --si-chip-border: #0b1d2a;
          --notice-border: #4a2a80; --error-border: #9c1c1c; }
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root { --si-text-2: #e3eaf0; --si-card-border: #f2f5f8; --si-chip-border: #f2f5f8;
          --notice-border: #d6c2ff; --error-border: #ffb4ab; }
}
```

### Contrast (WCAG 2.2 AA)

Method: relative luminance by hand (sRGB formula), ratios rounded down. I had no shell in
this session, so these were **not run through** `knowledge/.../check-contrast.mjs`;
Hollis should add the `--si-*` pairs to it and run it before sign-off. "Worst glass" =
card fill composited over pure black (light) or pure white (dark), the busiest possible
backdrop. Text minimum 4.5:1, UI components and focus indicators 3:1.

| Pair | Light | Dark | Min |
|---|---|---|---|
| `--si-text` on `--si-card-solid` | 17.2 | 14+ | 4.5 |
| `--si-text` on worst glass | 12.0 | 8.8 | 4.5 |
| `--si-text-2` on `--si-card-solid` | 8.5 | 9+ | 4.5 |
| `--si-text-2` on worst glass | 6.1 | 5.5 | 4.5 |
| `--si-link` (Sign out) on chip bg | 6.3 | 6+ | 4.5 |
| `--notice-text` on `--notice-bg` | 9.4 | 9.4 | 4.5 |
| `--error-text` on `--error-bg` | 7.1 | 9.1 | 4.5 |
| `--on-accent` on `--accent` (if a filled button is used) | 6.3 | 8.1 | 4.5 |
| `--gbtn-text` on `--gbtn-fill` | 16 | 14 | 4.5 |
| `--gbtn-border` on card (1.4.11) | 4.6 | 4.6 | 3 |
| `--focus-ring` on `--bg` / card / worst glass | 5.7 / 6.3 / 4.6 | 8.6 / 5+ / 4.4 | 3 |

Dark `--si-text-2` was `#b9c6d1` in the shared tokens; on the 0.80 fill over white it was
about 4.52:1, too tight, so the sign-in tokens use `#c3cfd9` and an 0.86 fill. The shared
`--text-secondary` is not changed by this spec.
Notice/error borders (decorative beside the icon and word) are not relied on for
meaning, so they have no 3:1 requirement, but both are at least 3:1 on their tint.

## 5. Focus rings

Visible on every control (2.4.7), never obscured by the sticky chip (2.4.11), at least
3:1 against both the control and what surrounds it. Two layers so it holds on glass, solid
and dark alike: a 2 px solid ring plus a 2 px halo in the opposite tone.

```css
:where(a, button, input, [tabindex]):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--focus-halo);   /* halo sits outside the outline */
  border-radius: inherit;
}
:where(a, button):focus:not(:focus-visible) { outline: none; }
@media (forced-colors: active) { :focus-visible { outline: 2px solid Highlight; box-shadow: none; } }
```

The Google button gets the same ring outside its 1 px border; the ring is never drawn
inside the button, so the branded fill and border stay untouched. Initial focus on page
load goes to the Google button only if Wren's flow says so (screen readers read the title first).

## 6. Motion

Short, physical, purposeful, all at most 250 ms (HIG-aligned, per our liquid-glass skill).

| Moment | Effect | Time / easing |
|---|---|---|
| Card appears | opacity 0 to 1, translateY 8 px to 0 | `--motion-enter` 220 ms, `--ease-out` |
| Alert appears or swaps | opacity 0 to 1 only (no movement) | 180 ms |
| Button press | the state-layer overlay changes; no scale | `--motion-fast` 120 ms |
| Signed in: sign-in card to chip | cross-fade 160 ms, no travel | 160 ms |
| Loading (redirecting) | static label "[Opening Google…]"; no spinner | none |

```css
.signin-card  { animation: si-enter var(--motion-enter) var(--ease-out) both; }
.alert        { animation: si-fade 180ms ease-out both; }
@keyframes si-enter { from { opacity: 0; transform: translateY(8px); } }
@keyframes si-fade  { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .signin-card, .alert { animation: none; }
  :root { --motion-enter: 0ms; --motion-fast: 0ms; }
  * { scroll-behavior: auto !important; transition: none !important; }
}
```

Under reduced motion the card and alerts simply appear: no movement, no fade. State
changes (hover, press, disabled) are instant colour changes, which still read as feedback.

## 7. Acceptance checklist for sign-off

- Card is solid (opaque, no blur) with `prefers-reduced-transparency: reduce`, with
  `prefers-contrast: more`, and with `backdrop-filter` unsupported; screenshot all three.
- Google button: no `backdrop-filter`, `box-shadow` or tint; logo is the official unmodified
  SVG served from `'self'`; label text exactly Google's; section 2 values confirmed against
  the official page.
- Chip, both alerts and the button each verified in light and dark at 320 px and 200% text.
- Every state carries icon + word; no state depends on colour alone.
- Contrast table re-run in Chromium (4 modes) and all pairs pass.
- Zero inline `style=""` or scripts; images local; works with the CSP.

## 8. For Wren / orchestrator

- Needs Wren: strings in `[brackets]` (account line, loading label, retry labels, not-allowed body).
- Disagreement risk: Wren may want the error alert red. It is allowed, but it must keep the
  circle-exclamation icon plus the word "Error" and stay away from risk badges.
- Open: if Google requires Roboto, should we ship a local Roboto Medium subset (Kai/Quinn: CSP `font-src 'self'`)?
