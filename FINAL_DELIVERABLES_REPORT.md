# FINAL_DELIVERABLES_REPORT.md — ODA Productivity Suite

**Final verification run:** 2026-07-17 03:58–04:36 UTC · session `6a59403bd40547963ad94eef`
**Repo:** `mk42-ai/oda-productivity-suite@main` · verified state `7c935a3` (production upgrades) on top of `0ea3de0` (streaming fixes) and `4f781a2`/`31e966f` (initial code + README)
**Live deployment (this run):** **https://sb-24ls40dblt27.vercel.run** — sandbox `sbx_lxFOIdN7aZs8zAWYEnqmUWbOA4ZS`, node22, port 8080, `ONDEMAND_API_KEY` via env var only. Root HTTP 200 @ `2026-07-17T04:14:20Z` · `/api/health` HTTP 200 `{"ok":true,"model":"predefined-gpt-5.6-sol+medium","keyLoaded":true}` @ `04:14:20Z`.
**Model policy:** every model call on `predefined-gpt-5.6-sol` + `reasoningEffort: medium` (= gpt-5.6-sol-medium), streaming ON — unchanged and re-verified live this run.

---

## 1 · Architecture & UX changes summary

| Area | What shipped |
|---|---|
| First-token experience | Backend streams 8 operational phases (Understanding → … → Finalising) the moment a request is accepted; frontend renders a rotating conic-gradient light-sweep indicator cycling 12 bilingual EN/AR terms (Analysing—تحليل … Collaboration—تعاون). Measured time-to-first-visible-event: **2–4 ms** (unbuffered read; 04:11:19Z). Never exposes chain-of-thought — safe status only. |
| Tool activity cards | `tool_start`/`tool_end` SSE frames drive shimmer→card transitions with tool name, purpose, live elapsed, completion state, result summary. |
| Standard/Debug modes | UI toggle (persisted). Debug reveals exact plugin ids, endpoint `predefined-gpt-5.6-sol+medium`, request ids, timings, artifact ids/URLs; server-side redaction guarantees no secrets in either mode (live-verified: no key material in DOM, 04:33:09Z). |
| Artifact pipeline | Intent detection routes docx→`plugin-1759408928`, pdf→`plugin-1739264368`, pptx/xlsx/csv→`plugin-1775547203`, image→`plugin-1776826082`, audio→TTS service; phases Queued→Planning→Generating→Rendering→Validating→Complete/Failed/Retrying streamed live; **download buttons stay disabled until a HEAD/status check confirms the artifact exists**; task status + links persist in the server-side store (restore-on-return). Local deterministic assembly is the always-available fallback. |
| Speech (STT/TTS) | Integrated exactly per the live-fetched Services API schemas (speech_to_text `{audioUrl}` / text_to_speech `{model,input,voice}`, apikey header). Full mic UX (tap-to-record, AnalyserNode waveform, duration, pause/cancel, editable transcript) and inline TTS player (play/pause/seek/speed/stop/regenerate/voice select, chunking). Workspace key lacks the Services subscription → both surfaces render a clean "not enabled on this workspace" state (see §8). |
| Error handling | Every error normalized to `{userMessage, errorCode, debugDetails}` at all four layers; SSE tail-flush; 90 s inactivity watchdog; upstream error frames surfaced; partial output preserved and persisted; one silent auto-reconnect on transport drops + manual Retry. |
| Hardening | React error boundaries (stream/wizard/audio/recorder); persistent session store (`server/data/state.json`); structured JSON logging with request ids and key-name redaction; aria/focus/keyboard/`prefers-reduced-motion` pass; EN/AR i18n with RTL safety; brand assets (sidebar logo, faded cover watermark, 5 woff2 fonts). |

## 2 · Bugs discovered and fixed (cumulative)

