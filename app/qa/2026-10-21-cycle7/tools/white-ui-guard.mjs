// QA cycle 7 — Lane F white-UI guard: chromatic scan (computed colour/background/border/fill/stroke outside the grey ramp, #2563EB, #B91C1C),
// Sentiment Universe bubble grayscale + ≥2 distinct fill-opacities, OnDemand / AIREV mention audit per route, after-screenshots at 1440×900.
// Run from app/: node qa/2026-10-21-cycle7/tools/white-ui-guard.mjs <BASE> <outDir>
import { chromium } from "playwright-core";
import fs from "node:fs"; import path from "node:path";
const [BASE, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const ROUTES = ["/overview", "/watchlist", "/news", "/radar", "/graph", "/sentiment", "/chat", "/briefing", "/methodology", "/settings", "/plugins", "/watchlist/airev"];
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem("uaecc.settings.v1", JSON.stringify({ onboarded: true, apikey: "", externalUserId: "INV-001", model: "predefined-deepseek-flash", theme: "light", companies: ["tii", "g42"] })); } catch {} });
const report = { base: BASE, utc: new Date().toISOString(), routes: {} };
for (const r of ROUTES) {
  const res = await page.goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(800);
  const data = await page.evaluate(() => {
    const parse = (c) => { const m = c && c.match(/[\d.]+/g); if (!m || m.length < 3) return null; const a = m.length > 3 ? parseFloat(m[3]) : 1; if (a === 0) return null; return [+m[0], +m[1], +m[2]]; };
    const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    const allowed = new Set(["#2563EB", "#B91C1C"]);
    const chromatic = (rgb) => Math.max(...rgb) - Math.min(...rgb) > 2 && !allowed.has(hex(rgb));
    const hits = new Map();
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
      for (const prop of ["color", "backgroundColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "outlineColor", "fill", "stroke"]) {
        const v = cs[prop]; const rgb = parse(v); if (!rgb || !chromatic(rgb)) continue;
        if (prop === "outlineColor" && cs.outlineStyle === "none") continue;
        if ((prop === "fill" || prop === "stroke") && !(el instanceof SVGElement)) continue;
        if (el.tagName === "IMG" || el.closest("img, picture, video, canvas")) continue;
        const key = `${prop}:${hex(rgb)}:${el.tagName.toLowerCase()}.${String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(" ").slice(0, 2).join(".")}`;
        hits.set(key, (hits.get(key) ?? 0) + 1);
      }
    }
    const text = document.body.innerText || "";
    const count = (rx) => (text.match(rx) || []).length;
    const bubbles = [...document.querySelectorAll('[data-testid="bubble"]')].map((el) => { const cs = getComputedStyle(el); return { fill: cs.fill, fo: cs.fillOpacity }; });
    const grey = (f) => { const m = f.match(/[\d.]+/g); return !m || Math.max(+m[0], +m[1], +m[2]) - Math.min(+m[0], +m[1], +m[2]) <= 2; };
    const bubbleOK = bubbles.length ? bubbles.every((x) => grey(x.fill)) : null; const fo = [...new Set(bubbles.map((x) => x.fo))];
    const ondemandCtx = [...document.querySelectorAll("body *")].filter((el) => el.children.length === 0 && /OnDemand/i.test(el.textContent || "")).map((el) => ({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), testid: el.closest("[data-testid]")?.getAttribute("data-testid") ?? null, text: (el.textContent || "").trim().slice(0, 90) }));
    return { status: null, chromatic: [...hits.entries()].map(([k, n]) => `${k} ×${n}`), ondemand: count(/OnDemand/gi), airev: count(/AIREV/gi), ondemandCtx: ondemandCtx.slice(0, 12), bubbles: bubbles.length, bubbleGrey: bubbleOK, fillOpacities: fo, docScroll: document.documentElement.scrollWidth, inner: innerWidth, h1: document.querySelector("h1")?.textContent?.trim().slice(0, 80) ?? null };
  });
  data.status = res ? res.status() : null;
  report.routes[r] = data;
  const name = r === "/" ? "root" : r.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-");
  await page.screenshot({ path: path.join(OUT, `after-${name}-1440x900.png`), fullPage: false });
  console.log(r, data.status, "chromatic", data.chromatic.length, "ondemand", data.ondemand, "airev", data.airev, "bubbles", data.bubbles, data.bubbleGrey, data.fillOpacities.length, "hscroll", data.docScroll <= data.inner + 1);
}
await b.close(); fs.writeFileSync(path.join(OUT, "white-ui-guard.json"), JSON.stringify(report, null, 1));
