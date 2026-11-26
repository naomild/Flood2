# 02 · Making it installable on iPhone and Android (PWA)

Researched 2026-11-26 from MDN's Progressive Web Apps guides and WebKit's blog.

## 1. Installability requirements (MDN)

From MDN, *Making PWAs installable*
(<https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable>):

1. **A web app manifest** linked from every page (`<link rel="manifest" href="/manifest.webmanifest">`)
   that contains:
   - `name` or `short_name`
   - `icons` containing a **192 px and a 512 px** icon
   - `start_url`
   - `display` and/or `display_override`
   - `prefer_related_applications` must be `false` or absent
2. **Secure context:** served over `https` (or `localhost` / `127.0.0.1` for development).
   Netlify gives HTTPS by default.
3. **Service worker:** MDN notes it is "not a requirement for a PWA to be installable",
   but this app needs one anyway for offline use during outages.

On Chromium browsers (Chrome, Edge, Samsung Internet on Android), the browser fires
`beforeinstallprompt` on `window` once the app is installable; keep the event and call
`prompt()` from your own "Install app" button.

## 2. Recommended `manifest.webmanifest`

```json
{
  "name": "Flood & Outage Outlook – South Florida",
  "short_name": "FloodWatch",
  "description": "Flood, power-outage and beach outlook for South Florida cities.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "id": "/",
  "display": "standalone",
  "background_color": "#0b1d2a",
  "theme_color": "#0b1d2a",
  "lang": "en-US",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Add for iOS in `<head>`: `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">`,
`<meta name="theme-color" content="#0b1d2a">`, and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
Do **not** disable zoom (`user-scalable=no`) — it is an accessibility failure.

## 3. iPhone vs Android

| | Android (Chrome/Edge/Samsung) | iPhone / iPad |
|---|---|---|
| How to install | Install prompt via `beforeinstallprompt`, or browser menu → *Install app* | Share menu → **Add to Home Screen**. No `beforeinstallprompt`. iOS 16.4+ allows this from Safari, Chrome, Edge, Firefox and Orion (MDN); iOS ≤16.3 Safari only |
| Our UI | Show an "Install" button when the event fires | Detect iOS + not `navigator.standalone` and show a one-time "Tap Share → Add to Home Screen" hint |
| Push notifications | Supported | iOS/iPadOS **16.4+, only for web apps added to the Home Screen** (WebKit: <https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/>, <https://webkit.org/blog/13966/webkit-features-in-safari-16-4/>) |
| Storage | Generous; can request `navigator.storage.persist()` | Script-writable storage can be evicted after ~7 days without use (WebKit ITP rule, widely reported; e.g. <https://tappwa.com/blog/ios-pwa-limitations-2026>); Cache Storage is smaller |
| Background sync / periodic sync | Partly supported | Not supported |

**Design consequences**

- Always re-fetch on launch; treat cached forecasts as a fallback with a visible
  "Last updated 3 h ago — offline" banner.
- Push alerts ("High flood risk tomorrow in Miami") require a server that sends Web Push
  (VAPID keys in Netlify env vars + a scheduled function). That is a **phase 2** feature;
  on iOS it only works after installation.

## 4. Service worker strategy

| Request | Strategy |
|---|---|
| App shell (HTML, CSS, JS, icons, `cities.json`) | Precache on `install`, versioned cache name (`shell-v{build}`), delete old caches on `activate` |
| Open-Meteo forecast/marine JSON | **Network-first with timeout (~4 s), fall back to cache**; store the response time so the UI can show its age |
| `/api/*` (Agent Console) | **Network only**, never cached (contains private, authenticated data) |

Keep the service worker hand-written (≈80 lines) or use Workbox via a build step; either
is fine. Register it with `navigator.serviceWorker.register('/sw.js')`. Use
`Cache-Control: no-cache` on `sw.js` (Netlify `_headers`) so updates roll out.

## 5. When would we need a native wrapper (Capacitor) instead?

Stay a PWA unless one of these becomes a hard requirement:

| Need | PWA? | Native wrapper (Capacitor) |
|---|---|---|
| Listing in the App Store / Play Store | No (Play Store possible via a Trusted Web Activity) | Yes |
| Reliable background refresh / scheduled local notifications without a server | No | Yes (local notifications, background tasks) |
| Push on iPhone **without** asking users to install from Safari first | No | Yes (APNs) |
| Home-screen / lock-screen widgets ("Flood risk: High") | No | Yes, with native widget code |
| Storage that iOS will not evict | No | Yes |
| Critical alerts that bypass silent mode | No | Native + Apple entitlement |

Capacitor wraps the same web app in a native shell, so the code written now carries over.
The trade-off is App Store review, developer accounts ($99/yr Apple) and native builds.
**Recommendation:** ship the PWA first; reconsider Capacitor only if widgets or
reliable iOS push become the top user request.

## 6. Installability checklist (for the QA agent)

- [ ] Lighthouse / Chrome DevTools → Application → Manifest shows no errors
- [ ] 192 and 512 icons load; maskable icon looks right in the DevTools preview
- [ ] App installs on Android Chrome and launches standalone
- [ ] On iPhone, Add to Home Screen gives the right icon, name and standalone launch
- [ ] Airplane mode: app opens and shows the last forecast with its age
- [ ] New deploy → app picks up the new service worker on next launch
