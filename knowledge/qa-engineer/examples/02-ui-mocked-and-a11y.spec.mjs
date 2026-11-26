// Example 2 — UI test with a mocked weather API + an axe accessibility scan.
// Service workers are BLOCKED here: "browserContext.route() will not intercept requests intercepted
// by Service Worker … We recommend disabling Service Workers when using request interception"
// (https://playwright.dev/docs/api/class-browsercontext). Offline/SW behaviour is tested in example 3.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ serviceWorkers: "block" });

test("shows the mocked forecast for today", async ({ page }) => {
  await page.route("**/mock-open-meteo/forecast.json", (route) => route.fulfill({
    json: { daily: { time: ["2026-12-01", "2026-12-02"], precipitation_sum: [0, 2.4], precipitation_probability_max: [5, 85] } },
  }));
  await page.goto("/");
  await expect(page.locator("#today")).toHaveText("2.4 in of rain expected (85% chance)");
  await expect(page.getByRole("status")).toHaveText(/^Updated /);
});

test("explains a failed load without blame", async ({ page }) => {
  await page.route("**/mock-open-meteo/forecast.json", (route) => route.abort("internetdisconnected"));
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Unable to load the forecast. Connect to the internet and try again.");
});

test("has no automatically detectable WCAG 2.2 A/AA violations", async ({ page }) => {
  await page.route("**/mock-open-meteo/forecast.json", (route) => route.fulfill({
    json: { daily: { time: ["a", "b"], precipitation_sum: [0, 1], precipitation_probability_max: [0, 50] } } }));
  await page.goto("/");
  await expect(page.locator("#today")).not.toHaveText("—");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);   // automated checks can't find everything — keep the manual list
});
