---
name: github-contents-api
description: "Reading and committing files with the GitHub REST contents API and a fine-grained token. Use when writing or reviewing the Agent Console approve/commit path."
user-invocable: false
---
# GitHub REST — repository contents

Docs: https://docs.github.com/en/rest/repos/contents

- Read: `GET /repos/{owner}/{repo}/contents/{path}?ref=main` → `content` (Base64), `sha`.
- Write: `PUT /repos/{owner}/{repo}/contents/{path}` with `message`, `content` (Base64),
  `branch: "main"` (D3) and `sha` of the file being replaced (omit for new files).
- Headers: `Accept: application/vnd.github+json`, `Authorization: Bearer $GITHUB_TOKEN`,
  `X-GitHub-Api-Version` (use the version the docs page shows; confirm).
- Writes and deletes must run **serially**; parallel calls conflict.
- Files ≤ 1 MB get full support (our cap is 200 KB).
- One commit per file. Atomic multi-file needs the Git Data API (not built yet).

## Token (D5)
Fine-grained PAT, *Only select repositories* → `naomild/Flood2`, **Contents: Read and
write** only. No Workflows (so `.github/workflows` can't be changed), no Actions,
Secrets or Administration. Expiry set; rotate.

## Approve flow
Re-check allow-list and size → GET current `sha` → if ≠ proposal's `base_sha`, mark
**stale** → PUT → store commit SHA → audit log. Never retry a failed PUT blindly.
