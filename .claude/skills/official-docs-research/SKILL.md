---
name: official-docs-research
description: "Read the current official documentation before building, cite it, and flag anything not verified. Use before writing code or docs that depend on an outside API, platform limit or standard."
user-invocable: false
---
# Official-docs research

1. Find the **official** page (vendor docs, MDN, W3C, NWS/NOAA, GitHub Docs). Blogs and
   forums are leads, not sources.
2. Read the part you need now. Quote exact names, limits and values; don't paraphrase numbers.
3. Record the source as `<title> — <URL> (read YYYY-MM-DD)` in the doc or code comment
   that relies on it.
4. If a page can't be reached or doesn't say, write **"not verified"** and say what must be
   checked. Never fill gaps from memory for limits, prices, model IDs or API fields.
5. Check `docs/decisions.md` first: decisions D1–D6 override anything you read.

Project research lives in `docs/` (index: `docs/README.md`). Update the owning doc when
you learn something new, and add it to "Not verified" there if you couldn't confirm it.
