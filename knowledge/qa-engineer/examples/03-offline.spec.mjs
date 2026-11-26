// Example 3 — offline behaviour with the REAL service worker (no page.route: the SW must see the
// real responses). Uses browserContext.setOffline (https://playwright.dev/docs/api/class-browsercontext).
import { test, expect } from "@playwright/test";

test("after one online visit, the app opens offline with the last forecast and says so", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();                                         // now controlled by the SW
  await expect(page.getByRole("status")).toHaveText(/^Updated /);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("status")).toHaveText(/^Offline · Updated \d{1,2}:\d{2} [AP]M$/);
  await expect(page.locator("#today")).toHaveText("17.2 in of rain expected (100% chance)");
});

test("a first-ever visit while offline cannot load (documented limitation)", async ({ page, context }) => {
  await context.setOffline(true);
  const response = await page.goto("/").catch(() => null);     // first-ever visit offline: no shell yet
  expect(response).toBeNull();                                  // browser shows its own offline page — documented limitation
});
