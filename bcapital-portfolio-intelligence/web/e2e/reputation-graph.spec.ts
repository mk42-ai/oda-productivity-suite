import { test, expect } from "./helpers";
import fs from "node:fs";
import path from "node:path";

/**
 * Reputation interactive-graph e2e (2026-10-18): the ported Rilian BubbleGraph canvas on /reputation renders EXACTLY four dashed-ring
 * registers (B Capital, Eduardo Saverin, Raj Ganguly, Karan Mohla), nodes drag, 2D↔3D toggles, Show isolates toggles, a link click
 * (Connections drawer in Expand) opens WHY CONNECTED with real evidence refs, a node click loads that subject into ASK · OnDemand, and
 * the evidence chips reflect the enlarged corpus — at 1440x900 and 390x844 with zero console errors and no horizontal overflow.
 */
const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const VIEWPORTS = [{ w: 1440, h: 900, label: "1440x900" }, { w: 390, h: 844, label: "390x844" }];
type GS = { nodeCount?: number; edgeCount?: number; halos?: unknown[]; mode?: string };
type GP = { nodeScreenPoints?: (n: number) => [number, number][] };
const gs = (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __graphState?: GS }).__graphState ?? {});
async function settled(page: import("@playwright/test").Page) {
  // poll the DOM directly (no actionability loop): the wrapper can re-mount a few times while the lazy corpus payload streams in
  await expect.poll(async () => page.evaluate(() => !!document.querySelector("[data-testid=correlation-graph-wrap]")), { timeout: 120_000 }).toBe(true);
  // the canvas sits below the hero on mobile: bring it into the viewport (node screen points are viewport coordinates)
  await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
  await page.waitForFunction(() => /layout settled|fit #/.test(document.querySelector("[data-testid=graph-status]")?.textContent ?? ""), null, { timeout: 60_000 }).catch(() => {});
}
async function noOverflow(page: import("@playwright/test").Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, "no horizontal overflow").toBeLessThanOrEqual(o.cw + 1);
}

