# Netlify — function env vars, redeploys, and the AI Gateway's auto-injected keys

Sources (read 2026-11-26):
- *Environment variables and serverless functions*: <https://docs.netlify.com/build/functions/environment-variables/>
- *AI Gateway overview*: <https://docs.netlify.com/build/ai-gateway/overview/>
- *Manage dependencies* (NPM_FLAGS): <https://docs.netlify.com/build/configure-builds/manage-dependencies/>

## Function env (quoted)
- "Environment variables declared in a Netlify configuration file (`netlify.toml`) are not available to serverless functions."
- "Each deploy … uses the environment variable values that were set at the time of deployment. To apply updated
  environment variable values, create a new deploy." → After changing `OWNER_EMAILS` (including the empty-list
  kill switch), **trigger a deploy**.
- Read-only vars at function runtime: only "`URL`", "`SITE_NAME`", "`SITE_ID`"; "You can't set or override these values manually."

## AI Gateway (quoted). This matters for spend caps.
- "In credit-based plans, the environment variables necessary to use common AI model providers are automatically set".
- "When a Netlify Function … is initialized, the following environment variables are set …: `ANTHROPIC_API_KEY`
  and `ANTHROPIC_BASE_URL` - unless any of these is already set by you."
- The Gateway "bills your Netlify account by converting the actual token usage in the request into credits".
- "`NETLIFY_AI_GATEWAY_KEY` and `NETLIFY_AI_GATEWAY_URL` environment variables are always injected".
- "To prevent any variables from being automatically set, you can disable AI Features."

**Consequences for Flood:**
1. If the owner's `ANTHROPIC_API_KEY` is missing at runtime (the secret-flag gotcha in `docs/03` §1),
   Netlify silently supplies a Gateway key. Chat then spends **Netlify credits** instead of being capped by
   the Claude Console limit. The function must also build the client with an explicit
   `baseURL: "https://api.anthropic.com"`, so an injected `ANTHROPIC_BASE_URL` can't reroute it.
2. `NETLIFY_AI_GATEWAY_KEY` is a credential that is always in the function env. It is one more reason never
   to log `process.env` or echo it.
3. Recommended: disable Netlify AI Features for the team (the owner does this in the Netlify UI). **Not
   verified** that this works on Free.

## NPM_FLAGS (quoted)
"`NPM_FLAGS`: used to indicate the flags to pass to the npm install command." **Not verified:** that
`--ignore-scripts` via `NPM_FLAGS` is honoured by Netlify's dependency install, and whether it breaks esbuild.
