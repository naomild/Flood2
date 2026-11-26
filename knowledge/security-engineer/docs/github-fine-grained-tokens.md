# GitHub fine-grained personal access tokens

Source: GitHub Docs, *Managing your personal access tokens* —
<https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens> (read 2026-11-26)

> "Treat your access tokens like passwords."
> "GitHub recommends that you use fine-grained personal access tokens instead of personal
> access tokens (classic) whenever possible."

## Why fine-grained (quoted)
- "Each token is limited to access resources owned by a single user or organization."
- "Each token can be further limited to only access specific repositories…"
- "Each token is granted specific, fine-grained permissions, which offer more control than
  the scopes granted to personal access tokens (classic)."

## Gaps (quoted list, abridged)
Contributing to public repos where you're not a member; repos where you're an outside
collaborator; multiple organisations at once; Packages; the Checks API; user-owned Projects.
None affect Flood (one personal repo, Contents only).

## Creation steps that matter for Flood (D5)
- **Expiration:** "If not provided, the default is 30 days". GitHub "automatically removes
  personal access tokens that haven't been used in a year" and "highly recommend[s] adding
  an expiration". → Pick 90 days and set a rotation reminder.
- **Resource owner:** the account that owns `naomild/Flood2`.
- **Repository access:** "You should choose the minimal repository access that meets your
  needs." → *Only select repositories* → `Flood2`. Note: "Tokens always include read-only
  access to all public repositories on GitHub."
- **Permissions:** "You should choose the minimal permissions necessary for your needs." →
  Repository permission **Contents: Read and write** only (Metadata: read is required and
  added automatically).

## Storage
Netlify env var `GITHUB_TOKEN`, flagged *Contains secret values*, Functions scope only.
Never logged, returned, committed, or placed in Blobs. Revoke immediately if exposed.
