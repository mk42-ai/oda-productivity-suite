// Agent 2 — watchlist: 50 cards, every dossier opens, search/filter/compare, logo authenticity
import { harness, withBrowser, ctx, go, VPS, BASE, APP } from "./lib.mjs";
import fs from "node:fs";
const H = harness("agent2-watchlist");
const ORGS = JSON.parse(fs.readFileSync(`${APP}/src/data/uae_cc_v1/orgs.json`, "utf8")).organizations;
const LOGOS = JSON.parse(fs.readFileSync(`${APP}/src/data/uae_cc_v1/logos.json`, "utf8"));
await withBrowser(async (b) => {
  for (const vp of VPS) {
    const c = await ctx(b, vp); const page = await c.newPage();
    await go(page, "/watchlist");
    const n = await page.locator('[data-testid="org-card"]').count(); const cnt = await page.locator('[data-testid="watchlist-count"]').textContent();
    await H.record("cards-50", vp, n === 50 && /50 \/ 50/.test(cnt), `org-card=${n}, counter="${cnt}"`, page);
    // logos: every rendered <img data-testid=org-logo> must load and correspond to an 'official' entry; others must be monograms with a title explaining
    const logo = await page.evaluate(() => [...document.querySelectorAll('[data-testid="org-card"]')].map((el) => { const img = el.querySelector('[data-testid="org-logo"]'); const mono = el.querySelector('[data-testid="org-monogram"]'); return { id: el.getAttribute("data-org"), img: img ? { src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0, title: img.getAttribute("title") } : null, mono: mono ? mono.getAttribute("title") : null }; }));
    const bad = logo.filter((l) => (l.img && (!l.img.ok || LOGOS[l.id]?.status !== "official")) || (!l.img && !(l.mono && /monogram/i.test(l.mono))));
    await H.record("logos-authentic-or-marked", vp, bad.length === 0, `${logo.filter((l) => l.img).length} official icons (all loaded, all sourced from official domains in logos.json), ${logo.filter((l) => l.mono).length} marked monograms "(no verified official logo)"; bad=${JSON.stringify(bad).slice(0, 300)}`, null);
    // search
    await page.fill('[data-testid="watchlist-search"]', "Falcon"); await page.waitForTimeout(500);
    const s1 = await page.locator('[data-testid="org-card"]').count(); const ids1 = await page.$$eval('[data-testid="org-card"]', (els) => els.map((e) => e.getAttribute("data-org")));
    await H.record("search", vp, s1 > 0 && s1 < 50 && ids1.includes("tii"), `"Falcon" → ${s1} cards (${ids1.slice(0, 6).join(",")})`, page);
    await page.fill('[data-testid="watchlist-search"]', "zzzz-no-such-org"); await page.waitForTimeout(400);
    const empty = await page.getByText("No organisation matches these filters.").isVisible();
    await H.record("search-empty-state", vp, empty, `empty-state visible=${empty}`, page);
    await page.fill('[data-testid="watchlist-search"]', ""); await page.waitForTimeout(300);
    // filter: government
    await page.click('[data-testid="filter-government"]'); await page.waitForTimeout(400);
    const gov = await page.$$eval('[data-testid="org-card"]', (els) => els.map((e) => e.getAttribute("data-org")));
    const expectGov = ORGS.filter((o) => o.type === "government").map((o) => o.id);
    await H.record("filter-type", vp, gov.length === expectGov.length && gov.every((g) => expectGov.includes(g)), `government filter → ${gov.length} (expected ${expectGov.length})`, page);
    await page.click('[data-testid="filter-government"]'); await page.waitForTimeout(300);
    const back = await page.locator('[data-testid="org-card"]').count();
    // compare
    await go(page, "/watchlist");
    for (const id of ["g42", "edge", "tii"]) { const t = page.locator(`[data-testid="org-card"][data-org="${id}"] [data-testid="compare-toggle"]`); await t.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await page.waitForTimeout(400); const bb = await t.boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(200); } // real pointer click at the button centre (html has scroll-behavior:smooth, which makes Playwright's own scroll-then-click flaky)
    const tray = await page.locator('[data-testid="compare-tray"]').innerText().catch(() => "");
    await page.click('[data-testid="compare-go"]'); await page.waitForURL(/compare\?ids=/, { timeout: 20000 }).catch(() => {});
    await page.waitForSelector('[data-testid="compare-table"]', { timeout: 20000 }).catch(() => {});
    const ct = await page.locator('[data-testid="compare-table"]').textContent().catch(() => "");
    await H.record("compare", vp, /G42/.test(ct) && /EDGE/.test(ct) && /Technology Innovation Institute|TII/.test(ct) && /ids=g42,edge,tii/.test(page.url()), `tray="${tray.replace(/\n/g, " ").slice(0, 80)}" → url=${page.url().replace(BASE, "")} table has G42/EDGE/TII; filter reset → ${back} cards`, page);
    // every dossier opens (HTTP + rendered title); screenshot one at each viewport
    if (vp.name === "1440x900") {
      const fails = []; const t0 = Date.now();
      for (const o of ORGS) { const r = await go(page, `/watchlist/${o.id}`); const t = await page.locator('[data-testid="dossier-title"]').textContent({ timeout: 15000 }).catch(() => ""); if (!r || r.status() !== 200 || !t || !t.includes(o.name.split(" (")[0].slice(0, 12))) fails.push(`${o.id}:${r?.status()}:${t?.slice(0, 30)}`); }
      await go(page, "/watchlist/g42");
      await H.record("dossiers-all-50-open", vp, fails.length === 0, fails.length ? fails.join(" ") : `50/50 dossiers HTTP 200 with matching title (${Math.round((Date.now() - t0) / 1000)} s)`, page);
    } else {
      await go(page, "/watchlist/g42"); const t = await page.locator('[data-testid="dossier-title"]').textContent().catch(() => "");
      const ov = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      await H.record("dossier-mobile", vp, /G42/.test(t) && ov, `title="${t}", no horizontal overflow=${ov}`, page);
    }
    await c.close();
  }
});
H.save();
