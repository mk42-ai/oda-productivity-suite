import { test, expect, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { primeSettings } from "./helpers";

/**
 * Navigation stress harness (2026-10-16). Hammers the App Router with the crash classes seen in production:
 * rapid nav clicks, back/forward spam, deep-link reloads, navigating with a drawer open, navigating mid-stream,
 * compare tray mid-navigation, #dossier-news anchor, /radar and bad URLs — at 1440x900 and 390x844 (UAE routes, 2026-10-21 rewrite).
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
const ROUTES = ["/", "/overview", "/watchlist", "/sentiment", "/radar", "/graph", "/briefing", "/methodology", "/docs/interactive-ui", "/news", "/chat?skip=1", "/watchlist/tii", "/watchlist/tii#dossier-news"];
const BADS = ["/no-such-page-xyz", "/watchlist/nope/definitely-bad", "/watchlist/does-not-exist-zz"];
const SSE = ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED"].map((type) =>
  `data: ${JSON.stringify(type === "TEXT_MESSAGE_CONTENT" ? { type, messageId: "m", delta: "Stress answer: Technology Innovation Institute is a geothermal developer." } : type.startsWith("RUN") ? { type, threadId: "t", runId: "r" } : { type, messageId: "m" })}\n\n`).join("") + "data: [DONE]\n\n";

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
/** At 390 px the primary nav lives in the off-canvas rail drawer — open it first when the link is not visible. */
async function openNavIfHidden(page: Page) {
  if (await nav(page, "overview").isVisible().catch(() => false)) return;
  const t = page.getByTestId("rail-drawer-toggle");
  if (await t.isVisible().catch(() => false)) { await t.click({ timeout: 4000 }).catch(() => {}); await page.getByTestId("rail-drawer").waitFor({ state: "visible", timeout: 4000 }).catch(() => {}); }
}

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
      const ids = ["overview", "watchlist", "sentiment", "news", "radar", "graph", "chat", "briefing", "artifacts", "methodology", "settings"];
      for (let round = 0; round < 3; round++) for (const id of ids) {
        await step(ev, page, vp.label, "rapid-nav", `click ${id}`, async () => { await openNavIfHidden(page); await nav(page, id).click({ timeout: 4000, noWaitAfter: true }); await page.waitForTimeout(150); });
      }
      await step(ev, page, vp.label, "rapid-nav", "final overview", async () => { await openNavIfHidden(page); await nav(page, "overview").click({ timeout: 4000 }); await expect(page).toHaveURL(/\/overview/); });
      await finish(page, ev, vp.label, "rapid-nav", info);
    });

    test("back-forward-spam", async ({ page }, info) => {
      const ev = attach(page, vp.label, "back-forward-spam");
      await page.goto("/overview");
      for (const id of ["watchlist", "radar", "sentiment", "news"]) await step(ev, page, vp.label, "back-forward-spam", `nav ${id}`, async () => { await openNavIfHidden(page); await nav(page, id).click({ timeout: 5000 }); await page.waitForURL(new RegExp(id), { timeout: 15000 }); });
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
      // The company quick-view drawer was removed with the UAE build; the chat inspector drawer is the modal surface that stays open across navigation.
      const ev = attach(page, vp.label, "drawer-open-nav");
      await page.goto("/chat?skip=1"); await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await step(ev, page, vp.label, "drawer-open-nav", "open drawer", async () => {
        await page.getByTestId("inspector-toggle").click();
        await expect(page.getByTestId("chat-inspector")).toHaveAttribute("data-open", "true");
        await expect(page.getByTestId("inspector-backdrop")).toBeVisible();
      });
      // Navigate while the drawer is open (programmatic click — the overlay covers the rail on mobile).
      await step(ev, page, vp.label, "drawer-open-nav", "nav while open", async () => { await openNavIfHidden(page); await nav(page, "radar").dispatchEvent("click"); await page.waitForURL(/\/radar/, { timeout: 15000 }); });
      await step(ev, page, vp.label, "drawer-open-nav", "drawer gone on /radar", async () => expect(page.getByTestId("inspector-backdrop")).toHaveCount(0));
      await step(ev, page, vp.label, "drawer-open-nav", "back", async () => { await page.goBack(); await page.waitForURL(/\/chat/, { timeout: 15000 }); });
      const locked = await page.evaluate(() => getComputedStyle(document.body).overflow === "hidden" || getComputedStyle(document.documentElement).overflow === "hidden" || document.body.style.pointerEvents === "none");
      if (locked) ev.push({ viewport: vp.label, test: "drawer-open-nav", route: page.url(), kind: "scroll-lock", message: "body still scroll-locked / pointer-events none after navigating away from an open drawer" });
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
      await step(ev, page, vp.label, "nav-while-streaming", "send", async () => { await page.getByTestId("composer-input").fill("Tell me about Technology Innovation Institute in one line."); await page.getByTestId("composer-send").click(); });
      await page.waitForTimeout(500);
      await step(ev, page, vp.label, "nav-while-streaming", "nav overview mid-stream", async () => { await openNavIfHidden(page); await nav(page, "overview").click({ timeout: 5000 }); await page.waitForURL(/\/overview/, { timeout: 15000 }); });
      await page.waitForTimeout(4000);
      await step(ev, page, vp.label, "nav-while-streaming", "back to chat", async () => { await page.goBack(); await page.waitForURL(/\/chat/, { timeout: 15000 }); });
      await step(ev, page, vp.label, "nav-while-streaming", "forward", async () => { await page.goForward(); await page.waitForURL(/\/overview/, { timeout: 15000 }); });
      await finish(page, ev, vp.label, "nav-while-streaming", info);
    });

    test("compare-mid-nav", async ({ page }, info) => {
      // Replaces the removed GROWTH onboarding tile: toggle the watchlist compare tray, navigate mid-interaction, come back.
      const ev = attach(page, vp.label, "compare-mid-nav");
      await page.goto("/watchlist");
      await step(ev, page, vp.label, "compare-mid-nav", "toggle compare #1", async () => { await page.getByTestId("org-card").first().waitFor(); await page.getByTestId("compare-toggle").first().click({ noWaitAfter: true }); });
      await step(ev, page, vp.label, "compare-mid-nav", "goto overview mid-interaction", () => page.goto("/overview"));
      await step(ev, page, vp.label, "compare-mid-nav", "back", () => page.goBack());
      await step(ev, page, vp.label, "compare-mid-nav", "toggle compare #2", async () => { const b = page.getByTestId("compare-toggle").nth(1); await b.click(); await expect(b).toHaveAttribute("aria-pressed", "true"); });
      await step(ev, page, vp.label, "compare-mid-nav", "forward", () => page.goForward());
      await finish(page, ev, vp.label, "compare-mid-nav", info);
    });

    test("news-anchor", async ({ page }, info) => {
      const ev = attach(page, vp.label, "news-anchor");
      await page.goto("/watchlist/tii#dossier-news");
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      // RouteEffects scrolls once the target exists. Poll instead of a fixed sleep.
      let top = 99999;
      for (let i = 0; i < 60; i++) { top = await page.locator("#dossier-news").evaluate((el) => el.getBoundingClientRect().top).catch(() => 99999); if (top >= -4 && top < vp.height) break; await page.waitForTimeout(250); }
      if (!(top >= -4 && top < vp.height)) ev.push({ viewport: vp.label, test: "news-anchor", route: page.url(), kind: "anchor", message: `#dossier-news not in viewport after deep link (top=${Math.round(top)})` });
      // Client-side path: watchlist card → dossier, then hash navigation
      await step(ev, page, vp.label, "news-anchor", "card → dossier → hash", async () => {
        await page.goto("/watchlist"); await page.locator('[data-testid="org-card"] a[href^="/watchlist/"]').first().click(); await page.waitForURL(/\/watchlist\/[a-z0-9-]+$/, { timeout: 15000 });
        await page.evaluate(() => { window.location.hash = "dossier-news"; });
        let t2 = 99999;
        for (let i = 0; i < 60; i++) { t2 = await page.locator("#dossier-news").evaluate((el) => el.getBoundingClientRect().top).catch(() => 99999); if (t2 >= -4 && t2 < vp.height) break; await page.waitForTimeout(250); }
        if (!(t2 >= -4 && t2 < vp.height)) ev.push({ viewport: vp.label, test: "news-anchor", route: page.url(), kind: "anchor", message: `#dossier-news not in viewport after client nav (top=${Math.round(t2)})` });
      });
      await finish(page, ev, vp.label, "news-anchor", info);
    });

    test("radar", async ({ page }, info) => {
      // Replaces the removed /signals table: the Tech Radar blips link to dossiers.
      const ev = attach(page, vp.label, "radar");
      const r = await page.goto("/radar"); expect.soft(r?.status()).toBe(200);
      await step(ev, page, vp.label, "radar", "blips", async () => expect(page.getByTestId("radar-blip").first()).toBeVisible());
      await page.reload();
      await step(ev, page, vp.label, "radar", "nav to watchlist + back", async () => { await openNavIfHidden(page); await nav(page, "watchlist").click(); await page.waitForURL(/\/watchlist/); await page.goBack(); await page.waitForURL(/\/radar/); });
      await finish(page, ev, vp.label, "radar", info);
    });

    test("bad-urls", async ({ page }, info) => {
      const ev = attach(page, vp.label, "bad-urls");
      for (const b of BADS) {
        const r = await page.goto(b); expect.soft(r?.status(), b).toBe(404);
        await step(ev, page, vp.label, "bad-urls", `${b} copy`, async () => expect(page.getByText(/Page not found|could not be found|not found/i).first()).toBeVisible());
      }
      await step(ev, page, vp.label, "bad-urls", "recover via nav", async () => { await openNavIfHidden(page); await nav(page, "overview").click(); await page.waitForURL(/\/overview/); });
      await finish(page, ev, vp.label, "bad-urls", info);
    });
  });
}
