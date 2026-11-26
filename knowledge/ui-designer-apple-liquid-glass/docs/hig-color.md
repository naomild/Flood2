# Apple HIG — Color

Source: Apple Human Interface Guidelines, *Color* —
<https://developer.apple.com/design/human-interface-guidelines/color> (read 2026-11-26)

> "Judicious use of color can enhance communication, evoke your brand, provide visual
> continuity, communicate status and feedback, and help people understand information."

## Best practices most relevant to Flood (Apple's headings, quoted)
- **"Avoid using the same color to mean different things."** Use colour consistently,
  "especially when you use it to help communicate information like status".
- **"Make sure all your app's colors work well in light, dark, and increased contrast
  contexts."** "If you define a custom color, make sure to supply light and dark variants,
  and an increased contrast option for each variant." "Even if your app ships in a single
  appearance mode, provide both light and dark colors to support Liquid Glass adaptivity."
- **"Test your app's color scheme under a variety of lighting conditions."** "In bright
  surroundings, colors look darker and more muted. In dark environments, colors appear
  bright and saturated." (Flood users check it outdoors in storms and in dark rooms
  during outages.)
- **"Avoid relying solely on color to differentiate between objects, indicate
  interactivity, or communicate essential information."** "…use text labels or glyph
  shapes to identify objects or states."
- **"Avoid using colors that make it hard to perceive content in your app."** Insufficient
  contrast; colour-blind combinations.
- **"Consider how the colors you use might be perceived in other countries and
  cultures."** "red communicates danger in some cultures, but has positive connotations
  in other cultures."
- **"Avoid hard-coding system color values in your app."** (On the web we can't use
  Apple's dynamic system colours, so we define our own tokens with light/dark/
  high-contrast variants.)
- **"Avoid redefining the semantic meanings of dynamic system colors."** e.g. don't use
  the separator colour as text.
- **"Apply color sparingly to the Liquid Glass material, and to symbols or text on the
  material."** Reserve it "for elements that truly benefit from emphasis, such as status
  indicators or primary actions." To emphasise a primary action "apply color to the
  background rather than to symbols or text". "Refrain from adding color to the
  background of multiple controls."
- **"Avoid using similar colors in control labels if your app has a colorful
  background."**
- **"Be aware of the placement of color in the content layer."** The resting state (top of
  the screen) must keep clear legibility.

## Flood consequences
- One colour = one meaning: risk colours are used **only** for risk levels.
- Every risk token ships light, dark and increased-contrast values
  (`@media (prefers-contrast: more)`).
- Risk is always colour + word + icon shape.
