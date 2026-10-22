// Agent 4 — Executive chat: 5 demo questions through the live UI; grounded citations; Verified vs Interpretation split; briefing generation
import { harness, withBrowser, ctx, go, VPS, sleep } from "./lib.mjs";
const H = harness("agent4-chat");
const QS = ["What has TII announced recently?", "Which UAE AI companies are accelerating internationally?", "What is driving negative sentiment about AI employment?", "Compare G42, EDGE and TII's AI research activity.", "Which UAE organizations announced new AI partnerships this month?"];
async function ask(b, vp, q, i) {
  const c = await ctx(b, vp); const page = await c.newPage(); const t0 = Date.now(); let firstEvent = null; let status = null;
  page.on("response", (r) => { if (r.url().endsWith("/api/chat") && r.request().method() === "POST") { status = r.status(); firstEvent = Date.now() - t0; } });
  try {
    await go(page, "/chat"); await page.waitForSelector('[data-testid="composer-input"]', { timeout: 30000 });
    await page.fill('[data-testid="composer-input"]', q); const tSend = Date.now(); await page.click('[data-testid="composer-send"]');
    await page.waitForSelector('[data-testid="answer-block"], [data-testid="chat-error"]', { timeout: 200000 });
    // QA cycle 7 (Lane B) — PROPER AWAIT: the old check counted links/chips 800 ms after `assistant-streaming` disappeared, i.e. before the
    // run had necessarily settled (run-view data-live=false + frozen run-timer) and before the throttled markdown pass had painted the last
    // deltas. Wait for the settled state, then for the DOM to be stable for 1.5 s (no change in link/chip counts between two reads).
    await page.waitForFunction(() => { const rv = [...document.querySelectorAll('[data-testid="run-view"]')].pop(); return rv && rv.getAttribute("data-live") === "false"; }, null, { timeout: 200000 }).catch(() => {});
    const count = async () => ({
      links: await page.locator('[data-testid="answer-markdown"]').last().locator("a[href^='http']").evaluateAll((as) => as.map((a) => a.href)).catch(() => []),
      chips: await page.locator('[data-testid="citation-chip"]').count(),
      rail: await page.locator('[data-testid="sources-rail"] [data-testid="source-link"]').count().catch(() => 0),
    });
    let c = await count(); for (let k = 0; k < 6; k++) { await sleep(1500); const n = await count(); if (n.links.length === c.links.length && n.chips === c.chips && n.rail === c.rail) { c = n; break; } c = n; }
    const err = await page.locator('[data-testid="chat-error"]').count();
    const md = await page.locator('[data-testid="answer-markdown"]').last().innerText().catch(() => "");
    const { links, chips, rail } = c;
    const verified = /verified facts?/i.test(md), interp = /interpretation/i.test(md);
    const total = Date.now() - tSend;
    await page.locator('[data-testid="answer-block"]').last().scrollIntoViewIfNeeded().catch(() => {});
    // Grounding = at least one real outbound citation anywhere the UI renders them (inline link, [n] chip or Sources rail). Coverage state of
    // the pinned web-research plugin is recorded alongside so an upstream-only outcome is classifiable from the result row.
    const coverage = await page.locator('[data-testid="coverage-notice"]').last().getAttribute("data-reason").catch(() => null);
    const cited = links.length + chips + rail;
    const pass = !err && md.length > 200 && verified && interp && cited > 0;
    await H.record(`q${i + 1}`, vp, pass, `"${q}" → HTTP ${status}, ${total} ms, ${md.length} chars, Verified=${verified} Interpretation=${interp}, ${links.length} inline links + ${chips} citation chips + ${rail} rail links${coverage ? `, web-research coverage=${coverage}` : ""}${err ? ", CHAT-ERROR shown" : ""}; sources: ${[...new Set(links.map((u) => { try { return new URL(u).hostname; } catch { return u; } }))].slice(0, 5).join(", ")}`, page);
    return { q, vp: vp.name, status, total, chars: md.length, verified, interp, links, chips, rail, coverage, md };
  } catch (e) { await H.record(`q${i + 1}`, vp, false, `"${q}" → exception ${e.message.slice(0, 200)}`, page); return null; }
  finally { await c.close(); }
}
await withBrowser(async (b) => {
  const all = [];
  for (const vp of VPS) all.push(...(await Promise.all(QS.map((q, i) => ask(b, vp, q, i)))));
  (await import("node:fs")).writeFileSync("/tmp/chat-answers.json", JSON.stringify(all, null, 1));
  // briefing generation through the UI (on-demand) + scheduled briefing panel
  for (const vp of VPS) {
    const c = await ctx(b, vp); const page = await c.newPage(); let st = null;
    page.on("response", (r) => { if (r.url().endsWith("/api/briefing")) st = r.status(); });
    await go(page, "/briefing"); const t0 = Date.now();
    await page.click('[data-testid="briefing-generate"]');
    await page.waitForSelector('[data-testid="briefing-loading"]', { timeout: 5000 }).catch(() => {});
    const sawLoading = await page.locator('[data-testid="briefing-loading"]').count();
    await page.waitForSelector('[data-testid="briefing-output"], [data-testid="briefing-error"]', { timeout: 240000 }).catch(() => {});
    const out = await page.locator('[data-testid="briefing-output"]').innerText().catch(() => "");
    const links = await page.locator('[data-testid="briefing-output"] a[href^="http"]').count();
    await page.locator('[data-testid="briefing-output"]').scrollIntoViewIfNeeded().catch(() => {});
    await H.record("briefing-generate", vp, st === 200 && /Verified/i.test(out) && /Interpretation/i.test(out) && /Concept Demonstration/.test(out) && links > 0, `POST /api/briefing HTTP ${st}, ${Date.now() - t0} ms, loading-state=${sawLoading > 0}, ${out.length} chars, ${links} source links`, page);
    const sch = page.locator('[data-testid="scheduled-briefing"]'); await sch.scrollIntoViewIfNeeded().catch(() => {}); await sleep(500);
    const stx = await sch.innerText().catch(() => "");
    await H.record("briefing-scheduled-panel", vp, /Generated by execution/.test(stx) && stx.length > 400, `scheduled panel: ${stx.slice(0, 180).replace(/\n/g, " ")}`, page);
    await c.close();
  }
});
H.save();
