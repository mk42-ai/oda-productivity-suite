import { test as base, expect } from "@playwright/test";
import { primeSettings, captureErrors } from "./helpers";
import * as fs from "node:fs";
import * as path from "node:path";

// QA route matrix. Runs at both viewports via explicit test.use (the "mobile" project only matches *mobile.spec.ts).
const PROOF = path.resolve(__dirname, "..", "proof");
fs.mkdirSync(PROOF, { recursive: true });
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const ROUTES: { path: string; slug: string; onboarded?: boolean; expect404?: boolean }[] = [
  { path: "/overview", slug: "overview" },
  { path: "/watchlist", slug: "watchlist" },
  { path: "/watchlist/tii", slug: "company-tii" },
  { path: "/watchlist/mbzuai", slug: "company-mbzuai" },
  { path: "/news", slug: "news" },
  { path: "/settings", slug: "settings" },
  { path: "/chat", slug: "chat" },
  { path: "/watchlist/does-not-exist", slug: "company-does-not-exist", expect404: true },
];

const MATRIX_FILE = path.join(PROOF, "qa-route-matrix.json");
function appendMatrix(entry: Record<string, unknown>) {
  let arr: Record<string, unknown>[] = [];
  try { arr = JSON.parse(fs.readFileSync(MATRIX_FILE, "utf8")); } catch { /* fresh */ }
  arr = arr.filter((e) => !(e.route === entry.route && e.viewport === entry.viewport && e.reducedMotion === entry.reducedMotion));
  arr.push(entry);
  fs.writeFileSync(MATRIX_FILE, JSON.stringify(arr, null, 2));
}

const test = base;

/** Logos/news thumbs are `loading="lazy"` and sit below the fold: scroll through the document so they actually fetch. */
async function scrollThrough(page: import("@playwright/test").Page, maxMs = 12_000) {
  const t0 = Date.now();
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  });
  // wait until all lazy imgs settled (complete) or timeout
  while (Date.now() - t0 < maxMs) {
    const pending = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLImageElement>("img[loading=lazy]")).filter((i) => !i.complete).length);
    if (pending === 0) break;
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

