import type { Page } from "@playwright/test";
import { test as base, expect, hasKey, isAllowed } from "./helpers";

/** Same auto error gate as helpers.ts, but the browser's own "Failed to load resource: … 503" line for the HONEST
 *  /api/voice/workflow unavailable answer (VOICE_WORKFLOW_ID empty) is expected here, not an app error. */
const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use, testInfo) => {
      const errs: string[] = [];
      (page as Page).on("pageerror", (e) => { const m = "pageerror: " + e.message; if (!isAllowed(m)) errs.push(m); });
      (page as Page).on("console", (m) => {
        if (m.type() !== "error") return;
        const url = m.location()?.url ?? "";
        if (/\/api\/voice\/workflow/.test(url) && /503|Service Unavailable/.test(m.text())) return; // honest unavailable state
        const t = "console: " + m.text(); if (!isAllowed(t)) errs.push(t);
      });
      await use(errs);
      if (errs.length) testInfo.annotations.push({ type: "client-errors", description: errs.slice(0, 10).join(" | ") });
      expect(errs, "no client-side page/console errors").toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Voice mode — rewritten 2026-10-21 (QA cycle 4, Lane B) to the surface that actually ships in this build:
 *   • there is NO /api/voice/tts route and NO "voice-mode" / "voice-select" controls any more — voice is a full-duplex dock
 *     (src/components/chat/voice/voice-dock.tsx, since 4d0be39) whose mic button is portalled into the composer row and whose
 *     turn is mirrored to the Agents Flow Builder workflow through POST /api/voice/workflow (src/app/api/voice/workflow/route.ts);
 *   • when VOICE_WORKFLOW_ID is empty the relay must answer an HONEST 503 { code: "no_workflow" } and the panel must show the
 *     "Voice workflow: unavailable: …" line instead of pretending the workflow ran.
 * The previous assertions (tts relay / mic-first ordering / voice-mode toggle / alloy voice select) were stale: the old
 * `voice relay: POST /api/voice/tts …` test failed with "Unexpected token '<'" (Next 404 HTML) and the old UI test with
 * "getByTestId('voice-mode') … element(s) not found" in cycle 3 (qa/2026-10-21-cycle3/laneA/s3-uploads.log). Nothing is deleted:
 * the two stale tests are rewritten in place against the real contract.
 */
const SSE = ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED"].map((type) =>
  `data: ${JSON.stringify(type === "TEXT_MESSAGE_CONTENT" ? { type, messageId: "m", delta: "Voice answer: Technology Innovation Institute is Abu Dhabi's applied-research institute." } : type.startsWith("RUN") ? { type, threadId: "t", runId: "r" } : { type, messageId: "m" })}\n\n`).join("") + "data: [DONE]\n\n";

