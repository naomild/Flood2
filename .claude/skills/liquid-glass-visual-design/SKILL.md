---
name: liquid-glass-visual-design
description: "Apple Liquid Glass–style visual design for the web: translucent materials, depth, type, colour tokens, motion, with accessible fallbacks. Use when designing or styling any screen."
user-invocable: false
---
# Liquid Glass visual design (web)

Apple's Liquid Glass is a translucent, layered material that sits above content. On the
web we approximate it; legibility of risk information always wins over effect.

## Materials
- Glass layer: semi-transparent fill + `backdrop-filter: blur() saturate()` + a thin
  light inner border + soft shadow. Use for floating controls (city picker, tab bar,
  sheets), **not** behind dense text.
- Always provide a solid fallback: `@supports not (backdrop-filter: blur(1px))` and
  `@media (prefers-reduced-transparency: reduce)` → opaque surface.
- Body text sits on solid or near-solid surfaces; check contrast on the worst background.

## Tokens (CSS custom properties, light + dark)
Colour: background, surface, glass, text-primary/secondary, separator, accent, and risk
colours `--risk-low/moderate/high/very-high` — each paired with a word and icon, never
colour alone. Type: system stack (`system-ui, -apple-system, "SF Pro Text", …`) with a
clear scale (large title → caption) in `rem`. Radius, spacing (4/8 pt grid), shadow, blur.

## Motion
Short, physical, purposeful (≤ 250 ms). Off under `prefers-reduced-motion`.

## Deliverables
Token file (`public/styles/tokens.css`), component specs (card, risk badge, day row,
city picker, offline banner, chat bubble, diff view), light/dark screenshots. Wren
signs off on flow and wording; you sign off on visuals.
