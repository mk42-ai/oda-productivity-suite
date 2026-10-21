import { test, expect } from "@playwright/test";
import { primeSettings, hasKey, captureErrors } from "./helpers";

/**
 * a15 — two-turn session continuity in ONE thread (desktop 1440×900):
 *   send turn 1 → wait for `run-footer` → send turn 2 in the same thread →
 *   the second `run-view` renders BELOW the first, the first turn's `od-status` stays pinned (offsetTop unchanged),
 *   `rail-chats-list` lists exactly one thread for this session, no `chat-error`, no console/page errors.
 * Run: cd web && BASE_URL=<frontend> node node_modules/@playwright/test/cli.js test e2e/session-continuity.spec.ts --project=desktop --workers=1
 */
test.describe("session continuity — two turns, one thread", () => {
  test.skip(!hasKey(), "needs ON_DEMAND_API_KEY to send real turns");
  test.setTimeout(420_000);
  test.use({ viewport: { width: 1440, height: 900 } });

  // RETARGETED (cycle 5, decision: OdStatusView): turn 2 appends below turn 1; turn 1 od-status pinned; one thread in rail-chats-list; no errors
  test("turn 2 appends below turn 1; turn 1 od-status pinned; one thread; no errors", async ({ page }, testInfo) => {
    await primeSettings(page);
    const errors = captureErrors(page);
    const t0 = Date.now();
    await page.goto("/chat?skip=1");
    const input = page.getByTestId("composer-input");
    await expect(input).toBeVisible({ timeout: 30_000 });

    // ── turn 1
    await input.fill("What is the latest news about Technology Innovation Institute? Cite sources.");
    await page.getByTestId("composer-send").click();
    await expect(page.getByTestId("user-message").first()).toContainText("Technology Innovation Institute", { timeout: 30_000 });
    await expect(page.getByTestId("run-view")).toHaveCount(1, { timeout: 30_000 });
    await expect(page.getByTestId("run-footer").first()).toBeVisible({ timeout: 180_000 });
    await expect(page.getByTestId("run-view").first()).toHaveAttribute("data-live", "false", { timeout: 60_000 });
    const turn1Ms = Date.now() - t0;
    const footer1 = page.getByTestId("run-footer").first();
    const totalMs1 = Number(await page.getByTestId("answer-badge").first().getAttribute("data-total-ms"));

    // RETARGETED (cycle 5, decision: OdStatusView): live runs use OdStatusView (data-testid="od-status") instead of legacy thinking-block
    const firstOdStatus = page.getByTestId("od-status").first();
    const hasOdStatus = (await page.getByTestId("od-status").count()) > 0;
    const topBefore = hasOdStatus ? await firstOdStatus.evaluate((el) => (el as HTMLElement).offsetTop) : null;
    const run1Box = await page.getByTestId("run-view").first().boundingBox();
    expect(run1Box).not.toBeNull();

    // ── turn 2 in the SAME thread
    const t1 = Date.now();
    await input.fill("And EDGE Group?");
    await page.getByTestId("composer-send").click();
    await expect(page.getByTestId("user-message")).toHaveCount(2, { timeout: 30_000 });
    await expect(page.getByTestId("run-view")).toHaveCount(2, { timeout: 30_000 });
    // second run-view must sit BELOW the first (document order + geometry)
    const run2Box = await page.getByTestId("run-view").nth(1).boundingBox();
    expect(run2Box).not.toBeNull();
    expect(run2Box!.y).toBeGreaterThan(run1Box!.y);
    // RETARGETED (cycle 5, decision: OdStatusView): first turn's od-status did not move while turn 2 streams
    if (hasOdStatus) expect(await firstOdStatus.evaluate((el) => (el as HTMLElement).offsetTop)).toBe(topBefore);

    await expect(page.getByTestId("run-footer")).toHaveCount(2, { timeout: 180_000 });
    await expect(page.getByTestId("run-view").nth(1)).toHaveAttribute("data-live", "false", { timeout: 60_000 });
    const turn2Ms = Date.now() - t1;
    const totalMs2 = Number(await page.getByTestId("answer-badge").nth(1).getAttribute("data-total-ms"));
    await expect(footer1).toBeVisible();
    // RETARGETED (cycle 5, decision: OdStatusView): first turn's od-status remains pinned after turn 2 settles
    if (hasOdStatus) expect(await firstOdStatus.evaluate((el) => (el as HTMLElement).offsetTop)).toBe(topBefore);
    const run2After = await page.getByTestId("run-view").nth(1).boundingBox();
    expect(run2After!.y).toBeGreaterThan((await page.getByTestId("run-view").first().boundingBox())!.y);

    // RETARGETED (cycle 5, decision: OdStatusView): exactly one thread in rail-chats-list (desktop) for this session
    const rail = page.getByTestId("nav-rail");
    if ((await rail.getAttribute("data-collapsed")) === "true") {
      await page.getByTestId("rail-toggle").click();
    }
    const chatsList = page.getByTestId("rail-chats-list");
    await expect(chatsList).toBeVisible({ timeout: 15_000 });
    await expect(chatsList.locator('[data-testid="rail-chat-item"]')).toHaveCount(1);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("uaecc.chat.threads.v2") ?? "[]") as { id: string }[]);
    expect(stored.length).toBe(1);

    await expect(page.getByTestId("chat-error")).toHaveCount(0);
    expect(errors, errors.join("\n")).toEqual([]);

    const numbers = { turn1WallMs: turn1Ms, turn2WallMs: turn2Ms, badgeTotalMs: { turn1: totalMs1, turn2: totalMs2 }, odStatusTop: topBefore, run1Y: run1Box!.y, run2Y: run2Box!.y, threads: stored.length };
    await testInfo.attach("continuity-numbers", { body: JSON.stringify(numbers, null, 2), contentType: "application/json" });
    console.log("[session-continuity]", JSON.stringify(numbers));
    await page.screenshot({ path: "proof/pass-3/continuity/two-turn-1440.png", fullPage: false });
  });
});
