# Apple HIG — Typography

Source: Apple Human Interface Guidelines, *Typography* —
<https://developer.apple.com/design/human-interface-guidelines/typography> (read 2026-11-26)

## Legibility (quoted headings)
- **"Use font sizes that most people can read easily."** "If you use a custom font with a
  thin weight, aim for larger than the recommended sizes."
- **"Test legibility in different contexts."**
- **"In general, avoid light font weights."** "prefer Regular, Medium, Semibold, or Bold
  … and avoid Ultralight, Thin, and Light font weights".

## Default and minimum sizes
| Platform | Default | Minimum |
|---|---|---|
| iOS, iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

## iOS Dynamic Type — "Large" (default) sizes
| Style | Weight | Size (pt) | Leading (pt) | Emphasized |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

## Dynamic Type (quoted headings)
- **"Make sure your app's layout adapts to all font sizes."**
- **"Increase the size of meaningful interface icons as font size increases."**
- **"Keep text truncation to a minimum as font size increases."**
- **"Consider adjusting your layout at large font sizes."** — e.g. a stacked layout
  "where text appears above secondary items".
- **"Maintain a consistent information hierarchy regardless of the current font size."**

## System fonts
San Francisco (SF Pro, SF Compact, SF Mono, …) and New York; variable fonts; weights
Ultralight → Black. "Consider using the built-in text styles."
The page has no guidance for the web.

## Flood web mapping (our interpretation)
- Font stack: `system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif`
  (gets SF on Apple devices without shipping a font file).
- 1 pt ≈ 1 CSS px on iPhone, so: body `1.0625rem` (17 px) on a 16 px root, minimum
  `0.6875rem` (11 px). Use `rem` so browser text-size settings scale everything.
- iOS Safari only follows the Dynamic Type setting with
  `font: -apple-system-body` — optional progressive enhancement (verify before use).
