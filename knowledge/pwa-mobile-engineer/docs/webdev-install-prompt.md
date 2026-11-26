# Install prompts — Android (beforeinstallprompt) and iPhone

Sources (read 2026-11-26):
- web.dev, *Learn PWA: Installation prompt* — <https://web.dev/learn/pwa/installation-prompt>
- MDN, *Making PWAs installable* — <https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable>
- WebKit, *Web Push for Web Apps on iOS and iPadOS* — <https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/>

## Chromium (Android Chrome, Edge, Samsung Internet) — web.dev code
```js
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevents the default mini-infobar or install dialog from appearing on mobile
  e.preventDefault();
  // Save the event because you'll need to trigger it later.
  deferredPrompt = e;
  showInAppInstallPromotion();
});

installButton.addEventListener('click', async () => {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  // The deferredPrompt can only be used once.
  deferredPrompt = null;
  if (outcome === 'accepted') console.log('User accepted the install prompt.');
  else if (outcome === 'dismissed') console.log('User dismissed the install prompt');
});
```
Show install instructions only in the browser (web.dev):
```css
#installInstructions { display: none }
@media (display-mode: browser) { #installInstructions { display: block } }
```

## iPhone / iPad
- No `beforeinstallprompt`. People install from the **Share** menu → **Add to Home Screen**;
  from iOS 16.4 this works in Safari, Chrome, Edge, Firefox and Orion (MDN).
- Installed web apps can receive Web Push from iOS/iPadOS 16.4 (WebKit).
- Detect an installed launch with `matchMedia('(display-mode: standalone)').matches`, or the
  non-standard `navigator.standalone === true` on iOS Safari.

## Flood rules
- Never call `prompt()` without a user click on our own button.
- Show the iPhone hint once, after the first forecast has loaded, dismissible; remember the
  dismissal in `localStorage` (wrapped in try/catch).
