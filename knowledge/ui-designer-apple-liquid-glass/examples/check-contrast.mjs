// Verifies Sable's tokens: WCAG contrast for every text/background pair in light, dark and
// increased-contrast modes, and that glass falls back to an opaque surface when transparency is reduced.
// Run: node check-contrast.mjs   (real Chromium via the preinstalled `playwright`)
// Minimums: Apple HIG Accessibility — 4.5:1 for text up to 17 pt, 3:1 for 18 pt+ or bold
// (same as WCAG 2.2 AA). Glass pairs are checked against the fallback AND the fill over the page
// background (worst realistic case without imagery underneath).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");

const file = new URL("./risk-badge.html", import.meta.url).href;
const PAIRS = [ // [text token, background token, minimum]
  ["--text", "--bg", 4.5], ["--text", "--surface", 4.5], ["--text-secondary", "--surface", 4.5],
  ["--text", "--glass-fallback", 4.5], ["--text-secondary", "--glass-fallback", 4.5],
  ["--on-accent", "--accent", 4.5],
  ["--on-risk", "--risk-low", 4.5], ["--on-risk", "--risk-moderate", 4.5],
  ["--on-risk", "--risk-high", 4.5], ["--on-risk", "--risk-very-high", 4.5],
];

const parse = (c) => { // "rgb(…)" / "rgba(…)" / "rgb(r g b / a)" from getComputedStyle
  const n = c.match(/[\d.]+/g).map(Number);
  return { r: n[0], g: n[1], b: n[2], a: n[3] ?? 1 };
};
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
const lum = ({ r, g, b }) => [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const browser = await chromium.launch();
let failures = 0;
try {
  for (const [scheme, contrast] of [["light", "no-preference"], ["dark", "no-preference"], ["light", "more"], ["dark", "more"]]) {
    const page = await browser.newPage();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setEmulatedMedia", { features: [
      { name: "prefers-color-scheme", value: scheme }, { name: "prefers-contrast", value: contrast }] });
    await page.goto(file);
    const colors = await page.evaluate((names) => {
      const probe = document.createElement("div"); document.body.append(probe);
      const out = {};
      for (const n of names) { probe.style.color = `var(${n})`; out[n] = getComputedStyle(probe).color; }
      return out;
    }, [...new Set(PAIRS.flat().filter((x) => typeof x === "string").concat("--glass-fill"))]);
    const c = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, parse(v)]));
    const rows = PAIRS.map(([fg, bg, min]) => [fg, bg, ratio(c[fg], c[bg]), min]);
    rows.push(["--text", "--glass-fill over --bg", ratio(c["--text"], over(c["--glass-fill"], c["--bg"])), 4.5]);
    console.log(`\n${scheme}${contrast === "more" ? " + increased contrast" : ""}`);
    for (const [fg, bg, r, min] of rows) {
      const ok = r >= min; if (!ok) failures++;
      console.log(`  ${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg}`);
    }
    await page.close();
  }
  // Reduced transparency → opaque glass, no backdrop-filter
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }] });
  await page.goto(file);
  const glass = await page.$eval(".topbar", (el) => ({ bg: getComputedStyle(el).backgroundColor, filter: getComputedStyle(el).backdropFilter }));
  assert.equal(parse(glass.bg).a, 1, "glass must be opaque with reduced transparency");
  assert.equal(glass.filter, "none");
  console.log(`\nreduced transparency: glass background ${glass.bg}, backdrop-filter ${glass.filter} — pass`);
} finally { await browser.close(); }
assert.equal(failures, 0, `${failures} contrast failures`);
console.log("check-contrast: all pairs meet the minimums");
