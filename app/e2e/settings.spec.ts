import { test, expect, SETTINGS_KEY } from "./helpers";
import { MODEL_ID, MODEL_LABEL, REASONING_MODE } from "../src/lib/plugins";

test.describe("Settings", () => {
  test("shows user + apikey inputs; model and plugin are fixed (config-public MODEL_LABEL · Perplexity pinned)", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("#set-user")).toBeVisible();
    await expect(page.locator("#set-user")).toHaveValue("INV-001");
    await expect(page.locator("#set-key"), "apikey override field (server proxy owns the backend URL; #set-backend removed in the UAE build)").toBeVisible();
    const model = page.getByTestId("fixed-model");
    await expect(model).toBeVisible();
    await expect(model).toContainText(MODEL_LABEL);
    await expect(model).toContainText(MODEL_ID);
    await expect(model).toContainText(REASONING_MODE);
    await expect(page.locator("select#set-model")).toHaveCount(0);
    const list = page.getByTestId("plugin-list");
    await expect(list).toContainText("plugin-1722260873");
    // Live directory (182 chat plugins, Perplexity locked on) replaces the old 5-plugin allow-list.
    await expect(list.getByTestId("plugin-showing")).toContainText(/Showing \d+ of \d+/);
    const pplx = page.getByRole("switch", { name: /perplexity/i });
    await expect(pplx).toBeDisabled();
    await expect(pplx).toHaveAttribute("aria-checked", "true");
  });

  test("editing the user id persists to localStorage", async ({ page }) => {
    await page.goto("/settings");
    const user = page.locator("#set-user");
    await user.fill("INV-777");
    await user.blur();
    await expect
      .poll(async () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").externalUserId, SETTINGS_KEY))
      .toBe("INV-777");
  });
});
