// Agent 1 — branding, disclaimer, zero previous-tenant residue (DOM, network responses, titles, metadata)
import { harness, withBrowser, ctx, go, VPS, BASE } from "./lib.mjs";
const H = harness("agent1-branding");
const ROUTES = ["/overview", "/watchlist", "/watchlist/tii", "/watchlist/compare?ids=g42,edge,tii", "/sentiment", "/news", "/radar", "/graph", "/chat", "/briefing", "/methodology", "/settings", "/artifacts", "/docs/interactive-ui"];
const BRAND = [/b[\s._-]?capital/i, /\bbcap\b/i, /bcap[._:-]/i, /b_capital/i, /portfolio intelligence/i, /eduardo saverin/i, /raj ganguly/i, /pitchbook/i, /\bB Social\b/];
const PHRASE = "UAE AI Intelligence — Concept Demonstration";
const scan = (t) => BRAND.map((re) => (t.match(re) || [])[0]).filter(Boolean);
await withBrowser(async (b) => {
  for (const vp of VPS) {
    const c = await ctx(b, vp); const page = await c.newPage();
    const netHits = []; let netCount = 0;
    page.on("response", async (r) => { try { const u = r.url(); if (!u.startsWith(BASE)) return; const ct = r.headers()["content-type"] || ""; if (!/text|json|javascript|css|xml|manifest/.test(ct)) return; const t = await r.text(); netCount++; const h = scan(t); if (h.length) netHits.push(`${u.replace(BASE, "")}: ${h.join(",")}`); } catch {} });
    const routeFails = []; const titleHits = []; const metaHits = []; const domHits = []; let phraseMissing = []; let disclaimerMissing = [];
    for (const r of ROUTES) {
      const res = await go(page, r);
      if (!res || res.status() >= 400) routeFails.push(`${r}:${res?.status()}`);
      const info = await page.evaluate(() => ({ title: document.title, metas: [...document.querySelectorAll("meta")].map((m) => `${m.getAttribute("name") || m.getAttribute("property") || ""}=${m.getAttribute("content") || ""}`).join("\n"), text: document.body.innerText, html: document.documentElement.outerHTML, bar: document.querySelector('[data-testid="disclaimer-bar"]')?.textContent || "" }));
      if (scan(info.title).length) titleHits.push(`${r}: ${info.title}`);
      if (scan(info.metas).length) metaHits.push(`${r}: ${scan(info.metas)}`);
      const d = scan(info.html); if (d.length) domHits.push(`${r}: ${d}`);
      if (!info.text.includes(PHRASE)) phraseMissing.push(r);
      if (!/Concept Demonstration/.test(info.bar) || !/not an official government system/i.test(info.text)) disclaimerMissing.push(r);
    }
    await go(page, "/overview");
    await H.record("routes-load", vp, routeFails.length === 0, routeFails.length ? routeFails.join(" ") : `${ROUTES.length} routes HTTP <400`, page);
    await H.record("disclaimer-phrase", vp, phraseMissing.length === 0 && disclaimerMissing.length === 0, phraseMissing.length || disclaimerMissing.length ? `"${PHRASE}" missing on ${phraseMissing.join(",") || "-"}; concept disclaimer missing on ${disclaimerMissing.join(",") || "-"}` : `"${PHRASE}" + "not an official government system" on all ${ROUTES.length} routes`, page);
    await H.record("residue-dom", vp, domHits.length === 0, domHits.length ? domHits.join(" | ") : `0 hits across ${ROUTES.length} rendered DOMs`, null);
    await H.record("residue-titles-meta", vp, titleHits.length + metaHits.length === 0, titleHits.concat(metaHits).join(" | ") || `0 hits in <title> and <meta> (${ROUTES.length} routes)`, null);
    await H.record("residue-network", vp, netHits.length === 0, netHits.length ? netHits.slice(0, 8).join(" | ") : `0 hits in ${netCount} same-origin text responses`, null);
    await c.close();
  }
  // metadata endpoints
  const vp = VPS[0]; const c = await ctx(b, vp); const page = await c.newPage();
  const extras = ["/manifest.webmanifest", "/api/uae/orgs", "/health", "/api/uae/live", "/robots.txt"]; const hits = [];
  for (const e of extras) { const r = await page.request.get(BASE + e); const t = await r.text(); const h = scan(t); if (h.length) hits.push(`${e}: ${h}`); }
  await go(page, "/methodology");
  await H.record("residue-metadata-endpoints", vp, hits.length === 0, hits.join(" | ") || `0 hits in ${extras.join(", ")}`, page);
  await c.close();
});
H.save();
