// QA cycle 8 — Lane C layout spec probe: rail 224/64 (persisted), 52 px top bar, 800 px conversation column, 360 px inspector with literal
// Plan/Run role=tab tabs, 280 px mobile drawer, `.oiu-cite__preview` ≤ 318 at 390 (mocked citation-heavy answer, same frames as cycle 7).
// Run from app/: node qa/2026-10-22-cycle8/tools/layout-spec-probe.mjs <BASE> <outDir>
import { chromium } from "playwright-core";
import fs from "node:fs"; import path from "node:path";
const [BASE, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const SRC = [
  { url: "https://www.khaleejtimes.com/uae/ai-minister-agents-jobs-livelihood-technology-control", title: "No AI agent will be allowed to make decisions that could affect a person's livelihood — Al Olama", sourceName: "khaleejtimes.com" },
  { url: "https://www.wam.ae/en/article/c2us54g-edra-itu-organise-uae-capacity-building-week", title: "TDRA, ITU organise UAE Capacity Building Week: From Connectivity to Intelligence", sourceName: "wam.ae" },
  { url: "https://www.emirates247.com/uae/uae-blocked-750000-cyberattack-attempts-energy-and-education-sectors-were-the-top-targets/6964", title: "UAE blocked 750,000 cyberattack attempts, energy and education sectors were the top targets", sourceName: "emirates247.com" },
  { url: "https://www.thenationalnews.com/business/technology/2026/09/25/uae-ai-adoption-microsoft-report/", title: "UAE tops Microsoft AI diffusion ranking with 70.1% of working-age population using AI", sourceName: "thenationalnews.com" },
  { url: "https://www.tii.ae/news/plant-waste-gel-irrigation", title: "TII researchers' plant-waste gel cuts irrigation water use by about 30%", sourceName: "tii.ae" },
];
const line = (i) => `- Fact ${i + 1} about the UAE AI ecosystem with a citation [${SRC[i % 5].sourceName}](${SRC[i % 5].url}) and a second one [${SRC[(i + 2) % 5].sourceName}](${SRC[(i + 2) % 5].url}).\n`;
const ANSWER = ["## Verified facts\n", ...Array.from({ length: 30 }, (_, i) => line(i)), "\n## Interpretation\n", "The pattern across these sources is a cautious, audit-first agent policy."];
const frames = [{ type: "RUN_STARTED", threadId: "t", runId: "c8" }, { type: "CUSTOM", name: "ondemand.status", value: { phase: "researching" } }, { type: "CUSTOM", name: "ondemand.sources", value: { sources: SRC, pluginId: "plugin-1722260873", pluginName: "Perplexity" } }, { type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" }, ...ANSWER.map((d) => ({ type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: d })), { type: "TEXT_MESSAGE_END", messageId: "m1" }, { type: "RUN_FINISHED", threadId: "t", runId: "c8" }];
const body = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n";
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const out = { base: BASE, utc: new Date().toISOString(), viewports: {} };
const w = (el) => el ? Math.round(el.getBoundingClientRect().width) : null;
for (const vp of [{ n: "1440x900", w: 1440, h: 900, m: false }, { n: "390x844", w: 390, h: 844, m: true }]) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: vp.m, hasTouch: vp.m });
  const page = await ctx.newPage(); const V = (out.viewports[vp.n] = {});
  await page.addInitScript(() => { try { localStorage.setItem("uaecc.settings.v1", JSON.stringify({ onboarded: true, apikey: "", externalUserId: "INV-001", model: "predefined-deepseek-flash", theme: "light", companies: ["tii", "g42"] })); localStorage.removeItem("uaecc.nav.rail"); } catch {} });
  await page.route("**/api/chat", (route) => route.request().method() === "POST" ? route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "x-ondemand-session": "qa-c8-mock", "access-control-expose-headers": "x-ondemand-session" }, body }) : route.continue());
  await page.goto(`${BASE}/chat?skip=1`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByTestId("composer-input").waitFor({ timeout: 30000 }); await page.waitForTimeout(600);
  // rail / top bar / column before any run
  V.shell = await page.evaluate(() => { const q = (s) => document.querySelector(s); const w = (el) => el ? Math.round(el.getBoundingClientRect().width) : null; const h = (el) => el ? Math.round(el.getBoundingClientRect().height) : null;
    return { navRail: w(q('[data-testid="nav-rail"]')), railState: localStorage.getItem("uaecc.nav.rail"), topbarH: h(q('[data-testid="chat-topbar"]')) ?? h(q('.oiu-topbar')), mobileTopbarH: h(q('header.sticky, [data-testid="mobile-topbar"]')), welcomeW: w(q('.openui-agent-welcome-screen')), composerW: w(q('.oiu-composer')), inner: innerWidth, docScroll: document.documentElement.scrollWidth }; });
  if (!vp.m) {
    const toggle = page.getByTestId("rail-toggle"); if (await toggle.count()) { await toggle.first().click(); await page.waitForTimeout(400);
      V.railCollapsed = await page.evaluate(() => ({ navRail: Math.round(document.querySelector('[data-testid="nav-rail"]').getBoundingClientRect().width), railState: localStorage.getItem("uaecc.nav.rail") }));
      await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("composer-input").waitFor({ timeout: 30000 }); await page.waitForTimeout(500);
      V.railCollapsedAfterReload = await page.evaluate(() => ({ navRail: Math.round(document.querySelector('[data-testid="nav-rail"]').getBoundingClientRect().width), railState: localStorage.getItem("uaecc.nav.rail") }));
      await page.getByTestId("rail-toggle").first().click(); await page.waitForTimeout(400);
      await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("composer-input").waitFor({ timeout: 30000 }); await page.waitForTimeout(500);
      V.railExpandedAfterReload = await page.evaluate(() => ({ navRail: Math.round(document.querySelector('[data-testid="nav-rail"]').getBoundingClientRect().width), railState: localStorage.getItem("uaecc.nav.rail") })); }
  } else {
    const dt = page.getByTestId("rail-drawer-toggle"); if (await dt.count()) { await dt.first().click(); await page.waitForTimeout(400);
      V.drawer = await page.evaluate(() => { const d = document.querySelector('[data-testid="rail-drawer"]'); const o = document.querySelector('[data-testid="rail-overlay"]'); return { drawerW: d ? Math.round(d.getBoundingClientRect().width) : null, overlay: !!o, docScroll: document.documentElement.scrollWidth }; });
      await page.screenshot({ path: path.join(OUT, `drawer-open-${vp.n}.png`) }); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
      V.drawerAfterEscape = await page.evaluate(() => { const d = document.querySelector('[data-testid="rail-drawer"]'); return d ? d.getAttribute("data-open") ?? getComputedStyle(d).transform : "absent"; }); }
  }
  // run the mocked citation-heavy answer
  await page.getByTestId("composer-input").click(); await page.keyboard.type("Give me a cited summary of this week's UAE AI policy signals.");
  await page.keyboard.press("Enter"); await page.waitForTimeout(3500);
  V.run = await page.evaluate(() => { const rv = document.querySelector('[data-testid="run-view"]'); const msgs = document.querySelector('.openui-agent-thread-messages'); const prev = [...document.querySelectorAll('.oiu-cite__preview')].map((p) => { const r = p.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }; });
    return { rvScroll: rv?.scrollWidth ?? null, rvClient: rv?.clientWidth ?? null, docScroll: document.documentElement.scrollWidth, inner: innerWidth, messagesW: msgs ? Math.round(msgs.getBoundingClientRect().width) : null, chips: document.querySelectorAll('.oiu-cite').length, previews: prev.length, maxPreviewW: prev.length ? Math.max(...prev.map((p) => p.w)) : null, maxPreviewRight: prev.length ? Math.max(...prev.map((p) => p.right)) : null }; });
  const chip = page.locator('.oiu-cite').first(); if (await chip.count()) { await chip.hover().catch(() => {}); await page.waitForTimeout(400);
    V.hover = await page.evaluate(() => { const rv = document.querySelector('[data-testid="run-view"]'); const prev = [...document.querySelectorAll('.oiu-cite__preview')].filter((p) => getComputedStyle(p).visibility !== "hidden" && getComputedStyle(p).opacity !== "0").map((p) => Math.round(p.getBoundingClientRect().width)); return { rvScroll: rv?.scrollWidth ?? null, rvClient: rv?.clientWidth ?? null, docScroll: document.documentElement.scrollWidth, visiblePreviewMaxW: prev.length ? Math.max(...prev) : null }; });
    await page.screenshot({ path: path.join(OUT, `citation-hover-${vp.n}.png`) }); }
  // inspector + tabs
  const it = page.getByTestId("inspector-toggle"); if (await it.count()) { await it.first().click(); await page.waitForTimeout(500);
    V.inspector = await page.evaluate(() => { const a = document.querySelector('[data-testid="chat-inspector"]'); const tabs = [...document.querySelectorAll('[data-testid="inspector-tabs"] [role="tab"]')].map((t) => ({ text: t.textContent.trim(), selected: t.getAttribute("aria-selected"), testid: t.getAttribute("data-testid") })); const r = a?.getBoundingClientRect(); return { open: a?.getAttribute("data-open"), w: r ? Math.round(r.width) : null, h: r ? Math.round(r.height) : null, tabs }; });
    const plan = page.getByTestId("inspector-tab-plan"); if (await plan.count()) { await plan.first().click(); await page.waitForTimeout(300); V.planTab = await page.evaluate(() => ({ selected: document.querySelector('[data-testid="inspector-tab-plan"]')?.getAttribute("aria-selected"), panel: !!document.querySelector('[data-testid="inspector-plan"]') })); await page.screenshot({ path: path.join(OUT, `inspector-plan-${vp.n}.png`) }); }
    const run = page.getByTestId("inspector-tab-run"); if (await run.count()) { await run.first().click(); await page.waitForTimeout(300); V.runTab = await page.evaluate(() => ({ selected: document.querySelector('[data-testid="inspector-tab-run"]')?.getAttribute("aria-selected"), runRail: !!document.querySelector('[data-testid="run-rail"]') })); await page.screenshot({ path: path.join(OUT, `inspector-run-${vp.n}.png`) }); } }
  await page.screenshot({ path: path.join(OUT, `chat-run-${vp.n}.png`), fullPage: false });
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(OUT, "layout-spec-measurements.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
