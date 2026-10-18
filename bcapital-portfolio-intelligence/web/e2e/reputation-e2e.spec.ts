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
      await expect(page.getByTestId("reputation-banner")).toContainText(/run REP-BATCH-001 · [\d,]+ sourced items/);
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

    test("plates self-hosted + mapped, headshots in the ring, card click loads that entity as the chat subject, B Capital identity", async ({ page }) => {
      await page.goto("/reputation");
      await expect(page.getByTestId("reputation-view")).toBeVisible();
      // B Capital shell: brand logo + B Capital nav (Companies, Signals, B Social, News Pulse, Reputation) — and none of the source workbench's identity
      await expect(page.getByTestId("brand-home")).toBeVisible();
      for (const id of ["companies", "signals", "social", "news", "reputation"]) await expect(page.getByTestId("primary-nav").getByTestId(`nav-${id}`)).toHaveCount(1);
      const html = (await page.content()).toLowerCase();
      for (const bad of ["gulf-io-light-workbench", "start investigation", "office of development affairs", "rillion"]) expect(html, bad).not.toContain(bad);
      // the four plates: self-hosted under /public/reputation, each mapped to its surface, each actually served (200 + image)
      expect(await page.getByTestId("reputation-hero").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("/reputation/plate-hero-Fkray2Nt1A.jpg");
      expect(await page.locator('[data-entity="b-capital"] [data-testid="entity-plate"]').getAttribute("data-plate")).toBe("/reputation/plate-firm-3Ha2Gnbdlt.jpg");
      for (const id of ENTITIES.slice(1)) expect(await page.locator(`[data-entity="${id}"] [data-testid="entity-plate"]`).getAttribute("data-plate")).toBe("/reputation/plate-leadership-kmAXRIzvSH.jpg");
      expect(await page.getByTestId("matrix-panel").getAttribute("data-plate")).toBe("/reputation/plate-matrix-gNQTYRN0OI.jpg");
      for (const u of ["/reputation/plate-hero-Fkray2Nt1A.jpg", "/reputation/plate-firm-3Ha2Gnbdlt.jpg", "/reputation/plate-leadership-kmAXRIzvSH.jpg", "/reputation/plate-matrix-gNQTYRN0OI.jpg", "/reputation/people/eduardo-saverin.jpg", "/reputation/people/raj-ganguly.jpg", "/reputation/people/karan-mohla.jpg", "/brand/b-capital-logo.svg"]) {
        const r = await page.request.get(u); expect(r.status(), u).toBe(200); expect(r.headers()["content-type"], u).toMatch(/image\//);
      }
      // headshots: self-hosted under /reputation/people, loaded, circular and centred inside the plate's ring
      for (const id of ENTITIES.slice(1)) {
        const img = page.locator(`[data-entity="${id}"] [data-testid="entity-photo"]`);
        expect(await img.getAttribute("src")).toBe(`/reputation/people/${id}.jpg`);
        await expect.poll(async () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
        const g = await img.evaluate((el) => { const p = el.parentElement!.getBoundingClientRect(); const r = el.getBoundingClientRect(); return { cx: (r.left + r.width / 2 - p.left) / p.width, cy: (r.top + r.height / 2 - p.top) / p.height, round: getComputedStyle(el).borderRadius }; });
        expect(Math.abs(g.cx - 0.3122)).toBeLessThan(0.02); expect(Math.abs(g.cy - 0.4517)).toBeLessThan(0.03); expect(g.round).toMatch(/9999px|50%/);
      }
      await expect.poll(async () => page.locator('[data-entity="b-capital"] [data-testid="entity-photo"]').evaluate((el) => (el as HTMLImageElement).naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
      // clicking each card (its plate) loads that entity as the quick-chat subject
      for (const [id, name] of [["eduardo-saverin", "Eduardo Saverin"], ["karan-mohla", "Karan Mohla"], ["b-capital", "B Capital"], ["raj-ganguly", "Raj Ganguly"]] as const) {
        await page.locator(`[data-entity="${id}"] [data-testid="entity-plate"]`).click();
        await expect(page.getByTestId("ask-subject")).toContainText(name);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(PROOF, `reputation-hero-plates-${vp.label}.png`), fullPage: false });
      await page.getByTestId("matrix-panel").scrollIntoViewIfNeeded();
      await page.getByTestId("matrix-panel").screenshot({ path: path.join(PROOF, `reputation-matrix-plate-${vp.label}.png`) });
      await noOverflow(page);
    });

    test("evidence batch: >=3,000 processed, finite scores, 4x4 matrix, virtualized list with entity + category filters", async ({ page }) => {
      await page.goto("/reputation");
      const counts = page.getByTestId("batch-counts");
      await expect(counts).toBeVisible();
      const processed = Number(((await counts.textContent()) ?? "").match(/([\d,]+) processed/)?.[1]?.replace(/,/g, "") ?? 0);
      expect(processed, "processed items").toBeGreaterThanOrEqual(3000);
      await expect(counts).toContainText(" 0 NaN");
      const rows = page.getByTestId("batch-score-row");
      await expect(rows).toHaveCount(4);
      for (const t of await page.locator('[data-testid="score-reputation"], [data-testid="score-prestige"]').allTextContents()) expect(Number.isFinite(parseFloat(t)), `score "${t}"`).toBe(true);
      await expect(page.getByTestId("batch-matrix-cell")).toHaveCount(16);
      // virtualized: total ≥ 3,000 but only a window of rows in the DOM
      const total = page.getByTestId("evidence-total");
      await expect.poll(async () => Number(((await total.textContent()) ?? "0").replace(/[^\d]/g, "")), { timeout: 20_000 }).toBeGreaterThanOrEqual(3000);
      await expect(page.getByTestId("evidence-row").first()).toBeVisible({ timeout: 20_000 });
      expect(await page.locator('[data-testid="evidence-row"], [data-testid="evidence-row-loading"]').count()).toBeLessThan(80);
      // entity filter with counts → list narrows to that subject
      const mohla = page.locator('[data-testid="entity-filter"][data-value="karan-mohla"]');
      const mohlaN = Number(((await mohla.textContent()) ?? "").replace(/[^\d]/g, ""));
      expect(mohlaN).toBeGreaterThan(10);
      await mohla.click();
      await expect.poll(async () => Number(((await total.textContent()) ?? "0").replace(/[^\d]/g, "")), { timeout: 15_000 }).toBe(mohlaN);
      await expect(page.getByTestId("evidence-row").first()).toContainText(/Mohla/);
      // category filter with counts (counts follow the entity filter)
      const cat = page.locator('[data-testid="category-filter"]:not([data-value="all"])').first();
      const catN = Number(((await cat.textContent()) ?? "").replace(/[^\d]/g, ""));
      await cat.click();
      await expect.poll(async () => Number(((await total.textContent()) ?? "0").replace(/[^\d]/g, "")), { timeout: 15_000 }).toBe(catN);
      // scrolling deep into the full list fetches later pages on demand
      await page.locator('[data-testid="entity-filter"][data-value="all"]').click();
      await page.locator('[data-testid="category-filter"][data-value="all"]').click();
      await expect.poll(async () => Number(((await total.textContent()) ?? "0").replace(/[^\d]/g, "")), { timeout: 15_000 }).toBeGreaterThanOrEqual(3000);
      await page.getByTestId("evidence-scroll").evaluate((el) => { el.scrollTop = 58 * 2500; });
      await expect.poll(async () => page.locator('[data-testid="evidence-row"]').evaluateAll((els) => Math.max(...els.map((e) => Number(e.getAttribute("data-index"))))), { timeout: 15_000 }).toBeGreaterThan(2000);
      await page.getByTestId("batch-summary").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(PROOF, `reputation-batch-${vp.label}.png`), fullPage: false });
      await page.getByTestId("evidence-explorer").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(PROOF, `reputation-evidence-${vp.label}.png`), fullPage: false });
      // the 12k rows are served by the API route, never inlined in the page HTML
      const html = await (await page.request.get("/reputation")).text();
      expect(html.length).toBeLessThan(2_500_000);
      expect((html.match(/itm-/g) ?? []).length).toBeLessThan(500);
      await noOverflow(page);
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