for (const vp of VIEWPORTS) {
  test.describe(`QA routes @ ${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    const W = vp.width;

    for (const r of ROUTES) {
      test(`${r.path}`, async ({ page }) => {
        test.setTimeout(120_000);
        await primeSettings(page, r.onboarded === false ? { onboarded: false } : {});
        const errors = captureErrors(page);
        const res = await page.goto(r.path, { waitUntil: "domcontentloaded" });
        const status = res?.status() ?? 0;
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(1000);
        const extra: Record<string, unknown> = {};

        if (r.expect404) {
          expect(status, "404 status for unknown organisation").toBe(404);
          const body = (await page.locator("body").innerText()).toLowerCase();
          expect(body, "not-found UI").toMatch(/not found|404|doesn.t exist|no such company/);
          extra.notFoundUi = true;
        }

        if (r.slug === "overview" || r.slug === "news") await scrollThrough(page);
        if (r.slug === "overview") {
          // UAE build: org logos live on /watchlist (6 official-domain icons + 44 marked monograms); /overview carries the live pipeline + pulse panels.
          await expect(page.locator("body")).toContainText(/UAE AI National Intelligence Command Centre/);
          await page.screenshot({ path: path.join(PROOF, `overview-${W}.png`), fullPage: true });
        }
        if (r.slug === "watchlist") {
          await scrollThrough(page);
          const logos = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLImageElement>('img[data-testid="org-logo"]')).map((i) => ({ src: i.currentSrc || i.src, naturalWidth: i.naturalWidth })),
          );
          const ok = logos.filter((l) => l.naturalWidth > 0).length;
          const monograms = await page.locator('[data-testid="org-monogram"]').count();
          extra.orgLogos = { total: logos.length, ok, monograms };
          expect(ok + monograms, "every one of the 50 cards shows an official icon or a marked monogram").toBeGreaterThanOrEqual(50);
          expect(ok, "≥1 official org-logo img rendered (naturalWidth>0)").toBeGreaterThanOrEqual(1);
          await page.screenshot({ path: path.join(PROOF, `watchlist-logos-${W}.png`), fullPage: true });
        }

        if (r.slug === "company-mbzuai" || r.slug === "company-tii") {
          await expect(page.getByTestId("dossier-title")).toBeVisible();
          const hero = page.getByTestId("dossier").locator('[data-testid="org-logo"], [data-testid="org-monogram"]').first();
          await expect(hero, "dossier hero shows an official icon or a marked monogram").toBeAttached();
          const info = await hero.evaluate((el) => ({ kind: el.getAttribute("data-testid"), src: (el as HTMLImageElement).src ?? null, nw: (el as HTMLImageElement).naturalWidth ?? null, title: el.getAttribute("title") }));
          extra.heroLogo = info;
          if (info.kind === "org-logo") expect(info.nw, "hero logo naturalWidth>0").toBeGreaterThan(0);
          else expect(info.title, "monogram is marked as unverified").toMatch(/no verified official logo/);
          if (W === 1440) await page.screenshot({ path: path.join(PROOF, `dossier-${r.slug}-hero.png`), fullPage: false });
        }

        if (r.slug === "news") {
          const imgs = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLImageElement>('img[data-testid="news-image"]')).map((i) => i.naturalWidth),
          );
          extra.newsImages = { total: imgs.length, ok: imgs.filter((n) => n > 0).length, placeholders: await page.locator('[data-testid="news-image-placeholder"]').count() };
          await page.screenshot({ path: path.join(PROOF, `news-logos-${W}.png`), fullPage: true });
        }

        await page.screenshot({ path: path.join(PROOF, `qa-${r.slug}-${W}.png`), fullPage: true });
        // Third-party image hosts (news thumbnails / logos) failing with a cert or CORP error are resource noise, not app errors;
        // they are counted separately so they stay visible in the matrix but do not fail the route.
        const resourceNoise = errors.filter((e) => /Failed to load resource: net::ERR_/.test(e));
        const real = errors.filter((e) => !resourceNoise.includes(e));
        appendMatrix({ route: r.path, viewport: W, reducedMotion: false, status, consoleErrors: real.filter((e) => e.startsWith("console")).length, pageErrors: real.filter((e) => e.startsWith("pageerror")).length, thirdPartyResourceErrors: resourceNoise.length, errors: real.slice(0, 5), ...extra });
        expect(real, "0 console/page errors").toEqual([]);
      });
    }

    test("/watchlist with reduced motion: compare tray toggles", async ({ page }) => {
      // Replaces the removed onboarding GROWTH tile (2515e93): the compare tray is the motion-bearing interaction on the watchlist.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await primeSettings(page);
      const errors = captureErrors(page);
      const res = await page.goto("/watchlist", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      const t = page.getByTestId("compare-toggle").first();
      await expect(t).toBeVisible();
      await t.click();
      await expect(t).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText(/Compare \(1\/4\)/)).toBeVisible();
      await page.screenshot({ path: path.join(PROOF, `compare-tray-reduced-motion-${W}.png`), fullPage: false });
      appendMatrix({ route: "/watchlist", viewport: W, reducedMotion: true, status: res?.status(), consoleErrors: errors.filter((e) => e.startsWith("console")).length, pageErrors: errors.filter((e) => e.startsWith("pageerror")).length, errors: errors.slice(0, 5) });
      expect(errors.filter((e) => !/Failed to load resource: net::ERR_/.test(e)), "0 console/page errors").toEqual([]);
    });
  });
}

test.describe("Logo audit (browser) @ desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("collect every org-logo / monogram on /watchlist (≤60 s)", async ({ page }) => {
    test.setTimeout(120_000);
    await primeSettings(page);
    await page.goto("/watchlist", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    const start = Date.now();
    const all: { src: string; naturalWidth: number; testid: string }[] = [];
    let fallbacks = 0, monograms = 0, pages = 0;
    const collect = async () => {
      await scrollThrough(page);
      const items = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLImageElement>('img[data-testid="org-logo"], img[data-testid="logo-img"]')).map((i) => ({ src: i.currentSrc || i.src, naturalWidth: i.naturalWidth, testid: i.dataset.testid! })),
      );
      all.push(...items);
      fallbacks += await page.locator('[data-testid="company-logo-fallback"]').count();
      monograms += await page.locator('[data-testid="org-monogram"], [data-testid="logo-monogram"]').count();
      pages++;
    };
    await collect();
    const next = page.locator('[data-testid="paged-table"] button[aria-label*="ext" i], [data-testid="paged-table"] button:has-text("Next")').first();
    while ((await next.count()) > 0 && (await next.isEnabled().catch(() => false)) && Date.now() - start < 60_000) {
      await next.click();
      await collect();
    }
    const uniq = new Map(all.map((a) => [a.src, a]));
    const list = Array.from(uniq.values());
    const audit = {
      generatedAt: new Date().toISOString(), route: "/watchlist", pagesVisited: pages,
      total: list.length, ok: list.filter((l) => l.naturalWidth > 0).length, broken: list.filter((l) => l.naturalWidth === 0),
      fallbacks: { companyLogoFallback: fallbacks, logoMonogram: monograms },
      images: list,
    };
    fs.writeFileSync(path.join(PROOF, "logo-audit-browser.json"), JSON.stringify(audit, null, 2));
    expect(audit.ok, "at least one rendered logo").toBeGreaterThanOrEqual(1);
  });
});
