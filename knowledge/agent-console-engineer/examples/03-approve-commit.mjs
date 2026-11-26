// Example 3 — Approve → commit to main through the GitHub contents API (fetch mocked).
// Run: node 03-approve-commit.mjs
// Docs: https://docs.github.com/en/rest/repos/contents (GET for sha; PUT with message, Base64
// content, sha, branch; 409 on conflict). D3: commit straight to main. D5: fine-grained token.
import assert from "node:assert/strict";

const API = "https://api.github.com";
const headers = (token) => ({ Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2026-03-10", "Content-Type": "application/json" });

/**
 * @param {{path:string,new_content:string,summary:string,agent:string,base_sha:string|null,status:string}} proposal
 * @param {{repo:string, token:string, fetchImpl?: typeof fetch, isWritable:(p:string)=>boolean}} o
 */
export async function approveProposal(proposal, { repo, token, fetchImpl = fetch, isWritable }) {
  if (proposal.status !== "pending") return { status: "skipped", reason: `already ${proposal.status}` };
  if (!isWritable(proposal.path)) return { status: "rejected", reason: "path not on the write allow-list" };
  if (Buffer.byteLength(proposal.new_content, "utf8") > 200 * 1024) return { status: "rejected", reason: "file over 200 KB" };

  const url = `${API}/repos/${repo}/contents/${proposal.path.split("/").map(encodeURIComponent).join("/")}`;
  const cur = await fetchImpl(`${url}?ref=main`, { headers: headers(token) });
  const currentSha = cur.status === 404 ? null : (await cur.json()).sha;
  if (cur.status !== 404 && !cur.ok) return { status: "error", reason: `GitHub GET ${cur.status}` };
  if (currentSha !== proposal.base_sha) return { status: "stale", reason: "file changed since the proposal was made" };

  const body = { message: `agent(${proposal.agent}): ${proposal.summary}\n\nApproved-by: console`,
    content: Buffer.from(proposal.new_content, "utf8").toString("base64"), branch: "main",
    ...(currentSha ? { sha: currentSha } : {}) };
  const put = await fetchImpl(url, { method: "PUT", headers: headers(token), body: JSON.stringify(body) });
  if (put.status === 409) return { status: "stale", reason: "GitHub reported a conflict (409)" };
  if (!put.ok) return { status: "error", reason: `GitHub PUT ${put.status}` };       // never blind-retry
  const json = await put.json();
  return { status: "committed", commit: json.commit.sha, url: json.commit.html_url };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const isWritable = (p) => /^(src|public|tests|docs)\//.test(p) && !p.includes("..");
  const calls = [];
  const fakeGitHub = (state) => async (url, init = {}) => {
    calls.push({ url, method: init.method ?? "GET", body: init.body && JSON.parse(init.body), auth: init.headers.Authorization });
    if ((init.method ?? "GET") === "GET") return state.exists
      ? new Response(JSON.stringify({ sha: state.sha, type: "file" }), { status: 200 })
      : new Response("{}", { status: 404 });
    if (state.conflict) return new Response("{}", { status: 409 });
    return new Response(JSON.stringify({ commit: { sha: "3f9c2a1", html_url: "https://github.com/naomild/Flood2/commit/3f9c2a1" } }), { status: 200 });
  };
  const base = { path: "src/scoring/thresholds.js", new_content: "export const RATE = 1;\n", summary: "Tune rain-rate threshold",
    agent: "weather-risk-scientist", base_sha: "abc123", status: "pending" };
  const o = { repo: "naomild/Flood2", token: "github_pat_TEST", isWritable };

  let r = await approveProposal(base, { ...o, fetchImpl: fakeGitHub({ exists: true, sha: "abc123" }) });
  assert.equal(r.status, "committed");
  const put = calls.find((c) => c.method === "PUT");
  assert.equal(put.body.branch, "main");
  assert.equal(put.body.sha, "abc123");
  assert.equal(Buffer.from(put.body.content, "base64").toString(), base.new_content);
  assert.match(put.body.message, /^agent\(weather-risk-scientist\): Tune rain-rate threshold/);

  r = await approveProposal(base, { ...o, fetchImpl: fakeGitHub({ exists: true, sha: "zzz999" }) });
  assert.equal(r.status, "stale");                                   // someone changed the file

  r = await approveProposal({ ...base, path: "docs/new.md", base_sha: null }, { ...o, fetchImpl: fakeGitHub({ exists: false }) });
  assert.equal(r.status, "committed");                               // new file: no sha sent
  assert.equal(calls.at(-1).body.sha, undefined);

  r = await approveProposal(base, { ...o, fetchImpl: fakeGitHub({ exists: true, sha: "abc123", conflict: true }) });
  assert.equal(r.status, "stale");

  r = await approveProposal({ ...base, path: "netlify/functions/approve.mts" }, { ...o, fetchImpl: () => assert.fail("no call") });
  assert.equal(r.status, "rejected");
  r = await approveProposal({ ...base, status: "committed" }, { ...o, fetchImpl: () => assert.fail("no call") });
  assert.equal(r.status, "skipped");                                 // double-click can't commit twice
  console.log("03-approve-commit: all checks passed");
}
