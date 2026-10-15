import { test, expect, primeSettings, captureErrors, noHorizontalOverflow } from "./helpers";
import fs from "node:fs";
import path from "node:path";

const PROOF = process.env.PROOF_DIR || path.join(process.cwd(), "..", "..", ".ui-proof");
fs.mkdirSync(PROOF, { recursive: true });
const HAS_KEY = !!(process.env.ONDEMAND_API_KEY ?? process.env.ON_DEMAND_API_KEY ?? "");
const RAW = "the answer could not be completed";
const FAIL = [`data: ${JSON.stringify({type:"RUN_STARTED",threadId:"t",runId:"r1"})}`,`data: ${JSON.stringify({type:"RUN_ERROR",message:"The answer could not be completed",code:"upstream_http"})}`,"data: [DONE]",""].join("\n")+"\n";
const OK = [`data: ${JSON.stringify({type:"RUN_STARTED",threadId:"t",runId:"r2"})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_START",messageId:"m1"})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_CONTENT",messageId:"m1",delta:"Retry succeeded: Fervo Energy is a geothermal company in the portfolio."})}`,`data: ${JSON.stringify({type:"TEXT_MESSAGE_END",messageId:"m1"})}`,`data: ${JSON.stringify({type:"RUN_FINISHED",threadId:"t",runId:"r2"})}`,"data: [DONE]",""].join("\n")+"\n";

const ROUTES = [
  { p: "/", name: "root", final: "/overview" },
  { p: "/overview", name: "overview" },
  { p: "/companies", name: "companies" },
  { p: "/social", name: "social" },
  { p: "/docs/interactive-ui", name: "docs-interactive-ui" },
] as const;

