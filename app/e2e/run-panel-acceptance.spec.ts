import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { primeSettings, captureErrors } from "./helpers";

/**
 * a12 — run-panel acceptance spec (cycle 5). ONE chat turn per viewport (1440×900, 390×844), serial, against BASE_URL.
 * Numbered invariants (each `expect.soft` + annotation + ndjson line, so one failure never hides the others):
 *  1 run-view exists; run-header precedes od-status (or run-status-header) in DOM order;
 *  2 run-header offsetTop (relative to run-view) is stable (≤2 px) across ≥20 samples while streaming;
 *  3 inspector opens via inspector-toggle (chat-inspector data-open=true, width ≤ 360 at 1440) and run-rail is visible;
 *  4 no raw planner JSON visible in od-status or run-view;
 *  5 turn completes with answer-block; run settles (run-timer data-state=frozen or run-view data-live=false);
 *    if coverage-notice is present it contains "unavailable" and there is NO "Response failed" text;
 *  6 working-band absent;
 *  7 no console/page errors.
 * Log: proof/pass-3/run-panel-acceptance.ndjson
 */
const QUESTION = "What has TII announced recently?";
const PLAN_RAW_RE = /"plan_required"|"steps"\s*:|^\s*\{/;
const RAW_JSON_RE = /"pluginId"|api_request_parameters|plan_required/;
const LOG = path.join(__dirname, "..", "proof", "pass-3", "run-panel-acceptance.ndjson");

type Rec = { n: number; label: string; pass: boolean; detail?: unknown };

function logLine(info: TestInfo, viewport: string, rec: Rec) {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), base: process.env.BASE_URL ?? "", viewport, project: info.project.name, ...rec }) + "\n");
  info.annotations.push({ type: rec.pass ? `pass-${rec.n}` : `FAIL-${rec.n}`, description: `${rec.label}${rec.detail !== undefined ? ` — ${JSON.stringify(rec.detail).slice(0, 400)}` : ""}` });
}

/** Soft, numbered assertion: records the outcome, never throws (so later checks still run), but marks the test failed on a miss. */
function check(info: TestInfo, viewport: string, n: number, label: string, pass: boolean, detail?: unknown) {
  logLine(info, viewport, { n, label, pass, detail });
  expect.soft(pass, `(${n}) ${label}${detail !== undefined ? ` — ${JSON.stringify(detail).slice(0, 400)}` : ""}`).toBe(true);
}

