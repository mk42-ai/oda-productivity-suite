import { test, expect } from "./helpers";

/** a33 — keyboard reach on /watchlist cards, arrow-key nav on the rail, and the single spec'd accent focus ring (#2563EB = rgb(37, 99, 235)) everywhere — no other hue. */
const activeInfo = () => {
  const el = document.activeElement as HTMLElement | null;
  const cs = el ? getComputedStyle(el) : null;
  return { testid: el?.dataset.testid ?? null, name: el?.textContent?.trim() ?? "", outline: cs?.outlineColor ?? "", width: cs?.outlineWidth ?? "" };
};
const RING = "37, 99, 235"; // --ring: #2563EB — the one accent the white/neutral spec allows for links + focus rings
const isOffSpecRing = (rgb: string) => {
  if (!rgb || rgb === "rgba(0, 0, 0, 0)") return false; // outline-color unset → no ring drawn
  return !rgb.includes(RING);
};

test.describe("a33 keyboard nav", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("watchlist: cards are keyboard-reachable with the accent focus ring", async ({ page }) => {
    await page.goto("/watchlist?skip=1");
    const cards = page.getByTestId("org-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBe(50);
    // Tab until a link inside the first card is focused (toolbar controls come first)
    let info = { testid: null as string | null, name: "", outline: "", width: "" };
    let inCard = false;
    for (let i = 0; i < 40 && !inCard; i++) {
      await page.keyboard.press("Tab");
      info = await page.evaluate(activeInfo);
      inCard = await page.evaluate(() => !!document.activeElement?.closest('[data-testid="org-card"]'));
    }
    expect(inCard, "a watchlist card link receives keyboard focus within 40 Tabs").toBe(true);
    expect(info.outline, "focus ring uses the spec'd accent").toContain(RING);
    const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement).getAttribute("href"));
    expect(href).toMatch(/^\/watchlist\//);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.getByTestId("dossier-title")).toBeVisible();
  });

  test("nav rail: Tab + arrows, only the accent focus ring anywhere", async ({ page }) => {
    await page.goto("/overview?skip=1");
    await expect(page.getByTestId("nav-overview")).toBeVisible();
    const seen: { testid: string | null; outline: string }[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60); // let any colour transition settle before reading the computed outline
      const info = await page.evaluate(activeInfo);
      seen.push({ testid: info.testid, outline: info.outline });
      expect(isOffSpecRing(info.outline), `off-spec focus ring on ${info.testid}: ${info.outline}`).toBe(false);
      if (info.testid === "nav-settings") break;
    }
    expect(seen.some((s) => s.testid === "nav-overview")).toBe(true);
    await page.getByTestId("nav-overview").focus();
    await page.keyboard.press("ArrowDown");
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.testid)).toBe("nav-watchlist");
    await page.keyboard.press("End");
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.testid)).toBe("nav-settings");
    await page.keyboard.press("ArrowDown");
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.testid)).toBe("nav-overview");
    await page.keyboard.press("Home");
    const home = await page.evaluate(activeInfo);
    expect(home.testid).toBe("nav-overview");
    expect(home.outline).toContain(RING);
  });
});
