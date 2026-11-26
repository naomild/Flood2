# OWASP — Session Management Cheat Sheet

Source: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html> (read 2026-11-26)

## Cookie attributes (quoted)
- **Secure**: "only send the cookie through an encrypted HTTPS … connection. This session
  protection mechanism is mandatory".
- **HttpOnly**: "not to allow scripts … access [to] the cookies via the DOM document.cookie
  object. This session ID protection is mandatory to prevent session ID stealing through XSS".
- **SameSite**: "Session cookies must explicitly set `SameSite=Strict` (preferred) or
  `SameSite=Lax`." "Treat `SameSite` as defense in depth against CSRF, not as a replacement
  for a CSRF token."
- **Domain/Path**: "the `Domain` attribute should not be set … and the `Path` attribute should
  be set as restrictive as possible".
- **Max-Age/Expires**: "Enforce session expiration on the server and invalidate the session
  when the user logs out; deleting a cookie alone does not invalidate a stolen copy".

## Session IDs and timeouts (quoted)
- "Session identifiers must have at least `64 bits` of entropy" from a CSPRNG.
- "All sessions should implement an idle or inactivity timeout."
- "All sessions should implement an absolute timeout, regardless of session activity."
- "The session ID must be renewed or regenerated … after any privilege level change" —
  especially at login.

## Flood mapping
Stateless signed cookie: payload `{sid: 128-bit random, iat, exp}` + HMAC-SHA256 with
`SESSION_SECRET`. Absolute timeout 12 h (`exp`), idle timeout 2 h (re-issue on use).
`HttpOnly; Secure; SameSite=Strict; Path=/api`. New `sid` at every login. Logout and
"log everyone out" = rotate `SESSION_SECRET` or add the `sid` to a deny-list in Blobs.
CSRF: also require the `X-Requested-With: console` header and check `Origin`.
