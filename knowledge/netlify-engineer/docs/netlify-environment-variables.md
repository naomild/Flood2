# Netlify environment variables (and functions)

Sources (read 2026-11-26):
- *Environment variables overview* — <https://docs.netlify.com/build/environment-variables/overview/>
- *Environment variables and serverless functions* — <https://docs.netlify.com/build/functions/environment-variables/>
- *Enhanced security with Secrets Controller* — <https://docs.netlify.com/build/environment-variables/secrets-controller/>

## Reading in a function (official example)
```ts
export default async (req: Request, context: Context) => {
  const value = process.env.MY_IMPORTANT_VARIABLE;
  return Response.json({ message: `Value of MY_IMPORTANT_VARIABLE is ${value}.` });
};
```
Use **`process.env.NAME`** — that is what the official functions page shows.

## Scopes
"By default, environment variables apply to all scopes." Scopes: **Builds**, **Functions**
("securely provide sensitive values for your functions … such as API keys and tokens"),
**Runtime** (forms, signed proxy redirects), **Post processing** (snippet injection).
**"On the Pro plan and above, you can set specific scopes for your environment variables."**

> ⚠ Flood is on the Free plan (D4): we **cannot** restrict secrets to the Functions scope;
> they are also visible to the build. Mitigation: the build runs no third-party build plugins,
> never prints env vars, and nothing in `public/` is generated from env vars.

## Deploy contexts
One value for all contexts by default, or per context: Production, Deploy Previews, Branch
deploys, Preview server, Local development, plus per-branch values (`release/*` wildcards).
"`Local development` environment variables cannot be marked as secret".

## Limits and gotchas
- "Keys can contain up to 255 characters, and values can contain up to 5,000 characters."
  Function values must also fit AWS Lambda environment limits.
- **"Environment variables declared in a Netlify configuration file (`netlify.toml`) are not
  available to serverless functions."** → set secrets in the UI or CLI only.
- Read-only runtime variables in functions: `URL`, `SITE_NAME`, `SITE_ID` (+ AWS reserved).
- Mark secrets **Contains secret values** (Secrets Controller) where the plan allows; check
  availability on Free before relying on it (not verified).
