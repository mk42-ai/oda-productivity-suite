import { test, expect } from "@playwright/test";
import { primeSettings, hasKey } from "./helpers";

/**
 * Thread re-open after a hard reload (cycle 5):
 *   send one short message → page.reload() → the previous thread is listed in rail-chats-list (1440 px) / threads-menu (390 px) / welcome-recent → click it → the user message is back.
 * Also: /chat?thread=<id> deep link selects that thread on mount.
 * Run: BASE_URL=<frontend> npx playwright test e2e/thread-reopen.spec.ts --workers=1
 */
test.describe("thread re-open after reload", () => {
  test.skip(!hasKey(), "needs ON_DEMAND_API_KEY to send a real turn");
  test.setTimeout(240_000);

  test("reload → recent thread listed → click → messages restored; ?thread deep link", async ({ page }) => {
    await primeSettings(page);
    await page.goto("/chat?skip=1");
    await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
    const q = "What has TII announced recently?";
    await page.getByTestId("composer-input").fill(q);
    await page.getByTestId("composer-send").click();
    await expect(page.getByTestId("user-message").first()).toContainText(/What has TII announced recently\?|TII/i, { timeout: 30_000 });
    // wait for the turn to settle so the thread is persisted with its title + messages
    await expect.poll(async () => {
      const rv = page.getByTestId("run-view").last();
      const live = await rv.getAttribute("data-live").catch(() => null);
      const timer = await rv.getByTestId("run-timer").getAttribute("data-state").catch(() => null);
      return live === "false" || timer === "frozen";
    }, { timeout: 150_000, intervals: [500] }).toBe(true);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("uaecc.chat.threads.v2") ?? "[]") as { id: string; title: string }[]);
    expect(stored.length).toBeGreaterThan(0);
    const tid = stored[0].id;

    // hard reload → the thread must be re-openable
    await page.reload();
    await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });

    const vpWidth = page.viewportSize()?.width ?? 1440;
    if (vpWidth >= 1024) {
      // REWRITTEN (cycle 5): at 1440 px desktop, recent threads live in the left rail (rail-chats-section > rail-chats-list > rail-chat-item)
      const railList = page.getByTestId("rail-chats-list");
      const railItem = railList.getByTestId("rail-chat-item").first();
      const welcomeRecent = page.getByTestId("welcome-recent");
      let clicked = false;
      if (await railItem.isVisible({ timeout: 15_000 }).catch(() => false)) {
        await expect(railItem.getByTestId("thread-title")).toBeVisible();
        await railItem.click();
        clicked = true;
      } else if (await welcomeRecent.count()) {
        // REWRITTEN (cycle 5): fallback to welcome-recent if rail-chats-list is not mounted
        const wThread = welcomeRecent.getByTestId("welcome-thread").first();
        if (await wThread.isVisible({ timeout: 10_000 }).catch(() => false)) {
          await wThread.click();
          clicked = true;
        }
      }
      // REWRITTEN (cycle 5): assert recent thread was opened from rail-chat-item or welcome-recent
      expect(clicked, "// REWRITTEN (cycle 5): recent thread opened from rail-chat-item or welcome-recent").toBe(true);
    } else {
      // REWRITTEN (cycle 5): mobile (390 px) keeps <details data-testid="threads-menu"> in top bar
      const menu = page.getByTestId("threads-menu");
      await expect(menu).toBeVisible({ timeout: 15_000 });
      await menu.locator("summary").click();
      const item = page.getByTestId("threads-menu-item").first();
      await expect(item).toBeVisible({ timeout: 15_000 });
      await item.click();
    }

    // messages restored after click
    await expect(page.getByTestId("user-message").first()).toContainText(/What has TII announced recently\?|TII/i, { timeout: 30_000 });
    await expect(page.getByTestId("chat-title")).toBeVisible({ timeout: 15_000 });

    // deep link selects the thread on mount
    await page.goto(`/chat?skip=1&thread=${encodeURIComponent(tid)}`);
    await expect(page.getByTestId("user-message").first()).toContainText(/What has TII announced recently\?|TII/i, { timeout: 30_000 });
  });
});
