import { test, expect, type Page, type Request } from "@playwright/test";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { primeSettings, hasKey } from "./helpers";
import { MERGED_LIST_CAP, PINNED_PLUGIN_ID } from "../src/lib/plugin-catalogue";

/**
 * Chat payload harness A–G — RESTORED + ADAPTED (QA cycle 4, 2026-10-21) from the deleted
 * web/tests/chat-intelligent-ui-payloads.spec.ts (commit 1f878a1; evidence copy in qa/2026-10-21-cycle4/laneA/).
 *
 * The original drove `/chat?fixture=…` streams and the "Intelligent UI" slots (deliverables-shelf, iui-root, interactive-wait-card,
 * od-settings-*, run-pipeline-rail). None of that exists on this branch (feature reverted upstream in 1ed4247). Every scenario is
 * therefore re-expressed against the CURRENT run view (run-view / plan-stepper / working-list / step-summary / answer-block /
 * citation-chip / sources-list / inline-artifacts / outputs-card / chat-error) and made deterministic with a PACED SSE mock of
 * POST /api/chat (AG-UI frames: RUN_STARTED, TEXT_MESSAGE_*, TOOL_CALL_*, RUN_FINISHED/RUN_ERROR and the CUSTOM `ondemand.*` frames
 * the shell binds to — src/lib/ondemand/eventMap.ts CLIENT_EVENT, consumed in chat-shell.tsx teeStream()).
 * Pacing matters (first-paint ordering, live identity across summaries), and route.fulfill() delivers one buffered body — so the
 * frames are served by a tiny local HTTP server started in this file and the POST is re-pointed to it with route.continue({url}).
 * F and the Retry half of G hit the REAL backend through BASE_URL (see the comments there).
 *
 * Run (both viewports are REQUIRED):
 *   PW_VIEWPORT=1440x900 npx playwright test e2e/chat-intelligent-ui-payloads.spec.ts --project=desktop --workers=1
 *   PW_VIEWPORT=390x844  npx playwright test e2e/chat-intelligent-ui-payloads.spec.ts --project=desktop --workers=1
 * Output: qa/2026-10-21-cycle4/laneA/payload-<X>-<vp>.png + pass2-results.jsonl (one JSON line per scenario).
 */
const VIEWPORT = (process.env.PW_VIEWPORT ?? "1440x900").split("x").map(Number) as [number, number];
const VP = `${VIEWPORT[0]}x${VIEWPORT[1]}`;
const OUT = process.env.PAYLOAD_OUT ? path.resolve(process.env.PAYLOAD_OUT) : path.resolve(__dirname, "..", "qa", "2026-10-21-cycle4", "laneA"); // PAYLOAD_OUT: per-cycle evidence dir (cycle 5+)
fs.mkdirSync(OUT, { recursive: true });
const RESULTS = path.join(OUT, "pass2-results.jsonl");
const record = (row: Record<string, unknown>) => fs.appendFileSync(RESULTS, JSON.stringify({ viewport: VP, utc: new Date().toISOString(), ...row }) + "\n");
const shot = async (page: Page, label: string) => { const file = path.join(OUT, `payload-${label}-${VP}.png`); await page.screenshot({ path: file, fullPage: false }); return { file: path.relative(path.resolve(__dirname, ".."), file), utc: new Date().toISOString() }; };
const noOverflow = async (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
const collectErrors = (page: Page) => { const errs: string[] = []; page.on("pageerror", (e) => errs.push("pageerror: " + String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon|source map|DevTools|net::ERR_ABORTED|ERR_BLOCKED_BY_ORB|404/i.test(m.text())) errs.push("console: " + m.text().slice(0, 300)); }); return errs; };

type ChatCapture = { status: number | null; answerChars: number; headers: Record<string, string>; body: Record<string, unknown> | null };
/** Captures the next POST /api/chat: request headers + JSON body, HTTP status, and the number of answer characters streamed. */
async function captureChat(page: Page): Promise<() => Promise<ChatCapture>> {
  const cap: ChatCapture = { status: null, answerChars: 0, headers: {}, body: null };
  let done!: () => void; const settled = new Promise<void>((r) => { done = r; });
  const isChat = (u: string) => /\/api\/chat(\?|$)/.test(u) || /\/stream\?s=[A-G]$/.test(u); // the mock re-points POST /api/chat at the local paced stream
  const onReq = (req: Request) => { if (req.method() === "POST" && isChat(req.url())) { cap.headers = req.headers(); try { cap.body = req.postDataJSON(); } catch { cap.body = null; } } };
  page.on("request", onReq);
  page.on("response", async (res) => {
    if (res.request().method() !== "POST" || !isChat(res.url())) return;
    cap.status = res.status();
    try { const body = await res.text(); for (const line of body.split("\n")) { if (!line.startsWith("data:")) continue; const d = line.slice(5).trim(); if (!d || d === "[DONE]") continue; try { const f = JSON.parse(d); if (f.type === "TEXT_MESSAGE_CONTENT" && typeof f.delta === "string") cap.answerChars += f.delta.length; } catch { /* partial */ } } } catch { /* body unavailable */ }
    done();
  });
  return async () => { await Promise.race([settled, new Promise((r) => setTimeout(r, 200_000))]); page.off("request", onReq); return cap; };
}