const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      await primeSettings(page);
      const errs = captureErrors(page);
      await use(errs);
    },
    { auto: true },
  ],
});
test.describe.configure({ mode: "default" });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function acceptance(page: Page, errors: string[], viewport: string) {
  const info = test.info();
  test.skip(!process.env.BASE_URL && !(process.env.ONDEMAND_API_KEY ?? process.env.ON_DEMAND_API_KEY), "needs a live BASE_URL or an API key");
  await page.goto("/chat?skip=1");
  await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("composer-input").fill(QUESTION);
  await page.getByTestId("composer-send").click();
  const run = page.getByTestId("run-view").last();
  await expect(run).toBeVisible({ timeout: 30_000 });

  // ── (1) REWRITTEN (cycle 5): run-view exists; run-header precedes od-status (or run-status-header) in DOM order
  const runHeader = run.getByTestId("run-header");
  const odStatus = run.getByTestId("od-status");
  const statusHeader = run.getByTestId("run-status-header");
  await expect(runHeader).toBeVisible({ timeout: 15_000 });
  const hasStatusTarget = await expect.poll(async () => (await odStatus.count()) > 0 || (await statusHeader.count()) > 0, { timeout: 30_000, intervals: [200] }).toBe(true).then(() => true).catch(() => false);
  const headerPrecedes = await run.evaluate((el) => {
    const rh = el.querySelector('[data-testid="run-header"]');
    const target = el.querySelector('[data-testid="od-status"]') || el.querySelector('[data-testid="run-status-header"]');
    return !!rh && !!target && !!(rh.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
  }).catch(() => false);
  // REWRITTEN (cycle 5): assert run-view exists and run-header precedes od-status or run-status-header
  check(info, viewport, 1, "run-view exists and run-header precedes od-status/run-status-header in DOM order", hasStatusTarget && headerPrecedes, { hasStatusTarget, headerPrecedes });

  // ── (2) REWRITTEN (cycle 5): run-header offsetTop (relative to run-view) stays anchored (≤2 px) across ≥20 samples while streaming
  const tops: number[] = [];
  for (let i = 0; i < 24; i++) {
    const top = await run.evaluate((el) => {
      const h = el.querySelector<HTMLElement>('[data-testid="run-header"]');
      return h ? h.getBoundingClientRect().top - el.getBoundingClientRect().top : NaN;
    }).catch(() => NaN);
    if (!Number.isNaN(top)) tops.push(top);
    await sleep(100);
  }
  const spread = tops.length ? Math.max(...tops) - Math.min(...tops) : NaN;
  // REWRITTEN (cycle 5): assert run-header offsetTop moves <= 2 px across >= 20 samples
  check(info, viewport, 2, "run-header offsetTop (relative to run-view) moves ≤2 px across ≥20 samples", tops.length >= 20 && spread <= 2, { samples: tops.length, spread, min: tops.length ? Math.min(...tops) : null, max: tops.length ? Math.max(...tops) : null });

  // ── (5) REWRITTEN (cycle 5): run settles (run-timer data-state=frozen or run-view data-live=false); answer-block present
  const answered = await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 120_000 }).then(() => true).catch(() => false);
  const settled = await expect.poll(async () => {
    const timerState = await run.getByTestId("run-timer").getAttribute("data-state").catch(() => null);
    const liveAttr = await run.getAttribute("data-live").catch(() => null);
    return timerState === "frozen" || liveAttr === "false";
  }, { timeout: 60_000, intervals: [500] }).toBe(true).then(() => true).catch(() => false);
  // REWRITTEN (cycle 5): assert turn completes with answer-block and settles
  check(info, viewport, 5, "turn completes with answer-block and settles (run-timer frozen or run-view data-live=false)", answered && settled, { answered, settled });

  const coverageNotice = run.getByTestId("coverage-notice");
  let coverageValid = true;
  let coverageNoticeText = "";
  if (await coverageNotice.count()) {
    coverageNoticeText = (await coverageNotice.first().evaluate((el) => el.textContent || "").catch(() => "")) ?? "";
    coverageValid = coverageNoticeText.toLowerCase().includes("unavailable");
  }
  const fullText = (await run.evaluate((el) => el.textContent || "").catch(() => "")) ?? "";
  const noResponseFailed = !/Response failed/i.test(fullText);
  // REWRITTEN (cycle 5): assert coverage-notice contains 'unavailable' if present and no 'Response failed' text
  check(info, viewport, 5, "if coverage-notice is present it contains 'unavailable' and there is NO 'Response failed' text", coverageValid && noResponseFailed, { hasCoverage: (await coverageNotice.count()) > 0, coverageNoticeText, noResponseFailed });

  // ── (4) REWRITTEN (cycle 5): no raw planner JSON visible in od-status or run-view
  let odJsonClean = true;
  let odTextSample = "";
  if (await odStatus.count()) {
    const text = (await odStatus.first().evaluate((el) => el.textContent || "").catch(() => "")) ?? "";
    odTextSample = text.slice(0, 200);
    odJsonClean = !PLAN_RAW_RE.test(text);
  }
  const rawMatch = fullText.match(RAW_JSON_RE);
  // REWRITTEN (cycle 5): assert no raw planner JSON visible in od-status or run-view
  check(info, viewport, 4, "no raw planner JSON visible in od-status or run-view", odJsonClean && !rawMatch, { odJsonClean, sample: odTextSample, rawMatch: rawMatch?.[0] ?? null });

  // ── (3) REWRITTEN (cycle 5): inspector opens via inspector-toggle (chat-inspector data-open=true, width ≤ 360 at 1440) and run-rail is visible
  const toggle = page.getByTestId("inspector-toggle");
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  await toggle.click();
  const inspector = page.getByTestId("chat-inspector");
  await expect(inspector).toHaveAttribute("data-open", "true", { timeout: 10_000 });
  const railVisible = await inspector.getByTestId("run-rail").isVisible({ timeout: 5_000 }).catch(() => false);
  let widthValid = true;
  if (viewport === "1440x900") {
    const bbox = await inspector.boundingBox();
    widthValid = !!bbox && bbox.width <= 360.5;
  }
  // REWRITTEN (cycle 5): assert inspector opens with data-open=true, width <= 360 at 1440, and run-rail visible
  check(info, viewport, 3, "inspector opens via inspector-toggle (data-open=true, width ≤ 360 at 1440) and run-rail is visible", railVisible && widthValid, { railVisible, widthValid, viewport });

  // Close inspector cleanly using inspector-close button or Escape
  const closeBtn = page.getByTestId("inspector-close");
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click().catch(() => page.keyboard.press("Escape"));
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(inspector).toHaveAttribute("data-open", "false", { timeout: 5000 }).catch(() => {});
  await sleep(200);

  // ── (6) REWRITTEN (cycle 5): working-band absent throughout run and after settle
  const bandEnd = await run.getByTestId("working-band").count();
  // REWRITTEN (cycle 5): assert working-band absent after settle
  check(info, viewport, 6, "working-band absent after the turn settles", bandEnd === 0, { count: bandEnd });

  // ── (7) no console/page errors
  check(info, viewport, 7, "no console/page errors during the turn", errors.length === 0, { errors: errors.slice(0, 8) });

  const failed = info.annotations.filter((a) => a.type.startsWith("FAIL-")).map((a) => a.type.replace("FAIL-", "") + ": " + a.description);
  logLine(info, viewport, { n: 99, label: "summary", pass: failed.length === 0, detail: { failedNumbers: [...new Set(failed.map((f) => f.split(":")[0]))], failed } });
}

test.describe("run-panel acceptance — desktop 1440×900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("anchored run-header, od-status, inspector drawer, coverage notice, no raw JSON", async ({ page, errors }) => {
    test.setTimeout(150_000);
    await acceptance(page, errors, "1440x900");
  });
});

test.describe("run-panel acceptance — mobile 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("anchored run-header, od-status, inspector drawer, coverage notice, no raw JSON", async ({ page, errors }) => {
    test.setTimeout(150_000);
    await acceptance(page, errors, "390x844");
  });
});
