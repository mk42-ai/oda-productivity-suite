import { test, expect, hasKey } from "./helpers";
import type { Page } from "@playwright/test";

/**
 * unit1 — planner JSON filter: the Thinking body never carries plan / tool-definition JSON ("pluginId", api_request_parameters,
 * "… 2048 chars each" truncation markers); a6: the collapsed `planner-payload` disclosure lives ONLY inside the dev-disclosure (run rail).
 * Desktop 1440×900 + mobile 390×844. On the pre-unit1 build the first assertion FAILS (that is the before-state; do not weaken it).
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
  await expect(run.getByTestId("answer-block")).toBeVisible({ timeout: 200_000 });
  await expect.poll(async () => (await run.getByTestId("run-timer").getAttribute("data-state")) ?? "frozen", { timeout: 60_000, intervals: [500] }).toBe("frozen");
  return run;
}

function filterChecks() {
  test.skip(!hasKey() && !process.env.BASE_URL, "needs a live BASE_URL");
  test("Thinking body has no planner JSON; planner-payload lives only in dev-disclosure", async ({ page }) => {
    const run = await runOneTurn(page);
    // RETARGETED (cycle 5, decision: OdStatusView): Thinking = od-status (ThinkingProcess + StatusLogBlock)
    const odStatus = run.getByTestId("od-status");
    await expect(odStatus).toBeAttached();

    // If any collapsible StatusAccordion buttons are present (e.g. Thinking accordion), expand them
    const accordions = odStatus.locator("button[aria-expanded='false']");
    const count = await accordions.count();
    for (let i = 0; i < count; i++) {
      await accordions.nth(i).click().catch(() => {});
    }

    const odStatusText = await odStatus.innerText().catch(() => "");
    // RETARGETED (cycle 5, decision: OdStatusView): od-status text contains no planner JSON markers and no raw "plan_required" / {"objective" JSON
    expect(odStatusText, "thinking text must not match planner JSON markers").not.toMatch(PAYLOAD_RE);
    expect(odStatusText, "od-status text never contains plan_required or raw objective JSON").not.toMatch(/"plan_required"|{"objective"/);

    // a6: the planner-payload disclosure lives ONLY inside the single developer reveal (run-rail dev-disclosure), never in the run view.
    await expect(run.getByTestId("planner-payload"), "no planner-payload inside the run view").toHaveCount(0);
    expect(await run.innerText(), "run view never shows raw planner JSON").not.toMatch(/"plan_required"|"user_query"\s*:/);

    // RETARGETED (cycle 5, decision: OdStatusView): dev-disclosure inside run-rail in the inspector; open it via inspector-toggle
    const drawer = page.getByTestId("chat-inspector");
    if ((await drawer.count()) > 0 && (await drawer.getAttribute("data-open")) !== "true") {
      const toggle = page.getByTestId("inspector-toggle");
      if (await toggle.count()) await toggle.click();
    }

    const dev = page.locator("details[data-testid=dev-disclosure]");
    if (await dev.count()) {
      await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>("details[data-testid=dev-disclosure]"); if (d) d.open = true; });
      const payload = dev.getByTestId("planner-payload");
      if (await payload.count()) {
        await payload.locator("summary").click();
        await expect(payload.locator("pre").first()).toBeVisible();
        const n = Number(await payload.getAttribute("data-chars"));
        expect(n, "planner payload has content").toBeGreaterThan(0);
      } else {
        test.info().annotations.push({ type: "note", description: "no planner payload on this turn — dev-disclosure planner-payload assertion not applicable" });
      }
    }
  });
}

test.describe("desktop 1440×900", () => { test.use({ viewport: { width: 1440, height: 900 } }); filterChecks(); });
test.describe("mobile 390×844", () => { test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); filterChecks(); });
