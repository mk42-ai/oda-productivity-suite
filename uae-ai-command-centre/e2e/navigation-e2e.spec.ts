import { test, expect, primeSettings, captureErrors, noHorizontalOverflow } from "./helpers";
import fs from "node:fs";
import path from "node:path";

const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const HAS_KEY = !!(process.env.ONDEMAND_API_KEY ?? process.env.ON_DEMAND_API_KEY ?? "");
const BADS = ["/no-such-page-xyz", "/companies/nope/definitely-bad", "/api/does-not-exist-xyz"];

test.describe("navigation e2e", () => {
  test.beforeEach(async ({ page }) => { await primeSettings(page); });

  for (const r of [
    { p: "/", name: "root", expectPath: "/overview" },
    { p: "/overview", name: "overview" },
    { p: "/companies", name: "companies" },
    { p: "/social", name: "social" },
    { p: "/signals", name: "signals" },
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
    await nav.getByTestId("nav-companies").click(); await expect(page).toHaveURL(/\/companies/);
    await expect(nav.getByTestId("nav-companies")).toHaveAttribute("aria-current","page");
    await page.screenshot({ path: path.join(PROOF, "nav-click-companies-1440x900.png") });
    await nav.getByTestId("nav-signals").click(); await expect(page).toHaveURL(/\/signals/);
    await expect(page.getByTestId("signals-table")).toBeVisible();
    await page.screenshot({ path: path.join(PROOF, "nav-signals-1440x900.png") });
    await nav.getByTestId("nav-social").click(); await expect(page).toHaveURL(/\/social/);
    await page.screenshot({ path: path.join(PROOF, "nav-social-1440x900.png") });
    await page.goBack(); await expect(page).toHaveURL(/\/signals/);
    await page.goForward(); await expect(page).toHaveURL(/\/social/);
    await page.reload(); await expect(page).toHaveURL(/\/social/);
    expect(errs).toEqual([]);
  });

  test("company link, breadcrumb back, drawer close returns focus/scroll", async ({ page }) => {
    const errs = captureErrors(page);
    await page.goto("/companies");
    await page.waitForLoadState("networkidle").catch(()=>{});
    // drawer
    const trig = page.getByTestId("company-quick-view-trigger").first();
    if (await trig.count()) {
      await trig.scrollIntoViewIfNeeded();
      const y = await page.evaluate(()=>window.scrollY);
      await trig.click();
      const drawer = page.getByTestId("company-quick-view-drawer");
      await expect(drawer).toBeVisible();
      await expect(page.getByTestId("company-quick-view-close")).toBeFocused();
      await page.screenshot({ path: path.join(PROOF, "nav-drawer-open-1440x900.png") });
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(trig).toBeFocused();
      expect(Math.abs((await page.evaluate(()=>window.scrollY))-y)).toBeLessThanOrEqual(50);
      await page.screenshot({ path: path.join(PROOF, "nav-drawer-closed-1440x900.png") });
    }
    // full profile + breadcrumb
    const link = page.locator('a[href^="/company/"]').first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
    await page.screenshot({ path: path.join(PROOF, "nav-company-detail-1440x900.png") });
    await page.getByRole("link",{name:"Overview"}).first().click();
    await expect(page).toHaveURL(/\/overview/);
    // hash anchor
    await page.goto(`${href}#news`);
    await page.waitForTimeout(800);
    const newsVisible = await page.locator("#news").isVisible().catch(()=>false);
    expect(newsVisible).toBe(true);
    await page.screenshot({ path: path.join(PROOF, "nav-company-news-anchor-1440x900.png") });
    expect(errs).toEqual([]);
  });

  test("growth tile interactive (onboarding)", async ({ page }) => {
    await primeSettings(page,{onboarded:false,companies:[]});
    const errs = captureErrors(page);
    await page.goto("/onboarding?skip=1");
    const grid = page.locator('[data-testid="growth-grid"]');
    await expect(grid).toBeVisible();
    const first = page.locator('[data-testid="growth-value"]').first();
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded","true");
    await page.screenshot({ path: path.join(PROOF, "nav-growth-open-1440x900.png") });
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
    await expect(page.locator("body")).toContainText(/Fervo/i,{timeout:90000});
    await page.screenshot({ path: path.join(PROOF, "nav-chat-answer-1440x900.png") });
    expect(errs).toEqual([]);
  });
});

test.describe("mobile navigation", () => {
  test.use({ viewport:{width:390,height:844} });
  test.beforeEach(async ({ page }) => { await primeSettings(page); });
  test("mobile routes + nav scroll + no overflow", async ({ page }) => {
    const errs = captureErrors(page);
    for (const [p,n] of [["/overview","overview"],["/companies","companies"],["/signals","signals"],["/social","social"]] as const) {
      const resp = await page.goto(p);
      expect(resp?.status()).toBe(200);
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: path.join(PROOF, `nav-${n}-390x844.png`) });
    }
    // nav is reachable (horizontal scroll container) and Signals tappable
    const nav = page.getByTestId("primary-nav");
    await expect(nav).toBeVisible();
    await nav.getByTestId("nav-signals").scrollIntoViewIfNeeded();
    await nav.getByTestId("nav-signals").click();
    await expect(page).toHaveURL(/\/signals/);
    await page.screenshot({ path: path.join(PROOF, "nav-mobile-signals-390x844.png") });
    // bad url mobile
    const resp = await page.goto("/no-such-page-xyz");
    expect(resp?.status()).toBe(404);
    await page.screenshot({ path: path.join(PROOF, "nav-notfound-390x844.png") });
    expect(errs).toEqual([]);
  });
});
