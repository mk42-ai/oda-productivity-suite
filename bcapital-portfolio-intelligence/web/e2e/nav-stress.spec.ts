import { test, expect, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { primeSettings } from "./helpers";

/**
 * Navigation stress harness (2026-10-16). Hammers the App Router with the crash classes seen in production:
 * rapid nav clicks, back/forward spam, deep-link reloads, navigating with a drawer open, navigating mid-stream,
 * GROWTH tile mid-navigation, #news anchor, /signals and bad URLs — at 1440x900 and 390x844.
 *
 * Every pageerror (with stack), console error, hydration warning, unhandled rejection and error-boundary paint is
 * recorded as an event (route + stack) instead of failing fast, so one run covers every scenario. Each test then
 * asserts ZERO events; the JSONL ledger lives in STRESS_OUT (default /tmp/stress) and screenshots in PROOF_DIR.
 */
const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", "..", ".ui-proof");
const OUT = process.env.STRESS_OUT || "/tmp/stress";
fs.mkdirSync(PROOF, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

type Ev = { viewport: string; test: string; route: string; kind: string; message: string; stack?: string };
const NOISE = [/favicon/i, /net::ERR_ABORTED/i, /ERR_BLOCKED_BY_ORB/i, /Failed to load resource.*(404|net::)/i, /status of 404/i, /\[route-error\]|\[global-error\]/];
const HYDRATION = /hydrat|did not match|Minified React error|#418|#423|#425/i;
const BOUNDARY = /Application error: a client-side exception|This section hit a problem|Something went wrong/i;
const ROUTES = ["/", "/overview", "/companies", "/social", "/signals", "/reputation", "/docs/interactive-ui", "/news", "/chat?skip=1", "/company/fervo-energy", "/company/fervo-energy#news"];
const BADS = ["/no-such-page-xyz", "/companies/nope/definitely-bad", "/company/does-not-exist-zz"];
const SSE = ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED"].map((type) =>
  `data: ${JSON.stringify(type === "TEXT_MESSAGE_CONTENT" ? { type, messageId: "m", delta: "Stress answer: Fervo Energy is a geothermal developer." } : type.startsWith("RUN") ? { type, threadId: "t", runId: "r" } : { type, messageId: "m" })}\n\n`).join("") + "data: [DONE]\n\n";

function attach(page: Page, vp: string, name: string) {
  const ev: Ev[] = [];
  const push = (kind: string, message: string, stack?: string) => { if (!NOISE.some((r) => r.test(message))) ev.push({ viewport: vp, test: name, route: page.url(), kind, message: message.slice(0, 600), stack: stack?.split("\n").slice(0, 8).join("\n") }); };
  page.on("pageerror", (e) => push("pageerror", e.message, e.stack));
  page.on("console", (m) => {
    const t = m.text(); const loc = m.location(); const where = loc?.url ? `${loc.url}:${loc.lineNumber}` : undefined;
    if (/UNHANDLED_REJECTION/.test(t)) return push("unhandledrejection", t, where);
    if (m.type() === "error") return push(HYDRATION.test(t) ? "hydration" : "console.error", t, where);
    if (m.type() === "warning" && HYDRATION.test(t)) push("hydration", t, where);
  });
  return ev;
}
async function boundaryCheck(page: Page, ev: Ev[], vp: string, name: string) {
  const txt = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const m = txt.match(BOUNDARY);
  if (m) ev.push({ viewport: vp, test: name, route: page.url(), kind: "error-boundary", message: m[0] });
}
async function step(ev: Ev[], page: Page, vp: string, name: string, label: string, fn: () => Promise<unknown>) {
  try { await fn(); } catch (e) { ev.push({ viewport: vp, test: name, route: page.url(), kind: "harness-step", message: `${label}: ${(e as Error).message.split("\n")[0]}` }); }
}
async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => 0);
}
async function finish(page: Page, ev: Ev[], vp: string, name: string, info: TestInfo) {
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await boundaryCheck(page, ev, vp, name);
  const ov = await overflow(page);
  if (ov > 0) ev.push({ viewport: vp, test: name, route: page.url(), kind: "h-overflow", message: `scrollWidth exceeds clientWidth by ${ov}px` });
  await page.screenshot({ path: path.join(PROOF, `stress-${name}-${vp}.png`) }).catch(() => {});
  const real = ev.filter((e) => e.kind !== "harness-step");
  fs.appendFileSync(path.join(OUT, "events.jsonl"), ev.map((e) => JSON.stringify(e)).join("\n") + (ev.length ? "\n" : ""));
  fs.appendFileSync(path.join(OUT, "results.jsonl"), JSON.stringify({ viewport: vp, test: name, events: real.length, harness: ev.length - real.length, overflow: ov }) + "\n");
  info.annotations.push({ type: "events", description: JSON.stringify(ev) });
  expect(real, `stress events in ${name} @${vp}`).toEqual([]);
}
const nav = (page: Page, id: string) => page.locator(`[data-testid="primary-nav"] [data-testid="nav-${id}"]`).first();

