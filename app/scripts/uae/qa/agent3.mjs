// Agent 3 — Sentiment Universe: hover tooltips, click-through to real source URLs (HTTP status), time playback, filters, pulse metrics
import { harness, withBrowser, ctx, go, VPS, APP, sleep } from "./lib.mjs";
import fs from "node:fs";
const H = harness("agent3-sentiment");
const REC = JSON.parse(fs.readFileSync(`${APP}/src/data/uae_cc_v1/sentiment.json`, "utf8")).records;
await withBrowser(async (b) => {
  for (const vp of VPS) {
    const c = await ctx(b, vp); const page = await c.newPage();
    await go(page, "/sentiment"); await page.waitForSelector('[data-testid="bubble"]', { timeout: 30000 });
    const nb = await page.locator('[data-testid="bubble"]').count(); const vc = await page.locator('[data-testid="visible-count"]').textContent();
    await H.record("bubbles-render", vp, nb === REC.length, `${nb} bubbles, counter "${vc}" (dataset ${REC.length})`, page);
    // hover tooltip
    const bub = page.locator('[data-testid="bubble"]').nth(5); await bub.scrollIntoViewIfNeeded(); await bub.hover({ force: true }); await sleep(400);
    const tip = await page.locator('[data-testid="hover-evidence"]').textContent().catch(() => "");
    await H.record("hover-tooltip", vp, tip.length > 30, `tooltip: ${tip.slice(0, 160)}`, page);
    // click-through: pin a bubble that has a verified URL, read the source link
    const target = REC.findIndex((r) => r.url && r.url_verified);
    await page.locator('[data-testid="bubble"]').nth(target).click({ force: true }); await sleep(300);
    const href = await page.locator('[data-testid="evidence-source"]').getAttribute("href").catch(() => null);
    await page.locator('[data-testid="evidence-panel"]').scrollIntoViewIfNeeded().catch(() => {});
    await H.record("click-through-link", vp, !!href && href === REC[target].url, `evidence-source href=${href}`, page);
    // filters
    await go(page, "/sentiment"); await page.waitForSelector('[data-testid="bubble"]');
    await page.locator('[data-testid="class-filter"]', { hasText: "Optimists" }).click(); await sleep(300);
    const vOpt = await page.locator('[data-testid="visible-count"]').textContent();
    const expOpt = REC.filter((r) => r.sentiment_class === "Optimists").length;
    await page.locator('[data-testid="class-filter"]', { hasText: "Optimists" }).click();
    await page.check('[data-testid="filter-geo"]'); await sleep(300); const vGeo = await page.locator('[data-testid="visible-count"]').textContent();
    const expGeo = REC.filter((r) => r.location_evidence === "EXPLICIT_UAE").length;
    await page.uncheck('[data-testid="filter-geo"]');
    await page.selectOption('[data-testid="filter-topic"]', "Jobs & skills"); await sleep(300); const vTop = await page.locator('[data-testid="visible-count"]').textContent();
    const expTop = REC.filter((r) => r.topic_cluster === "Jobs & skills").length;
    await H.record("filters", vp, vOpt.startsWith(`${expOpt} /`) && vGeo.startsWith(`${expGeo} /`) && vTop.startsWith(`${expTop} /`), `Optimists "${vOpt}" (exp ${expOpt}); Explicit-UAE "${vGeo}" (exp ${expGeo}); Jobs & skills "${vTop}" (exp ${expTop})`, page);
    await page.selectOption('[data-testid="filter-topic"]', "all");
    // time playback
    await page.click('[data-testid="win-30d"]'); await sleep(200);
    const h0 = await page.locator('[data-testid="playhead"]').textContent();
    await page.click('[data-testid="playback"]'); await sleep(2200);
    const h1 = await page.locator('[data-testid="playhead"]').textContent(); const v1 = await page.locator('[data-testid="visible-count"]').textContent();
    await H.record("time-playback", vp, h0 !== h1, `30d window, playhead ${h0} → ${h1} after 2.2 s, visible ${v1}`, page);
    await page.click('[data-testid="playback"]').catch(() => {});
    // pulse metrics 24h / 7d / 30d + sampling-limitation notice
    await go(page, "/sentiment");
    const pulse = page.locator('[data-testid="pulse-panel"]'); await pulse.scrollIntoViewIfNeeded();
    const pt = await pulse.textContent();
    const has = ["24h", "7d", "30d"].every((w) => pt.includes(w)); const notice = /Not a population survey/i.test(pt);
    await H.record("pulse-metrics-24h-7d-30d", vp, has && notice, `pulse panel contains 24h/7d/30d=${has}, sampling notice=${notice}; text="${pt.slice(0, 220)}"`, page);
    await c.close();
  }
});
// HTTP status of every unique verified source URL (server-side GET, browser UA, 12 s timeout)
const urls = [...new Set(REC.filter((r) => r.url && r.url_verified).map((r) => r.url))];
const res = []; const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
for (let i = 0; i < urls.length; i += 12) {
  await Promise.all(urls.slice(i, i + 12).map(async (u) => { const t0 = Date.now(); try { const r = await fetch(u, { redirect: "follow", headers: { "user-agent": UA, accept: "text/html,*/*" }, signal: AbortSignal.timeout(12000) }); res.push({ u, s: r.status, ms: Date.now() - t0 }); } catch (e) { res.push({ u, s: 0, err: String(e.cause?.code || e.name), ms: Date.now() - t0 }); } }));
}
const by = res.reduce((m, r) => { const k = r.s === 0 ? "network/timeout" : r.s < 300 ? "2xx" : r.s < 400 ? "3xx" : r.s === 403 || r.s === 429 ? "403/429 bot-wall" : r.s === 404 || r.s === 410 ? "404/410" : String(r.s); m[k] = (m[k] || 0) + 1; return m; }, {});
fs.writeFileSync("/tmp/source-url-status.json", JSON.stringify(res, null, 1));
const dead = res.filter((r) => r.s === 404 || r.s === 410);
const vp = { name: "server" };
await H.record("source-urls-http", vp, dead.length / res.length <= 0.1, `${res.length} unique verified URLs: ${JSON.stringify(by)}; dead(404/410)=${dead.length}${dead.length ? " e.g. " + dead.slice(0, 4).map((d) => d.u).join(" ") : ""}`, null);
H.save();
