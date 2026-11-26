---
name: web-security-headers
description: "Content Security Policy and other security headers for Flood on Netlify. Use when adding a script, style, external host or header."
user-invocable: false
---
# Web security headers

Set in `netlify.toml` `[[headers]] for = "/*"` (see `docs/03-architecture.md` §3):

- `Content-Security-Policy`: `default-src 'self'; connect-src 'self'
  https://api.open-meteo.com https://marine-api.open-meteo.com; img-src 'self' data:;
  style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self';
  form-action 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=()`
- `/sw.js`: `Cache-Control: no-cache`

Rules: no inline scripts/styles, no `eval`, no third-party scripts or fonts. A new
external host needs security-engineer approval and a CSP change in the same commit.
Links out (NWS, outage map) are plain `<a>` with `rel="noopener"`; they don't need CSP.