1. **`[object Object]` streaming failure** — root cause §3; fixed in `0ea3de0`.
2. **Silent upstream error frames** — `ondemand.js` ignored `error` eventType and error-status `statusLog` frames → streams stopped silently. Fixed: loud structured throws.
3. **No inactivity watchdog** — wedged upstream hung requests until socket death. Fixed: 90 s watchdog → `STREAM_STALLED`.
4. **Dropped final SSE line** — both readers discarded an unterminated trailing `data:` line. Fixed: tail-flush (unit U4 proves it).
5. **Partial output lost on failure** — mid-stream failures discarded streamed text. Fixed: `partialAnswer` carried + persisted with an "Incomplete" marker.
6. **pptx/xlsx exports 500** — missing `app/public/` binaries (`ENOENT oda-watermark-faded.png`). Fixed: assets regenerated + committed.
7. **Artifact downloads not gated** — buttons were live before bytes existed; expired artifacts 404'd confusingly. Fixed: HEAD gating + explicit 410 expired state.
8. **Unstructured backend error frame** — `{message}` only. Fixed: `{userMessage, errorCode, debugDetails, partialPreserved}` with code classification.

## 3 · Streaming-failure root cause (and fix)

**Chain:** long prompts → upstream fetch dies (`terminated`) or proxy returns JSON whose `error` field is an **object** → `api.js:35` `new Error(objectBody.error)` stringifies to `"[object Object]"` → `App.jsx:119` re-threw without coercion → `App.jsx:128` interpolated it into the chat bubble. Aggravated by silent upstream error frames, no watchdog, and the dropped final SSE line.
**Fix (commit `0ea3de0`):** `StreamError` + recursive `normalizeError()` (structurally cannot emit `[object Object]` — 10/10 adversarial unit cases re-proven this run @04:01:55Z), structured server error frames, watchdog, tail-flush, partial-output persistence, auto-reconnect, debug mode. **Re-verified live:** 12,411-char prompt → 11,623 chars streamed over 2,388 frames to a clean `done`, 0 error frames (04:10 UTC); browser journey B on an 11,164-char prompt rendered zero `[object Object]` including through a real mid-stream drop + retry cycle (04:18–04:24 UTC).

## 4 · Capability matrix

Full 16-row matrix in `CAPABILITY_MATRIX.md` (repo + prior artifact), built from the live docs (26 operations / 8 services, 12 OpenAPI specs fetched HTTP 200): **7 implemented · 3 partial · 6 not-implemented (4 deliberate)**. The 10 ADOPTed plugins (PLUGIN_TESTS.md, 10/10 re-verified HTTP 200 on 2026-07-16 21:04–21:07 UTC) back the 8 features; artifact routes additionally exercise `plugin-1759408928` (DOCX — live-proven this run with a hosted URL: HEAD 200, `application/vnd…wordprocessingml.document`, 26,153 B) and `plugin-1739264368` (PDF — integration test I3/I4: Complete + HEAD 200, 43,025 B).

## 5 · Newly enabled features

First-token bilingual swirl + phase streaming · tool-activity cards · Standard/Debug display modes · intent-routed artifact generation with phase cards and validated download gating · persisted artifact tasks with restore-on-return · mic recording UX with live waveform + editable transcript · inline TTS player · error boundaries · structured logging with request ids · EN/AR i18n + RTL + reduced-motion accessibility · official brand assets throughout.

## 6 · Evidence per workflow (screenshots in `demo-evidence-final/`, all 2026-07-17 UTC)

| Journey | Evidence | UTC |
|---|---|---|
| Shell/branding | `00-shell.png` (sidebar+logo+8 tools+8 chips) | 04:17:45 |
| A — chat w/ progress indicators | `A1-swirl-phases.png` (swirl live: "Orchestrating تنسيق · Understanding the request"), `A2-answer-complete.png` (1,460 chars, trace card, no `[object Object]`) | 04:17:50 / 04:18:18 |
| B — long prompt (11,164 chars) | `B1-long-prompt-streaming.png`, `B2-long-prompt-complete.png` (6,986 chars partial + structured toast), `B3-long-prompt-retry-complete.png` (5,399 chars clean, toast cleared) | 04:18:45 / 04:21:01 / 04:24:53 |
| C — tool activity cards | `C1-tool-activity-cards.png` (Router done 0 ms · Model stream done 71.4 s · purposes + summaries) | 04:25:37 |
| D — Word document | `D1-docx-task-running.png`, `D2-docx-task-complete.png` (DOCX Complete); hosted URL HEAD **200**, content-type `wordprocessingml.document`, **26,153 B**, OOXML-valid (`word/document.xml` present) | 04:30:45 / 04:31:22 / 04:34:00 |
| E — PowerPoint | `E1-pptx-task-complete.png` (PPTX Complete); HEAD **200**, 1,066,489 B, OOXML-valid **4 slides** | 04:32:32 / 04:34:00 |
| F — speech input | `F1-mic-idle.png`, `F2-mic-recording-waveform.png` (live waveform, 00:02 timer), `F3-mic-graceful-state.png` (clean gated note) | 04:32:32–04:32:41 |
| G — TTS playback | `G1-tts-state.png` (Listen → graceful "Speech services are not enabled on this workspace yet.") | 04:32:48 |
| H — forced failure + recovery | `H1-stream-dropped-structured-error-retry.png` ("The connection dropped mid-stream. [STREAM_DROPPED]" + Retry); retry completed cleanly with session intact (B3) | 04:21:29 |
| I — debug mode | `I1-debug-mode-cards.png` (model gpt-5.6-sol-medium, reqId, endpoint `predefined-gpt-5.6-sol+medium`, router source/reason, sawAnswer; **no secret material in DOM**) | 04:33:09 |

