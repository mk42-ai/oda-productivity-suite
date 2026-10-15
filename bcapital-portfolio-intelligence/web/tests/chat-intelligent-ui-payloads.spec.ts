import { test, expect, type Page, type Request } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Chat Intelligent-UI payload harness A–G (pass 2, 2026-10-15). Drives POST /api/chat on the LIVE preview (BASE_URL) through the
 * deterministic fixture streams (`?fixture=<name>`; see src/lib/ondemand/chat-fixtures.ts) and the real upstream (F/G retry), at
 * 1440x900 and 390x844 (PW_VIEWPORT=390x844). Every row writes web/ui-proof/payload-<X>-<viewport>.png with a UTC timestamp, and a
 * JSON result line into web/ui-proof/pass2-results.jsonl (status, answer chars, PASS/FAIL per assertion).
 *   BASE_URL=https://sb-xxxx.vercel.run PW_VIEWPORT=1440x900 npx playwright test tests/chat-intelligent-ui-payloads.spec.ts --config tests/payloads.config.ts
 */
const VIEWPORT = (process.env.PW_VIEWPORT ?? "1440x900").split("x").map(Number) as [number, number];
const VP = `${VIEWPORT[0]}x${VIEWPORT[1]}`;
const PROOF = path.resolve(__dirname, "..", "ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const RESULTS = path.join(PROOF, "pass2-results.jsonl");
const record = (row: Record<string, unknown>) => fs.appendFileSync(RESULTS, JSON.stringify({ viewport: VP, utc: new Date().toISOString(), ...row }) + "\n");
const FIX = (name: string, q: string, extra = "") => `/chat?fixture=${name}&skip=1&q=${encodeURIComponent(q)}${extra}`;
const shot = async (page: Page, label: string) => { const file = path.join(PROOF, `payload-${label}-${VP}.png`); await page.screenshot({ path: file, fullPage: false }); return { file: path.relative(path.resolve(__dirname, ".."), file), utc: new Date().toISOString() }; };

type ChatCapture = { status: number | null; answerChars: number; headers: Record<string, string>; responseHeaders: Record<string, string> };
/** Captures the next POST /api/chat: request headers, HTTP status, and the number of answer characters streamed (TEXT_MESSAGE_CONTENT deltas). */
async function captureChat(page: Page): Promise<() => Promise<ChatCapture>> {
  const cap: ChatCapture = { status: null, answerChars: 0, headers: {}, responseHeaders: {} };
  let done!: () => void; const settled = new Promise<void>((r) => { done = r; });
  const onReq = (req: Request) => { if (req.method() === "POST" && /\/api\/chat(\?|$)/.test(req.url())) cap.headers = req.headers(); };
  page.on("request", onReq);
  page.on("response", async (res) => {
    if (res.request().method() !== "POST" || !/\/api\/chat(\?|$)/.test(res.url())) return;
    cap.status = res.status(); cap.responseHeaders = res.headers();
    try { const body = await res.text(); for (const line of body.split("\n")) { if (!line.startsWith("data:")) continue; const d = line.slice(5).trim(); if (!d || d === "[DONE]") continue; try { const f = JSON.parse(d); if (f.type === "TEXT_MESSAGE_CONTENT" && typeof f.delta === "string") cap.answerChars += f.delta.length; } catch { /* partial */ } } } catch { /* body unavailable */ }
    done();
  });
  return async () => { await Promise.race([settled, new Promise((r) => setTimeout(r, 90_000))]); page.off("request", onReq); return cap; };
}
const noOverflow = async (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
// "Blocked script execution in 'about:srcdoc' … sandboxed" is Chromium REPORTING that the HtmlView sandbox refused the fixture's inline <script>
// — it is the proof the sandbox works, not an app error — so it is counted separately (sandboxBlocks) and never as a console error.
const SANDBOX_BLOCK_RE = /Blocked script execution in 'about:srcdoc'.*sandboxed/i;
const collectErrors = (page: Page) => { const errs: string[] = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon|source map|DevTools/i.test(m.text()) && !SANDBOX_BLOCK_RE.test(m.text())) errs.push(m.text()); }); return errs; };

