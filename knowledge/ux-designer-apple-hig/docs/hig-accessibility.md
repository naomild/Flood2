# Apple HIG — Accessibility

Source: Apple Human Interface Guidelines, *Accessibility* —
<https://developer.apple.com/design/human-interface-guidelines/accessibility> (read 2026-11-26)

> "Accessible user interfaces empower everyone to have a great experience with your app or game."

## Minimum contrast
| Text size | Text weight | Minimum contrast ratio |
|---|---|---|
| Up to 17 pts | All | 4.5:1 |
| 18 pts | All | 3:1 |
| All | Bold | 3:1 |

"If your app doesn't provide this minimum contrast by default, ensure it at least provides
a higher contrast color scheme when the system setting Increase Contrast is turned on."

## Control (hit target) size
| Platform | Default control size | Minimum control size |
|---|---|---|
| iOS, iPadOS | 44x44 pt | 28x28 pt |

## Motion — "Be cautious with fast-moving and blinking animations."
When Reduce Motion is on, reduce "automatic and repetitive animations, including zooming,
scaling, and peripheral motion". Also: tighten springs, track animations to gestures,
avoid animating z-axis depth, "Replacing transitions in x-, y-, and z-axes with fades",
"Avoiding animating into and out of blurs".

## Other quoted headings
- **"Prefer system-defined colors."** (They adapt to Increase Contrast and light/dark.)
- **"Describe your app's interface and content for VoiceOver."**
- **"Convey information with more than color alone."** "…pairings such as red-green and
  blue-orange. Offer visual indicators, like distinct shapes or icons, in addition to color".
- **"Keep actions simple and intuitive."** "Prefer system gestures and behaviors people are
  already familiar with over creating custom gestures".

## Web equivalents for Flood (our mapping)
| Apple setting | CSS / HTML |
|---|---|
| Reduce Motion | `@media (prefers-reduced-motion: reduce)` |
| Reduce Transparency | `@media (prefers-reduced-transparency: reduce)` |
| Increase Contrast | `@media (prefers-contrast: more)` |
| Dark appearance | `@media (prefers-color-scheme: dark)` |
| VoiceOver labels | visible text first; `aria-label` only when there is no visible text |
| 44×44 pt targets | `min-block-size: 44px; min-inline-size: 44px` (WCAG 2.2 floor is 24×24 px) |
