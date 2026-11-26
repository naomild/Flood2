# Flood CSP, Supabase and Free-plan notes (2026-11-26)

Status: docs.netlify.com and developer.mozilla.org were NOT reachable in this session
(network allow-list), so these are **not verified** against the official pages. Re-read before relying.

- CSP for D6: `script-src 'self'` (supabase-js vendored in `public/vendor/`),
  `connect-src 'self' https://pcmdtscesnxmpuxcizfk.supabase.co https://api.open-meteo.com https://marine-api.open-meteo.com`,
  `frame-ancestors 'none'`, `base-uri 'none'`, `form-action 'self'`, `object-src 'none'`.
- Google OAuth redirect = top-level navigation (`window.location`). `connect-src` covers
  fetch/XHR/WebSocket only; no Google host needed. `form-action` covers form submissions only
  (search summary of MDN; redirect behaviour after form posts differs by browser). `navigate-to`
  is not widely supported. Check MDN *form-action* and *Navigation directive* pages.
  If an avatar from Google is ever shown, `img-src` would need `https://*.googleusercontent.com`.
- Secrets Controller ("Contains secret values", CLI `--secret`): flag cannot be removed; Free-plan
  availability **not verified** (https://docs.netlify.com/build/environment-variables/secrets-controller/).
- HSTS: whether Netlify already adds it on *.netlify.app is **not verified**; we set `max-age=31536000`.
- Rate limits: 2 code-based rules on Free (D4); verified earlier, see netlify-functions-limits-and-api.md.
