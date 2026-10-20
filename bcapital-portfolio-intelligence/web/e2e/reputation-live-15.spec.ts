import { test, expect, type Page } from "./helpers";
import fs from "node:fs";
import path from "node:path";

/**
 * Live 15-point verification of /reputation on the deployed preview (2026-10-20), at 1440x900 and 390x844.
 * Writes one JSON record per viewport to PROOF_DIR (default ../../../.ui-proof) plus the after-* screenshots the report cites.
 * Every check records the observed value; the test only hard-fails on the invariants (200, no errors, no overflow, no blue).
 */
const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const VIEWPORTS = [{ w: 1440, h: 900, label: "1440x900" }, { w: 390, h: 844, label: "390x844" }];
type GS = { nodeCount?: number; edgeCount?: number; halos?: Array<{ id?: string; label?: string; register?: string; count?: number }>; mode?: string; cameraDistance?: number | null; zoom?: number | null; linkHovers?: number; nodeHovers?: number };
type GP = { nodeScreenPoints?: (n: number) => [number, number][]; linkScreenPoints?: (n: number) => [number, number][]; live3D?: () => unknown };
const gs = (page: Page) => page.evaluate(() => (window as unknown as { __graphState?: GS }).__graphState ?? {});
const num = (s: string | null) => Number((s ?? "").replace(/[^\d]/g, "") || 0);
const isBlue = (r: number, g: number, b: number) => {
  const R = r / 255, G = g / 255, B = b / 255; const max = Math.max(R, G, B), min = Math.min(R, G, B); const l = (max + min) / 2;
  if (max === min) return false; const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h; if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60; else if (max === G) h = ((B - R) / d + 2) * 60; else h = ((R - G) / d + 4) * 60;
  return h >= 190 && h <= 260 && s > 0.15 && d > 0.15;
};

