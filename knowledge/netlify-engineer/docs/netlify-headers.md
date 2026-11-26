# Netlify custom headers

Source: *Custom headers* — <https://docs.netlify.com/manage/routing/headers/> (read 2026-11-26)

`netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
```
`_headers` file in the publish directory:
```
/*
  X-Frame-Options: DENY
```
- Wildcards `*` match any characters within a segment; `:placeholders` only at the start of a
  segment; not both in one segment.
- Multi-value: repeat the header in `_headers`, or a multi-line string in TOML.
- **"Custom headers apply only to files Netlify serves from our own backing store."** For a
  URL "handled by a function or edge function … custom headers won't be applied … the function
  should return any required headers instead." → `/api/*` functions set their own
  `Cache-Control: no-store`, `Content-Type`, etc.
- Headers in `_headers`/`netlify.toml` "are global for all builds and cannot be scoped for
  specific branches or deploy contexts".
- Ignored names include `Set-Cookie`, `Content-Length`, `Content-Encoding`, `Location`,
  `Date`, `Server`, `Connection`, `Transfer-Encoding` (Netlify sets them).