test.use({ viewport: { width: VIEWPORT[0], height: VIEWPORT[1] } });
test.describe.configure({ mode: "serial" });

// ---------------------------------------------------------------------------------------------------------------------------------- A
test("A — multi-deliverable workbook + run synthesis shelf", async ({ page }) => {
  const errs = collectErrors(page); const got = await captureChat(page);
  await page.goto(FIX("workspace", "Plan aid delivery around a blocked Strait of Hormuz"));
  const shelf = page.getByTestId("deliverables-shelf"); await expect(shelf).toBeVisible({ timeout: 60_000 });
  const cap = await got();
  const rows: Record<string, boolean> = {};
  rows["header 2 verified deliverables"] = (await page.getByTestId("deliverables-title").textContent())?.trim() === "2 verified deliverables";
  rows["run completed in 7m 32s"] = (await page.getByTestId("deliverables-duration").textContent())?.includes("run completed in 7m 32s") ?? false;
  const cta = page.getByTestId("deliverables-final-download");
  rows["gold Download final document CTA"] = (await cta.textContent())?.includes("Download final document") === true && (await cta.evaluate((e) => getComputedStyle(e).backgroundColor)) === "rgb(184, 134, 43)";
  const card1 = page.locator('[data-testid=deliverable-card][data-deliverable-id="d-wb"]'); const card2 = page.locator('[data-testid=deliverable-card][data-deliverable-id="d-syn"]');
  rows["card 1 title + pills"] = (await card1.getByTestId("deliverable-title").textContent()) === "Problem-solving workbook" && (await card1.getByTestId("deliverable-format").textContent()) === "workbook-md" && (await card1.getByTestId("deliverable-version").textContent()) === "v3" && (await card1.getByTestId("deliverable-verified").textContent())?.includes("verified") === true;
  rows["card 2 title + pills"] = (await card2.getByTestId("deliverable-title").textContent()) === "Run synthesis" && (await card2.getByTestId("deliverable-format").textContent()) === "markdown" && (await card2.getByTestId("deliverable-version").textContent()) === "v1" && (await card2.getByTestId("deliverable-verified").textContent())?.includes("verified") === true;
  const p1 = (await card1.getByTestId("deliverable-preview").textContent()) ?? ""; const p2 = (await card2.getByTestId("deliverable-preview").textContent()) ?? "";
  rows["literal markdown previews"] = p1.startsWith("## Aid delivery around a blocked Strait of Hormuz — problem-solving workbook **Status header** - **Problem one-liner**: aid to Somalia and") && p2.startsWith("Your problem-solving workbook is ready. Here's what it delivers, answer-first. **Bottom line:** the Strait of Hormuz constrains only cargo") && (await card1.getByTestId("deliverable-preview").locator("h2,strong,em").count()) === 0;
  const hist = card1.getByTestId("deliverable-history-toggle");
  rows["Version history (2) label"] = (await hist.textContent())?.includes("Version history (2)") === true;
  await hist.click(); await expect(card1.getByTestId("deliverable-history")).toBeVisible();
  rows["history expands to v1/v2/v3"] = (await card1.getByTestId("deliverable-history-row").count()) === 3;
  await card1.locator('[data-testid=deliverable-history-row][data-version="1"]').click();
  rows["selecting v1 swaps the preview"] = (await card1.getByTestId("deliverable-version").textContent()) === "v1" && ((await card1.getByTestId("deliverable-preview").textContent()) ?? "").includes("_Draft v1");
  const dl = card1.getByTestId("deliverable-download"); const href = await dl.getAttribute("href");
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 15_000 }).catch(() => null), dl.click()]);
  rows["per-artifact Download works"] = !!download || (!!href && href.startsWith("data:text/markdown"));
  rows["no per-card Download / history on Run synthesis"] = (await card2.locator("[data-testid=deliverable-download],[data-testid=deliverable-history-toggle]").count()) === 0;
  rows["no horizontal overflow"] = await noOverflow(page);
  rows["zero console/page errors"] = errs.length === 0;
  await shelf.scrollIntoViewIfNeeded(); const s = await shot(page, "A");
  record({ payload: "A", http_status: cap.status, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
  expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- B
test("B — country profile + 5-stage pipeline + Waiting-for-you creds prompt", async ({ page }) => {
  const errs = collectErrors(page); const got = await captureChat(page);
  const credsCalls: number[] = []; page.on("response", (r) => { if (/\/api\/chat\/creds/.test(r.url())) credsCalls.push(r.status()); });
  await page.goto(FIX("creds-pipeline", "Profile Oman as an aid-staging country"));
  const wait = page.getByTestId("interactive-wait-card"); await expect(wait).toBeVisible({ timeout: 60_000 });
  const rows: Record<string, boolean> = {};
  rows["Waiting for you inside interactive-wait-card"] = ((await wait.getByTestId("interactive-wait-state").textContent()) ?? "").trim() === "Waiting for you";
  await page.getByTestId("inspector-toggle").click(); const rail = page.getByTestId("run-pipeline-rail"); await expect(rail).toBeVisible();
  rows["5-stage pipeline 1..5 labels"] = (await rail.getByTestId("rail-pipeline").textContent()) === "1data-scout2benchmark3problem-solve4storyline5design";
  rows["data-scout + benchmark done, problem-solve running"] = (await rail.locator('[data-testid=rail-stage][data-state=done]').count()) === 2 && (await rail.locator('[data-testid=rail-stage][data-stage=problem-solve]').getAttribute("data-state")) === "running";
  const timer = page.getByTestId("run-timer");
  const t1 = Number(await timer.getAttribute("data-ms")); await page.waitForTimeout(1200); const t2 = Number(await timer.getAttribute("data-ms"));
  rows["pipeline timer pauses while waiting"] = (await timer.getAttribute("data-state")) === "paused" && t2 - t1 < 300;
  rows["country profile slot filled"] = (await page.locator('[data-testid=iui-slot][data-type=country-profile][data-filled=true]').count()) === 1;
  await page.getByTestId("inspector-close").click();
  await wait.locator("input").first().fill("pb-test-token-not-real");
  const s = await shot(page, "B");
  await wait.locator('button[type=submit]').click();
  // on a 200 from the relay the shell clears the prompt (the wait card unmounts) and resumes the run
  await expect(page.getByTestId("interactive-wait-card")).toHaveCount(0, { timeout: 15_000 });
  rows["/api/chat/creds relay answered 200"] = credsCalls.includes(200);
  await page.waitForTimeout(600); const t3 = Number(await timer.getAttribute("data-ms")); await page.waitForTimeout(900); const t4 = Number(await timer.getAttribute("data-ms"));
  rows["session resumes on submit (timer running again)"] = t4 > t3 || (await timer.getAttribute("data-state")) !== "paused";
  await expect(page.getByTestId("answer-block")).toBeVisible({ timeout: 60_000 });
  const cap = await got();
  rows["no error boundary / retry notice"] = (await page.locator("[data-testid=chat-error], .openui-agent-thread-error").count()) === 0 && !(await page.content()).includes("Application error");
  await page.getByTestId("inspector-toggle").click();
  await expect(rail.locator('[data-testid=rail-stage][data-state=done]')).toHaveCount(5, { timeout: 30_000 });
  rows["all 5 stages done after resume"] = true;
  rows["no horizontal overflow"] = await noOverflow(page);
  rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "B", http_status: cap.status, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs, creds_calls: credsCalls });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
  expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- C
test("C — publisher-first citations, +N focus, source stepping, safe outbound anchors", async ({ page }) => {
  const errs = collectErrors(page); const got = await captureChat(page);
  await page.goto(FIX("workspace", "Plan aid delivery around a blocked Strait of Hormuz"));
  await expect(page.getByTestId("deliverables-shelf")).toBeVisible({ timeout: 60_000 });
  const cap = await got(); const rows: Record<string, boolean> = {};
  const inline = page.locator('[data-testid=answer-block] [data-testid=citation-chip]');
  rows["inline publisher chips in the answer"] = (await inline.count()) >= 4 && (await inline.evaluateAll((els) => els.every((e) => /^[a-z0-9.-]+$/.test(e.getAttribute("data-publisher") ?? "")))) === true;
  await page.getByTestId("inspector-toggle").click(); const rail = page.getByTestId("run-pipeline-rail"); await expect(rail).toBeVisible();
  rows["rail chips are publisher names"] = (await rail.getByTestId("rail-citation-chip").allTextContents()).map((t) => t.trim()).join(",") === "reuters,bloomberg,ft,unocha";
  await rail.getByTestId("rail-citation-overflow").click();
  rows["+N click focuses Verified sources"] = (await page.evaluate(() => document.activeElement?.id)) === "rail-verified-sources" && ((await rail.getByTestId("rail-verified-sources").textContent()) ?? "").includes("5 / 6");
  await rail.getByTestId("rail-source-next").click();
  rows["next steps to 6 / 6"] = ((await rail.getByTestId("rail-verified-sources").textContent()) ?? "").includes("6 / 6") && !!(await rail.getByTestId("rail-source-card").locator("img").count());
  await rail.getByTestId("rail-source-prev").click();
  rows["prev steps back to 5 / 6"] = ((await rail.getByTestId("rail-verified-sources").textContent()) ?? "").includes("5 / 6");
  const bad = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>("[data-testid=answer-block] a[href], [data-testid=run-pipeline-rail] a[href], [data-testid=sources-list] a[href]")];
    return anchors.filter((a) => !/^https:\/\//.test(a.href) || a.target !== "_blank" || !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel) || /perplexity\.ai|google\.com\/url|utm_|\/r\/[a-z]+\/go/i.test(a.href)).map((a) => a.href);
  });
  rows["every outbound anchor https + _blank + noopener noreferrer, no proxy/tracking"] = bad.length === 0;
  const s = await shot(page, "C");
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "C", http_status: cap.status, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs, bad_anchors: bad });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
  expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- D
