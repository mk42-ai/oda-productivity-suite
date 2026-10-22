import { test, expect, primeSettings, captureErrors, noHorizontalOverflow } from "./helpers";
import fs from "node:fs";
import path from "node:path";

const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const HAS_KEY = !!(process.env.ONDEMAND_API_KEY ?? process.env.ON_DEMAND_API_KEY ?? "");
const BADS = ["/no-such-page-xyz", "/watchlist/nope/definitely-bad", "/api/does-not-exist-xyz"];

test.describe("navigation e2e", () => {
  test.beforeEach(async ({ page }) => { await primeSettings(page); });

  for (const r of [
    { p: "/", name: "root", expectPath: "/overview" },
    { p: "/overview", name: "overview" },
    { p: "/watchlist", name: "watchlist" },
    { p: "/sentiment", name: "sentiment" },
    { p: "/radar", name: "radar" },
    { p: "/graph", name: "graph" },
    { p: "/docs/interactive-ui", name: "docs-interactive-ui" },
  ]) {
    test(`route ${r.p} renders @desktop`, async ({ page }) => {
      const errs = captureErrors(page);
      const resp = await page.goto(r.p);
      expect(resp?.status()).toBe(200);
      await page.waitForLoadState("networkidle").catch(()=>{});
      await expect(page.locator("body")).not.toBeEmpty();
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: path.join(PROOF, `nav-${r.name}-1440x900.png`), fullPage: false });
      expect(errs).toEqual([]);
    });
  }

  test("bad urls are real 404", async ({ page }) => {
    const errs = captureErrors(page);
    let i=0;
    for (const b of BADS) {
      i++;
      const resp = await page.goto(b);
      expect(resp?.status(), b).toBe(404);
      await page.screenshot({ path: path.join(PROOF, `nav-notfound${i}-1440x900.png`) });
    }
    expect(errs.filter(e=>!/404/.test(e))).toEqual([]);
  });

  test("nav click-through + active + back/forward + refresh", async ({ page }) => {
    const errs = captureErrors(page);
    await page.goto("/overview");
    const nav = page.getByTestId("primary-nav");
    await expect(nav.getByTestId("nav-overview")).toHaveAttribute("aria-current","page");
    await nav.getByTestId("nav-watchlist").click(); await expect(page).toHaveURL(/\/watchlist/);
    await expect(nav.getByTestId("nav-watchlist")).toHaveAttribute("aria-current","page");
    await page.screenshot({ path: path.join(PROOF, "nav-click-watchlist-1440x900.png") });
    await nav.getByTestId("nav-radar").click(); await expect(page).toHaveURL(/\/radar/);
    await expect(page.getByTestId("radar-blip").first()).toBeVisible();
    await page.screenshot({ path: path.join(PROOF, "nav-radar-1440x900.png") });
    await nav.getByTestId("nav-sentiment").click(); await expect(page).toHaveURL(/\/sentiment/);
    await page.screenshot({ path: path.join(PROOF, "nav-sentiment-1440x900.png") });
    await page.goBack(); await expect(page).toHaveURL(/\/radar/);
    await page.goForward(); await expect(page).toHaveURL(/\/sentiment/);
    await page.reload(); await expect(page).toHaveURL(/\/sentiment/);
    expect(errs).toEqual([]);
  });

  test("dossier link, rail back to overview, #dossier-news anchor", async ({ page }) => {
    // The quick-view drawer + GROWTH onboarding tile were removed with the UAE build (2515e93); the watchlist card → dossier journey replaces them.
    const errs = captureErrors(page);
    await page.goto("/watchlist");
    await page.waitForLoadState("networkidle").catch(()=>{});
    const link = page.locator('[data-testid="org-card"] a[href^="/watchlist/"]').first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
    await expect(page.getByTestId("dossier-title")).toBeVisible();
    await page.screenshot({ path: path.join(PROOF, "nav-dossier-detail-1440x900.png") });
    await page.getByTestId("primary-nav").getByTestId("nav-overview").click();
    await expect(page).toHaveURL(/\/overview/);
    // hash anchor
    await page.goto(`${href}#dossier-news`);
    await expect.poll(async () => page.locator("#dossier-news").evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 15_000 }).toBeLessThan(900);
    await page.screenshot({ path: path.join(PROOF, "nav-dossier-news-anchor-1440x900.png") });
    expect(errs).toEqual([]);
  });

  test("chat non-empty 200", async ({ page }) => {
    test.skip(!HAS_KEY, "no key");
    const errs = captureErrors(page);
    let status=0;
    page.on("response", r=>{ if(r.url().includes("/api/chat") && r.request().method()==="POST") status=r.status(); });
    await page.goto("/chat?skip=1");
    const composer = page.getByTestId("composer-input");
    await expect(composer).toBeVisible({timeout:30000});
    await composer.fill("Tell me about Technology Innovation Institute in one line.");
    await page.getByTestId("composer-send").click();
    await expect.poll(()=>status,{timeout:90000}).toBe(200);
    await expect(page.locator("body")).toContainText(/Technology Innovation Institute|TII/,{timeout:90000});
    await page.screenshot({ path: path.join(PROOF, "nav-chat-answer-1440x900.png") });
    expect(errs).toEqual([]);
  });
});

test.describe("mobile navigation", () => {
  test.use({ viewport:{width:390,height:844} });
  test.beforeEach(async ({ page }) => { await primeSettings(page); });
  test("mobile routes + nav scroll + no overflow", async ({ page }) => {
    const errs = captureErrors(page);
    for (const [p,n] of [["/overview","overview"],["/watchlist","watchlist"],["/radar","radar"],["/sentiment","sentiment"]] as const) {
      const resp = await page.goto(p);
      expect(resp?.status()).toBe(200);
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: path.join(PROOF, `nav-${n}-390x844.png`) });
    }
    // nav lives in the 390 px off-canvas drawer; Radar tappable
    await page.getByTestId("rail-drawer-toggle").click();
    const nav = page.getByTestId("rail-drawer").getByTestId("primary-nav");
    await expect(nav).toBeVisible();
    await nav.getByTestId("nav-radar").scrollIntoViewIfNeeded();
    await nav.getByTestId("nav-radar").click();
    await expect(page).toHaveURL(/\/radar/);
    await page.screenshot({ path: path.join(PROOF, "nav-mobile-radar-390x844.png") });
    // bad url mobile
    const resp = await page.goto("/no-such-page-xyz");
    expect(resp?.status()).toBe(404);
    await page.screenshot({ path: path.join(PROOF, "nav-notfound-390x844.png") });
    expect(errs).toEqual([]);
  });
});
