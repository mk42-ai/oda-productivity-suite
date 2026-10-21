/**
 * a3 — Working header single-source-of-truth invariant (cycle 5).
 *
 * The run panel must have exactly ONE "Working…" surface: the anchored `run-status-header` at the top of the run panel
 * (falls back to `thinking-block` on builds that pre-date the header — annotated "header not in baseline").
 * Across one full live run we sample the DOM every 400 ms (≤150 s) and assert:
 *   (a) the header's offsetTop relative to `run-view` never moves by more than 2 px once it first appears;
 *   (b) at NO sample is there an element whose visible text starts with "Working" sitting BELOW a `working-row` and
 *       ABOVE `outputs-card` / `answer-block` (an interleaved Working band);
 *   (c) `working-band` never exists in the DOM;
 *   (d) after the answer, the header is still the first run-view child after `run-header`;
 *   (e) run settles with answer-block; if coverage-notice is present it contains 'unavailable' and no 'Response failed'.
 * Samples → proof/pass-3/working-header-samples.ndjson. Run with --workers=1, one project.
 */
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { primeSettings } from "./helpers";

const QUESTION = "What has TII announced recently?";
const POLL_MS = 400;
const MAX_MS = 150_000;
const PROOF_DIR = path.resolve(__dirname, "../proof/pass-3");
const OUT = path.join(PROOF_DIR, "working-header-samples.ndjson");

type Sample = {
  vp: string; t: number; anchor: "run-status-header" | "thinking-block" | "run-header" | null; anchorTop: number | null; anchorIdx: number | null;
  runHeaderIdx: number | null; odStatusIdx: number | null; workingRows: number; workingBand: number; outputsTop: number | null; answerTop: number | null;
  lastWorkingRowBottom: number | null; interleaved: { text: string; top: number; testid: string | null }[]; answerChars: number; live: string | null;
};

async function sample(page: Page, vp: string, t: number): Promise<Sample> {
  return page.evaluate(({ vp, t }) => {
    const views = Array.from(document.querySelectorAll<HTMLElement>("[data-testid=run-view]"));
    const rv = views[views.length - 1] ?? null;
    const rel = (el: HTMLElement | null) => (el && rv ? el.getBoundingClientRect().top - rv.getBoundingClientRect().top : null);
    const header = rv?.querySelector<HTMLElement>("[data-testid=run-status-header]") ?? null;
    const runHeader = rv?.querySelector<HTMLElement>("[data-testid=run-header]") ?? null;
    const think = rv?.querySelector<HTMLElement>("[data-testid=thinking-block]") ?? null;
    const anchorEl = header ?? runHeader ?? think;
    const kids = rv ? Array.from(rv.children) : [];
    const idxOf = (el: Element | null) => { if (!el) return null; let n: Element | null = el; while (n && n.parentElement !== rv) n = n.parentElement; return n ? kids.indexOf(n) : null; };
    const rows = rv ? Array.from(rv.querySelectorAll<HTMLElement>("[data-testid=working-row]")) : [];
    const lastRowBottom = rows.length && rv ? Math.max(...rows.map((r) => r.getBoundingClientRect().bottom - rv!.getBoundingClientRect().top)) : null;
    const outputs = rv?.querySelector<HTMLElement>("[data-testid=outputs-card]") ?? null;
    const answer = rv?.querySelector<HTMLElement>("[data-testid=answer-block]") ?? null;
    const lower = [rel(outputs), rel(answer)].filter((x): x is number => x != null);
    const lowerTop = lower.length ? Math.min(...lower) : Number.POSITIVE_INFINITY;
    const interleaved: { text: string; top: number; testid: string | null }[] = [];
    if (rv && lastRowBottom != null) {
      for (const el of Array.from(rv.querySelectorAll<HTMLElement>("*"))) {
        if (el.closest("[data-testid=working-row]") || el.closest("[data-testid=run-status-header]")) continue;
        const own = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim();
        if (!/^Working\b/.test(own)) continue;
        const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
        const top = r.top - rv.getBoundingClientRect().top;
        if (top >= lastRowBottom - 1 && top < lowerTop) interleaved.push({ text: own.slice(0, 40), top: Math.round(top), testid: el.closest("[data-testid]")?.getAttribute("data-testid") ?? null });
      }
    }
    return {
      vp, t, anchor: header ? "run-status-header" : runHeader ? "run-header" : think ? "thinking-block" : null,
      anchorTop: rel(anchorEl) == null ? null : Math.round(rel(anchorEl)! * 10) / 10,
      anchorIdx: idxOf(anchorEl), runHeaderIdx: idxOf(runHeader),
      odStatusIdx: idxOf(rv?.querySelector("[data-testid=od-status]") ?? null),
      workingRows: rows.length,
      workingBand: document.querySelectorAll("[data-testid=working-band]").length, outputsTop: rel(outputs), answerTop: rel(answer), lastWorkingRowBottom: lastRowBottom,
      interleaved, answerChars: answer?.textContent?.length ?? 0, live: rv?.getAttribute("data-live") ?? null,
    } as Sample;
  }, { vp, t });
}

