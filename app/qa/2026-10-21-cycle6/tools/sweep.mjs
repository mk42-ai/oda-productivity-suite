// Cycle-6 gate sweep: AA contrast (genuine misses), horizontal scroll, residue (DOM + network) over 13 routes × 2 viewports.
// Run from app/: node qa/2026-10-21-cycle6/tools/sweep.mjs <BASE> <out.json>
import { chromium } from "playwright-core";
import fs from "node:fs";
const [BASE, OUT] = process.argv.slice(2);
const ROUTES = ["/overview", "/watchlist", "/watchlist/tii", "/watchlist/compare?ids=g42,edge,tii", "/sentiment", "/news", "/radar", "/graph", "/chat", "/briefing", "/methodology", "/settings", "/artifacts"];
const VPS = [{ n: "1440x900", w: 1440, h: 900, m: false }, { n: "390x844", w: 390, h: 844, m: true }];
const RX = [/\bnavy\b/i, /\bgold\b/i, /\bemerald\b/i, /b[\s._-]?capital/i, /\bportfolio\b/i];
const VENDORED = /(black\|blue\|dkgray|navy:128|gold:0xffd700|emerald:\{|oklch|colorNames|cssKeywords|WRITER)/i;
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const report = { started: new Date().toISOString(), base: BASE, contrast: { checked: 0, below: 0, genuine: 0, artefacts: 0, worst: [] }, hscroll: { pass: 0, fail: [] }, residue: { dom: 0, network: 0, networkVendored: 0, hits: [] }, routes: [] };
const seenAssets = new Map();
try {
  for (const vp of VPS) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: vp.m, hasTouch: vp.m });
    const page = await ctx.newPage();
    const net = [];
    page.on("response", async (res) => { const u = res.url(); const t = res.headers()["content-type"] || ""; if (/javascript|css/.test(t) && u.includes("/_next/static/")) { if (!seenAssets.has(u)) { try { seenAssets.set(u, await res.text()); } catch { seenAssets.set(u, ""); } } net.push(u); } });
    for (const r of ROUTES) {
      await page.goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(600);
      const res = await page.evaluate(() => {
        const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m || m.length < 3) return null; const a = m.length > 3 ? parseFloat(m[3]) : 1; if (a === 0) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(+m[0]) + 0.7152 * f(+m[1]) + 0.0722 * f(+m[2]); };
        const bgOf = (el) => { let e = el; while (e && e !== document.documentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\)$/.test(c) && c !== "transparent") return c; e = e.parentElement; } return "rgb(255, 255, 255)"; };
        let checked = 0, below = 0, genuine = 0, artefacts = 0; const worst = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n; while ((n = walker.nextNode())) {
          const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; if (!el) continue;
          const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;
          const rect = el.getBoundingClientRect(); if (rect.width === 0 || rect.height === 0) continue;
          if (el.closest("[aria-hidden=true],script,style,noscript,.sr-only")) continue;
          checked++;
          const fg = cs.color, bg = bgOf(el);
          if (/oklab|oklch|color\(/.test(fg + bg)) { artefacts++; continue; }
          const lf = lum(fg), lb = lum(bg); if (lf == null || lb == null) { artefacts++; continue; }
          const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
          const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
          const need = large ? 3 : 4.5;
          if (ratio < need) { below++; const placeholder = el.matches("input,textarea") || cs.opacity && parseFloat(cs.opacity) < 1 && el.closest("[disabled],[aria-disabled=true]"); if (placeholder) { artefacts++; } else { genuine++; worst.push({ text: t.slice(0, 60), fg, bg, ratio: +ratio.toFixed(2), size, sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : "") }); } }
        }
        worst.sort((a, b) => a.ratio - b.ratio);
        const body = document.body.innerText;
        return { checked, below, genuine, artefacts, worst: worst.slice(0, 8), scrollW: document.documentElement.scrollWidth, inner: window.innerWidth, body };
      });
      const domHits = RX.map((rx) => (res.body.match(new RegExp(rx.source, rx.flags + "g")) || []).map((m) => ({ rx: String(rx), m }))).flat();
      const row = { route: r, vp: vp.n, checked: res.checked, below: res.below, genuine: res.genuine, scrollW: res.scrollW, inner: res.inner, domHits: domHits.length, worst: res.worst };
      report.routes.push(row);
      report.contrast.checked += res.checked; report.contrast.below += res.below; report.contrast.genuine += res.genuine; report.contrast.artefacts += res.artefacts; report.contrast.worst.push(...res.worst.map((w) => ({ ...w, route: r, vp: vp.n })));
      if (res.scrollW <= res.inner) report.hscroll.pass++; else report.hscroll.fail.push({ route: r, vp: vp.n, scrollW: res.scrollW, inner: res.inner });
      report.residue.dom += domHits.length; if (domHits.length) report.residue.hits.push({ route: r, vp: vp.n, domHits });
      console.log(new Date().toISOString(), vp.n, r, `checked=${res.checked} genuine=${res.genuine} scroll=${res.scrollW}/${res.inner} dom=${domHits.length}`);
    }
    await ctx.close();
  }
  for (const [u, txt] of seenAssets) { for (const rx of RX) { const g = new RegExp(rx.source, rx.flags + "g"); let m; while ((m = g.exec(txt))) { const ctx = txt.slice(Math.max(0, m.index - 60), m.index + 60); if (VENDORED.test(ctx)) report.residue.networkVendored++; else { report.residue.network++; report.residue.hits.push({ asset: u.replace(BASE, ""), rx: String(rx), ctx }); } } } }
  report.contrast.worst.sort((a, b) => a.ratio - b.ratio); report.contrast.worst = report.contrast.worst.slice(0, 25);
} finally { await b.close().catch(() => {}); }
report.finished = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ contrast: { ...report.contrast, worst: undefined }, hscroll: { pass: report.hscroll.pass, fail: report.hscroll.fail }, residue: { dom: report.residue.dom, network: report.residue.network, vendored: report.residue.networkVendored } }));