async function settled(page: Page) {
  await expect.poll(async () => page.evaluate(() => !!document.querySelector("[data-testid=correlation-graph-wrap]")), { timeout: 120_000 }).toBe(true);
  await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
  await page.waitForFunction(() => /layout settled|fit #/.test(document.querySelector("[data-testid=graph-status]")?.textContent ?? ""), null, { timeout: 90_000 }).catch(() => {});
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
async function cameraSig(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graph?: GP; __graphState?: GS };
    const pts = w.__graph?.nodeScreenPoints?.(24) ?? [];
    return { pts, live: JSON.stringify(w.__graph?.live3D?.() ?? null) };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`live-15 ${vp.label}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });
    test.setTimeout(600_000);

    test(`15 checks on /reputation @ ${vp.label}`, async ({ page, errors }) => {
      const rec: Record<string, unknown> = { viewport: vp.label, url: "", at: new Date().toISOString() };
      const responses: Array<{ url: string; status: number }> = [];
      page.on("response", (r) => responses.push({ url: r.url(), status: r.status() }));
      const res = await page.goto("/reputation?skip=1");
      rec.url = page.url();
      rec.c1_http = res?.status();
      expect(res?.status(), "C1 HTTP 200").toBe(200);
      await settled(page);
      const status = (await page.getByTestId("graph-status").textContent()) ?? "";
      rec.c1_status = status.trim();
      expect(status, "C1 status includes 'layout settled'").toMatch(/layout settled/);

      // C2 readout numbers
      const readout = ((await page.getByTestId("graph-readout").textContent()) ?? "").replace(/\s+/g, " ").trim();
      rec.c2_readout = readout;
      const m = readout.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*) edges[^\d]*(\d[\d,]*) linked\s*\/\s*(\d[\d,]*) nodes[^\d]*(\d[\d,]*) isolates (hidden|shown)/);
      rec.c2_parsed = m ? { edgesShown: num(m[1]), edgesTotal: num(m[2]), linked: num(m[3]), nodesTotal: num(m[4]), isolates: num(m[5]), isolatesState: m[6] } : null;
      expect(m, "C2 readout shows edges, linked/total nodes, isolates").not.toBeNull();
      const section = page.getByTestId("reputation-graph-section");
      rec.c2_section = { nodes: num(await section.getAttribute("data-nodes")), edges: num(await section.getAttribute("data-edges")), isolates: num(await section.getAttribute("data-isolates")), source: await section.getAttribute("data-source") };

      // C3 four register rings + per-register counts
      const g = await gs(page);
      rec.c3_halos = g.halos;
      expect(Array.isArray(g.halos) ? g.halos.length : 0, "C3 four register halos").toBe(4);
      const regs = await page.locator("[data-testid=register-count]").evaluateAll((els) => els.map((e) => ({ id: e.getAttribute("data-register"), items: Number(e.getAttribute("data-items")), target: Number(e.getAttribute("data-target")), title: e.getAttribute("title"), text: (e.textContent ?? "").replace(/\s+/g, " ").trim() })));
      rec.c3_registers = regs;
      expect(regs.map((r) => r.id).sort()).toEqual(["BCAP-001", "BCAP-002", "BCAP-003", "BCAP-004"]);
      const chips = await page.locator("[data-testid=entity-filter]").evaluateAll((els) => els.map((e) => [e.getAttribute("data-value"), Number(e.getAttribute("data-count"))]));
      rec.c3_evidence_chip_counts = Object.fromEntries(chips as [string, number][]);
      rec.c3_register_counts_total = ((await page.getByTestId("register-counts-total").textContent()) ?? "").trim();

      const desktop = vp.w >= 600;
      // C4 node drag (2D, desktop)
      if (desktop) {
        await page.getByTestId("graph-mode-2d").click();
        await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("2d");
        await settled(page); await page.waitForTimeout(1500);
        await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
        await page.waitForTimeout(400);
        const ptsAll = await page.evaluate(() => (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(16) ?? []);
        const pts = ptsAll.filter(([, py]) => py > 60 && py < vp.h - 20);
        expect(pts.length, "C4 node screen points in viewport").toBeGreaterThan(0);
        const [x, y] = pts[0];
        await page.mouse.move(x, y); await page.waitForTimeout(200); await page.mouse.down(); await page.waitForTimeout(100);
        for (let i = 1; i <= 30; i++) { await page.mouse.move(x + (70 * i) / 30, y + (40 * i) / 30); await page.waitForTimeout(16); }
        await page.waitForTimeout(100); await page.mouse.up(); await page.waitForTimeout(1200);
        const pts2 = await page.evaluate(() => (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(16) ?? []);
        const moved = Math.max(0, ...ptsAll.map(([ax, ay], i) => (pts2[i] ? Math.hypot(pts2[i][0] - ax, pts2[i][1] - ay) : 0)));
        rec.c4_drag_px = Math.round(moved * 10) / 10;
        expect(moved, "C4 dragged node moved").toBeGreaterThan(4);

        // C5 orbit on empty-space drag (3D)
        await page.getByTestId("graph-mode-3d").click();
        await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("3d");
        await settled(page); await page.waitForTimeout(2000);
        const wrap = await page.getByTestId("correlation-bubble-graph").boundingBox();
        expect(wrap).not.toBeNull();
        const before = await cameraSig(page);
        const nodePts = await page.evaluate(() => (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(4000) ?? []);
        // find an empty spot: a point inside the canvas ≥ 40px from any node
        let ex = wrap!.x + 30, ey = wrap!.y + wrap!.height / 2;
        outer: for (const cx of [0.08, 0.92, 0.15, 0.85, 0.5]) for (const cy of [0.15, 0.85, 0.5, 0.3, 0.7]) {
          const px = wrap!.x + wrap!.width * cx, py = wrap!.y + wrap!.height * cy;
          if (!nodePts.some(([nx, ny]) => Math.hypot(nx - px, ny - py) < 40)) { ex = px; ey = py; break outer; }
        }
        await page.mouse.move(ex, ey); await page.mouse.down();
        for (let i = 1; i <= 25; i++) { await page.mouse.move(ex + (120 * i) / 25, ey + (30 * i) / 25); await page.waitForTimeout(16); }
        await page.mouse.up(); await page.waitForTimeout(1200);
        const after = await cameraSig(page);
        const deltas = before.pts.map(([ax, ay], i) => (after.pts[i] ? Math.hypot(after.pts[i][0] - ax, after.pts[i][1] - ay) : 0));
        const movedPts = deltas.filter((d) => d > 2).length;
        rec.c5_orbit = { pointsMoved: movedPts, of: deltas.length, liveBefore: before.live, liveAfter: after.live };
        expect(movedPts, "C5 orbit: node projections moved after empty-space drag").toBeGreaterThan(Math.max(1, deltas.length * 0.5));
      } else {
        rec.c4_drag_px = "n/a (mobile: touch viewport, mouse drag not applicable)";
        rec.c5_orbit = "n/a (mobile)";
      }

      // C6 2D/3D toggle
      await page.getByTestId("graph-mode-2d").click();
      await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("2d");
      await expect.poll(async () => page.getByTestId("correlation-bubble-graph").getAttribute("data-mode"), { timeout: 30_000 }).toBe("2d");
      await page.getByTestId("graph-mode-3d").click();
      await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("3d");
      await expect.poll(async () => page.getByTestId("correlation-bubble-graph").getAttribute("data-mode"), { timeout: 30_000 }).toBe("3d");
      rec.c6_toggle = "2d→3d ok (data-mode + __graphState.mode)";

      // C7 hover highlights neighbourhood (2D for deterministic hit test)
      await page.getByTestId("graph-mode-2d").click();
      await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("2d");
      await settled(page); await page.waitForTimeout(1500);
      {
        await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
        await page.waitForTimeout(300);
        const ptsAll = await page.evaluate(() => (window as unknown as { __graph?: GP }).__graph?.nodeScreenPoints?.(16) ?? []);
        const pts = ptsAll.filter(([, py]) => py > 60 && py < vp.h - 20);
        let hovered = "0";
        for (const [x, y] of pts.slice(0, 6)) {
          await page.mouse.move(x - 3, y - 3); await page.mouse.move(x, y); await page.waitForTimeout(350);
          hovered = (await page.getByTestId("correlation-bubble-graph").getAttribute("data-hover")) ?? "0";
          if (hovered === "1") break;
        }
        const st = await gs(page);
        rec.c7_hover = { dataHover: hovered, nodeHovers: (st as Record<string, unknown>).nodeHovers ?? null, linkHovers: st.linkHovers ?? null };
        expect(hovered, "C7 hover sets data-hover=1 (neighbourhood dimming active)").toBe("1");
        await page.mouse.move(5, 5);
      }

      // C8 edge click → WHY CONNECTED with evidence + Ask
      if (desktop) {
        const isExpanded = async () => (await page.getByTestId("correlation-graph-wrap").getAttribute("data-fullscreen")) !== "0";
        for (let a = 0; a < 3 && !(await isExpanded()); a++) { await page.getByTestId("graph-expand").scrollIntoViewIfNeeded(); await page.getByTestId("graph-expand").click(); await page.waitForTimeout(2500); }
        await expect.poll(isExpanded, { timeout: 30_000 }).toBe(true);
        await page.getByTestId("connections-drawer-toggle").click();
        const opt = page.locator("#connections-drawer [role=option], [data-testid=connections-drawer] [role=option]").first();
        await expect(opt).toBeVisible({ timeout: 20_000 });
        await opt.click();
        const why = page.getByTestId("why-connected-panel").first();
        await expect(why).toBeVisible({ timeout: 20_000 });
        const evid = Number(await page.getByTestId("why-panel-evidence").first().getAttribute("data-evid-count"));
        const chipsN = await page.locator("[data-testid=evid-ref-chip]").count();
        const ask = page.getByTestId("why-panel-ask-in-chat").first();
        await expect(ask).toBeVisible({ timeout: 10_000 });
        rec.c8_why = { evidenceRefs: evid, evidChips: chipsN, askButton: (await ask.textContent())?.trim(), pair: ((await page.getByTestId("why-panel-pair").first().textContent()) ?? "").replace(/\s+/g, " ").trim().slice(0, 160) };
        expect(evid, "C8 evidence refs ≥ 1").toBeGreaterThanOrEqual(1);
        await page.screenshot({ path: path.join(PROOF, `after-edge-click-${vp.label}.png`) });
        await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(1200);
        const exitBtn = page.getByTestId("expand-exit");
        if (await exitBtn.count()) await exitBtn.first().click({ force: true, timeout: 5_000 }).catch(() => {});
        await page.keyboard.press("Escape").catch(() => {});
        await page.evaluate(() => document.exitFullscreen?.().catch(() => {})).catch(() => {});
        await expect.poll(async () => page.getByTestId("correlation-graph-wrap").getAttribute("data-fullscreen").catch(() => "0"), { timeout: 20_000 }).toBe("0");
      } else {
        rec.c8_why = "n/a (mobile; desktop-only in the corpus suite)";
      }

      // C9 MAX AGE slider
      {
        const total = page.getByTestId("evidence-total");
        await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBeGreaterThan(0);
        const t0 = num(await total.textContent());
        const r0 = ((await page.getByTestId("graph-readout").textContent()) ?? "").replace(/\s+/g, " ").trim();
        await setSlider(page, 30);
        await expect.poll(async () => page.getByTestId("graph-max-age-readout").textContent(), { timeout: 15_000 }).toMatch(/30d/);
        await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBeLessThan(t0);
        await expect.poll(async () => ((await page.getByTestId("graph-readout").textContent()) ?? "").replace(/\s+/g, " ").trim(), { timeout: 30_000 }).not.toBe(r0);
        const r30 = ((await page.getByTestId("graph-readout").textContent()) ?? "").replace(/\s+/g, " ").trim();
        const t30 = num(await total.textContent());
        await setSlider(page, 120);
        await expect.poll(async () => num(await total.textContent()), { timeout: 60_000 }).toBe(t0);
        rec.c9_maxage = { readoutAll: r0, readout30d: r30, evidenceAll: t0, evidence30d: t30 };
      }

      // C10 show isolates toggle
      {
        const btn = page.getByTestId("graph-isolates");
        await btn.scrollIntoViewIfNeeded();
        const l0 = ((await btn.textContent()) ?? "").trim(); const s0 = await btn.getAttribute("data-show-isolates");
        const shown0 = (await gs(page)).halos; void shown0;
        const sn0 = await page.evaluate(() => (window as unknown as { __graphState?: { shownNodes?: number } }).__graphState?.shownNodes ?? -1);
        await btn.click();
        await expect.poll(async () => btn.getAttribute("data-show-isolates"), { timeout: 15_000 }).not.toBe(s0);
        await page.waitForTimeout(1500);
        const l1 = ((await btn.textContent()) ?? "").trim();
        const sn1 = await page.evaluate(() => (window as unknown as { __graphState?: { shownNodes?: number } }).__graphState?.shownNodes ?? -1);
        const r1 = ((await page.getByTestId("graph-readout").textContent()) ?? "").replace(/\s+/g, " ").trim();
        await btn.click();
        await expect.poll(async () => btn.getAttribute("data-show-isolates"), { timeout: 15_000 }).toBe(s0);
        rec.c10_isolates = { labelBefore: l0, labelAfter: l1, shownNodesBefore: sn0, shownNodesAfter: sn1, readoutAfter: r1, isolates: Number(await btn.getAttribute("data-isolates")) };
        expect(l1, "C10 isolates label updates").not.toBe(l0);
        expect(sn1, "C10 shown node count changes").not.toBe(sn0);
      }

      // C11 /news/summary via the web origin (+ /backend prefix)
      {
        const base = new URL(page.url()).origin;
        const out: Record<string, number> = {};
        for (const p of ["/news/summary", "/backend/news/summary"]) {
          const r = await page.request.get(base + p);
          out[p] = r.status();
        }
        rec.c11_news_summary = out;
      }

      // C12 LinkedIn glyph + zero 404s
      {
        const glyph = responses.find((r) => r.url.includes("/brand/linkedin-inbug-black.png"));
        const glyphDirect = await page.request.get(new URL("/brand/linkedin-inbug-black.png", page.url()).toString());
        const notFound = responses.filter((r) => r.status === 404);
        rec.c12_glyph = { inPageStatus: glyph?.status ?? "not requested yet", directStatus: glyphDirect.status(), size: (await glyphDirect.body()).length, notFoundResponses: notFound.map((r) => r.url).slice(0, 10), notFoundCount: notFound.length };
        expect(glyphDirect.status(), "C12 glyph 200").toBe(200);
        expect(notFound.length, "C12 zero 404 responses").toBe(0);
      }

      // C14 overflow
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      rec.c14_overflow = o;
      expect(o.sw, "C14 no horizontal overflow").toBeLessThanOrEqual(o.iw);

      // C15 no blue: computed styles of visible elements + canvas pixels
      {
        const styleHits = await page.evaluate(() => {
          const isBlue = (r: number, g: number, b: number) => { const R = r / 255, G = g / 255, B = b / 255; const max = Math.max(R, G, B), min = Math.min(R, G, B); const l = (max + min) / 2; if (max === min) return false; const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min); let h; if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60; else if (max === G) h = ((B - R) / d + 2) * 60; else h = ((R - G) / d + 4) * 60; return h >= 190 && h <= 260 && s > 0.15 && d > 0.15; };
          const parse = (c: string) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(c); return m && (m[4] === undefined || Number(m[4]) > 0.05) ? [Number(m[1]), Number(m[2]), Number(m[3])] : null; };
          const hits: string[] = []; let scanned = 0;
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
            const cs = getComputedStyle(el); scanned++;
            for (const p of ["color", "backgroundColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "outlineColor", "fill", "stroke"] as const) {
              const v = parse(cs[p] as string); if (v && isBlue(v[0], v[1], v[2])) hits.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} ${p}=${cs[p]}`);
            }
            if (hits.length > 20) break;
          }
          return { scanned, hits };
        });
        const canvasHits = await page.evaluate(() => {
          const isBlue = (r: number, g: number, b: number) => { const R = r / 255, G = g / 255, B = b / 255; const max = Math.max(R, G, B), min = Math.min(R, G, B); const l = (max + min) / 2; if (max === min) return false; const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min); let h; if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60; else if (max === G) h = ((B - R) / d + 2) * 60; else h = ((R - G) / d + 4) * 60; return h >= 190 && h <= 260 && s > 0.15 && d > 0.15; };
          const out: Array<{ canvas: number; sampled: number; blue: number; w: number; h: number }> = [];
          document.querySelectorAll("canvas").forEach((cv, i) => {
            try {
              const w = cv.width, h = cv.height; if (!w || !h) return;
              let data: Uint8ClampedArray | null = null;
              const ctx2d = cv.getContext("2d"); if (ctx2d) data = ctx2d.getImageData(0, 0, w, h).data;
              else { const gl = (cv.getContext("webgl2") || cv.getContext("webgl")) as WebGLRenderingContext | null; if (gl) { const buf = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf); data = new Uint8ClampedArray(buf.buffer); } }
              if (!data) { out.push({ canvas: i, sampled: 0, blue: -1, w, h }); return; }
              let sampled = 0, blue = 0; const step = Math.max(1, Math.floor((w * h) / 200000)) * 4;
              for (let p = 0; p < data.length; p += step) { if (data[p + 3] < 20) continue; sampled++; if (isBlue(data[p], data[p + 1], data[p + 2])) blue++; }
              out.push({ canvas: i, sampled, blue, w, h });
            } catch { out.push({ canvas: i, sampled: 0, blue: -2, w: cv.width, h: cv.height }); }
          });
          return out;
        });
        rec.c15_blue = { styleScanned: styleHits.scanned, styleHits: styleHits.hits, canvases: canvasHits };
        expect(styleHits.hits, "C15 no blue computed styles").toEqual([]);
        const bluePx = canvasHits.reduce((a, c) => a + Math.max(0, c.blue), 0);
        const sampled = canvasHits.reduce((a, c) => a + c.sampled, 0);
        // Tolerate ≤ 0.1% isolated anti-aliased pixels; sized canvases must have been sampled
        expect(bluePx / Math.max(1, sampled), "C15 no blue canvas pixels").toBeLessThan(0.001);
      }
      void isBlue;

      // Screenshots: after-<vp>.png (full page), after-register-rings (fit + labels)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(PROOF, `after-${vp.label}.png`), fullPage: true });
      if (desktop) {
        await page.getByTestId("graph-mode-3d").click();
        await expect.poll(async () => (await gs(page)).mode, { timeout: 30_000 }).toBe("3d");
        await settled(page);
        const labels = page.getByTestId("graph-labels");
        if ((await labels.getAttribute("aria-pressed")) !== "true") await labels.click();
        const halos = page.getByTestId("graph-halos");
        if ((await halos.getAttribute("aria-pressed")) !== "true") await halos.click();
        await page.getByTestId("graph-fit").click();
        await page.waitForTimeout(2500);
        await page.evaluate(() => document.querySelector("[data-testid=correlation-graph-wrap]")?.scrollIntoView({ block: "center" }));
        await page.waitForTimeout(600);
        const st = await gs(page);
        rec.rings_shot = { halos: st.halos?.length, labelCount: (st as Record<string, unknown>).labelCount, haloCount: (st as Record<string, unknown>).haloCount };
        await page.screenshot({ path: path.join(PROOF, `after-register-rings-${vp.label}.png`) });
      }

      // C13 console/page errors (fixture asserts too)
      rec.c13_errors = errors.slice(0, 20);
      fs.writeFileSync(path.join(PROOF, `live-15-${vp.label}.json`), JSON.stringify(rec, null, 2));
      expect(errors, "C13 zero console/page errors").toEqual([]);
    });
  });
}
