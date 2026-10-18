// Polish run 2 checks: 404 / empty / error illustrations, OG + twitter images, favicon, ⌘K palette, unique titles.
// Uses the plain @playwright/test `test` (not the helpers fixture) so the error-boundary test can opt out of the
// console-error assertion. Runs under the "desktop" project; each test is repeated at 1440x900 and 390x844.
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { primeSettings } from "./helpers";

const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });

const NOISE = /favicon|Failed to load resource|net::ERR_ABORTED|status of 404|\[route-error\]|\[global-error\]/i;
const TITLE_SUFFIX = "· B Capital Portfolio Intelligence";

function collectErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (!NOISE.test(t)) errs.push("console: " + t.slice(0, 300));
  });
  page.on("pageerror", (e) => {
    const t = e.message;
    if (!NOISE.test(t)) errs.push("pageerror: " + t.slice(0, 300));
  });
  return errs;
}

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function expectNoOverflow(page: Page) {
  expect(await overflow(page), "horizontal overflow").toBeLessThanOrEqual(0);
}

function pngSize(buf: Buffer): { w: number; h: number } {
  // PNG signature (8) + IHDR length (4) + "IHDR" (4) → width @16, height @20 (big-endian uint32).
  expect(buf.length).toBeGreaterThan(24);
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const shot = (page: Page, name: string, vp: string) =>
  page.screenshot({ path: path.join(PROOF, `run2-${name}-${vp}.png`) });

for (const vp of [
  { w: 1440, h: 900, l: "1440x900" },
  { w: 390, h: 844, l: "390x844" },
] as const) {
  test.describe(`polish run2 ${vp.l}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });
    test.beforeEach(async ({ page }) => {
      test.setTimeout(180_000);
      await primeSettings(page);
    });

    test("404 renders illustration", async ({ page }) => {
      const errs = collectErrors(page);
      const resp = await page.goto("/no-such-page-xyz");
      expect(resp?.status()).toBe(404);
      await expect(page.getByTestId("not-found")).toBeVisible();
      const img = page.getByTestId("not-found-illustration");
      await expect(img).toBeVisible();
      await expect
        .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth ?? 0), { timeout: 15_000 })
        .toBeGreaterThan(0);
      await expect(page.getByRole("link", { name: "Back to portfolio" }).first()).toHaveAttribute("href", "/overview");
      await expectNoOverflow(page);
      await shot(page, "404", vp.l);
      expect(errs).toEqual([]);
    });

    test("empty state renders", async ({ page }) => {
      const errs = collectErrors(page);
      await page.goto("/companies?q=zzzzqqqxx-nomatch");
      const empty = page.getByTestId("companies-empty-state");
      await expect(empty).toBeVisible({ timeout: 15_000 });
      await expect(empty.getByTestId("empty-state-illustration")).toBeVisible();
      await expectNoOverflow(page);
      await shot(page, "empty-state", vp.l);
      await page.getByRole("button", { name: "Reset all filters" }).first().click();
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Filters reset" }).first()).toBeVisible();
      await expectNoOverflow(page);
      expect(errs).toEqual([]);
    });

    test("error boundary renders", async ({ page }) => {
      // Forced error is expected here — console/page errors are intentionally NOT asserted.
      await page.route("**/_next/static/chunks/app/companies/page-*.js", (r) =>
        r.fulfill({ status: 200, contentType: "application/javascript", body: "throw new Error('forced-boundary-test')" }),
      );
      const boundary = page.getByTestId("route-error").or(page.getByTestId("global-error"));

      await page.goto("/overview");
      await page.waitForLoadState("networkidle").catch(() => {});
      const navLink = page.locator('[data-testid="primary-nav"] [data-testid="nav-companies"]').first();
      await navLink.scrollIntoViewIfNeeded().catch(() => {});
      await navLink.click();

      let shown = await boundary.first().waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false);
      if (!shown) {
        await page.goto("/companies");
        shown = await boundary.first().waitFor({ state: "visible", timeout: 20_000 }).then(() => true, () => false);
      }
      if (!shown) {
        throw new Error(
          "Error boundary (route-error/global-error) never appeared: chunk interception via client nav and direct /companies load both failed to trigger it.",
        );
      }

      await expect(page.getByTestId("error-illustration").first()).toBeVisible();
      expect(await page.locator("body").innerText()).not.toContain("forced-boundary-test");
      await expectNoOverflow(page);
      await shot(page, "error-state", vp.l);

      const retry = page.getByTestId("route-error-retry").first();
      if (await retry.isVisible().catch(() => false)) {
        await retry.click().catch(() => {});
      }
    });

    test("og image", async ({ page }) => {
      const errs = collectErrors(page);
      for (const p of ["/opengraph-image", "/twitter-image"]) {
        const r = await page.request.get(p);
        expect(r.status(), p).toBe(200);
        expect(r.headers()["content-type"] ?? "", p).toContain("image/png");
        const { w, h } = pngSize(await r.body());
        expect({ w, h }, p).toEqual({ w: 1200, h: 630 });
      }
      if (vp.w === 1440) {
        await page.goto("/opengraph-image");
        await shot(page, "og-image", vp.l);
      }
      expect(errs).toEqual([]);
    });

    test("favicon loads", async ({ page }) => {
      const errs = collectErrors(page);
      await page.goto("/overview");
      await page.waitForLoadState("domcontentloaded");
      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]'))
          .map((l) => l.href)
          .filter(Boolean),
      );
      const icons = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')).map((l) => l.href).filter(Boolean),
      );
      expect(icons.length, "at least one link[rel=icon]").toBeGreaterThan(0);
      for (const h of Array.from(new Set(hrefs))) {
        const r = await page.request.get(h);
        expect(r.status(), h).toBe(200);
        expect(r.headers()["content-type"] ?? "", h).toMatch(/image\//);
      }
      await expectNoOverflow(page);
      await shot(page, "favicon", vp.l);
      expect(errs).toEqual([]);
    });

    test("cmd-k opens and navigates", async ({ page }) => {
      const errs = collectErrors(page);
      await page.goto("/overview");
      await page.waitForLoadState("load");
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.keyboard.press("Control+KeyK");
      const cmdk = page.getByTestId("cmdk");
      await expect(cmdk).toBeVisible();
      await expectNoOverflow(page);
      await shot(page, "cmdk-open", vp.l);
      await page.getByTestId("cmdk-input").fill("Karan");
      await expect(page.getByTestId("cmdk-reputation").first()).toBeVisible();
      await expect(page.getByTestId("cmdk-reputation").first()).toHaveText(/Karan Mohla/);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/reputation(\/|#)karan-mohla/, { timeout: 20_000 });

      await page.goto("/overview");
      await page.waitForLoadState("load");
      const hint = page.getByTestId("cmdk-hint").first();
      if (await hint.isVisible().catch(() => false)) {
        await hint.click();
        await expect(cmdk).toBeVisible();
        await page.getByTestId("cmdk-input").fill("Companies");
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/companies/, { timeout: 20_000 });
      }
      await expectNoOverflow(page);
      expect(errs).toEqual([]);
    });

    test("unique titles", async ({ page }) => {
      const routes = [
        "/overview",
        "/companies",
        "/news",
        "/signals",
        "/social",
        "/reputation",
        "/chat?skip=1",
        "/pitchbook",
        "/artifacts",
        "/settings",
        "/docs/interactive-ui",
        "/company/fervo-energy",
        "/compare",
      ];
      const titles: string[] = [];
      for (const r of routes) {
        await page.goto(r, { waitUntil: "load" }); await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        const t = await page.title();
        titles.push(t);
        expect(t.endsWith(TITLE_SUFFIX), `${r} title "${t}"`).toBe(true);
      }
      const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
      expect(new Set(titles).size, `duplicate titles: ${dupes.join(" | ")}`).toBe(titles.length);
      await expectNoOverflow(page);
      await shot(page, "titles", vp.l);
    });
  });
}
