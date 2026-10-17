import { test, expect } from "./helpers";
import fs from "node:fs";
import path from "node:path";

/**
 * Reputation & Prestige e2e (2026-10-17): /reputation renders the four entity cards with REAL photos that load, factor tables with
 * source links, the ported Rilian correlation output, a quick-chat that sends a real POST to the server-side proxy and gets a 200 with a
 * non-empty answer, and a real HTTP 404 for an unknown entity id — at 1440x900 and 390x844 with zero console errors and no horizontal
 * overflow (helpers.ts asserts the error list is empty after every test).
 *
 * Run: BASE_URL=<app> npx playwright test e2e/reputation-e2e.spec.ts --project=desktop   (PROOF_DIR for screenshots, optional)
 */
const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const VIEWPORTS = [{ w: 1440, h: 900, label: "1440x900" }, { w: 390, h: 844, label: "390x844" }];
const ENTITIES = ["b-capital", "eduardo-saverin", "raj-ganguly", "karan-mohla"];

async function noOverflow(page: import("@playwright/test").Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, "no horizontal overflow").toBeLessThanOrEqual(o.cw + 1);
}

for (const vp of VIEWPORTS) {
  test.describe(`reputation ${vp.label}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });

    test("four entity cards with real photos, factor tables with source links, correlation output", async ({ page }) => {
      await page.goto("/reputation");
      await expect(page.getByTestId("reputation-view")).toBeVisible();
      await expect(page.getByTestId("primary-nav").getByTestId("nav-reputation")).toHaveAttribute("aria-current", "page");
      const cards = page.getByTestId("entity-card");
      await expect(cards).toHaveCount(4);
      for (const id of ENTITIES) await expect(page.locator(`[data-testid="entity-card"][data-entity="${id}"]`)).toBeVisible();
      // real <img> elements that actually load (naturalWidth > 0) — never generated faces
      const photos = page.getByTestId("entity-photo");
      await expect(photos).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        const img = photos.nth(i);
        await expect.poll(async () => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0), { timeout: 15_000 }).toBe(true);
        expect(await img.getAttribute("data-source")).toMatch(/^https?:\/\/|web\/public\/brand/);
      }
      // factor tables with source links on every card (expand "Show N factors" on every card first — the default shows 6 rows)
      for (const btn of await page.getByTestId("entity-toggle-factors").all()) await btn.click();
      const tables = page.getByTestId("factor-table");
      await expect(tables).toHaveCount(4);
      const rows = page.getByTestId("factor-row");
      expect(await rows.count()).toBeGreaterThanOrEqual(50);
      const links = page.getByTestId("factor-source");
      expect(await links.count()).toBeGreaterThanOrEqual(50);
      for (const href of await links.evaluateAll((as) => as.slice(0, 40).map((a) => (a as HTMLAnchorElement).href))) expect(href).toMatch(/^https?:\/\//);
      // the "not verified" rows (Forbes Midas List) are labelled, never scored as facts
      expect(await page.locator('[data-testid="factor-row"][data-verified="false"]').count()).toBeGreaterThanOrEqual(3);
      // correlation output rendered: banner with run stats, matrix canvas, centrality table, communities, WHY CONNECTED
      await expect(page.getByTestId("reputation-banner")).toContainText(/run REP-001 · \d+ sourced factors/);
      await expect(page.getByTestId("correlation-output")).toBeVisible();
      await expect(page.locator('[data-testid="correlation-matrix"] canvas')).toBeVisible();
      expect(await page.getByTestId("edge-chip").count()).toBeGreaterThanOrEqual(3);
      await expect(page.getByTestId("why-connected-panel")).toBeVisible();
      await expect(page.getByTestId("entity-scores").first()).toContainText(/degree/);
      await noOverflow(page);
      await page.screenshot({ path: path.join(PROOF, `reputation-page-${vp.label}.png`), fullPage: false });
      for (const id of ENTITIES) {
        const card = page.locator(`[data-testid="entity-card"][data-entity="${id}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.screenshot({ path: path.join(PROOF, `reputation-card-${id}-${vp.label}.png`) });
      }
    });

    test("quick-chat sends a real POST through the server-side proxy and renders a non-empty answer", async ({ page }) => {
      test.skip(!process.env.ONDEMAND_API_KEY && !process.env.ON_DEMAND_API_KEY && !process.env.LIVE_CHAT, "needs a live OnDemand key on the server");
      await page.goto("/reputation");
      await page.locator('[data-testid="entity-card"][data-entity="raj-ganguly"] [data-testid="entity-ask"]').click();
      await expect(page.getByTestId("ask-subject")).toContainText("Raj Ganguly");
      await expect(page.getByTestId("ask-presets").getByTestId("ask-preset").first()).toBeVisible();
      const posted = page.waitForResponse((r) => r.url().includes("/api/reputation/ondemand") && r.request().method() === "POST", { timeout: 60_000 });
      await page.getByTestId("ask-input").fill("In two sentences, what do the cited facts say about Raj Ganguly's board seats and media presence?");
      await page.getByTestId("ask-send").click();
      const resp = await posted;
      expect(resp.status(), "proxy POST returns 200").toBe(200);
      const answer = page.getByTestId("ask-answer-text").last();
      await expect.poll(async () => ((await answer.textContent()) ?? "").trim().length, { timeout: 120_000 }).toBeGreaterThan(20);
      await expect(page.getByTestId("ask-error")).toHaveCount(0);
      await noOverflow(page);
      await page.getByTestId("ondemand-ask-panel").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(PROOF, `reputation-quickchat-${vp.label}.png`), fullPage: false });
    });

    test("unknown entity id is a real HTTP 404; known ids resolve", async ({ page }) => {
      const bad = await page.request.get("/reputation/not-a-real-entity");
      expect(bad.status()).toBe(404);
      const resp = await page.goto("/reputation/not-a-real-entity");
      expect(resp?.status()).toBe(404);
      await expect(page.locator("body")).toContainText(/not found/i);
      const good = await page.request.get("/reputation/karan-mohla", { maxRedirects: 0 });
      expect([200, 307, 308]).toContain(good.status());
      await noOverflow(page);
    });
  });
}
