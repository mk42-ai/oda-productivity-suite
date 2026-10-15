import { test } from "@playwright/test";
import fs from "node:fs";
/** rAF-batch / frame-drop metrics on the live preview: counts React commits of the stream store (data-commit on the live turn) vs SSE frames,
 *  and long animation frames (>50 ms) while the highfreq fixture streams at 40 ms/frame. Writes ui-proof/pass2-metrics.json. */
test.use({ viewport: { width: 1440, height: 900 } });
test("rAF batch + frame-drop metrics", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __m: { commits: number; longFrames: number; frames: number; maxGap: number; rafTicks: number } };
    w.__m = { commits: 0, longFrames: 0, frames: 0, maxGap: 0, rafTicks: 0 };
    // one rAF loop: measures frame gaps (>50 ms = a dropped frame budget) AND samples the live turn's data-commit (= store version) each tick,
    // so `commits` is the number of distinct React commits the stream store produced while the turn was live.
    const seen = new Set<string>();
    let last = performance.now(); const tick = (t: number) => { const gap = t - last; last = t; w.__m.rafTicks++; if (gap > 50) w.__m.longFrames++; if (gap > w.__m.maxGap) w.__m.maxGap = gap; const el = document.querySelector("[data-testid=assistant-streaming]"); if (el) { const c = el.getAttribute("data-commit") ?? ""; if (c && !seen.has(c)) { seen.add(c); w.__m.commits = seen.size; } } requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  });
  const t0 = Date.now();
  await page.goto("/chat?fixture=highfreq&skip=1&fxdelay=40&q=" + encodeURIComponent("High-frequency stream metrics"));
  await page.getByTestId("answer-block").waitFor({ timeout: 90_000 });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => (window as unknown as { __m: unknown }).__m) as Record<string, number>;
  const perf = await page.evaluate(() => (window as unknown as { __oiuPerf?: { commits: number; patches: number } }).__oiuPerf ?? null); if (perf) { m.commits = perf.commits; (m as Record<string, unknown>).patches = perf.patches; (m as Record<string, unknown>).raf_batch_ratio = perf.commits ? Number((perf.patches / perf.commits).toFixed(2)) : null; }
  await page.getByTestId("inspector-toggle").click(); const railTxt = (await page.getByTestId("rail-metrics").textContent()) ?? ""; const framesM = railTxt.match(/(\d+) frames/); if (framesM) m.frames = Number(framesM[1]); const ttftM = railTxt.match(/first token ([\d,]+) ms/); (m as Record<string, unknown>).ttft_ui_ms = ttftM ? Number(ttftM[1].replace(/,/g, "")) : null;
  const out = { base_url: process.env.BASE_URL, fixture: "highfreq", pace_ms: 40, sse_frames_expected: 16, ...(m as Record<string, number>), wall_ms: Date.now() - t0, utc: new Date().toISOString() };
  fs.writeFileSync("ui-proof/pass2-metrics.json", JSON.stringify(out, null, 1)); console.log("METRICS", JSON.stringify(out));
});