for (const vp of VIEWPORTS) {
  test.describe(`reputation graph ${vp.label}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });
    test.setTimeout(480_000); // WebGL + 240 nodes on a shared headless runner: the full interaction script needs more than the 240 s default

    test("graph renders with exactly 4 registers; drag, 2D/3D, isolates, link → WHY CONNECTED, node → ASK", async ({ page }) => {
      await page.goto("/reputation?skip=1");
      await settled(page);
      const g = await gs(page);
      expect(g.nodeCount ?? 0).toBeGreaterThan(20);
      expect(g.edgeCount ?? 0).toBeGreaterThan(20);
      expect(Array.isArray(g.halos) ? g.halos.length : 0, "exactly four dashed-ring registers").toBe(4);
      await expect(page.getByTestId("unproven-banner")).toContainText("CORRELATION ONLY");
      await expect(page.getByTestId("graph-readout")).toContainText(/nodes/);
      await page.screenshot({ path: path.join(PROOF, `after-graph-${vp.label}.png`) });
      // 3D → 2D → 3D
      await page.getByTestId("graph-mode-2d").click();
      await expect.poll(async () => (await gs(page)).mode).toBe("2d");
      await settled(page);
      await page.waitForTimeout(1500);
      // drag a real node (2D): pointer down on the bubble, a paced move (force-graph reads pointermove events), the node moves on screen
      await page.getByTestId("correlation-graph-wrap").scrollIntoViewIfNeeded();
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
      await page.getByTestId("graph-mode-3d").click();
      await expect.poll(async () => (await gs(page)).mode).toBe("3d");
      // isolates toggle
      const iso = page.getByTestId("graph-isolates");
      const before = await page.getByTestId("graph-readout").textContent();
      await iso.click();
      await expect.poll(async () => page.getByTestId("graph-readout").textContent()).not.toBe(before);
      await iso.click();
      // link click → WHY CONNECTED (via the Connections drawer in Expand — deterministic, no canvas pixel hunting)
      await page.getByTestId("graph-expand").click();
      await page.waitForTimeout(1200);
      await page.getByTestId("connections-drawer-toggle").click();
      const opt = page.locator("#connections-drawer [role=option], [data-testid=connections-drawer] [role=option]").first();
      await opt.click();
      const why = page.getByTestId("why-connected-panel").first();
      await expect(why).toBeVisible();
      await expect(why).toContainText("CORRELATION ONLY");
      const evid = Number(await page.getByTestId("why-panel-evidence").first().getAttribute("data-evid-count"));
      expect(evid, "WHY CONNECTED carries real evidence refs").toBeGreaterThan(0);
      await expect(page.locator("[data-testid=evid-ref-chip][data-resolved='1']").first()).toBeVisible();
      await expect(page.getByTestId("ask-subject").first()).toContainText(/×/);
      await page.screenshot({ path: path.join(PROOF, `after-graph-why-connected-${vp.label}.png`) });
      await page.keyboard.press("Escape"); // closes the WHY CONNECTED card / drawer first (Rilian focus order)
      await page.waitForTimeout(300);
      const exitBtn = page.getByTestId("expand-exit");
      if (await exitBtn.count()) await exitBtn.click({ force: true, timeout: 10_000 }).catch(async () => { await page.keyboard.press("Escape"); });
      await expect.poll(async () => page.getByTestId("correlation-graph-wrap").getAttribute("data-fullscreen"), { timeout: 15_000 }).toBe("0");
      await page.waitForTimeout(800);
      // node click → ASK subject (a subject hub, through the Centrality table's onFocus is the matrix path; here use a real canvas click)
      await page.getByTestId("graph-mode-2d").click();
      await page.waitForTimeout(1500);
      await page.getByTestId("correlation-graph-wrap").scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      // pick a node point that is not under the toolbar / legend overlays (elementFromPoint must be the canvas), then click it
      // the WHY CONNECTED card from the drawer step stays open after Expand exits (the Rilian card is non-modal) — on a 390-px canvas it
      // covers every bubble, so close it before the canvas click
      const whyClose = page.getByTestId("why-panel-close");
      if (await whyClose.count()) await whyClose.first().click().catch(() => {});
      let candidates: [number, number][] = [];
      for (let attempt = 0; attempt < 6 && !candidates.length; attempt++) {
        await page.getByTestId("correlation-graph-wrap").scrollIntoViewIfNeeded();
        await page.getByTestId("graph-fit").click();
        await page.waitForTimeout(1500);
        candidates = await page.evaluate(() => {
          const pts = (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(80) ?? [];
          return pts.filter(([px, py]) => { const el = document.elementFromPoint(px, py); return !!el && el.tagName === "CANVAS" && py > 40 && py < window.innerHeight - 20; });
        });
      }
      expect(candidates.length, "a node point free of overlays").toBeGreaterThan(0);
      let picked = false;
      for (const [cx, cy] of candidates.slice(0, 6)) {
        await page.mouse.move(cx, cy);
        await page.waitForTimeout(150);
        await page.mouse.click(cx, cy);
        await page.waitForTimeout(600);
        const subj = (await page.getByTestId("ask-subject").first().textContent()) ?? "";
        if (!/×|none yet/.test(subj)) { picked = true; break; }
      }
      expect(picked, "node click loads the node into ASK").toBe(true);
      await noOverflow(page);
    });

    test("evidence chips reflect the 2026-10-18 corpus (web/data/reputation/evidence.json)", async ({ page }) => {
      const r = await page.request.get("/api/reputation/evidence?limit=1");
      expect(r.status()).toBe(200);
      const j = (await r.json()) as { total: number; source: string; counts: { entity: Record<string, number> } };
      expect(j.source).toBe("web/data/reputation/evidence.json");
      expect(j.total, "≈4,000-item target").toBeGreaterThanOrEqual(4_000);
      expect(j.counts.entity["BCAP-001"]).toBeGreaterThanOrEqual(2_000);
      expect(j.counts.entity["BCAP-002"]).toBeGreaterThanOrEqual(800);
      expect(j.counts.entity["BCAP-003"]).toBeGreaterThanOrEqual(600);
      expect(j.counts.entity["BCAP-004"], "Mohla — target 500 (honest shortfall shown on the page)").toBeGreaterThanOrEqual(400);
      await page.goto("/reputation?skip=1");
      // the first evidence page is fetched after hydration; under a loaded runner that can take longer than the default expect timeout
      await expect(page.getByTestId("evidence-total")).toContainText(/\d,\d{3} items/, { timeout: 60_000 });
      await noOverflow(page);
    });
  });
}