## 7 · Test results (STEP 1 — full detail in `TEST_RESULTS.md`)

Unit **10/10** (04:01:55Z) · Integration **11/11 product-level** (2 nominal TTFE fails were buffered-read harness artifacts; unbuffered re-measure: **2–4 ms** TTFE, 04:11:19Z) · PDF artifact Complete + HEAD 200 (43,025 B) · DOCX artifact Complete · 12,411-char perf run clean · Failure sims **5/5** (invalid key → `UPSTREAM_HTTP_401` structured; mid-stream drop → no session loss; tool error → structured 404; post-sim health ok; persistence verified).

## 8 · Known limitations

1. **Speech Services subscription gap** — `speech_to_text`/`text_to_speech` return 400 "Please subscribe" on this workspace key (live-probed 2026-07-17 03:28 UTC). UI degrades gracefully; zero code changes needed once the subscription is enabled. STT additionally needs `PUBLIC_BASE_URL` set so the service can fetch mic clips.
2. **Sandbox TTL** — preview URLs expire (2 h this deploy); redeploy uses the documented local-build + self-download flow (the sandbox exec layer was repeatedly faulty: "not a directory" on every binary).
3. **Session store is single-node JSON** — restores on restart but is not multi-instance safe.
4. **Custom WDI/GHO/SDG wrapper plugins** — still blocked by the platform tool-creation 524 outage; direct keyless API routes remain the (documented, verified) substitute.
5. **Thinking-token frames** — gpt-5.6-sol emits no `fulfillment_thinking` frames at medium effort (empirical); the accordion renders whenever the platform delivers them.

## 9 · Remaining production risks

Occasional upstream `terminated` drops on long streams (now recovered via auto-reconnect + Retry with partial output preserved — journey B/H proved the full cycle live) · artifact bytes are in-memory (metadata persists; bytes expire on restart → honest 410 + regenerate) · single API key ties all usage to one workspace quota · litterbox-hosted deploy bundle expires in 1 h (redeploys must re-upload).

## 10 · Recommended next improvements

Enable the OnDemand Services subscription (speech) and set `PUBLIC_BASE_URL` · move the session store to SQLite/Redis · persist artifact bytes to blob storage · create the WDI/GHO/SDG wrapper plugins when the tool-creation surface recovers · add CI (the unit suite is ready to wire into GitHub Actions) · add a durable deploy target beyond ephemeral sandboxes · consider `getchatmessages` rehydration for cross-restart chat history.

---

### Verification timeline (this run, all 2026-07-17 UTC)

03:58:57 workspace restored @7c935a3, token valid · 04:01:02 build clean · 04:01:55 unit 10/10 · 04:03:46–04:10:31 integration+perf+failure sims · 04:11:19 TTFE re-measure 2–4 ms · 04:12:02 TEST_RESULTS.md · 04:12:59 bundle hosted · 04:14:20 **deployed + root/health 200** · 04:17:45–04:33:09 journeys A–I (16 screenshots) · 04:34:00 D/E artifacts HEAD-validated + OOXML-verified · 04:35:38 AUDIT_REPORT.md updated in place · 04:36 this report.

*Generated by the final verification run · 2026-07-17 04:36 UTC*