test.describe("voice", () => {
  test("voice relay: POST /api/voice/workflow executes the advanced-voice workflow (ok:true + executionId) or answers an honest 503 no_workflow when VOICE_WORKFLOW_ID is empty", async ({ request }, testInfo) => {
    test.skip(!hasKey(), "ONDEMAND_API_KEY not set in this runner");
    const r = await request.post("/api/voice/workflow", { data: { transcript: "Hello from UAE AI Command Centre.", pluginIds: [] } });
    const j = (await r.json()) as { ok: boolean; executionId?: string; workflowId?: string; code?: string; message?: string };
    if (j.ok) {
      expect(r.status()).toBe(200);
      expect(j.executionId).toMatch(/^[a-f0-9]{24}$/i);
      expect(j.workflowId).toBeTruthy();
      testInfo.annotations.push({ type: "voice", description: `workflow live: ${j.workflowId} → execution ${j.executionId}` });
    } else {
      // Honest unavailable state: the server says WHY (no workflow id / no key / upstream) — never a 404 HTML page.
      expect(["no_workflow", "no_key", "upstream"]).toContain(j.code);
      expect([502, 503, 401, 403]).toContain(r.status());
      expect(j.message ?? "").not.toBe("");
      testInfo.annotations.push({ type: "voice", description: `BLOCKED_BY_EXTERNAL_DEPENDENCY: ${j.code} — ${j.message}` });
    }
    // GET without a well-formed executionId is a 400 bad_request (polling contract).
    const bad = await request.get("/api/voice/workflow?executionId=nope");
    expect(bad.status()).toBe(400);
    expect(((await bad.json()) as { code: string }).code).toBe("bad_request");
    // The legacy TTS relay is gone in this build — assert it stays gone so the spec cannot silently regress to the old contract.
    const legacy = await request.post("/api/voice/tts", { data: { text: "x" } });
    expect(legacy.status()).toBe(404);
  });

  test("voice relay: expired/unknown clip token is a 404 and STT rejects a non-audio form", async ({ request }) => {
    const miss = await request.get("/api/voice/clip/deadbeefdeadbeefdeadbeef0000");
    expect(miss.status()).toBe(404);
    const bad = await request.post("/api/voice/stt", { multipart: { note: "no audio here" } });
    expect(bad.status()).toBe(400);
  });

  test("voice UI: composer mic → full-duplex panel (listening with the fake mic, or an honest error); orb + Start/End toggle match; a voice turn shows the honest workflow status", async ({ page, context }, testInfo) => {
    await context.grantPermissions(["microphone"]);
    // Keep the chat turn offline: the voice turn goes through the normal /api/chat path, which we stub so no Perplexity credits are spent.
    await page.route("**/api/chat", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: SSE }).catch(() => {});
    });
    await page.goto("/chat?skip=1");
    const mic = page.getByTestId("voice-mic");
    await expect(mic).toBeVisible({ timeout: 30_000 });
    // The mic lives in the composer row next to the send button (portalled into the "mic" slot).
    expect(await page.evaluate(() => !!document.querySelector("[data-testid=composer-row] [data-testid=voice-mic]") && !!document.querySelector("[data-testid=composer-row] [data-testid=composer-send]"))).toBe(true);
    await expect(mic).toHaveAttribute("data-state", "idle");
    await expect(mic).toHaveAttribute("aria-pressed", "false");
    await mic.click();
    const panel = page.getByTestId("voice-panel");
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(mic).toHaveAttribute("data-state", /^(listening|error)$/, { timeout: 10_000 });
    const state = (await mic.getAttribute("data-state"))!;
    const orb = page.getByTestId("voice-orb");
    await expect(orb).toBeAttached();
    await expect(orb).toHaveAttribute("data-state", state);
    await expect(panel).toHaveAttribute("data-state", state);
    const toggle = page.getByTestId("voice-toggle");
    await expect(toggle).toBeVisible();
    if (state === "error") {
      await expect(page.getByTestId("voice-error")).toBeVisible();
      await expect(page.getByTestId("voice-state")).toContainText(/Voice unavailable/);
      testInfo.annotations.push({ type: "voice", description: `mic error: ${await page.getByTestId("voice-error").innerText()}` });
    } else {
      await expect(toggle).toHaveText("End");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("voice-state")).toContainText(/Listening/);
      testInfo.annotations.push({ type: "voice", description: "fake mic → listening (full duplex)" });
      // Escape ends duplex mode; the mic returns to idle and the panel stays open with the Start CTA.
      await page.keyboard.press("Escape");
      await expect(mic).toHaveAttribute("data-state", "idle", { timeout: 5_000 });
      await expect(toggle).toHaveText("Start");
    }
    // Plugin chips for the voice turn use the same per-turn selection as the chat.
    await expect(page.getByTestId("voice-plugins")).toBeAttached();
    // Inject one voice turn through the dock's own test hook (what /chat?voice= uses) and assert the HONEST workflow status line:
    // either the workflow runs (starting/running/success…) or it says "unavailable: VOICE_WORKFLOW_ID is not configured" — never a crash.
    await page.evaluate(() => (window as unknown as { __uaeccVoice?: { injectTranscript: (s: string, partialFirst?: boolean) => Promise<void> } }).__uaeccVoice?.injectTranscript("What does the Technology Innovation Institute do?", false));
    const wf = page.getByTestId("voice-workflow");
    await expect(wf).toBeAttached({ timeout: 20_000 });
    await expect(wf).toHaveAttribute("data-status", /^(starting|running|unavailable: .+|HTTP \d{3}|[A-Za-z_-]+)$/, { timeout: 20_000 });
    const status = (await wf.getAttribute("data-status")) ?? "";
    testInfo.annotations.push({ type: "voice-workflow", description: status });
    if (/^unavailable:/.test(status)) expect(status).toMatch(/VOICE_WORKFLOW_ID is not configured|ONDEMAND_API_KEY|HTTP|execute answered/);
    await expect(page.getByTestId("voice-origin").first()).toBeVisible({ timeout: 15_000 }); // the turn is marked "via voice"
    // Brand palette only on the panel (no blue computed colours).
    const blue = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[data-testid=voice-panel], [data-testid=voice-panel] *")) as HTMLElement[];
      return els.some((el) => { const cs = getComputedStyle(el); return [cs.color, cs.backgroundColor, cs.borderColor].some((c) => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m && +m[3] > 180 && +m[3] > +m[1] + 60 && +m[3] > +m[2] + 40; }); });
    });
    expect(blue).toBe(false);
  });

  test("voice a11y: caption strip is a polite live region and the mic has an accessible name", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);
    await page.goto("/chat?skip=1");
    const mic = page.getByTestId("voice-mic");
    await expect(mic).toBeVisible({ timeout: 30_000 });
    expect((await mic.getAttribute("aria-label")) ?? "").not.toBe("");
    await mic.click();
    const caption = page.getByTestId("voice-caption");
    await expect(caption).toBeAttached({ timeout: 10_000 });
    await expect(caption).toHaveAttribute("aria-live", "polite");
    await expect(caption).toHaveAttribute("aria-atomic", "true");
    await page.keyboard.press("Escape");
  });
});
