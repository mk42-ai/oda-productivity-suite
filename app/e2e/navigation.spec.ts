import { test, expect } from "@playwright/test";
import { primeSettings } from "./helpers";

const RAIL_ROUTES = [
  "/overview",
  "/watchlist",
  "/sentiment",
  "/news",
  "/radar",
  "/graph",
  "/chat",
  "/briefing",
  "/artifacts",
  "/methodology",
  "/settings",
];

test.describe("Navigation adjacency & route integrity", () => {
  test.beforeEach(async ({ page }) => {
    await primeSettings(page);
  });

  for (const route of RAIL_ROUTES) {
    test(`Desktop (1440x900) - ${route} direct load, title, aria-current, breadcrumbs, reload`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `status 200 for ${route}`).toBe(200);

      // Title pattern
      await expect(page).toHaveTitle(/· UAE AI Command Centre \(concept\)$/);

      // aria-current="page" on desktop rail
      const linkId = `nav-${route.slice(1)}`;
      const railLink = page.locator(`aside[data-testid="nav-rail"] a[data-testid="${linkId}"]`);
      await expect(railLink).toHaveAttribute("aria-current", "page");

      // Breadcrumbs: on every route except /overview and /chat
      const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
      if (route === "/overview" || route === "/chat") {
        await expect(breadcrumbs).toHaveCount(0);
      } else {
        await expect(breadcrumbs).toBeVisible();
      }

      // Reload keeps the same H1
      const h1Before = await page.locator("h1").first().textContent();
      await page.reload({ waitUntil: "domcontentloaded" });
      const h1After = await page.locator("h1").first().textContent();
      expect(h1After?.trim()).toBe(h1Before?.trim());
    });

    test(`Mobile (390x844) - ${route} direct load, title, drawer aria-current, breadcrumbs`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `status 200 for ${route}`).toBe(200);

      // Title pattern
      await expect(page).toHaveTitle(/· UAE AI Command Centre \(concept\)$/);

      // Open mobile drawer and verify aria-current="page"
      const toggle = page.locator('[data-testid="rail-drawer-toggle"]');
      await toggle.click();
      const drawer = page.locator('#rail-drawer');
      await expect(drawer).toBeVisible();

      const linkId = `nav-${route.slice(1)}`;
      const drawerLink = drawer.locator(`a[data-testid="${linkId}"]`);
      await expect(drawerLink).toHaveAttribute("aria-current", "page");

      // Breadcrumbs check
      const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
      if (route === "/overview" || route === "/chat") {
        await expect(breadcrumbs).toHaveCount(0);
      } else {
        await expect(breadcrumbs).toBeVisible();
      }
    });
  }

  test("Dossier /watchlist/airev breadcrumbs and crosslinks", async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const res = await page.goto("/watchlist/airev");
    expect(res?.status()).toBe(200);

    // Breadcrumbs: Overview › Watchlist › AIREV
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();
    const text = (await breadcrumbs.textContent()) || "";
    expect(text).toContain("Overview");
    expect(text).toContain("Watchlist");
    expect(text).toContain("AIREV");

    // Dossier cross-links row with 6 links whose hrefs resolve 200
    const crosslinksRow = page.locator('[data-testid="dossier-crosslinks"]');
    await expect(crosslinksRow).toBeVisible();
    const links = crosslinksRow.locator("a");
    await expect(links).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
      const checkRes = await request.get(href!);
      expect(checkRes.status(), `href ${href} resolves 200`).toBe(200);
    }
  });

  test("/news?org=airev filters only items with the AIREV chip", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/news?org=airev");

    const chip = page.locator('[data-testid="org-filter-chip"]');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText("AIREV");

    const items = page.locator('[data-testid="news-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const itemText = (await items.nth(i).textContent()) || "";
      expect(itemText).toContain("AIREV");
    }
  });

  test("/graph shows top-connected list with >= 10 links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/graph");

    const list = page.locator('[data-testid="top-connected-list"]');
    await expect(list).toBeVisible();

    const links = list.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test("/chat-od redirects to /chat", async ({ page }) => {
    await page.goto("/chat-od");
    await expect(page).toHaveURL(/\/chat$/);
  });

  test("/plugins returns 200 with >= 1 plugin row", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const res = await page.goto("/plugins");
    expect(res?.status()).toBe(200);

    const cards = page.locator('[data-testid="plugin-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("/artifacts loads with 0 console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto("/artifacts", { waitUntil: "networkidle" });
    await expect(page.locator('[data-testid="artifacts-page"]')).toBeVisible();

    const realErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("ERR_BLOCKED_BY_ORB")
    );
    expect(realErrors).toEqual([]);
  });

  test("Mobile drawer focus trap and management", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/overview");

    const toggle = page.locator('[data-testid="rail-drawer-toggle"]');
    await toggle.focus();
    await toggle.click();

    const drawer = page.locator('#rail-drawer');
    await expect(drawer).toBeVisible();

    // Focus inside the drawer on open (close button focused on next frame)
    await page.waitForTimeout(100);
    const isInsideOnOpen = await page.evaluate(() => {
      const drawerEl = document.getElementById("rail-drawer");
      return !!(drawerEl && drawerEl.contains(document.activeElement));
    });
    expect(isInsideOnOpen, "focus moves inside drawer on open").toBe(true);

    // Tab x 20 stays inside #rail-drawer
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const isInside = await page.evaluate(() => {
        const drawerEl = document.getElementById("rail-drawer");
        return !!(drawerEl && drawerEl.contains(document.activeElement));
      });
      expect(isInside, `Tab #${i + 1} stays inside drawer`).toBe(true);
    }

    // Escape closes drawer and focus returns to toggle
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("aria-hidden", "true");

    await page.waitForTimeout(100);
    const activeIsToggle = await page.evaluate(() => {
      const toggleEl = document.querySelector('[data-testid="rail-drawer-toggle"]');
      return document.activeElement === toggleEl;
    });
    expect(activeIsToggle, "focus returns to drawer toggle button").toBe(true);
  });

  test("/chat CLS <= 0.05 at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Measure CLS via PerformanceObserver over 3 s after load
    await page.goto("/chat", { waitUntil: "load" });

    const cls = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as { hadRecentInput?: boolean }).hadRecentInput) {
              clsValue += (entry as { value: number }).value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    expect(cls).toBeLessThanOrEqual(0.05);
  });

  test("Focus ring on rail link is rgb(37, 99, 235) immediately after focus (no transition)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/overview");

    const link = page.locator('aside[data-testid="nav-rail"] a[data-testid="nav-overview"]');
    await link.focus();

    const outlineColor = await link.evaluate((el) => {
      return window.getComputedStyle(el).outlineColor;
    });

    expect(outlineColor).toBe("rgb(37, 99, 235)");
  });
});
