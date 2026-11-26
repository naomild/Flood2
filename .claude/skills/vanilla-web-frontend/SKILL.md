---
name: vanilla-web-frontend
description: "Front-end conventions for Flood: semantic HTML, modern CSS, ES modules, no framework, small payloads. Use when writing or reviewing anything under public/."
user-invocable: false
---
# Vanilla web front end

- No framework, no build step required. ES modules (`<script type="module">`).
- Semantic HTML first: `<main>`, `<nav>`, `<section>` with headings, `<button>` for
  actions, `<a>` for navigation, real `<label>`s.
- CSS: custom properties for all design tokens (from Sable), mobile-first, `rem` units,
  logical properties, `prefers-color-scheme`, `prefers-reduced-motion`,
  `prefers-reduced-transparency` and `prefers-contrast`.
- No inline `<script>` or `style=""` — the CSP forbids them (`web-security-headers`).
- No `innerHTML` with any data from APIs or agents; use `textContent` / DOM APIs.
- Budget: first load ≲ 100 KB compressed (excl. icons); no third-party scripts.
- Times shown in America/New_York with "Today/Tomorrow" words.
- Every async state has a UI: loading, offline (with data age), error, empty.
