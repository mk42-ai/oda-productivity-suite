// QA cycle 7 — Lane A probe: deterministic citation-heavy answer (mocked POST /api/chat, buffered AG-UI SSE) → measures run-view
// scrollWidth/clientWidth + document scrollWidth with the .oiu-cite__preview tooltips present, at 390×844 and 1440×900; screenshots.
// Run from app/: node qa/2026-10-21-cycle7/tools/runpanel-cite-probe.mjs <BASE> <outDir> <label>
import { chromium } from "playwright-core";
import fs from "node:fs"; import path from "node:path";
const [BASE, OUT, LABEL] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const SRC = [
  { url: "https://www.khaleejtimes.com/uae/ai-minister-agents-jobs-livelihood-technology-control", title: "No AI agent will be allowed to make decisions that could affect a person's livelihood — Al Olama", sourceName: "khaleejtimes.com" },
  { url: "https://www.wam.ae/en/article/c2us54g-edra-itu-organise-uae-capacity-building-week", title: "TDRA, ITU organise UAE Capacity Building Week: From Connectivity to Intelligence", sourceName: "wam.ae" },
  { url: "https://www.emirates247.com/uae/uae-blocked-750000-cyberattack-attempts-energy-and-education-sectors-were-the-top-targets/6964", title: "UAE blocked 750,000 cyberattack attempts, energy and education sectors were the top targets", sourceName: "emirates247.com" },
  { url: "https://www.thenationalnews.com/business/technology/2026/09/25/uae-ai-adoption-microsoft-report/", title: "UAE tops Microsoft AI diffusion ranking with 70.1% of working-age population using AI", sourceName: "thenationalnews.com" },
  { url: "https://www.tii.ae/news/plant-waste-gel-irrigation", title: "TII researchers' plant-waste gel cuts irrigation water use by about 30%", sourceName: "tii.ae" },
];
const ANSWER = ["## Verified facts\n", "- The UAE AI minister ruled out agents deciding on livelihoods [Khaleej Times](" + SRC[0].url + ").\n", "- TDRA and ITU ran Capacity Building Week on 19–22 October [WAM](" + SRC[1].url + ").\n", "- The Cyber Security Council reported ~750,000 blocked attempts [Emirates 24|7](" + SRC[2].url + ").\n", "- 70.1% of the working-age population used AI in Q1 2026 [The National](" + SRC[3].url + ") and TII published an irrigation gel result [TII](" + SRC[4].url + ").\n\n", "## Interpretation\n", "Governance signalling and adoption metrics move together; the right-aligned citation at the end of a long line is the overflow case [TII](" + SRC[4].url + ").\n\n", ...Array.from({ length: 9 }, (_, i) => `Filler sentence number ${i + 1} pads the line so a chip lands near the right edge ${"x".repeat(i)} [KT](${SRC[0].url}) and the five-way claim [a](${SRC[0].url}) [b](${SRC[1].url}) [c](${SRC[2].url}) [d](${SRC[3].url}) [e](${SRC[4].url}) follows.\n\n`)];
const frames = [{ type: "RUN_STARTED", threadId: "t", runId: "c7" }, { type: "CUSTOM", name: "ondemand.status", value: { phase: "researching" } }, { type: "CUSTOM", name: "ondemand.sources", value: { sources: SRC, pluginId: "plugin-1722260873", pluginName: "Perplexity", partial: false } }, { type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" }, ...ANSWER.map((delta) => ({ type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta })), { type: "TEXT_MESSAGE_END", messageId: "m1" }, { type: "RUN_FINISHED", threadId: "t", runId: "c7" }];
const body = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n";
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const out = { label: LABEL, base: BASE, utc: new Date().toISOString(), viewports: {} };
for (const vp of [{ n: "390x844", w: 390, h: 844, m: true }, { n: "1440x900", w: 1440, h: 900, m: false }]) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: vp.m, hasTouch: vp.m });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("uaecc.settings.v1", JSON.stringify({ onboarded: true, apikey: "", externalUserId: "INV-001", model: "predefined-deepseek-flash", theme: "light", companies: ["tii", "g42"] })); } catch {} });
  await page.route("**/api/chat", (route) => route.request().method() === "POST" ? route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "x-ondemand-session": "qa-c7-mock", "access-control-expose-headers": "x-ondemand-session" }, body }) : route.continue());
  await page.goto(`${BASE}/chat?skip=1`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByTestId("composer-input").waitFor({ timeout: 30000 });
  await page.getByTestId("composer-input").fill("Which 21 October 2026 items touch AI governance and adoption?");
  await page.getByTestId("composer-send").click();
  await page.getByTestId("answer-block").last().waitFor({ timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="citation-chip"]').length >= 4, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const measure = () => page.evaluate(() => { const rv = document.querySelector('[data-testid="run-view"]'); const se = document.scrollingElement; const chips = [...document.querySelectorAll('[data-testid="citation-chip"]')]; const prevs = [...document.querySelectorAll('.oiu-cite__preview')].map((p) => { const r = p.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }; }); return { rvScroll: rv?.scrollWidth ?? 0, rvClient: rv?.clientWidth ?? 0, docScroll: se.scrollWidth, inner: innerWidth, chips: chips.length, previews: prevs }; });
  const idle = await measure();
  await page.screenshot({ path: path.join(OUT, `${LABEL}-runpanel-${vp.n}.png`), fullPage: false });
  let hover = idle; const targets = page.locator('[data-testid="citation-chip"], [data-testid="citation-overflow"]'); const nT = await targets.count();
  for (let i = 0; i < nT; i++) { const t = targets.nth(i); if (!(await t.isVisible().catch(() => false))) continue; await t.scrollIntoViewIfNeeded().catch(() => {}); await t.hover({ force: true }).catch(() => {}); await page.waitForTimeout(120); const m = await measure(); if (m.rvScroll > hover.rvScroll || m.docScroll > hover.docScroll || m.previews.some((p) => p.right > vp.w + 1 || p.left < 0)) hover = m; }
  const last = page.locator('[data-testid="citation-overflow"]').last(); if (await last.count()) { await last.scrollIntoViewIfNeeded().catch(() => {}); await last.hover({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
  await page.screenshot({ path: path.join(OUT, `${LABEL}-citation-hover-${vp.n}.png`), fullPage: false });
  out.viewports[vp.n] = { idle, hover, pass: idle.rvScroll <= idle.rvClient + 1 && idle.docScroll <= idle.inner + 1 && hover.rvScroll <= hover.rvClient + 1 && hover.docScroll <= hover.inner + 1 && hover.previews.every((p) => p.left >= 0 && p.right <= vp.w + 1) };
  console.log(vp.n, JSON.stringify(out.viewports[vp.n]));
  await ctx.close();
}
await b.close(); fs.writeFileSync(path.join(OUT, `${LABEL}-measurements.json`), JSON.stringify(out, null, 1));