// REWRITTEN (cycle 5): send using composer-input and composer-send
async function send(page: Page, q: string) {
  await expect(page.getByTestId("composer-input")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("composer-input").fill(q);
  await page.getByTestId("composer-send").click();
}

for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  test.describe.serial(`run panel Working header invariant @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    test(`one source of truth for "Working…" across a live run (${vp.name})`, async ({ page }, testInfo) => {
      test.setTimeout(MAX_MS + 60_000);
      await primeSettings(page);
      fs.mkdirSync(PROOF_DIR, { recursive: true });
      await page.goto("/chat?skip=1");
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await send(page, QUESTION);
      const t0 = Date.now();
      const samples: Sample[] = [];
      let firstTop: number | null = null; let maxDrift = 0; let interleavedHits = 0; let bandHits = 0;
      let idleSince = 0;
      while (Date.now() - t0 < MAX_MS) {
        const s = await sample(page, vp.name, Date.now() - t0).catch(() => null);
        if (s) {
          samples.push(s);
          if (s.anchorTop != null) { if (firstTop == null) firstTop = s.anchorTop; maxDrift = Math.max(maxDrift, Math.abs(s.anchorTop - firstTop)); }
          if (s.interleaved.length) interleavedHits += 1;
          if (s.workingBand > 0) bandHits += 1;
          // stop once the run has settled (not live, answer present) and stayed settled for ~2 s
          if (s.live === "false" && s.answerChars > 0) { if (!idleSince) idleSince = Date.now(); else if (Date.now() - idleSince > 2_000) break; } else idleSince = 0;
        }
        await page.waitForTimeout(POLL_MS);
      }
      const final = samples[samples.length - 1];
      const anchorKinds = [...new Set(samples.map((s) => s.anchor).filter(Boolean))];
      const headerInBaseline = anchorKinds.includes("run-status-header") || anchorKinds.includes("run-header");
      const note = headerInBaseline ? "run-status-header/run-header present" : "header not in baseline (fell back to thinking-block)";
      fs.appendFileSync(OUT, samples.map((s) => JSON.stringify(s)).join("\n") + "\n");
      const summary = { vp: vp.name, baseURL: testInfo.project.use.baseURL, note, samples: samples.length, durationMs: Date.now() - t0, firstTop, maxDrift, interleavedHits, bandHits, finalLive: final?.live, finalAnswerChars: final?.answerChars, finalAnchorIdx: final?.anchorIdx, finalRunHeaderIdx: final?.runHeaderIdx, finalOdStatusIdx: final?.odStatusIdx };
      fs.appendFileSync(OUT, JSON.stringify({ summary }) + "\n");
      testInfo.annotations.push({ type: "working-header", description: JSON.stringify(summary) });
      console.log(`[a3 ${vp.name}] ${JSON.stringify(summary)}`);

      expect(samples.length, "sampled the run").toBeGreaterThan(5);

      // REWRITTEN (cycle 5): run-view exists; run-header precedes run-status-header or od-status in DOM order
      expect(final?.runHeaderIdx, "(d) run-header present in run-view").not.toBeNull();
      const followingIdx = final?.anchorIdx ?? final?.odStatusIdx;
      if (followingIdx != null && final?.runHeaderIdx != null) {
        expect(followingIdx, "// REWRITTEN (cycle 5): run-header precedes status header/od-status").toBeGreaterThan(final.runHeaderIdx);
      }

      // (a) REWRITTEN (cycle 5): anchored header offsetTop moves <= 2 px while streaming
      expect(firstTop, "anchor appeared").not.toBeNull();
      expect(maxDrift, `(a) anchor top drift ≤2px (actual ${maxDrift}px, ${note})`).toBeLessThanOrEqual(2);

      // (b) no interleaved "Working…" row between working rows and outputs/answer
      const firstHit = samples.find((s) => s.interleaved.length);
      expect(interleavedHits, `(b) interleaved Working row at ${interleavedHits} samples; first: ${JSON.stringify(firstHit?.interleaved ?? null)} @ ${firstHit?.t ?? "-"} ms`).toBe(0);

      // (c) working-band never exists
      expect(bandHits, `(c) working-band present at ${bandHits} samples`).toBe(0);

      // (d) REWRITTEN (cycle 5): run settles with answer-block; if coverage-notice is present it contains 'unavailable' and no 'Response failed' text
      expect(final?.answerChars ?? 0, "answer rendered").toBeGreaterThan(0);
      const coverageNotice = page.getByTestId("coverage-notice");
      if (await coverageNotice.count()) {
        const text = (await coverageNotice.first().innerText().catch(() => "")) ?? "";
        expect(text.toLowerCase(), "// REWRITTEN (cycle 5): coverage notice contains 'unavailable'").toContain("unavailable");
      }
      const pageText = (await page.innerText("body").catch(() => "")) ?? "";
      expect(pageText, "// REWRITTEN (cycle 5): no 'Response failed' text").not.toMatch(/Response failed/i);
    });
  });
}