/* ------------------------------------------------------------------ paced AG-UI mock stream (local server) ------------------------------------------------------------------ */
type Frame = Record<string, unknown>; type Step = Frame | number; // number = pause in ms
const F = (type: string, rest: Frame = {}): Frame => ({ type, ...rest });
const C = (name: string, value: Frame): Frame => ({ type: "CUSTOM", name: `ondemand.${name}`, value });
const text = (id: string, parts: string[], gap = 0): Step[] => [F("TEXT_MESSAGE_START", { messageId: id, role: "assistant" }), ...parts.flatMap((p) => (gap ? [F("TEXT_MESSAGE_CONTENT", { messageId: id, delta: p }), gap] : [F("TEXT_MESSAGE_CONTENT", { messageId: id, delta: p })])), F("TEXT_MESSAGE_END", { messageId: id })];
const SOURCES = [
  { url: "https://www.reuters.com/technology/uae-g42-ai-2026", title: "G42 expands sovereign AI compute", sourceName: "reuters.com" },
  { url: "https://www.bloomberg.com/news/articles/mbzuai-research-2026", title: "MBZUAI research output doubles", sourceName: "bloomberg.com" },
  { url: "https://www.ft.com/content/tii-falcon-models", title: "TII releases new Falcon models", sourceName: "ft.com" },
  { url: "https://www.thenationalnews.com/business/edge-group-2026", title: "EDGE Group autonomous systems", sourceName: "thenationalnews.com" },
  { url: "https://www.space42.ai/newsroom/satellite-ai", title: "Space42 satellite AI", sourceName: "space42.ai" },
];
const CITED_ANSWER = [
  "**Bottom line:** the UAE AI cluster is scaling on three fronts. ",
  "Compute: G42 is expanding sovereign capacity [Reuters](https://www.reuters.com/technology/uae-g42-ai-2026). ",
  "Research: MBZUAI doubled its output [Bloomberg](https://www.bloomberg.com/news/articles/mbzuai-research-2026) and TII shipped new Falcon models [FT](https://www.ft.com/content/tii-falcon-models). ",
  "Industry: EDGE Group [The National](https://www.thenationalnews.com/business/edge-group-2026) and Space42 [Space42](https://www.space42.ai/newsroom/satellite-ai) are the applied-AI anchors.\n\n",
  "- Signal strength: high\n- Data gaps: none\n",
];
const ARTIFACT = { id: "qa-art-1", name: "uae-ai-briefing.pdf", kind: "document", mime: "application/pdf", sizeBytes: 48213, version: 1, source: "generated", mediaId: null, mediaStatus: "local", mediaMessage: null, mediaSourceUrl: null, mediaUrlExpiresAt: null, mediaExternalUserId: null, mediaPlugins: null, threadId: null, sessionId: null, originEvent: "artifact_ready", contentUrl: "https://example.com/qa/uae-ai-briefing.pdf", thumbnailUrl: null, createdAt: "2026-10-21T12:00:00.000Z" };
const PLAN = C("plan", { objective: "Assess the UAE AI cluster momentum across compute, research and industry", steps: [{ id: "1", title: "Research sovereign compute capacity", plugins: ["Perplexity"] }, { id: "2", title: "Compare research output", plugins: ["Perplexity"] }, { id: "3", title: "Map applied-AI anchors", plugins: ["Perplexity"] }] });
const tool = (id: string, stepId: string, q: string, ms: number): Step[] => [F("TOOL_CALL_START", { toolCallId: id, toolCallName: "Perplexity", parentMessageId: "m1" }), F("TOOL_CALL_ARGS", { toolCallId: id, delta: JSON.stringify({ plugin: "Perplexity", pluginId: PINNED_PLUGIN_ID, query: q, stepId }) }), ms, F("TOOL_CALL_END", { toolCallId: id }), F("TOOL_CALL_RESULT", { toolCallId: id, messageId: `r-${id}`, role: "tool", content: JSON.stringify({ status: "ok", sources: 2, durationMs: ms }) })];
const think = (delta: string, kind = "planning_thinking"): Frame => C("thinking", { delta, kind });
const LONG_THINK = Array.from({ length: 12 }, (_, i) => `Considering angle ${i + 1}: how the ${["compute", "research", "talent", "capital", "policy", "export"][i % 6]} dimension affects the cluster. `).join("");

