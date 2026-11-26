# Installability and the web app manifest (MDN)

Sources (read 2026-11-26):
- MDN, *Making PWAs installable* — <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable>
- MDN, *Web application manifest* — <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest>

## What the manifest is
"A **web application manifest** … is a JSON text file that provides information about a web
application." Extension `.webmanifest` (or `.json`); MIME type `application/manifest+json`
(or `application/json`). Linked from every page:

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

## Required for installability (Chromium), per MDN *Making PWAs installable*
- `name` or `short_name`
- `icons` including a **192px and a 512px** icon
- `start_url`
- `display` and/or `display_override`
- `prefer_related_applications` `false` or absent
- Served over **https** (or `localhost` / `127.0.0.1` in development)
- A service worker is "not a requirement for a PWA to be installable" (but Flood needs one
  for offline).

## Members (MDN list)
`background_color`, `categories`, `description`, `display`, `display_override`,
`file_handlers`, `icons`, `id`, `launch_handler`, `name`, `note_taking`, `orientation`,
`prefer_related_applications`, `protocol_handlers`, `related_applications`, `scope`,
`scope_extensions`, `screenshots`, `serviceworker`, `share_target`, `short_name`,
`shortcuts`, `start_url`, `theme_color`.

`display` values: `fullscreen`, `standalone`, `minimal-ui`, `browser`.

## iOS / iPadOS
"On iOS 16.3 and earlier, PWAs can only be installed with Safari." "On iOS 16.4 and later,
PWAs can be installed from the Share menu in Safari, Chrome, Edge, Firefox, and Orion."

## MDN example manifest
```json
{
  "short_name": "MDN",
  "name": "MDN Web Docs",
  "icons": [
    { "src": "/favicon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "black",
  "background_color": "white"
}
```
Not stated on the page we read: icon `purpose` values (`maskable`, `monochrome`, `any`) —
see the MDN `icons` member page before relying on them.
