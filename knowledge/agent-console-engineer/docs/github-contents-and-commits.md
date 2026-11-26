# GitHub REST API — repository contents and commits

Sources (read 2026-11-26):
- *REST API endpoints for repository contents* — <https://docs.github.com/en/rest/repos/contents>
- *REST API endpoints for commits* — <https://docs.github.com/en/rest/commits/commits>

Headers on every call: `Accept: application/vnd.github+json`,
`Authorization: Bearer <GITHUB_TOKEN>`, `X-GitHub-Api-Version: 2026-03-10` (the version the
docs pages use).

## Get repository content — `GET /repos/{owner}/{repo}/contents/{path}`
- `ref`: "The name of the commit/branch/tag. Default: the repository's default branch."
- File response: `type`, `encoding`, `size`, `name`, `path`, `content` (Base64), `sha`, `url`,
  `git_url`, `html_url`, `download_url`.
- Media types: `application/vnd.github.raw+json` (raw bytes), `application/vnd.github.object+json`.
- Size: ≤ 1 MB full support; 1–100 MB only `raw`/`object`; > 100 MB unsupported.
- Status: 200, 302, 304, 403, 404.

## Create or update file contents — `PUT /repos/{owner}/{repo}/contents/{path}`
| Body | Notes (quoted) |
|---|---|
| `message` | Required. "The commit message." |
| `content` | Required. "The new file content, using Base64 encoding." |
| `sha` | "**Required if you are updating a file**. The blob SHA of the file being replaced." |
| `branch` | "Default: the repository's default branch." Flood sends `main` (D3). |
| `committer` / `author` | objects with required `name` and `email` (422 if omitted). Default: the authenticated user. |

Responses: 200 (updated), 201 (created), 404, **409 Conflict**, 422. Body: `content`,
`commit` (with `sha`, `html_url`).
Token permission: fine-grained **"Contents" repository permissions (write)** (+ "Workflows"
write only for workflow files — Flood does not grant it).
"If you use this endpoint and the 'Delete a file' endpoint in parallel, the concurrent requests
will conflict … You must use these endpoints serially instead."

## Commits — `GET /repos/{owner}/{repo}/commits` and `/commits/{ref}`
Used to show "last deployed commit" and to link an approval to its commit. Status codes on the
page: 200, 400, 404, 409, 422, 429 ("heavy server load. Please try again."), 500.

## Flood approve rules
GET current `sha` → compare with proposal's `base_sha` → mismatch = **stale** (no PUT) →
PUT → 409/422 = report, never blind-retry → store `commit.sha` in the audit log.
