# OWASP — Password Storage Cheat Sheet

Source: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html> (read 2026-11-26)

## Recommended parameters (quoted)
- **Argon2id** (preferred), e.g. "m=19456 (19 MiB), t=2, p=1" or "m=47104 (46 MiB), t=1, p=1".
- **scrypt**: "N=2^17 (128 MiB), r=8 (1024 bytes), p=1" … down to "N=2^13 (8 MiB), r=8, p=10".
  Other rows: N=2^16 p=2; N=2^15 p=3; N=2^14 p=5.
- **bcrypt**: "work factor of 10 or more and with a password limit of 72 bytes."
- **PBKDF2**: "PBKDF2-HMAC-SHA256: 600,000 iterations"; SHA512: 220,000.

## Salt and pepper
- "A unique salt must be added to each password to prevent attackers from using precomputed
  lookup tables like rainbow tables."
- Pepper: "Consider using a pepper to provide additional defense in depth"; it "should not be
  stored along with the generated hash"; "Peppers are secrets and should be stored in 'secrets
  vaults'".

## Flood choice
Node's built-in `crypto.scrypt` (no dependency). Netlify Functions have limited memory, so
use OWASP's **N=2^15, r=8, p=3** row (32 MiB) rather than 128 MiB — still on OWASP's list.
Store `scrypt$N$r$p$saltB64$hashB64` in `CONSOLE_PASSWORD_HASH`; compare with
`crypto.timingSafeEqual`. See `examples/02-password-and-session.mjs`.