const SCENARIOS: Record<string, Step[]> = {
  // A — deliverables: an artifact becomes ready + Outputs (step_output) after the run.
  A: [F("RUN_STARTED", { threadId: "t", runId: "A" }), C("status", { phase: "planning" }), think("Planning the deliverable. "), PLAN, C("step", { phase: "start", stepId: "1", index: 1, label: "Research sovereign compute capacity" }), ...tool("tc-a1", "1", "UAE sovereign AI compute 2026", 300), C("step_output", { stepId: "1", title: "Research sovereign compute capacity", plugins: [{ pluginId: PINNED_PLUGIN_ID, name: "Perplexity", params: { query: "UAE sovereign AI compute 2026" } }] }), C("step", { phase: "done", stepId: "1", index: 1 }), C("sources", { sources: SOURCES }), 200, ...text("m1", CITED_ANSWER, 60), C("artifact", { phase: "creating", key: "art-1", name: ARTIFACT.name, origin: "agent" }), 300, C("artifact", { phase: "ready", key: "art-1", name: ARTIFACT.name, kind: "document", artifact: ARTIFACT, origin: "agent" }), F("RUN_FINISHED", { threadId: "t", runId: "A" })],
  // B — pipeline & waiting: plan with 3 steps, tool rows running, timer ticking, a pending summary while "waiting".
  B: [F("RUN_STARTED", { threadId: "t", runId: "B" }), C("status", { phase: "planning" }), think("Breaking the question into three steps. "), PLAN, 150, C("step", { phase: "start", stepId: "1", index: 1, label: "Research sovereign compute capacity" }), C("status", { phase: "researching" }), ...tool("tc-b1", "1", "UAE sovereign AI compute", 2200), C("step", { phase: "done", stepId: "1", index: 1 }), C("summary", { phase: "start", index: 1, stepId: "1" }), 1500, C("summary", { phase: "done", index: 1, stepId: "1", text: "Step 1: compute capacity is expanding at G42 and MBZUAI.", at: "2026-10-21T12:00:05.000Z" }), C("step", { phase: "start", stepId: "2", index: 2, label: "Compare research output" }), ...tool("tc-b2", "2", "MBZUAI TII research output", 1500), C("step", { phase: "done", stepId: "2", index: 2 }), C("step", { phase: "start", stepId: "3", index: 3, label: "Map applied-AI anchors" }), ...tool("tc-b3", "3", "EDGE Space42 applied AI", 800), C("step", { phase: "done", stepId: "3", index: 3 }), C("sources", { sources: SOURCES }), ...text("m1", CITED_ANSWER, 40), F("RUN_FINISHED", { threadId: "t", runId: "B" })],
  // C — citations: plugin sources + markdown links → chips + Sources list.
  C: [F("RUN_STARTED", { threadId: "t", runId: "C" }), C("status", { phase: "researching" }), think("Collecting sources. "), ...tool("tc-c1", "", "UAE AI cluster news", 200), C("sources", { sources: SOURCES }), ...text("m1", CITED_ANSWER, 50), F("RUN_FINISHED", { threadId: "t", runId: "C" })],
  // D — root-first: a long quiet window before the first text delta so the skeleton/run-view paint ordering is observable.
  D: [F("RUN_STARTED", { threadId: "t", runId: "D" }), 400, C("status", { phase: "planning" }), think("Thinking before any answer token. "), 600, PLAN, C("step", { phase: "start", stepId: "1", index: 1, label: "Research sovereign compute capacity" }), ...tool("tc-d1", "1", "UAE sovereign AI compute", 700), C("step", { phase: "done", stepId: "1", index: 1 }), C("sources", { sources: SOURCES }), 300, ...text("m1", CITED_ANSWER, 50), F("RUN_FINISHED", { threadId: "t", runId: "D" })],
  // E — three between-step summaries while the run is live; long thinking + many answer deltas so the thread scrolls.
  E: [F("RUN_STARTED", { threadId: "t", runId: "E" }), C("status", { phase: "planning" }), ...Array.from({ length: 6 }, () => think(LONG_THINK)), PLAN, C("step", { phase: "start", stepId: "1", index: 1, label: "Research sovereign compute capacity" }), ...tool("tc-e1", "1", "UAE sovereign AI compute", 500), C("step", { phase: "done", stepId: "1", index: 1 }), C("summary", { phase: "start", index: 1, stepId: "1" }), 500, C("summary", { phase: "done", index: 1, stepId: "1", text: "Summary 1: compute is expanding.", at: "2026-10-21T12:00:01.000Z" }), 300, C("step", { phase: "start", stepId: "2", index: 2, label: "Compare research output" }), ...tool("tc-e2", "2", "MBZUAI TII research output", 500), C("step", { phase: "done", stepId: "2", index: 2 }), C("summary", { phase: "start", index: 2, stepId: "2" }), 500, C("summary", { phase: "done", index: 2, stepId: "2", text: "Summary 2: research output doubled.", at: "2026-10-21T12:00:02.000Z" }), 300, C("step", { phase: "start", stepId: "3", index: 3, label: "Map applied-AI anchors" }), ...tool("tc-e3", "3", "EDGE Space42 applied AI", 500), C("step", { phase: "done", stepId: "3", index: 3 }), C("summary", { phase: "start", index: 3, stepId: "3" }), 500, C("summary", { phase: "done", index: 3, stepId: "3", text: "Summary 3: applied anchors mapped.", at: "2026-10-21T12:00:03.000Z" }), 300, C("sources", { sources: SOURCES }), ...text("m1", Array.from({ length: 70 }, (_, i) => `Paragraph ${i + 1}: ${CITED_ANSWER[1]}\n\n`), 150), F("RUN_FINISHED", { threadId: "t", runId: "E" })],
};
// PROTOCOL FIX (cycle 6): Playwright's route.continue({url}) must keep the request's protocol, so against an https: baseURL the paced
// stream is served over HTTPS with a throw-away self-signed cert (openssl, generated in beforeAll); http: baseURLs keep the plain server.
let BASE_PROTO: "http" | "https" = "http";
let server: http.Server | https.Server; let port = 0;
function selfSigned(): { key: Buffer; cert: Buffer } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-payload-tls-")); const key = path.join(dir, "key.pem"); const cert = path.join(dir, "cert.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", cert, "-days", "2", "-subj", "/CN=127.0.0.1", "-addext", "subjectAltName=IP:127.0.0.1"], { stdio: "ignore" });
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}
test.beforeAll(async () => {
  BASE_PROTO = String(test.info().project.use.baseURL ?? process.env.BASE_URL ?? "").startsWith("https:") ? "https" : "http";
  const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const u = new URL(req.url ?? "/", "http://x"); const steps = SCENARIOS[u.searchParams.get("s") ?? ""];
    if (!steps) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", "x-ondemand-session": "qa-mock-session", "access-control-allow-origin": "*", "access-control-expose-headers": "x-ondemand-session" });
    (async () => { for (const s of steps) { if (typeof s === "number") await new Promise((r) => setTimeout(r, s)); else res.write(`data: ${JSON.stringify(s)}\n\n`); } res.write("data: [DONE]\n\n"); res.end(); })().catch(() => res.end());
  };
  server = BASE_PROTO === "https" ? https.createServer(selfSigned(), handler) : http.createServer(handler);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  port = (server.address() as { port: number }).port;
});
test.afterAll(async () => { await new Promise<void>((r) => server.close(() => r())); });
/** Re-point POST /api/chat at the paced local stream for scenario `s` (GET /api/chat/prewarm etc. pass through to the real server). */
const mockChat = (page: Page, s: string) => page.route("**/api/chat", (route) => (route.request().method() === "POST" ? route.continue({ url: `${BASE_PROTO}://127.0.0.1:${port}/stream?s=${s}` }) : route.continue()));
async function ask(page: Page, q: string) { await page.goto("/chat?skip=1"); await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 }); await page.getByTestId("composer-input").fill(q); await page.getByTestId("composer-send").click(); }
const settled = (page: Page) => expect.poll(async () => (await page.getByTestId("run-view").last().getByTestId("run-timer").getAttribute("data-state")) ?? "frozen", { timeout: 60_000, intervals: [300] }).toBe("frozen");
const check = (rows: Record<string, boolean>) => { for (const [k, v] of Object.entries(rows)) expect(v, k).toBe(true); };

