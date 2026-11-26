# Apple HIG — Materials and Liquid Glass

Source: Apple Human Interface Guidelines, *Materials* —
<https://developer.apple.com/design/human-interface-guidelines/materials> (read 2026-11-26)

> "A material is a visual effect that creates a sense of depth, layering, and hierarchy
> between foreground and background elements."

## What Liquid Glass is
- "Liquid Glass forms a distinct functional layer for controls and navigation elements —
  like tab bars and sidebars — that floats above the content layer, establishing a clear
  visual hierarchy between functional elements and content."
- Content "scroll[s] and peek[s] through from beneath these elements … while maintaining
  legibility for controls and navigation."

## Two variants
| Variant | Apple's description | Use for |
|---|---|---|
| `regular` | "blurs and adjusts the luminosity of background content to maintain legibility of text and other foreground elements." Most system components use it. | "when background content might create legibility issues, or when components have a significant amount of text, such as alerts, sidebars, or popovers." |
| `clear` | "highly translucent, which is ideal for prioritizing the visibility of the underlying content" | "components that float above media backgrounds — such as photos and videos" |

Dimming with `clear`: "If the underlying content is bright, consider adding a dark
dimming layer of 35% opacity." Not needed if the content is already dark.

## Best practices (Apple's headings, quoted)
- **"Don't use Liquid Glass in the content layer."** Use standard materials for content
  elements such as app backgrounds. Exception: transient controls in content (sliders,
  toggles) take on Liquid Glass while active.
- **"Use Liquid Glass effects sparingly."** "Limit these effects to the most important
  functional elements in your app."
- **"Only use clear Liquid Glass for components that appear over visually rich backgrounds."**
- **"Choose materials and effects based on semantic meaning and recommended usage."** Not
  by the colour they impart — system settings can change appearance.
- **"Help ensure legibility by using vibrant colors on top of materials."**
- **"Consider contrast and visual separation…"**: "Thicker materials, which are more
  opaque, can provide better contrast for text and other elements with fine features."
  "Thinner materials … help people retain their context."

## Standard materials
Blur, vibrancy and blending modes "convey a sense of structure in the content beneath
Liquid Glass". Thicknesses: `ultraThin`, `thin`, `regular`, `thick`.

## How Flood applies this (our interpretation for the web — not Apple text)
- Glass only on the **control layer**: top city bar, bottom tab bar, sheets, the Approve bar.
- Risk cards and day lists are **content layer** → solid/near-solid surfaces, never glass.
- Web approximation of `regular`: `background: rgb(255 255 255 / .62)` +
  `backdrop-filter: blur(20px) saturate(180%)`; thicker (more opaque) when it holds text.
- Fallback to an opaque surface for `prefers-reduced-transparency: reduce` and when
  `backdrop-filter` is unsupported.
