import { test, expect, type Page } from "./helpers";
import fs from "node:fs";
import path from "node:path";

/**
 * Reputation corpus-graph e2e (2026-10-19): /reputation renders the ported Rilian canvas over web/data/reputation/{graph,evidence}.json —
 * real counts from the corpus, exactly four BCAP register halos, node drag, 2D↔3D, edge → WHY CONNECTED with resolved evidence refs,
 * the MAX AGE slider filtering graph + evidence table + counts together, BCAP-only register chips, zero console errors and no horizontal
 * overflow — at 1440x900 and 390x844.
 */
const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const VIEWPORTS = [{ w: 1440, h: 900, label: "1440x900" }, { w: 390, h: 844, label: "390x844" }];
type GS = { nodeCount?: number; edgeCount?: number; halos?: unknown[]; mode?: string };
type GP = { nodeScreenPoints?: (n: number) => [number, number][] };
const gs = (page: Page) => page.evaluate(() => (window as unknown as { __graphState?: GS }).__graphState ?? {});
const num = (s: string | null) => Number((s ?? "").replace(/[^\d]/g, "") || 0);

async function settled(page: Page) {
  // poll the DOM directly (no actionability loop): the wrapper can re-mount a few times while the lazy graph payload streams in
  await expect.poll(async () => page.evaluate(() => !!document.querySelector("[data-testid=correlation-graph-wrap]")), { timeout: 120_000 }).toBe(true);
  await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
  await page.waitForFunction(() => /layout settled|fit #/.test(document.querySelector("[data-testid=graph-status]")?.textContent ?? ""), null, { timeout: 60_000 }).catch(() => {});
}
async function noOverflow(page: Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, "no horizontal overflow").toBeLessThanOrEqual(o.cw + 1);
}
async function setSlider(page: Page, value: number) {
  const slider = page.getByTestId("graph-max-age");
  await slider.scrollIntoViewIfNeeded();
  await slider.evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

for (const vp of VIEWPORTS) {
  test.describe(`reputation corpus graph ${vp.label}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });
    test.setTimeout(480_000);

    test("graph mounts from the corpus with real counts", async ({ page }) => {
      await page.goto("/reputation?skip=1");
      await settled(page);
      const section = page.getByTestId("reputation-graph-section");
      await expect.poll(async () => section.getAttribute("data-source"), { timeout: 60_000 }).toBe("web/data/reputation/graph.json");
      expect(num(await section.getAttribute("data-nodes"))).toBeGreaterThan(0);
      expect(num(await section.getAttribute("data-edges"))).toBeGreaterThan(0);
      expect(num(await section.getAttribute("data-isolates"))).toBeGreaterThanOrEqual(0);
      const g = await gs(page);
      expect(g.nodeCount ?? 0).toBeGreaterThan(0);
      expect(Array.isArray(g.halos) ? g.halos.length : 0, "exactly four dashed-ring registers").toBe(4);
      await expect(page.getByTestId("graph-readout")).toContainText(/\d+ \/ \d+ edges/);
      await expect(page.getByTestId("graph-status")).toContainText(/layout settled|fit #/);
      await expect(page.getByTestId("unproven-banner")).toContainText("CORRELATION ONLY");
      await expect(page.getByTestId("unproven-banner")).toContainText(/Coordination: UNPROVEN/);
      await expect(page.getByTestId("register-counts")).toBeVisible();
      expect(await page.getByTestId("register-count").count()).toBe(4);
      await page.screenshot({ path: path.join(PROOF, `corpus-graph-after-${vp.label}.png`) });
      await noOverflow(page);
    });

    test("node drag changes a node position", async ({ page }) => {
      test.skip(vp.w < 600, "desktop only");
      await page.goto("/reputation?skip=1");
      await settled(page);
      await page.getByTestId("graph-mode-2d").click();
      await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("2d");
      await settled(page);
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(400);
      const vpH = page.viewportSize()?.height ?? 900;
      const ptsAll = await page.evaluate(() => (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(16) ?? []);
      const pts = ptsAll.filter(([, py]) => py > 60 && py < vpH - 20);
      expect(pts.length, "node screen points inside the viewport").toBeGreaterThan(0);
      const [x, y] = pts[0];
      await page.mouse.move(x, y);
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.waitForTimeout(100);
      for (let i = 1; i <= 30; i++) { await page.mouse.move(x + (70 * i) / 30, y + (40 * i) / 30); await page.waitForTimeout(16); }
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(1200);
      const pts2 = await page.evaluate(() => (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(16) ?? []);
      const moved = Math.max(0, ...ptsAll.map(([ax, ay], i) => (pts2[i] ? Math.hypot(pts2[i][0] - ax, pts2[i][1] - ay) : 0)));
      expect(moved, "dragged node moved").toBeGreaterThan(4);
    });

    test("2D/3D toggle switches renderer", async ({ page }) => {
      await page.goto("/reputation?skip=1");
      await settled(page);
      await page.getByTestId("graph-mode-2d").click();
      await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("2d");
      await expect.poll(async () => page.getByTestId("correlation-bubble-graph").getAttribute("data-mode"), { timeout: 30_000 }).toBe("2d");
      await page.getByTestId("graph-mode-3d").click();
      await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("3d");
      await expect.poll(async () => page.getByTestId("correlation-bubble-graph").getAttribute("data-mode"), { timeout: 30_000 }).toBe("3d");
    });

    test("edge click opens WHY CONNECTED with evidence", async ({ page }) => {
      test.skip(vp.w < 600, "desktop only");
      await page.goto("/reputation?skip=1");
      await settled(page);
      // Expand (native fullscreen, in-page fallback) — retry the click if the first one landed before the toolbar was interactive
      const isExpanded = async () => (await page.getByTestId("correlation-graph-wrap").getAttribute("data-fullscreen")) !== "0";
      for (let attempt = 0; attempt < 3 && !(await isExpanded()); attempt++) {
        await page.getByTestId("graph-expand").scrollIntoViewIfNeeded();
        await page.getByTestId("graph-expand").click();
        await page.waitForTimeout(2500);
      }
      await expect.poll(isExpanded, { timeout: 30_000 }).toBe(true);
      await page.getByTestId("connections-drawer-toggle").click();
      const opt = page.locator("#connections-drawer [role=option], [data-testid=connections-drawer] [role=option]").first();
      await expect(opt).toBeVisible({ timeout: 20_000 });
      await opt.click();
      const why = page.getByTestId("why-connected-panel").first();
      await expect(why).toBeVisible({ timeout: 20_000 });
      const evid = Number(await page.getByTestId("why-panel-evidence").first().getAttribute("data-evid-count"));
      expect(evid, "evidence refs on the edge").toBeGreaterThanOrEqual(1);
      await expect(page.locator("[data-testid=evid-ref-chip][data-resolved='1']").first()).toBeVisible({ timeout: 20_000 });
      // leave Expand (best-effort, bounded): the assertion of this test is the WHY CONNECTED card above; the Expand state machine itself is
      // covered by reputation-graph.spec.ts. Native fullscreen exit can take several seconds in headless Chromium, so every step is capped.
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1500);
      const exitBtn = page.getByTestId("expand-exit");
      if (await exitBtn.count()) await exitBtn.first().click({ force: true, timeout: 5_000 }).catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      await page.evaluate(() => document.exitFullscreen?.().catch(() => {})).catch(() => {});
      await expect.poll(async () => page.getByTestId("correlation-graph-wrap").getAttribute("data-fullscreen").catch(() => "0"), { timeout: 20_000 }).toBe("0");
    });

    test("MAX AGE slider filters graph, evidence table and counts consistently", async ({ page }) => {
      await page.goto("/reputation?skip=1");
      await settled(page);
      const total = page.getByTestId("evidence-total");
      await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBeGreaterThan(0);
      const t0 = num(await total.textContent());
      const r0 = (await page.getByTestId("graph-readout").textContent()) ?? "";
      await setSlider(page, 30);
      await expect.poll(async () => page.getByTestId("graph-max-age-readout").textContent(), { timeout: 15_000 }).toMatch(/30d/);
      await expect.poll(async () => page.getByTestId("evidence-max-age").textContent(), { timeout: 15_000 }).toMatch(/30d/);
      await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBeLessThan(t0);
      await expect.poll(async () => page.getByTestId("graph-readout").textContent(), { timeout: 30_000 }).not.toBe(r0);
      await setSlider(page, 120);
      await expect.poll(async () => page.getByTestId("graph-max-age-readout").textContent(), { timeout: 15_000 }).toMatch(/all/);
      await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBe(t0);
    });

    test("register chips are exactly BCAP-001..004 and filter the table", async ({ page }) => {
      await page.goto("/reputation?skip=1");
      await settled(page);
      const chips = page.locator("[data-testid=entity-filter]");
      await expect.poll(async () => chips.count(), { timeout: 60_000 }).toBe(5);
      const values = await chips.evaluateAll((els) => els.map((e) => e.getAttribute("data-value")).sort());
      expect(values).toEqual(["BCAP-001", "BCAP-002", "BCAP-003", "BCAP-004", "all"]);
      expect(await page.locator("text=/NET-00\\d/").count()).toBe(0);
      const total = page.getByTestId("evidence-total");
      await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBeGreaterThan(0);
      const t0 = num(await total.textContent());
      // chip counts come straight from the corpus: the four register counts must sum to ≥ total (multi-register items count once per register)
      const counts = await chips.evaluateAll((els) => els.map((e) => [e.getAttribute("data-value"), Number(e.getAttribute("data-count"))] as [string, number]));
      const byReg = Object.fromEntries(counts);
      expect(byReg["all"]).toBe(t0);
      expect(byReg["BCAP-001"] + byReg["BCAP-002"] + byReg["BCAP-003"] + byReg["BCAP-004"]).toBeGreaterThanOrEqual(t0);
      await page.locator('[data-testid=entity-filter][data-value="BCAP-004"]').click();
      await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBe(byReg["BCAP-004"]);
      await expect(page.getByTestId("evidence-row").first()).toContainText(/Mohla|Karan/i, { timeout: 30_000 });
      await page.locator('[data-testid=entity-filter][data-value="all"]').click();
      await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBe(t0);
    });

    test("no console errors and no horizontal overflow", async ({ page, errors }) => {
      await page.goto("/reputation?skip=1");
      await settled(page);
      const explorer = page.getByTestId("evidence-explorer");
      await explorer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await noOverflow(page);
      if (vp.w < 600) {
        const toolbar = page.getByTestId("graph-toolbar");
        await toolbar.scrollIntoViewIfNeeded();
        const box = await toolbar.boundingBox();
        expect(box, "toolbar bounding box").not.toBeNull();
        if (box) expect(box.width, "toolbar bounding box width ≤ viewport width").toBeLessThanOrEqual(vp.w);
      }
      expect(errors, "no client-side page/console errors").toEqual([]);
    });
  });
}