// PROTOCOL FIX (cycle 6): ignoreHTTPSErrors accepts the self-signed paced-stream cert; the launch args turn off Chromium ≥ 130's
// Local Network Access gate (a public https origin fetching 127.0.0.1 is otherwise CORS-blocked with "Permission was denied").
const LNA_ARGS = ["--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,PrivateNetworkAccessForNavigations"];
test.use({
  viewport: { width: VIEWPORT[0], height: VIEWPORT[1] },
  ignoreHTTPSErrors: true,
  launchOptions: async ({ launchOptions }, use) => use({ ...launchOptions, args: [...(launchOptions.args ?? []), ...LNA_ARGS] }),
});
test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ page }) => { await primeSettings(page); });

// ---------------------------------------------------------------------------------------------------------------------------------- A
test("A — deliverables: artifact card + Outputs surfaced after the run", async ({ page }) => {
  // ADAPTED: deliverables-shelf / version history / gold CTA no longer exist. The current UI surfaces run deliverables as
  // inline-artifacts → artifact-card (from CUSTOM ondemand.artifact phase=ready) and the Outputs card (CUSTOM ondemand.step_output,
  // opened from the run header's Outputs button).
  const errs = collectErrors(page); await mockChat(page, "A"); const got = await captureChat(page);
  await ask(page, "Plan aid delivery around a blocked Strait of Hormuz");
  const run = page.getByTestId("run-view").last();
  await expect(run.getByTestId("inline-artifacts")).toBeVisible({ timeout: 60_000 }); await settled(page);
  const cap = await got(); const rows: Record<string, boolean> = {};
  const card = run.locator("[data-testid=artifact-card]");
  rows["one artifact-card inside inline-artifacts"] = (await card.count()) === 1 && (await card.getAttribute("data-kind")) === "document";
  rows["artifact card shows the file name"] = ((await card.textContent()) ?? "").includes("uae-ai-briefing.pdf");
  rows["artifact card offers Open/Download actions"] = (await card.getByRole("button").count()) + (await card.locator("a[href]").count()) >= 1;
  const outBtn = run.getByTestId("run-status-outputs");
  rows["Outputs button in the run header"] = (await outBtn.count()) === 1;
  if (await outBtn.count()) { await outBtn.click(); await expect(run.getByTestId("outputs-card")).toBeVisible(); }
  rows["outputs-card lists the step call"] = (await run.getByTestId("outputs-card").count()) === 1 && ((await run.getByTestId("outputs-card").textContent()) ?? "").includes("Research sovereign compute capacity");
  rows["answer rendered"] = ((await run.getByTestId("answer-block").textContent()) ?? "").includes("Bottom line");
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  await card.scrollIntoViewIfNeeded(); const s = await shot(page, "A");
  record({ payload: "A", http_status: cap.status, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  check(rows); expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- B
test("B — pipeline & waiting: plan-stepper steps, live run header + timer, working rows, step summary", async ({ page }) => {
  // ADAPTED: the 5-stage pipeline rail + Waiting-for-you creds card (+ /api/chat/creds relay) were part of the reverted feature.
  // The current pipeline surface is plan-stepper → plan-step rows (data-state pending/running/done) with working-row chips per step,
  // run-status-header + run-timer (data-state=running) while live, and a step-summary that is pending ("waiting") then done.
  const errs = collectErrors(page); await mockChat(page, "B"); const got = await captureChat(page);
  await ask(page, "Profile Oman as an aid-staging country");
  const run = page.getByTestId("run-view").last(); const rows: Record<string, boolean> = {};
  await expect(run.getByTestId("plan-stepper")).toBeVisible({ timeout: 60_000 });
  rows["plan-stepper has 3 plan-step rows + objective"] = (await run.getByTestId("plan-step").count()) === 3 && (await run.getByTestId("plan-objective").count()) === 1;
  await expect(run.locator("[data-testid=plan-step][data-state=running]").first()).toBeVisible({ timeout: 10_000 });
  await expect(run.locator("[data-testid=working-row][data-state=running]").first()).toBeVisible({ timeout: 10_000 });
  rows["a plan-step is running with a running working-row"] = true;
  const header = run.getByTestId("run-status-header");
  rows["run-status-header live while running"] = (await header.getAttribute("data-live")) === "true";
  const timer = run.getByTestId("run-timer");
  const t1 = Number(await timer.getAttribute("data-ms")); await page.waitForTimeout(800); const t2 = Number(await timer.getAttribute("data-ms"));
  rows["run-timer ticks while live"] = (await timer.getAttribute("data-state")) === "running" && t2 > t1;
  const pending = run.locator("[data-testid=step-summary][data-state=pending]");
  await expect(pending.first()).toBeVisible({ timeout: 15_000 });
  rows["step summary shows a pending/waiting state between steps"] = (await pending.count()) >= 1;
  const s = await shot(page, "B");
  await expect(run.locator("[data-testid=step-summary][data-state=done]").first()).toBeVisible({ timeout: 15_000 });
  rows["pending summary resolves to done"] = true;
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 60_000 }); await settled(page);
  const cap = await got();
  rows["all 3 steps done after the run"] = (await run.locator("[data-testid=plan-step][data-state=done]").count()) === 3;
  rows["3 working rows, all done"] = (await run.getByTestId("working-row").count()) === 3 && (await run.locator("[data-testid=working-row][data-state=done]").count()) === 3;
  rows["timer frozen after RUN_FINISHED"] = (await timer.getAttribute("data-state")) === "frozen";
  rows["no error notice"] = (await page.getByTestId("chat-error").count()) === 0;
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "B", http_status: cap.status, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  check(rows); expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- C
test("C — citations: publisher chips in the answer, Sources list, safe outbound anchors", async ({ page }) => {
  // ADAPTED: rail-citation-chip / +N focus / source stepping lived in the reverted pipeline rail. Kept: inline citation-chip
  // (publisher-first, data-publisher), the collapsed Sources strip (sources-list → source-link) and the outbound-anchor policy.
  const errs = collectErrors(page); await mockChat(page, "C"); const got = await captureChat(page);
  await ask(page, "Plan aid delivery around a blocked Strait of Hormuz");
  const run = page.getByTestId("run-view").last();
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 60_000 }); await settled(page);
  const cap = await got(); const rows: Record<string, boolean> = {};
  const inline = run.locator("[data-testid=answer-block] [data-testid=citation-chip]");
  await expect(inline.first()).toBeVisible({ timeout: 10_000 });
  const pubs = await inline.evaluateAll((els) => els.map((e) => e.getAttribute("data-publisher") ?? ""));
  rows["≥4 inline publisher chips (lower-case publisher names)"] = pubs.length >= 4 && pubs.every((p) => /^[a-z0-9.-]+$/.test(p)) && pubs.includes("reuters") && pubs.includes("bloomberg") && pubs.includes("ft");
  const srcs = run.getByTestId("sources-list"); await expect(srcs).toBeVisible({ timeout: 10_000 });
  rows["Sources (5) strip under the answer"] = (await srcs.getAttribute("data-count")) === "5";
  await srcs.getByTestId("sources-toggle").click(); await expect(run.getByTestId("source-link").first()).toBeVisible();
  rows["5 source-link rows"] = (await run.getByTestId("source-link").count()) === 5;
  const bad = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>("[data-testid=answer-block] a[href], [data-testid=sources-list] a[href]")].filter((a) => !/^https:\/\//.test(a.href) || a.target !== "_blank" || !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel) || /perplexity\.ai|google\.com\/url|utm_|\/r\/[a-z]+\/go|\/api\/(go|out|redirect)/i.test(a.href)).map((a) => a.href));
  rows["every outbound anchor https + _blank + noopener noreferrer, no proxy/tracking"] = bad.length === 0;
  rows["chip href is the exact cited URL"] = await inline.first().evaluate((a) => (a as HTMLAnchorElement).href === a.getAttribute("data-expected"));
  const s = await shot(page, "C");
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "C", http_status: cap.status, answer_chars: cap.answerChars, rows, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs, bad_anchors: bad, publishers: pubs });
  check(rows); expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- D
test("D — root-first: run skeleton/run-view paints before the first text delta; no broken images; no overflow", async ({ page }) => {
  // ADAPTED: iui-root / iui-slot / ODImage / HtmlView sandbox / lightbox no longer exist. The root-first contract on this UI is:
  // run-skeleton (first-event skeleton) or run-view mounts BEFORE answer-block (first text delta); every <img> loads or is hidden.
  const errs = collectErrors(page); await mockChat(page, "D"); const got = await captureChat(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __firstPaint: Record<string, number> }; w.__firstPaint = {};
    const ids = ["run-skeleton", "run-view", "thinking-block", "plan-stepper", "answer-block"];
    const mo = new MutationObserver(() => { for (const id of ids) if (!(id in w.__firstPaint) && document.querySelector(`[data-testid=${id}]`)) w.__firstPaint[id] = performance.now(); });
    document.addEventListener("DOMContentLoaded", () => mo.observe(document.body, { childList: true, subtree: true }));
  });
  await ask(page, "Plan aid delivery around a blocked Strait of Hormuz");
  const run = page.getByTestId("run-view").last();
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 60_000 }); await settled(page);
  const cap = await got(); const rows: Record<string, boolean> = {};
  const first = await page.evaluate(() => (window as unknown as { __firstPaint: Record<string, number> }).__firstPaint);
  const rootAt = Math.min(first["run-skeleton"] ?? Infinity, first["run-view"] ?? Infinity);
  rows["skeleton/run-view painted before the first answer token"] = Number.isFinite(rootAt) && first["answer-block"] != null && rootAt < first["answer-block"];
  rows["thinking + plan painted before the answer"] = first["thinking-block"] != null && first["plan-stepper"] != null && first["thinking-block"] < first["answer-block"] && first["plan-stepper"] < first["answer-block"];
  rows["run-view is the only run root after mount (skeleton unmounted)"] = (await page.getByTestId("run-skeleton").count()) === 0 && (await page.getByTestId("run-view").count()) === 1;
  rows["no broken-image icon"] = await page.evaluate(() => new Promise<boolean>((r) => { const t = Date.now(); (function p() { const imgs = [...document.images]; const done = imgs.every((i) => i.complete); if (done || Date.now() - t > 5000) return r(imgs.every((i) => !i.complete || i.naturalWidth > 0 || getComputedStyle(i).visibility === "hidden" || getComputedStyle(i).display === "none")); setTimeout(p, 100); })(); }));
  const s = await shot(page, "D");
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "D", http_status: cap.status, answer_chars: cap.answerChars, rows, first_paint: first, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  check(rows); expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- E
test("E — between-step summaries keep thinking/working mounted; scroll anchoring respected", async ({ page }) => {
  const errs = collectErrors(page); await mockChat(page, "E"); const got = await captureChat(page);
  await ask(page, "Review three aid corridors and summarise between steps");
  const run = page.getByTestId("run-view").last();
  await expect(run.getByTestId("thinking-block")).toBeVisible({ timeout: 60_000 });
  await expect(run.getByTestId("working-list").first()).toBeVisible({ timeout: 30_000 });
  // Same dataset-identity trick as the original: tag the LIVE nodes, re-read after each summary while data-live=true.
  await page.evaluate(() => { const tb = document.querySelector("[data-testid=run-view] [data-testid=thinking-block]") as HTMLElement | null; const wl = document.querySelector("[data-testid=run-view] [data-testid=working-list]") as HTMLElement | null; if (tb) tb.dataset.identity = "tb-1"; if (wl) wl.dataset.identity = "wl-1"; });
  const identity = () => page.evaluate(() => ({ tb: (document.querySelector("[data-testid=run-view] [data-testid=thinking-block]") as HTMLElement | null)?.dataset.identity ?? null, wl: (document.querySelector("[data-testid=run-view] [data-testid=working-list]") as HTMLElement | null)?.dataset.identity ?? null, rows: document.querySelectorAll("[data-testid=run-view] [data-testid=working-row]").length, live: document.querySelector("[data-testid=run-view]")?.getAttribute("data-live"), summaries: document.querySelectorAll("[data-testid=run-view] [data-testid=step-summary][data-state=done]").length }));
  const done = run.locator("[data-testid=step-summary][data-state=done]");
  await expect(done).toHaveCount(1, { timeout: 30_000 }); const afterS1 = await identity();
  await expect(done).toHaveCount(2, { timeout: 30_000 }); const afterS2 = await identity();
  await expect(done).toHaveCount(3, { timeout: 30_000 }); const afterS3 = await identity();
  // Scroll anchoring while the long answer streams: the shell follows the bottom until the user scrolls up, then shows jump-to-latest
  // and never yanks the user back (ADAPTED: this OpenUI build exposes no data-pinned-to-bottom attribute → assert the pill + scrollTop).
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 30_000 });
  const scroller = page.locator(".chat-shell .openui-agent-thread-scroll-area");
  await expect.poll(() => scroller.evaluate((n) => n.scrollHeight - n.clientHeight), { timeout: 20_000 }).toBeGreaterThan(300);
  const followed = await scroller.evaluate((n) => n.scrollHeight - n.scrollTop - n.clientHeight < 160);
  // ADAPTED: OpenUI's useScrollToBottom only treats a scroll as USER-initiated after a wheel/touch/mousedown event (a bare scrollTop write is
  // re-pinned as "programmatic"), so the manual scroll-up is a real mouse wheel over the thread, as a person would do it.
  const box = (await scroller.boundingBox())!; await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -1500); await page.waitForTimeout(60); }
  await page.waitForTimeout(400); const topA = await scroller.evaluate((n) => n.scrollTop); const pillA = await page.getByTestId("jump-to-latest").count(); const liveA = await run.getAttribute("data-live");
  await page.waitForTimeout(900); const top = await scroller.evaluate((n) => n.scrollTop);
  const yanked = top - topA > 200; const pill = Math.max(pillA, await page.getByTestId("jump-to-latest").count());
  const s = await shot(page, "E");
  await settled(page); const cap = await got(); const rows: Record<string, boolean> = {};
  rows["thinking block NOT remounted across summary frames (live run)"] = afterS1.tb === "tb-1" && afterS2.tb === "tb-1" && afterS3.tb === "tb-1" && afterS2.live === "true";
  rows["working list NOT remounted"] = afterS1.wl === "wl-1" && afterS2.wl === "wl-1" && afterS3.wl === "wl-1";
  rows["working rows monotonic 1 → 3, never reset"] = afterS1.rows >= 1 && afterS2.rows >= afterS1.rows && afterS3.rows === 3;
  rows["3 between-step summaries rendered"] = afterS3.summaries === 3;
  rows["followed the stream while pinned to bottom"] = followed;
  rows["manual scroll-up respected (not yanked back) + jump-to-latest pill shown"] = top < 120 && !yanked && pill === 1;
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "E", http_status: cap.status, answer_chars: cap.answerChars, rows, identity: { afterS1, afterS2, afterS3 }, scroll: { followed, topAfterWheel: topA, topLater: top, yanked, pill, liveAtCheck: liveA }, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  check(rows); expect(cap.status).toBe(200); expect(cap.answerChars).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------------------------------------------------------------- F
test("F — settings & plugin caps: pinned plugin locked, directory cap, request mirrors the inspector (REAL backend)", async ({ page }) => {
  test.skip(!hasKey(), "needs ONDEMAND_API_KEY for the live turn");
  // ADAPTED: the ONDEMAND SETTINGS drawer (od-settings-*, 25→20 id sanitiser, endpoint override headers) was removed with the feature.
  // The current surface is the inspector's plugin panel (sidebar-plugins): Perplexity pinned (toggle disabled + checked, cannot be
  // removed), list capped at MERGED_LIST_CAP, and POST /api/chat body.context.pluginIds mirrors the panel's data-selected.
  // LIVE NOTE: the run goes to the real OnDemand backend. The pinned Perplexity plugin currently answers "insufficient credits" upstream,
  // so the turn ends with the discreet "Response failed · Retry" notice although an answer streams — we assert HTTP 200 + non-empty
  // answer-block, NOT the absence of the notice (upstream condition, not an app bug).
  const errs = collectErrors(page);
  await page.goto("/chat?skip=1"); await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("inspector-toggle").click(); const drawer = page.getByTestId("chat-inspector"); await expect(drawer).toHaveAttribute("data-open", "true");
  const panel = drawer.getByTestId("sidebar-plugins"); await expect(panel).toBeVisible();
  const rows: Record<string, boolean> = {};
  const pinned = panel.locator(`[data-testid=plugin-toggle][data-plugin-id="${PINNED_PLUGIN_ID}"]`);
  rows["pinned Perplexity toggle disabled + checked (cannot be removed)"] = (await pinned.count()) === 1 && (await pinned.isDisabled()) && (await pinned.getAttribute("aria-checked")) === "true";
  await pinned.click({ force: true }).catch(() => undefined);
  rows["force-click does not unpin"] = (await pinned.getAttribute("aria-checked")) === "true" && ((await panel.getAttribute("data-selected")) ?? "").split(",")[0] === PINNED_PLUGIN_ID;
  const shown = Number(await panel.getByTestId("plugin-showing").getAttribute("data-shown"));
  rows[`idle list capped at MERGED_LIST_CAP=${MERGED_LIST_CAP}`] = shown > 0 && shown <= MERGED_LIST_CAP && (await panel.getByTestId("plugin-toggle").count()) <= MERGED_LIST_CAP;
  // toggle ONE optional plugin on → selection must carry pinned first + that id
  const optional = panel.locator("[data-testid=plugin-toggle]:not([data-pinned])").first(); const optId = await optional.getAttribute("data-plugin-id");
  await optional.click(); await expect(optional).toHaveAttribute("aria-checked", "true");
  const selected = ((await panel.getAttribute("data-selected")) ?? "").split(",").filter(Boolean);
  rows["selection = pinned first + toggled plugin"] = selected[0] === PINNED_PLUGIN_ID && !!optId && selected.includes(optId);
  const s = await shot(page, "F");
  await page.getByTestId("inspector-close").click();
  const got = await captureChat(page);
  await page.getByTestId("composer-input").fill("In one sentence, what does G42 do?"); await page.getByTestId("composer-send").click();
  const run = page.getByTestId("run-view").last();
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 200_000 });
  await expect.poll(async () => ((await run.getByTestId("answer-block").textContent()) ?? "").trim().length, { timeout: 60_000 }).toBeGreaterThan(20);
  const cap = await got();
  const ctx = (cap.body?.context ?? {}) as { pluginIds?: string[]; externalUserId?: string };
  rows["POST body context.pluginIds mirrors the inspector selection"] = JSON.stringify(ctx.pluginIds ?? []) === JSON.stringify(selected);
  rows["POST body carries externalUserId INV-001"] = ctx.externalUserId === "INV-001";
  rows["x-ondemand-key header sent when a client key is set"] = !!cap.headers["x-ondemand-key"];
  rows["HTTP 200 with non-empty answer (live)"] = cap.status === 200 && cap.answerChars > 0;
  rows["no horizontal overflow"] = await noOverflow(page); rows["zero console/page errors"] = errs.length === 0;
  record({ payload: "F", http_status: cap.status, answer_chars: cap.answerChars, rows, selected, optional_plugin: optId, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs, live_notice_present: (await page.getByTestId("chat-error").count()) > 0 });
  check(rows);
});

