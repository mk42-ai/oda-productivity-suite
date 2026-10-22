import { test, expect, type Page } from "@playwright/test";

/**
 * Chat failure UX regression (2026-10-14):
 *  - forced /api/chat failure must NEVER paint raw error text ("The answer could not be completed",
 *    "Something went wrong", upstream exception prose) nor the library's own error box
 *    (.openui-agent-thread-error stays suppressed). ONLY the discreet notice
 *    "Response failed" + Retry ([data-testid=chat-error]) may appear.
 *  - clicking Retry genuinely resubmits: a NEW POST /api/chat is issued and, once the failure route
 *    is removed, a non-empty answer renders and the notice disappears.
 */

// AG-UI stream whose RUN_ERROR carries the exact raw string that must never be user-visible.
const FAIL_BODY = [
  `data: ${JSON.stringify({ type: "RUN_STARTED", threadId: "t", runId: "r1" })}`,
  `data: ${JSON.stringify({ type: "RUN_ERROR", message: "The answer could not be completed", code: "upstream_http" })}`,
  "data: [DONE]",
  "",
].join("\n") + "\n";

const OK_BODY = [
  `data: ${JSON.stringify({ type: "RUN_STARTED", threadId: "t", runId: "r2" })}`,
  `data: ${JSON.stringify({ type: "TEXT_MESSAGE_START", messageId: "m1" })}`,
  `data: ${JSON.stringify({ type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "Retry succeeded: Technology Innovation Institute is a UAE research institute on the watchlist." })}`,
  `data: ${JSON.stringify({ type: "TEXT_MESSAGE_END", messageId: "m1" })}`,
  `data: ${JSON.stringify({ type: "RUN_FINISHED", threadId: "t", runId: "r2" })}`,
  "data: [DONE]",
  "",
].join("\n") + "\n";

const QUESTION = "Tell me about Technology Innovation Institute in one line.";

async function installFailingChat(page: Page, counter: { posts: number }) {
  await page.route("**/api/chat", async (route) => {
    if (route.request().method() === "POST") {
      counter.posts++;
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: FAIL_BODY });
    } else {
      await route.continue();
    }
  });
}

test.describe("chat error retry notice", () => {
  test("forced failure shows only the discreet notice; Retry resubmits and succeeds", async ({ page }) => {
    const counter = { posts: 0 };
    await installFailingChat(page, counter);

    await page.goto("/chat?skip=1");
    const composer = page.getByTestId("composer-input");
    await expect(composer).toBeVisible({ timeout: 30_000 });
    await composer.fill(QUESTION);
    await page.getByTestId("composer-send").click();

    const notice = page.getByTestId("chat-error");
    await expect(notice).toBeVisible({ timeout: 30_000 });
    await expect(notice).toContainText("Response failed");
    await expect(page.getByTestId("chat-error-retry")).toBeVisible();

    // No raw error text anywhere user-visible, and the library box never paints.
    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    // Raw text may exist inside the library's hidden error node (display:none per discreet-retry CSS);
    // the user-visible contract is innerText + the lib-box visibility check below.
    expect(bodyText).not.toContain("the answer could not be completed");
    expect(bodyText).not.toContain("an unexpected error occurred");
    const libBox = await page.locator(".openui-agent-thread-error").evaluateAll(
      (els) => els.map((el) => { const s = getComputedStyle(el as HTMLElement); return { display: s.display, visible: s.display !== "none" && !!(el as HTMLElement).offsetParent }; }),
    );
    expect(libBox.every((b) => !b.visible)).toBe(true);

    const postsBeforeRetry = counter.posts;
    expect(postsBeforeRetry).toBeGreaterThan(0);

    // Re-arm as a healthy stream, then click the REAL Retry (processMessage resubmit).
    await page.unroute("**/api/chat");
    await page.route("**/api/chat", async (route) => {
      if (route.request().method() === "POST") {
        counter.posts++;
        await route.fulfill({ status: 200, contentType: "text/event-stream", body: OK_BODY });
      } else {
        await route.continue();
      }
    });
    await page.getByTestId("chat-error-retry").click();
    await expect.poll(() => counter.posts).toBeGreaterThan(postsBeforeRetry);
    await expect(page.locator("body")).toContainText("Retry succeeded: Technology Innovation Institute", { timeout: 30_000 });
    await expect(notice).toHaveCount(0);
    expect((await page.locator("body").innerText()).toLowerCase()).not.toContain("the answer could not be completed");
  });
});
