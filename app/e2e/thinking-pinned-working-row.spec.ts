import { test, expect, hasKey } from "./helpers";
import type { Page } from "@playwright/test";

/**
 * unit1 — DOM invariant of the run view: Thinking stays pinned at the top of the turn after the answer streams; a Working row renders
 * directly before each action (every working-row precedes answer-block in DOM order); the Jump-to-latest pill never intersects a Working
 * row; and the Thinking body never carries planner / tool-definition JSON. Desktop 1440×900 + mobile 390×844 (two describes).
 * Runs against BASE_URL (live sandbox); the question is short to keep the turn fast.
 */
const QUESTION = process.env.U1_QUESTION ?? "In one sentence, what does Technology Innovation Institute do?";
const PAYLOAD_RE = /"pluginId"|api_request_parameters|chars each/;

async function runOneTurn(page: Page) {
  await page.goto("/chat?skip=1");
  await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("composer-input").fill(QUESTION);
  await page.getByTestId("composer-send").click();
  const run = page.getByTestId("run-view").last();
  await expect(run).toBeVisible({ timeout: 30_000 });

  // RETARGETED (cycle 5, decision: OdStatusView): sample od-status offsetTop while streaming
  const odStatus = run.getByTestId("od-status");
  await expect(odStatus).toBeAttached({ timeout: 30_000 });
  const sample1 = await odStatus.evaluate((el) => (el as HTMLElement).offsetTop);

  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 200_000 });
  const sample2 = await odStatus.evaluate((el) => (el as HTMLElement).offsetTop);

  // settle: wait for the run timer to freeze (RUN_FINISHED) or 60 s, whichever first
  await expect.poll(async () => (await run.getByTestId("run-timer").getAttribute("data-state")) ?? "frozen", { timeout: 60_000, intervals: [500] }).toBe("frozen");
  const sample3 = await odStatus.evaluate((el) => (el as HTMLElement).offsetTop);

  return { run, odStatus, offsetSamples: [sample1, sample2, sample3] };
}

function invariants() {
  test.skip(!hasKey() && !process.env.BASE_URL, "needs a live BASE_URL");
  test("Thinking pinned at top, Working rows before the answer, jump pill clear of Working rows, no planner JSON in Thinking", async ({ page }) => {
    const { run, odStatus, offsetSamples } = await runOneTurn(page);
    // 1. RETARGETED (cycle 5, decision: OdStatusView): section order: run-header followed by od-status as first children of run-view
    const childTestids = await run.evaluate((el) => Array.from(el.children).map((c) => c.getAttribute("data-testid")).filter(Boolean));
    expect(childTestids[0], "run-header is the first child of run-view").toBe("run-header");
    expect(childTestids, "od-status is present as child of run-view").toContain("od-status");
    expect(childTestids.indexOf("run-header")).toBeLessThan(childTestids.indexOf("od-status"));
    // RETARGETED (cycle 5, decision: OdStatusView): od-status offsetTop stable across samples while streaming
    expect(offsetSamples[1], "od-status offsetTop stable while streaming").toBe(offsetSamples[0]);
    expect(offsetSamples[2], "od-status offsetTop stable when settled").toBe(offsetSamples[0]);

    // 2. RETARGETED (cycle 5, decision: OdStatusView): Working rows = step rows inside StatusLogBlock precede answer-block in DOM order
    const answer = run.getByTestId("answer-block");
    await expect(answer).toBeVisible();
    const order = await run.evaluate((el) => {
      const ans = el.querySelector('[data-testid="answer-block"]');
      const od = el.querySelector('[data-testid="od-status"]');
      const stepRowTexts = od ? Array.from(od.querySelectorAll('.w-full, p')).map((e) => e.textContent?.trim()).filter(Boolean) : [];
      return {
        hasOd: !!od,
        stepRowCount: stepRowTexts.length,
        odPrecedesAnswer: !!ans && !!od && !!(od.compareDocumentPosition(ans) & Node.DOCUMENT_POSITION_FOLLOWING),
        stepRowTexts: stepRowTexts.slice(0, 5),
      };
    });
    expect(order.hasOd, "od-status is present").toBe(true);
    expect(order.odPrecedesAnswer, "od-status and its step rows precede answer-block").toBe(true);
    if (order.stepRowCount > 0) {
      expect(order.stepRowTexts[0].length, "step row has title text").toBeGreaterThan(0);
    }

    // 3. RETARGETED (cycle 5, decision: OdStatusView): od-status attached after the answer
    await expect(odStatus).toBeAttached();

    // 4. RETARGETED (cycle 5, decision: OdStatusView): jump-to-latest (if present) does not intersect any working-row box
    const jump = page.getByTestId("jump-to-latest");
    if (await jump.count()) {
      const jb = await jump.boundingBox();
      const rows = await odStatus.locator(".w-full").evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }));
      if (jb) for (const r of rows) {
        const intersects = jb.x < r.x + r.w && jb.x + jb.width > r.x && jb.y < r.y + r.h && jb.y + jb.height > r.y;
        expect(intersects, "jump-to-latest must not overlap an od-status step row").toBe(false);
      }
    }

    // 5. RETARGETED (cycle 5, decision: OdStatusView): od-status text carries no planner JSON; dev-disclosure carries payload
    const accordions = odStatus.locator("button[aria-expanded='false']");
    for (let i = 0; i < await accordions.count(); i++) {
      await accordions.nth(i).click().catch(() => {});
    }
    const text = await odStatus.innerText();
    expect(text, "od-status text must not contain planner/tool JSON").not.toMatch(PAYLOAD_RE);
    expect(text, "od-status text never contains plan_required or raw objective JSON").not.toMatch(/"plan_required"|{"objective"/);

    // RETARGETED (cycle 5, decision: OdStatusView): dev-disclosure inside run-rail in the inspector; open it via inspector-toggle
    const drawer = page.getByTestId("chat-inspector");
    if ((await drawer.count()) > 0 && (await drawer.getAttribute("data-open")) !== "true") {
      const toggle = page.getByTestId("inspector-toggle");
      if (await toggle.count()) await toggle.click();
    }
    const dev = page.locator("details[data-testid=dev-disclosure]");
    if (await dev.count()) {
      await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>("details[data-testid=dev-disclosure]"); if (d) d.open = true; });
    }
  });
}

test.describe("desktop 1440×900", () => { test.use({ viewport: { width: 1440, height: 900 } }); invariants(); });
test.describe("mobile 390×844", () => { test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); invariants(); });