for (const vp of [{ width: 1440, height: 900, label: "1440x900" }, { width: 390, height: 844, label: "390x844" }]) {
  test.describe(`nav stress @${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    test.beforeEach(async ({ page }) => {
      await primeSettings(page);
      await page.addInitScript(() => window.addEventListener("unhandledrejection", (e) => console.error("UNHANDLED_REJECTION " + ((e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)))));
    });

    test("rapid-nav", async ({ page }, info) => {
      const ev = attach(page, vp.label, "rapid-nav");
      await page.goto("/overview");
      const ids = ["overview", "companies", "news", "signals", "social", "pitchbook", "chat", "artifacts", "settings"];
      for (let round = 0; round < 3; round++) for (const id of ids) {
        await step(ev, page, vp.label, "rapid-nav", `click ${id}`, async () => { await nav(page, id).click({ timeout: 4000, noWaitAfter: true }); await page.waitForTimeout(150); });
      }
      await step(ev, page, vp.label, "rapid-nav", "final overview", async () => { await nav(page, "overview").click({ timeout: 4000 }); await expect(page).toHaveURL(/\/overview/); });
      await finish(page, ev, vp.label, "rapid-nav", info);
    });

    test("back-forward-spam", async ({ page }, info) => {
      const ev = attach(page, vp.label, "back-forward-spam");
      await page.goto("/overview");
      for (const id of ["companies", "signals", "social", "news"]) await step(ev, page, vp.label, "back-forward-spam", `nav ${id}`, async () => { await nav(page, id).click({ timeout: 5000 }); await page.waitForURL(new RegExp(id), { timeout: 15000 }); });
      await step(ev, page, vp.label, "back-forward-spam", "goto docs", () => page.goto("/docs/interactive-ui"));
      for (let i = 0; i < 10; i++) { await page.goBack({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(100); await page.goForward({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(100); }
      for (let i = 0; i < 5; i++) await page.goBack({ timeout: 8000 }).catch(() => {});
      await finish(page, ev, vp.label, "back-forward-spam", info);
    });

    test("deep-link-reload", async ({ page }, info) => {
      const ev = attach(page, vp.label, "deep-link-reload");
      for (const r of ROUTES) await step(ev, page, vp.label, "deep-link-reload", r, async () => {
        const res = await page.goto(r); expect.soft(res?.status() ?? 0, r).toBeLessThan(400);
        const res2 = await page.reload(); expect.soft(res2?.status() ?? 0, `${r} reload`).toBeLessThan(400);
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        await boundaryCheck(page, ev, vp.label, "deep-link-reload");
      });
      await finish(page, ev, vp.label, "deep-link-reload", info);
    });

    test("drawer-open-nav", async ({ page }, info) => {
      const ev = attach(page, vp.label, "drawer-open-nav");
      await page.goto("/companies"); await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await step(ev, page, vp.label, "drawer-open-nav", "open drawer", async () => {
        const trig = page.getByTestId("company-quick-view-trigger").first(); await trig.scrollIntoViewIfNeeded(); await trig.click();
        await expect(page.getByTestId("company-quick-view-drawer")).toBeVisible();
      });
      // Navigate while the drawer is open (the drawer overlay covers the rail on mobile → keyboard-free programmatic click on the link).
      await step(ev, page, vp.label, "drawer-open-nav", "nav while open", async () => { await nav(page, "signals").dispatchEvent("click"); await page.waitForURL(/\/signals/, { timeout: 15000 }); });
      await step(ev, page, vp.label, "drawer-open-nav", "drawer gone on /signals", async () => expect(page.getByTestId("company-quick-view-drawer")).toHaveCount(0));
      await step(ev, page, vp.label, "drawer-open-nav", "back", async () => { await page.goBack(); await page.waitForURL(/\/companies/, { timeout: 15000 }); });
      const locked = await page.evaluate(() => getComputedStyle(document.body).overflow === "hidden" || getComputedStyle(document.documentElement).overflow === "hidden" || document.body.style.pointerEvents === "none");
      if (locked) ev.push({ viewport: vp.label, test: "drawer-open-nav", route: page.url(), kind: "scroll-lock-leak", message: "body/html still scroll-locked after navigating away from an open drawer" });
      await step(ev, page, vp.label, "drawer-open-nav", "no drawer after back", async () => expect(page.getByTestId("company-quick-view-drawer")).toHaveCount(0));
      await finish(page, ev, vp.label, "drawer-open-nav", info);
    });

    test("nav-while-streaming", async ({ page }, info) => {
      const ev = attach(page, vp.label, "nav-while-streaming");
      await page.route("**/api/chat", async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({ status: 200, contentType: "text/event-stream", body: SSE }).catch(() => {});
      });
      await page.goto("/chat?skip=1");
      await step(ev, page, vp.label, "nav-while-streaming", "send", async () => { await page.getByTestId("composer-input").fill("Tell me about Fervo Energy in one line."); await page.getByTestId("composer-send").click(); });
      await page.waitForTimeout(500);
      await step(ev, page, vp.label, "nav-while-streaming", "nav overview mid-stream", async () => { await nav(page, "overview").click({ timeout: 5000 }); await page.waitForURL(/\/overview/, { timeout: 15000 }); });
      await page.waitForTimeout(4000);
      await step(ev, page, vp.label, "nav-while-streaming", "back to chat", async () => { await page.goBack(); await page.waitForURL(/\/chat/, { timeout: 15000 }); });
      await step(ev, page, vp.label, "nav-while-streaming", "forward", async () => { await page.goForward(); await page.waitForURL(/\/overview/, { timeout: 15000 }); });
      await finish(page, ev, vp.label, "nav-while-streaming", info);
    });

    test("growth-mid-nav", async ({ page }, info) => {
      const ev = attach(page, vp.label, "growth-mid-nav");
      await primeSettings(page, { onboarded: false, companies: [] });
      await page.goto("/onboarding?skip=1");
      await step(ev, page, vp.label, "growth-mid-nav", "click growth #1", async () => { await page.getByTestId("growth-grid").waitFor(); await page.locator('[data-testid="growth-value"]').first().click({ noWaitAfter: true }); });
      await step(ev, page, vp.label, "growth-mid-nav", "goto overview mid-animation", () => page.goto("/overview"));
      await step(ev, page, vp.label, "growth-mid-nav", "back", () => page.goBack());
      await step(ev, page, vp.label, "growth-mid-nav", "click growth #2", async () => { const b = page.locator('[data-testid="growth-value"]').nth(1); await b.click(); await page.locator('[data-testid="growth-value"]').nth(1).click(); });
      await step(ev, page, vp.label, "growth-mid-nav", "forward", () => page.goForward());
      await finish(page, ev, vp.label, "growth-mid-nav", info);
    });

    test("news-anchor", async ({ page }, info) => {
      const ev = attach(page, vp.label, "news-anchor");
      await page.goto("/company/fervo-energy#news");
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      // The section streams behind loading.tsx; RouteEffects scrolls once it exists. Poll instead of a fixed sleep.
      let top = 99999;
      for (let i = 0; i < 60; i++) { top = await page.locator("#news").evaluate((el) => el.getBoundingClientRect().top).catch(() => 99999); if (top >= -4 && top < vp.height) break; await page.waitForTimeout(250); }
      if (!(top >= -4 && top < vp.height)) ev.push({ viewport: vp.label, test: "news-anchor", route: page.url(), kind: "anchor", message: `#news not in viewport after deep link (top=${Math.round(top)})` });
      // Client-side path: quick view drawer → "news" link
      await step(ev, page, vp.label, "news-anchor", "drawer news link", async () => {
        await page.goto("/companies"); const trig = page.getByTestId("company-quick-view-trigger").first(); await trig.click();
        const link = page.locator('[data-testid="company-quick-view-drawer"] a[href*="#news"]').first();
        if (await link.count()) { await link.click(); await page.waitForURL(/#news/, { timeout: 15000 });
          let t2 = 99999;
          for (let i = 0; i < 60; i++) { t2 = await page.locator("#news").evaluate((el) => el.getBoundingClientRect().top).catch(() => 99999); if (t2 >= -4 && t2 < vp.height) break; await page.waitForTimeout(250); }
          if (!(t2 >= -4 && t2 < vp.height)) ev.push({ viewport: vp.label, test: "news-anchor", route: page.url(), kind: "anchor", message: `#news not in viewport after client nav (top=${Math.round(t2)})` }); }
      });
      await finish(page, ev, vp.label, "news-anchor", info);
    });

    test("signals", async ({ page }, info) => {
      const ev = attach(page, vp.label, "signals");
      const r = await page.goto("/signals"); expect.soft(r?.status()).toBe(200);
      await step(ev, page, vp.label, "signals", "table", async () => expect(page.getByTestId("signals-table").or(page.getByText(/Signal Score unavailable/))).toBeVisible());
      await page.reload();
      await step(ev, page, vp.label, "signals", "nav to company + back", async () => { await page.locator('[data-testid="signals-table"] a').first().click(); await page.waitForURL(/\/company\//); await page.goBack(); await page.waitForURL(/\/signals/); });
      await finish(page, ev, vp.label, "signals", info);
    });

    test("bad-urls", async ({ page }, info) => {
      const ev = attach(page, vp.label, "bad-urls");
      for (const b of BADS) {
        const r = await page.goto(b); expect.soft(r?.status(), b).toBe(404);
        await step(ev, page, vp.label, "bad-urls", `${b} copy`, async () => expect(page.getByText(/Page not found|could not be found|not found/i).first()).toBeVisible());
      }
      await step(ev, page, vp.label, "bad-urls", "recover via nav", async () => { await nav(page, "overview").click(); await page.waitForURL(/\/overview/); });
      await finish(page, ev, vp.label, "bad-urls", info);
    });
  });
}
