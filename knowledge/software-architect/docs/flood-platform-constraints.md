# Platform constraints that shape Flood's architecture

Each line is from an official page (all read 2026-11-26). Use this as the architect's checklist.

| Constraint | Source |
|---|---|
| Sync/streaming functions 60 s; streaming response ≤ 20 MB | <https://docs.netlify.com/build/functions/configuration/>, <https://docs.netlify.com/build/functions/api/> |
| Background functions 15 min, return 202, retried after 1 min and 2 min on error; available on Free | <https://docs.netlify.com/build/functions/background-functions/> |
| Free plan: 2 code-based rate-limit rules per project | <https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/> |
| Env-var scopes only on Pro and above; `netlify.toml` vars not visible to functions; read with `process.env` | <https://docs.netlify.com/build/functions/environment-variables/> |
| Custom headers don't apply to function responses | <https://docs.netlify.com/manage/routing/headers/> |
| Blobs: eventual consistency (≤ 60 s) unless `strong`; conditional writes | <https://docs.netlify.com/build/data-and-storage/netlify-blobs/> |
| Open-Meteo: no key, < 10,000 calls/day, non-commercial; models update hourly–6-hourly | <https://open-meteo.com/en/docs> |
| Marine data unreliable near coasts/inland | <https://open-meteo.com/en/docs/marine-weather-api> |
| iOS installs via Share → Add to Home Screen; no `beforeinstallprompt` | <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable> |
| GitHub contents API: one commit per file; writes must be serial; `sha` required to update | <https://docs.github.com/en/rest/repos/contents> |
| Claude Opus 5.5 / Sonnet 5.5 reject forced `tool_choice` | Claude API reference (see agent-console-engineer knowledge) |

Design consequences already taken: browser → Open-Meteo direct (no function cost); chat ≤ 45 s
per turn; long jobs in idempotent background functions; state in Blobs; secrets read only by
functions; owner approval before every commit.