// ---------------------------------------------------------------------------------------------------------------------------------- G
test("G — forced /api/chat 500 → discreet notice only; Retry → 200 with answer (REAL backend); cross-app regression sweep", async ({ page }) => {
  test.skip(!hasKey(), "needs ONDEMAND_API_KEY for the live retry");
  const errs = collectErrors(page); let posts = 0;
  await page.route("**/api/chat", async (route) => { if (route.request().method() === "POST") { posts++; if (posts === 1) return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "upstream exploded: TypeError at bridge.ts:912 stack trace follows" } }) }); } return route.continue(); });
  await ask(page, "Tell me about Technology Innovation Institute in one line.");
  const notice = page.getByTestId("chat-error"); await expect(notice).toBeVisible({ timeout: 60_000 });
  const rows: Record<string, boolean> = {};
  const visible = await page.evaluate(() => (document.querySelector("main") as HTMLElement | null)?.innerText ?? document.body.innerText);
  const libBoxHidden = await page.locator(".openui-agent-thread-error").evaluateAll((els) => els.every((e) => getComputedStyle(e).display === "none" || e.getBoundingClientRect().height === 0));
  // ADAPTED (390 px): the mobile nav drawer is a permanent role=dialog aria-modal surface that sits CLOSED (aria-hidden + inert, translated
  // off-canvas) — an open modal is one that is not aria-hidden/inert and intersects the viewport.
  const modalWithText = await page.locator("[role=dialog][aria-modal=true]").evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return (e as HTMLElement).innerText.trim().length > 0 && r.height > 0 && e.getAttribute("aria-hidden") !== "true" && !e.hasAttribute("inert") && r.right > 0 && r.left < innerWidth; }).length);
  rows["discreet notice 'Response failed' + Retry only"] = ((await notice.textContent()) ?? "").includes("Response failed") && (await page.getByTestId("chat-error-retry").count()) === 1 && (await page.getByTestId("chat-error-raw").count()) === 0;
  const RAW_RE = /upstream exploded|TypeError|bridge\.ts|stack trace|HTTP 500|500 \(|Internal Server Error|Something went wrong|could not be completed/i;
  const rawHit = RAW_RE.exec(visible)?.[0] ?? null; const rawCtx = rawHit ? visible.slice(Math.max(0, visible.indexOf(rawHit) - 80), visible.indexOf(rawHit) + 120) : null;
  rows["no raw error strings / stack traces / HTTP dumps / modal"] = !rawHit && libBoxHidden && modalWithText === 0;
  const s = await shot(page, "G");
  // LIVE NOTE: Retry goes to the real backend; the upstream Perplexity credit condition means the notice may reappear at the END of the
  // retried run — we assert HTTP 200 + a non-empty answer, not that the notice stays gone.
  const got = await captureChat(page);
  await page.getByTestId("chat-error-retry").click();
  const run = page.getByTestId("run-view").last();
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 200_000 });
  await expect.poll(async () => ((await run.getByTestId("answer-block").textContent()) ?? "").trim().length, { timeout: 60_000 }).toBeGreaterThan(20);
  const cap = await got();
  rows["Retry → a second POST, HTTP 200, non-empty answer"] = posts === 2 && cap.status === 200 && cap.answerChars > 0;
  rows["no horizontal overflow (chat)"] = await noOverflow(page);
  // cross-app regression sweep
  const sweep: Record<string, { errors: number; overflow: boolean; status: number | null }> = {};
  for (const route of ["/overview", "/watchlist", "/sentiment", "/news", "/radar", "/graph", "/briefing", "/methodology"]) {
    const before = errs.length; const res = await page.goto(route, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => null);
    await page.waitForTimeout(400);
    sweep[route] = { errors: errs.length - before, overflow: !(await noOverflow(page)), status: res?.status() ?? null };
  }
  rows["route sweep: HTTP 200, no page errors, no horizontal overflow"] = Object.values(sweep).every((r) => r.status === 200 && r.errors === 0 && !r.overflow);
  rows["zero console/page errors overall (500 noise excluded)"] = errs.filter((e) => !/500|Failed to load resource/.test(e)).length === 0;
  record({ payload: "G", http_status: cap.status, first_status: 500, answer_chars: cap.answerChars, rows, sweep, diag: { rawHit, rawCtx, libBoxHidden, modalWithText }, pass: Object.values(rows).every(Boolean), screenshot: s.file, screenshot_utc: s.utc, errors: errs });
  check(rows);
});
