// 5-agent QA harness (headless Playwright/playwright-core + system Chromium). Run: BASE_URL=<preview> node scripts/uae/qa/agentN.mjs (N=1..5)
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
export const BASE = process.env.BASE_URL || "https://sb-6x7pgj362xe9.vercel.run";
export const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const SHOTS = process.env.SHOT_DIR || `${APP}/proof/qa-20261020`;
export const VPS = [{ name: "1440x900", width: 1440, height: 900, mobile: false }, { name: "390x844", width: 390, height: 844, mobile: true }];
fs.mkdirSync(SHOTS, { recursive: true });

export function harness(agent) {
  const results = []; const round = process.env.ROUND || "r1";
  const out = `${process.env.QA_OUT || "/tmp"}/results-${agent}-${round}.json`;
  const save = () => fs.writeFileSync(out, JSON.stringify(results, null, 1));
  return {
    results,
    async record(test, vp, pass, detail, page) {
      const ts = new Date().toISOString(); let shot = null;
      if (page) { shot = `${agent}-${round}-${test}-${vp.name}.jpg`.replace(/[^\w.-]+/g, "_"); try { await page.screenshot({ path: `${SHOTS}/${shot}`, type: "jpeg", quality: 62, timeout: 20000 }); } catch (e) { shot = null; detail = `${detail} [screenshot failed: ${e.message.slice(0, 80)}]`; } }
      results.push({ agent, round, test, viewport: vp.name, pass: !!pass, detail: String(detail).slice(0, 900), ts, shot });
      console.log(`${pass ? "PASS" : "FAIL"} ${agent} ${test} ${vp.name} — ${String(detail).slice(0, 200)}`); save();
    },
    save,
  };
}
export async function withBrowser(fn) {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try { return await fn(b); } finally { await b.close().catch(() => {}); }
}
export async function ctx(b, vp, opts = {}) {
  return b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile, ...opts });
}
export async function go(page, path, wait = "domcontentloaded") {
  const r = await page.goto(BASE + path, { waitUntil: wait, timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  return r;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