test("D — root-first Intelligent UI: skeleton on first rAF tick, slots fill, ODImage only, one lightbox", async ({ page }) => {
  const errs = collectErrors(page); const got = await captureChat(page);
  // Observe the FIRST paint of the root: a MutationObserver installed before navigation-complete records slot counts at the first rAF after mount.
  await page.addInitScript(() => {
    (window as unknown as { __iuiFirst?: unknown }).__iuiFirst = null;
    const mo = new MutationObserver(() => {
      const root = document.querySelector("[data-testid=iui-root]"); if (!root) return;
      requestAnimationFrame(() => { const w = window as unknown as { __iuiFirst: unknown }; if (w.__iuiFirst) return; w.__iuiFirst = { slots: document.querySelectorAll("[data-testid=iui-slot]").length, filled: document.querySelectorAll("[data-testid=iui-slot][data-filled=true]").length, rootFirst: root.getAttribute("data-root-first") }; });
      mo.disconnect();
    });
    document.addEventListener("DOMContentLoaded", () => mo.observe(document.body, { childList: true, subtree: true }));
  });
  // paced at 60 ms/frame (fxdelay) so the root/layout statements land in an earlier rAF commit than the data statements, as on a real stream
  await page.goto(FIX("workspace", "Plan aid delivery around a blocked Strait of Hormuz", "&fxdelay=60"));
  await expect(page.getByTestId("iui-root")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-testid=iui-slot][data-filled=true]')).toHaveCount(7, { timeout: 30_000 });
  const cap = await got(); const rows: Record<string, boolean> = {};
  const first = await page.evaluate(() => (window as unknown as { __iuiFirst: { slots: number; filled: number; rootFirst: string } | null }).__iuiFirst);
  rows["skeleton mounts on first rAF tick before data hydration"] = !!first && first.slots === 7 && first.filled < 7 && first.rootFirst === "true";
  rows["< 60 statements, data-root-first=true"] = Number(await page.getByTestId("iui-root").getAttribute("data-statements")) < 60 && (await page.getByTestId("iui-root").getAttribute("data-root-first")) === "true";
  rows["all 7 slots fill afterwards"] = (await page.locator('[data-testid=iui-slot][data-filled=true]').count()) === 7;
  rows["no <img> outside ODImage in the IUI"] = await page.evaluate(() => [...document.querySelectorAll("[data-testid=iui-root] img")].every((i) => i.getAttribute("data-testid") === "od-image"));
  rows["no broken-image icon"] = await page.evaluate(() => new Promise<boolean>((r) => { const t = Date.now(); (function p() { const imgs = [...document.images]; const settled = imgs.every((i) => i.complete); if (settled || Date.now() - t > 5000) return r(imgs.every((i) => !i.complete || i.naturalWidth > 0 || getComputedStyle(i).visibility === "hidden")); setTimeout(p, 100); })(); }));
  rows["HtmlView sandboxed, script did not run"] = (await page.locator('[data-testid=iui-html-frame][sandbox=""]').count()) === 1 && !(await page.evaluate(() => document.body.innerText)).includes("SCRIPT RAN") && (await page.evaluate(() => { const f = document.querySelector("[data-testid=iui-html-frame]") as HTMLIFrameElement | null; try { return f?.contentDocument === null; } catch { return true; } }));
  const btn = page.locator("[data-testid=iui-country-profile] .iui-img__btn").first(); await btn.scrollIntoViewIfNeeded(); await btn.click();
  await expect(page.getByTestId("lightbox")).toHaveCount(1);
  rows["exactly one lightbox instance"] = (await page.getByTestId("lightbox").count()) === 1;
  const s = await shot(page, "D");
  await page.keyboard.press("Escape"); await expect(page.getByTestId("lightbox")).toHaveCount(0);
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "D", http_status: cap.status, answer_chars: cap.answerChars, rows, first_tick: first, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
  expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- E
test("E — between-step summarisation keeps the thinking/activity list mounted; scroll anchoring intact", async ({ page }) => {
  const errs = collectErrors(page); const got = await captureChat(page);
  // paced 40 ms/frame so the summarize_history.initialized → .completed window is observable mid-run
  await page.goto(FIX("summarize", "Review three aid corridors and summarise between steps", "&fxdelay=40"));
  await expect(page.getByTestId("thinking-block")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("working-list").first()).toBeVisible({ timeout: 30_000 });
  // Tag the LIVE DOM nodes before any summary frame, then re-read identity after each summarize_history.completed while the run is still live.
  await page.evaluate(() => { const tb = document.querySelector("[data-testid=thinking-block]") as HTMLElement | null; const wl = document.querySelector("[data-testid=working-list]") as HTMLElement | null; if (tb) tb.dataset.identity = "tb-1"; if (wl) wl.dataset.identity = "wl-1"; (window as unknown as { __rows0: number }).__rows0 = document.querySelectorAll("[data-testid=working-row]").length; });
  const identity = () => page.evaluate(() => ({ tb: (document.querySelector("[data-testid=thinking-block]") as HTMLElement | null)?.dataset.identity ?? null, wl: (document.querySelector("[data-testid=working-list]") as HTMLElement | null)?.dataset.identity ?? null, rows: document.querySelectorAll("[data-testid=working-row]").length, live: document.querySelector("[data-testid=run-view]")?.getAttribute("data-live"), summaries: document.querySelectorAll("[data-testid=step-summary][data-state=done]").length }));
  await expect(page.locator('[data-testid=step-summary][data-state=done]').first()).toBeVisible({ timeout: 60_000 });
  const afterS1 = await identity();
  await expect(page.locator('[data-testid=step-summary][data-state=done]')).toHaveCount(2, { timeout: 60_000 });
  const afterS2 = await identity();
  const scroller = page.locator(".chat-shell .openui-agent-thread-scroll-area");
  const pinnedDuring = await scroller.getAttribute("data-pinned-to-bottom");
  await expect(page.locator('[data-testid=step-summary][data-state=done]')).toHaveCount(3, { timeout: 60_000 });
  const afterS3 = await identity();
  await expect(page.getByTestId("answer-block")).toBeVisible({ timeout: 60_000 });
  const cap = await got(); const rows: Record<string, boolean> = {};
  rows["thinking block NOT remounted across summarize_history frames (live run)"] = afterS1.tb === "tb-1" && afterS2.tb === "tb-1" && afterS3.tb === "tb-1" && afterS2.live === "true";
  rows["activity (working) list NOT remounted"] = afterS1.wl === "wl-1" && afterS2.wl === "wl-1" && afterS3.wl === "wl-1";
  rows["item count stable / monotonic (1 → 3 tool rows, never reset)"] = afterS1.rows >= 1 && afterS2.rows >= afterS1.rows && afterS3.rows === 3;
  rows["3 between-step summaries rendered"] = afterS3.summaries === 3;
  rows["isPinnedToBottom stayed true while pinned"] = pinnedDuring !== "false";
  // manual scroll-up is not yanked back
  await scroller.evaluate((n) => { n.scrollTop = 0; n.dispatchEvent(new Event("scroll")); }); await page.waitForTimeout(500);
  const top = await scroller.evaluate((n) => n.scrollTop); const pinnedAfter = await scroller.getAttribute("data-pinned-to-bottom");
  rows["manual scroll-up is respected (not yanked back)"] = top < 40 && pinnedAfter === "false";
  const s = await shot(page, "E");
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "E", http_status: cap.status, answer_chars: cap.answerChars, rows, identity: { afterS1, afterS2, afterS3 }, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
  expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- F
test("F — ONDEMAND SETTINGS override round-trip headers, 25→20 sanitiser, server-side key fallback", async ({ page }) => {
  const errs = collectErrors(page);
  await page.goto("/chat?skip=1"); await expect(page.getByTestId("chat-shell")).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("od-settings-toggle").click(); const drawer = page.getByTestId("od-settings-drawer"); await expect(drawer).toHaveAttribute("data-open", "true");
  const rows: Record<string, boolean> = {};
  rows["GATE HELD · SENDS 0"] = ((await page.getByTestId("od-gate-badge").textContent()) ?? "").includes("GATE HELD · SENDS 0");
  // 25 ids incl. the two DISABLED ids → sanitised to <= 20 with the disabled ones removed
  const ids = ["plugin-1785777296", "plugin-1791713636", ...Array.from({ length: 23 }, (_, i) => `plugin-17${String(i).padStart(8, "0")}`)];
  const ta = page.getByTestId("od-plugin-ids"); await ta.fill(ids.join("\n"));
  const pills = await page.locator("[data-testid=od-plugin-pills] li").allTextContents();
  rows["25 pasted → capped to 20, DISABLED_PLUGIN_IDS removed"] = pills.length === 20 && !pills.includes("plugin-1785777296") && !pills.includes("plugin-1791713636") && ((await page.getByTestId("od-plugin-ids-error").textContent()) ?? "").includes("At most 20");
  await page.getByTestId("od-endpoint-id").fill("predefined-gpt-5.6-luna");
  await page.getByTestId("od-external-user-id").fill("INV-001");
  await page.getByTestId("od-api-key").fill(""); // blank → server-side ONDEMAND_API_KEY fallback
  const s = await shot(page, "F");
  await page.getByTestId("od-settings-close").click();
  const got = await captureChat(page);
  const composer = page.getByTestId("composer-input"); await composer.fill("In one sentence, what does B Capital invest in?"); await page.getByTestId("composer-send").click();
  await expect(page.getByTestId("answer-block")).toBeVisible({ timeout: 120_000 });
  const cap = await got();
  rows["request carries x-ondemand-endpoint-id / plugin-ids / external-user-id"] = cap.headers["x-ondemand-endpoint-id"] === "predefined-gpt-5.6-luna" && (cap.headers["x-ondemand-plugin-ids"] ?? "").split(",").length === 20 && cap.headers["x-ondemand-external-user-id"] === "INV-001";
  rows["blank client key → no x-ondemand-key header (server env fallback)"] = !cap.headers["x-ondemand-key"];
  let echo: { keySource?: string; pluginIds?: number } = {}; try { echo = JSON.parse(cap.responseHeaders["x-ondemand-overrides"] ?? "{}"); } catch { /* none */ }
  rows["server echoes overrides with keySource=server-env"] = echo.keySource === "server-env" && echo.pluginIds === 20;
  rows["HTTP 200 with non-empty answer"] = cap.status === 200 && cap.answerChars > 0;
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "F", http_status: cap.status, answer_chars: cap.answerChars, rows, echo, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
});

// ---------------------------------------------------------------------------------------------------------------------------------- G
test("G — forced /api/chat failure shows only the discreet retry notice; Retry → 200 with answer", async ({ page }) => {
  const errs = collectErrors(page); let posts = 0;
  await page.route("**/api/chat", async (route) => { if (route.request().method() === "POST") { posts++; if (posts === 1) return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "upstream exploded: TypeError at bridge.ts:912 stack trace follows" } }) }); } return route.continue(); });
  await page.goto("/chat?fixture=single&skip=1"); await expect(page.getByTestId("chat-shell")).toBeVisible({ timeout: 60_000 });
  const composer = page.getByTestId("composer-input"); await composer.fill("Tell me about Lambda in one line."); await page.getByTestId("composer-send").click();
  const notice = page.getByTestId("chat-error"); await expect(notice).toBeVisible({ timeout: 60_000 });
  const rows: Record<string, boolean> = {};
  // USER-VISIBLE text only: innerText of the app's <main> (what a person can read). The library's own error box must stay suppressed
  // (display:none), and no modal dialog with text may be open. (In `next dev` the Next.js dev-tools overlay echoes server errors in an
  // off-screen <nextjs-portal>; the live preview runs `next start`, where it does not exist — so we scope to <main>.)
  const visible = await page.evaluate(() => (document.querySelector("main") as HTMLElement | null)?.innerText ?? document.body.innerText);
  const libBoxHidden = await page.locator(".openui-agent-thread-error").evaluateAll((els) => els.every((e) => getComputedStyle(e).display === "none" || e.getBoundingClientRect().height === 0));
  const modalWithText = await page.locator("[role=dialog][aria-modal=true]").evaluateAll((els) => els.filter((e) => (e as HTMLElement).innerText.trim().length > 0 && e.getBoundingClientRect().height > 0).length);
  rows["discreet notice only"] = ((await notice.textContent()) ?? "").includes("Something interrupted that answer.") && (await page.getByTestId("chat-error-retry").count()) === 1;
  rows["no raw error strings / stack traces / HTTP dumps / modal"] = !/upstream exploded|TypeError|bridge\.ts|stack trace|HTTP 500|500 \(|Internal Server Error|Something went wrong/i.test(visible) && libBoxHidden && modalWithText === 0;
  const s = await shot(page, "G");
  const got = await captureChat(page);
  await page.getByTestId("chat-error-retry").click();
  await expect(page.getByTestId("answer-block")).toBeVisible({ timeout: 90_000 });
  const cap = await got();
  rows["Retry → HTTP 200 with non-empty answer"] = cap.status === 200 && cap.answerChars > 0 && posts === 2;
  rows["notice gone after retry"] = (await page.getByTestId("chat-error").count()) === 0;
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.filter((e) => !/500|Failed to load resource/.test(e)).length === 0;
  record({ payload: "G", http_status: cap.status, first_status: 500, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true);
});