for (const vp of [{ w: 1440, h: 900, label: "1440x900" }, { w: 390, h: 844, label: "390x844" }] as const) {
  test.describe(`live smoke ${vp.label}`, () => {
    test.use({ viewport: { width: vp.w, height: vp.h } });
    test.beforeEach(async ({ page }) => { await primeSettings(page); });

    for (const r of ROUTES) {
      test(`route ${r.p}`, async ({ page }) => {
        const errs = captureErrors(page);
        const resp = await page.goto(r.p);
        expect(resp?.status(), r.p).toBe(200);
        await page.waitForLoadState("networkidle").catch(() => {});
        if ("final" in r && r.final) await expect(page).toHaveURL(new RegExp(r.final.replace("/", "\\/") + "$"));
        expect(await page.locator("body").innerText()).not.toHaveLength(0);
        expect(await noHorizontalOverflow(page), "no horizontal overflow").toBe(true);
        await page.screenshot({ path: path.join(PROOF, `live-${r.name}-${vp.label}.png`) });
        expect(errs).toEqual([]);
      });
    }

    test("bad url is 404", async ({ page }) => {
      const resp = await page.goto("/this-route-does-not-exist-smoke");
      expect(resp?.status()).toBe(404);
      await page.screenshot({ path: path.join(PROOF, `live-notfound-${vp.label}.png`) });
    });

    test("nav links + back/forward", async ({ page }) => {
      const errs = captureErrors(page);
      await page.goto("/overview");
      const nav = page.getByTestId("primary-nav");
      await nav.getByTestId("nav-companies").scrollIntoViewIfNeeded();
      await nav.getByTestId("nav-companies").click(); await expect(page).toHaveURL(/\/companies/);
      await nav.getByTestId("nav-social").scrollIntoViewIfNeeded();
      await nav.getByTestId("nav-social").click(); await expect(page).toHaveURL(/\/social/);
      await page.goBack(); await expect(page).toHaveURL(/\/companies/);
      await page.goForward(); await expect(page).toHaveURL(/\/social/);
      await page.screenshot({ path: path.join(PROOF, `live-backforward-${vp.label}.png`) });
      expect(errs).toEqual([]);
    });

    test("preserved surfaces: docs + GROWTH", async ({ page }) => {
      await page.goto("/docs/interactive-ui");
      await expect(page.locator("body")).toContainText(/Synergy matrix|Why the chat is interactive/i);
      await primeSettings(page, { onboarded: false, companies: [] });
      await page.goto("/onboarding?skip=1");
      const first = page.locator('[data-testid="growth-value"]').first();
      await expect(page.locator('[data-testid="growth-grid"]')).toBeVisible();
      await first.click(); await expect(first).toHaveAttribute("aria-expanded", "true");
      await page.screenshot({ path: path.join(PROOF, `live-growth-${vp.label}.png`) });
    });

    test("chat actual request 200 + answer", async ({ page }) => {
      test.skip(!HAS_KEY, "no ONDEMAND key in runner env");
      const errs = captureErrors(page);
      let status = 0;
      page.on("response", (r) => { if (r.url().includes("/api/chat") && r.request().method() === "POST") status = r.status(); });
      await page.goto("/chat?skip=1");
      await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
      await page.getByTestId("composer-input").fill("Tell me about Fervo Energy in one line.");
      await page.getByTestId("composer-send").click();
      await expect.poll(() => status, { timeout: 90_000 }).toBe(200);
      await expect(page.locator("body")).toContainText(/Fervo/i, { timeout: 90_000 });
      await page.screenshot({ path: path.join(PROOF, `live-chat-${vp.label}.png`) });
      expect(errs).toEqual([]);
    });

    test("discreet retry: forced failure, no raw in DOM, retry recovers", async ({ page }) => {
      let posts = 0;
      await page.route("**/api/chat", async (route) => {
        if (route.request().method() === "POST") { posts++; await route.fulfill({ status: 200, contentType: "text/event-stream", body: FAIL }); } else await route.continue();
      });
      await page.goto("/chat?skip=1");
      await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
      await page.getByTestId("composer-input").fill("Tell me about Fervo Energy in one line.");
      await page.getByTestId("composer-send").click();
      const notice = page.getByTestId("chat-error");
      await expect(notice).toBeVisible({ timeout: 30_000 });
      await expect(notice).toContainText("Response failed");
      await expect(page.getByTestId("chat-error-retry")).toBeVisible();
      const innerText = (await page.locator("body").innerText()).toLowerCase();
      expect(innerText).not.toContain(RAW);
      const domProbe = await page.evaluate((raw) => {
        const html = document.documentElement.innerHTML.toLowerCase();
        const lib = Array.from(document.querySelectorAll(".openui-agent-thread-error")).map((el) => {
          const s = getComputedStyle(el as HTMLElement); return { display: s.display, visible: s.display !== "none" && !!(el as HTMLElement).offsetParent, text: (el as HTMLElement).innerText?.slice(0, 80) };
        });
        return { htmlHasRaw: html.includes(raw), lib };
      }, RAW);
      console.log("DOM_PROBE", JSON.stringify(domProbe));
      expect(domProbe.htmlHasRaw, "raw upstream error must not be in DOM").toBe(false);
      expect(domProbe.lib.every((b) => !b.visible)).toBe(true);
      await page.screenshot({ path: path.join(PROOF, `live-retry-error-${vp.label}.png`) });
      await page.unroute("**/api/chat");
      await page.route("**/api/chat", async (route) => {
        if (route.request().method() === "POST") { posts++; await route.fulfill({ status: 200, contentType: "text/event-stream", body: OK }); } else await route.continue();
      });
      const before = posts;
      await page.getByTestId("chat-error-retry").click();
      await expect.poll(() => posts).toBeGreaterThan(before);
      await expect(page.locator("body")).toContainText("Retry succeeded: Fervo Energy", { timeout: 30_000 });
      await expect(notice).toHaveCount(0);
      await page.screenshot({ path: path.join(PROOF, `live-retry-recovered-${vp.label}.png`) });
    });
  });
}
