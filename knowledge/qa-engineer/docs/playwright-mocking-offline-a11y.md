# Playwright — mocking APIs, offline, service workers, accessibility, web server

Sources (read 2026-11-26):
- *Mock APIs* — <https://playwright.dev/docs/mock>
- *BrowserContext* — <https://playwright.dev/docs/api/class-browsercontext>
- *Accessibility testing* — <https://playwright.dev/docs/accessibility-testing>
- *Web server* — <https://playwright.dev/docs/test-webserver>

## Mock an API (official)
```js
test("mocks a fruit and doesn't call api", async ({ page }) => {
  await page.route('*/**/api/v1/fruits', async route => {
    const json = [{ name: 'Strawberry', id: 21 }];
    await route.fulfill({ json });
  });
  await page.goto('https://demo.playwright.dev/api-mocking');
  await expect(page.getByText('Strawberry')).toBeVisible();
});
```
Patch a real response: `const response = await route.fetch(); … route.fulfill({ response, json })`.
Replay from a HAR: `page.routeFromHAR('./hars/fruit.har', { url: '*/**/api/v1/fruits', update: false })`.

## Service workers vs routing (important for Flood)
"`browserContext.route()` will not intercept requests intercepted by Service Worker … We
recommend disabling Service Workers when using request interception by setting
`serviceWorkers` to `'block'`." "Service workers are only supported on Chromium-based browsers."
→ Two kinds of e2e test:
1. **UI tests** with `serviceWorkers: 'block'` + `page.route()` fixtures.
2. **Offline/PWA tests** with the service worker **on**, a local server that serves the app
   *and* fixture JSON (no `route`), then `context.setOffline(true)` and reload.

## Offline
```js
await browserContext.setOffline(true);
```
"Offline emulation only affects requests that go through the browser's regular network stack,
such as page navigations, `fetch()`, `XMLHttpRequest` and WebSockets."

## Accessibility (official)
```js
import AxeBuilder from '@axe-core/playwright';
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .include('#navigation-menu-flyout')
  .exclude('#element-with-known-issue')
  .disableRules(['duplicate-id'])
  .analyze();
expect(results.violations).toEqual([]);
```
"Note that automated testing cannot detect all types of WCAG violations." (Add `wcag22aa`
for WCAG 2.2 rules.)

## Web server (official)
```js
export default defineConfig({
  webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
  use: { baseURL: 'http://localhost:3000' },
});
```
In this repo's cloud container: run with `--trace off`; Chromium is preinstalled — don't run
`playwright install`.
