/**
 * a10 — run-panel accessibility: Working-band contrast and prefers-reduced-motion disabling the spinner. Desktop project only (1440×900).
 * (Three stale disclosure-head tests removed in QA cycle 7 — see the note inside the describe block.)
 *
 *   BASE_URL=https://sb-1gizcktepfgc.vercel.run node node_modules/@playwright/test/cli.js test e2e/run-panel-a11y.spec.ts --project=desktop --workers=1
 */
import { test, expect, type Page } from "@playwright/test";
import { primeSettings } from "./helpers";

/** Any run-view surface that proves a run started (od-chat status accordion, legacy heads for saved turns, run-view itself). */
const RUN_SEL = '[data-testid="run-view"], [data-testid="od-status"], .oiu-summary__head, .oiu-thinking__head, .chat-shell details > summary';

/** Relative luminance (WCAG 2.x) from an "rgb(a)(...)" string. */
function lum(rgb: number[]) {
  const [r, g, b] = rgb.slice(0, 3).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: number[], b: number[]) {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function openChat(page: Page, opts: { reducedMotion?: "reduce" | "no-preference" } = {}) {
  await primeSettings(page);
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: opts.reducedMotion });
  await page.goto("/chat?skip=1", { waitUntil: "domcontentloaded" });
  await page.locator(".chat-shell").first().waitFor({ state: "visible", timeout: 30_000 });
  // Trigger a run so the thinking/outputs/sources heads render (works with or without a key: the
  // skeleton "Thinking" head + working list appear immediately).
  const box = page.locator("textarea, [contenteditable='true']").first();
  if (await box.isVisible().catch(() => false)) {
    await box.fill("Summarise public sentiment on UAE AI");
    await box.press("Enter");
  }
  await page.locator(RUN_SEL).first().waitFor({ state: "attached", timeout: 30_000 }).catch(() => {});
}

test.describe("run-panel a11y (a10)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // QA cycle 7 (Lane C): the three disclosure-head tests (old `HEAD_SEL` selector list) (focus ring on every disclosure head, Tab order to a head, .oiu-think__head contrast)
  // were DELETED as stale — the selector list targeted the legacy ThinkingBlock (.oiu-think__head …) which only mounts for saved turns; live runs
  // render the od-chat StatusAccordion, so the selectors matched nothing and the ring colour they asserted (mint 10,201,133) predates the
  // documented #2563EB focus ring. Live-run focus/contrast is covered by a11y.spec + axe-sweep.spec (/chat) and keyboard-nav.spec.
  test("Working band (mint gradient) text is ≥ 4.5:1 when present", async ({ page }) => {
    await openChat(page);
    const band = page.locator(".oiu-slot--on, .oiu-working").first();
    if (!(await band.isVisible().catch(() => false))) test.skip(true, "no Working… band rendered (no live run)");
    const parts = band.locator(".oiu-working__label, .oiu-working__phase, .oiu-working__tick, span, p");
    const n = await parts.count();
    for (let i = 0; i < Math.min(n, 6); i++) {
      const p = parts.nth(i);
      if (!(await p.isVisible().catch(() => false))) continue;
      const fg = await p.evaluate((el) => getComputedStyle(el).color.match(/[\d.]+/g)!.map(Number));
      const ratio = contrast(fg, [0xe6, 0xfa, 0xf3]);
      expect.soft(ratio, `band part ${i} on #E6FAF3`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("prefers-reduced-motion: .oiu-spin has no animation", async ({ page }) => {
    await openChat(page, { reducedMotion: "reduce" });
    const spin = page.locator(".oiu-spin").first();
    if ((await spin.count()) === 0) {
      // No spinner on screen → inject one to assert the stylesheet rule itself.
      await page.evaluate(() => {
        const s = document.createElement("span");
        s.className = "oiu-spin";
        (document.querySelector(".chat-shell") ?? document.body).appendChild(s);
      });
    }
    const anim = await page.locator(".oiu-spin").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    const chev = page.locator(".oiu-thinking__chev").first();
    if ((await chev.count()) > 0) {
      const dur = await chev.evaluate((el) => getComputedStyle(el).transitionDuration);
      expect.soft(dur.split(",").every((d) => parseFloat(d) <= 0.001), `chevron transition-duration ${dur}`).toBe(true);
    }
  });
});
