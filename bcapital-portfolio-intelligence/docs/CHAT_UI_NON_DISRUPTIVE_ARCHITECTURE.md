# Chat UI — non-disruptive architecture (B Capital Portfolio Intelligence)

_Generated 2026-10-15 (pass 2) from the source on branch `fix/navigation-crashes-20261014`. Every code block below is quoted verbatim from the file and line range named above it; nothing here is a specification — it is what the app runs._

## 1. Purpose & scope

The chat workspace gained four surfaces in two passes — the Verified Deliverables shelf, the Run rail (active skill · 5-stage pipeline · publisher-first citations · assumptions), the `ONDEMAND SETTINGS` drawer, and the root-first Intelligent UI renderer — without touching the existing stream reducers, the `/api/chat` + `/api/chat/creds` contracts, or the performance work that preceded them (rAF-coalesced state, scroll anchoring, throttled markdown, the performance badge). The mechanism is additive: new frames are demuxed by one pure, try/catch-isolated reducer whose result is committed through the same requestAnimationFrame boundary as every other frame, so a malformed payload can at worst be ignored, never break the run. This document quotes the real code paths that make that guarantee, then records the pass-1 and pass-2 verification results and the screenshot index under `web/ui-proof/`.

## 2. Additive SSE demux — `applyAdditiveRunFrames`

The reducer lives in `web/src/lib/chat-ui/additive-frames.ts`. It takes the current additive slice and ONE AG-UI `CUSTOM {name,value}` frame and returns the next slice; **any** exception inside returns `base` unchanged.

`src/lib/chat-ui/additive-frames.ts` (whole file, 59 lines):

```ts
/**
 * Additive SSE demux for the chat-ui parity frames (pass 1 + pass 2).
 *
 * `applyAdditiveRunFrames(base, frame)` is a PURE reducer: it takes the current additive slice of the stream state and ONE AG-UI CUSTOM
 * frame ({name, value}) and returns the next slice. It is wrapped in try/catch and returns `base` unchanged on ANY parser failure, so a
 * malformed or unexpected payload can never break the run view, the answer stream, or the existing reducers — the frame is simply ignored.
 * It is called from the chat shell's tee loop, and its result is committed through the SAME `setStream()` rAF/80 ms coalescer as every
 * other frame (no extra React commit per SSE event).
 */
import { CLIENT_EVENT as CE } from "@/lib/ondemand/eventMap";
import { IDLE_RAIL, IUI_MAX_STATEMENTS, type DeliverablesShelfData, type IuiStatement, type PipelineStageId, type RailState } from "./types";

export type AdditiveSlice = { deliverables: DeliverablesShelfData | null; rail: RailState; iui: IuiStatement[] };
export const IDLE_ADDITIVE: AdditiveSlice = { deliverables: null, rail: IDLE_RAIL, iui: [] };
export const ADDITIVE_FRAME_NAMES: ReadonlySet<string> = new Set([CE.deliverables, CE.skill, CE.stage, CE.assumptions, CE.iui]);

const STAGE_IDS: ReadonlySet<string> = new Set(["data-scout", "benchmark", "problem-solve", "storyline", "design"]);

export function applyAdditiveRunFrames(base: AdditiveSlice, frame: { name?: string; value?: unknown }): AdditiveSlice {
  try {
    const v = (frame.value && typeof frame.value === "object" ? frame.value : {}) as Record<string, unknown>;
    switch (frame.name) {
      case CE.deliverables: {
        if (!Array.isArray(v.items)) return base;
        const items = (v.items as Record<string, unknown>[]).filter((d) => d && typeof d.id === "string" && typeof d.title === "string").map((d) => ({
          id: String(d.id), title: String(d.title), format: String(d.format ?? "file"), version: Number.isFinite(Number(d.version)) ? Number(d.version) : 1,
          verified: d.verified === true, preview: typeof d.preview === "string" ? d.preview : "",
          downloadUrl: typeof d.downloadUrl === "string" ? d.downloadUrl : null,
          versions: Array.isArray(d.versions) ? (d.versions as Record<string, unknown>[]).filter((x) => Number.isFinite(Number(x.version))).map((x) => ({ version: Number(x.version), preview: typeof x.preview === "string" ? x.preview : "", contentUrl: typeof x.contentUrl === "string" ? x.contentUrl : null, at: typeof x.at === "string" ? x.at : null })) : [],
        }));
        return { ...base, deliverables: { items, durationMs: typeof v.durationMs === "number" && Number.isFinite(v.durationMs) ? v.durationMs : null, finalDownloadUrl: typeof v.finalDownloadUrl === "string" ? v.finalDownloadUrl : null, finalDownloadName: typeof v.finalDownloadName === "string" ? v.finalDownloadName : null } };
      }
      case CE.skill:
        return { ...base, rail: { ...base.rail, activeSkill: typeof v.label === "string" && v.label.trim() ? v.label.trim() : null } };
      case CE.stage: {
        const id = String(v.id ?? "");
        if (!STAGE_IDS.has(id)) return base;
        const sid = id as PipelineStageId; const ph = String(v.phase ?? "start"); const pl = base.rail.pipeline;
        const pipeline = ph === "start" ? { current: sid, done: pl.done.filter((d) => d !== sid), failed: null }
          : ph === "failed" ? { current: null, done: pl.done, failed: sid }
          : { current: pl.current === sid ? null : pl.current, done: pl.done.includes(sid) ? pl.done : [...pl.done, sid], failed: pl.failed === sid ? null : pl.failed };
        return { ...base, rail: { ...base.rail, pipeline } };
      }
      case CE.assumptions:
        if (!Array.isArray(v.items)) return base;
        return { ...base, rail: { ...base.rail, assumptions: (v.items as unknown[]).map((x) => String(x)).filter(Boolean).slice(0, 50) } };
      case CE.iui: {
        const add = (Array.isArray(v.statements) ? v.statements : v.statement ? [v.statement] : []) as IuiStatement[];
        const ok = add.filter((s) => s && typeof s === "object" && typeof (s as { op?: unknown }).op === "string" && typeof (s as { id?: unknown }).id === "string");
        if (!ok.length) return base;
        return { ...base, iui: [...base.iui, ...ok].slice(0, IUI_MAX_STATEMENTS) };
      }
      default:
        return base;
    }
  } catch {
    return base; // parser failure → base state, the run continues untouched
  }
}

```

Call site in the tee loop — the five frame names collapse into one case, and the result is committed with `setStream(next)` (coalesced, not immediate), so the demux never adds a React commit of its own:

`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 257–264:

```tsx
          // pass-2: additive frames (deliverables / skill / stage / assumptions / iui) go through ONE pure, try/catch-isolated reducer. A parser
          // failure returns the base slice unchanged, so a bad payload can never break the run; the result rides the same rAF commit boundary.
          case CE.deliverables: case CE.skill: case CE.stage: case CE.assumptions: case CE.iui: {
            const next = applyAdditiveRunFrames({ deliverables: st.deliverables, rail: st.rail, iui: st.iui }, { name: f.name, value: v });
            if (next.deliverables !== st.deliverables || next.rail !== st.rail || next.iui !== st.iui) setStream(next);
            break;
          }
          case CE.voice: if (typeof v.phase === "string") setStream({ voice: { phase: v.phase, ...(typeof v.text === "string" ? { text: v.text } : {}) } }); break;
```

**Why it cannot disrupt the run:** the reducer is pure (no React, no DOM, no fetch), every field it reads is type-checked at runtime before use, `IUI_MAX_STATEMENTS` (60) caps the statement list, unknown stage ids are ignored, and the outer `try { … } catch { return base; }` turns a parser failure into a no-op. The answer text, plan, tools, sources and prompts are handled by the pre-existing cases above it and are untouched.

## 3. Single rAF commit boundary

All stream state — pre-existing and additive — flows through one module-level store. A patch is merged into `pending`; one `setTimeout(FLUSH_MS) → requestAnimationFrame(flush)` chain commits it, so a burst of SSE deltas costs ONE React commit per 80 ms (140 ms on viewports ≤ 640 px). `immediate = true` is reserved for lifecycle edges (run start / finish, prompts, artifacts).

`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 122–141:

```ts
let pending: Partial<StreamState> | null = null; let rafId = 0;
const liveSources = new Map<string, Source[]>();
const liveMeta = new Map<string, StoredMeta>();
const listeners = new Set<() => void>();
const flush = () => { rafId = 0; if (!pending) return; const p = pending; pending = null; streamState = { ...streamState, ...p, version: streamState.version + 1 }; listeners.forEach((l) => l()); };
const FLUSH_MS = () => (typeof matchMedia !== "undefined" && matchMedia("(max-width: 640px)").matches ? 140 : 80);
let flushTimer: ReturnType<typeof setTimeout> | 0 = 0;
const setStream = (patch: Partial<StreamState>, immediate = false) => {
  pending = { ...(pending ?? {}), ...patch };
  if (immediate || typeof requestAnimationFrame === "undefined") { if (rafId && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(rafId); if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0; } rafId = 0; flush(); return; }
  // Time-boxed coalescing: a burst of deltas costs ONE commit per 80 ms (140 ms on narrow viewports) instead of one per animation frame.
  if (!flushTimer && !rafId) flushTimer = setTimeout(() => { flushTimer = 0; rafId = requestAnimationFrame(flush); }, FLUSH_MS());
};
/** Reads the latest value including not-yet-flushed patches (for tee-side accumulation). */
const peek = (): StreamState => ({ ...streamState, ...(pending ?? {}) });
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getStream = () => streamState;
export const useStreamState = () => useSyncExternalStore(subscribe, getStream, () => IDLE);
/** Narrow subscription: re-render only when the selected value changes (previous assistant messages must not re-render per token). */
export function useStreamSelector<T>(sel: (s: StreamState) => T): T { return useSyncExternalStore(subscribe, () => sel(streamState), () => sel(IDLE)); }
```

## 4. Virtualized thinking / activity list & scroll anchoring

The thinking body and the markdown answer re-render on a throttle rather than per token (`useThrottled`), the live run view is a single memoised tree keyed by stable ids (so `summarize_history.initialized / completed` — mapped to `CE.summary {phase:"start"|"done"}` in `lib/ondemand/eventMap.ts` — update a row in place instead of remounting the list; pass-2 payload E proves DOM-node identity survives three summaries), and `ScrollAnchor` follows the stream only while the user is pinned to the bottom. `atBottom.current` **is** `isPinnedToBottom`; it is mirrored onto the scroll container as `data-pinned-to-bottom` for tests and devtools.

`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 329–338:

```tsx
function useThrottled<T>(value: T, ms: number): T {
  const [v, setV] = useState(value); const last = useRef(0); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const now = Date.now(); const wait = Math.max(0, ms - (now - last.current));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { last.current = Date.now(); setV(value); }, wait);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, ms]);
  return v;
}
```
`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 1047–1076:

```tsx
function ScrollAnchor() {
  const isRunning = useThread((s) => s.isRunning); const st = useStreamState();
  const [away, setAway] = useState(false); const atBottom = useRef(true); const el = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const find = () => document.querySelector<HTMLElement>(".chat-shell .openui-agent-thread-scroll-area");
    el.current = find(); if (!el.current) return;
    const node = el.current;
    // isPinnedToBottom (= atBottom.current) is mirrored on the scroll container as data-pinned-to-bottom so tests / devtools can read it.
    const onScroll = () => { const gap = node.scrollHeight - node.scrollTop - node.clientHeight; atBottom.current = gap < 120; node.dataset.pinnedToBottom = atBottom.current ? "true" : "false"; setAway((a) => (a !== !atBottom.current ? !atBottom.current : a)); };
    node.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => node.removeEventListener("scroll", onScroll);
  }, [isRunning]);
  // Follow-to-bottom with an INSTANT scrollTop write (OpenUI's own smooth scrollTo lags behind fast growth on narrow viewports and leaves a
  // 100–300 px gap). Only while the user has not scrolled away (gap < 120 px); a programmatic scroll never counts as a layout shift.
  useLayoutEffect(() => {
    const node = el.current; if (!node || !isRunning) return;
    const gap = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (atBottom.current && gap > 2) node.scrollTop = node.scrollHeight;
    else atBottom.current = gap < 120;
    node.dataset.pinnedToBottom = atBottom.current ? "true" : "false";
  }, [st.version, isRunning]);
  // The "Jump to latest" pill is PORTALLED into the scroll container (absolute, out of flow). Rendering it as a sibling of the thread made
  // OpenUI's flex row shrink the whole thread by 128 px on every toggle — the single biggest layout shift in the recordings (CLS 0.23–0.81).
  const host = typeof document !== "undefined" ? el.current?.parentElement ?? null : null;
  const padOn = away && isRunning;
  // unit1: while the pill is shown, pad the scroll area so the last Working row can scroll above the pill (never hidden under it).
  useEffect(() => { const node = el.current; if (!node) return; node.classList.toggle("oiu-jump-pad", padOn); return () => node.classList.remove("oiu-jump-pad"); }, [padOn]);
  if (!padOn || !host) return null;
  return createPortal(<button type="button" className="oiu-jump" data-testid="jump-to-latest" onClick={() => { const node = el.current; if (node) { node.scrollTo({ top: node.scrollHeight, behavior: "smooth" }); atBottom.current = true; setAway(false); } }}><ArrowDown className="size-3.5" aria-hidden /> Jump to latest</button>, host);
}
```

The run timer is interval-driven and **pauses while the run waits for the user** (`paused` = live && phase === `awaiting-input`); the paused span is subtracted so the task time excludes the wait:

`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 437–446:

```tsx
function RunHeader({ live, startedAt, totalMs, tokens, logsOpen, onToggleLogs, outputs, paused }: RunHeaderProps) {
  const [now, setNow] = useState(() => Date.now());
  // Interval-driven (not frame-driven): the timer keeps ticking on heartbeat-only stretches until [DONE]/RUN_FINISHED —
  // and PAUSES while the run is waiting for the user (creds / clarification): the waiting time is not the run's time.
  const pausedAt = useRef<number | null>(null); const pausedTotal = useRef(0);
  useEffect(() => { if (paused) { if (pausedAt.current == null) pausedAt.current = Date.now(); } else if (pausedAt.current != null) { pausedTotal.current += Date.now() - pausedAt.current; pausedAt.current = null; } }, [paused]);
  useEffect(() => { if (!live || totalMs != null || paused) return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, [live, totalMs, paused]);
  const ms = totalMs != null ? totalMs : live && startedAt ? Math.max(0, (pausedAt.current ?? now) - startedAt - pausedTotal.current) : 0;
  return (
    <div className="oiu-run__header" data-testid="run-header" data-live={live ? "true" : "false"} aria-label="Run">
```

## 5. Key handling & plugin sanitiser

### 5.1 `x-ondemand-key` → `process.env.ONDEMAND_API_KEY` fallback

`src/app/api/chat/route.ts` lines 39–56:

```ts
/** pass-2 — ONDEMAND SETTINGS overrides arrive as request headers. They are validated + echoed back (x-ondemand-overrides) and the
 *  external user id is applied to the session; endpointId / pluginIds stay staged (the bridge keeps its fixed-model + pinned-plugin
 *  contract — see resolvePluginIds). The plugin list is sanitised the same way the drawer does it: DISABLED_PLUGIN_IDS removed, max 20. */
function readOverrides(req: NextRequest) {
  const endpointId = (req.headers.get("x-ondemand-endpoint-id") ?? "").trim().slice(0, 80) || null;
  const rawIds = (req.headers.get("x-ondemand-plugin-ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const pluginIds = [...new Set(rawIds.filter((id) => !DISABLED_PLUGIN_IDS.has(id)))].slice(0, 20);
  const externalUserId = (req.headers.get("x-ondemand-external-user-id") ?? "").trim().slice(0, 64) || null;
  return { endpointId, pluginIds, droppedPluginIds: rawIds.length - pluginIds.length, externalUserId, clientKey: !!req.headers.get("x-ondemand-key")?.trim() };
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  const ov = readOverrides(req);
  let body: BridgeBody = {};
  try { body = await req.json(); } catch { return Response.json({ error: { message: "expected JSON body" } }, { status: 400 }); }
  if (ov.externalUserId && body.context && typeof body.context === "object" && !body.context.externalUserId) body.context.externalUserId = ov.externalUserId;
  const echo = { "x-ondemand-overrides": JSON.stringify({ endpointId: ov.endpointId, pluginIds: ov.pluginIds.length, dropped: ov.droppedPluginIds, externalUserId: ov.externalUserId, keySource: ov.clientKey ? "client" : "server-env" }) };
```
`src/lib/ondemand/config.ts` lines 8–8:

```ts
export const serverApiKey = () => process.env.ONDEMAND_API_KEY?.trim() || "";
```
A blank client key means no `x-ondemand-key` header is sent at all (the drawer and the chat shell both guard on `s.apikey ?`), so the server-side key applies; the route echoes `x-ondemand-overrides: {…, keySource: "server-env"}` so a test can prove which key path was taken without ever seeing the value. The key is never logged and `next build` output is grepped for its value on every deploy (0 hits in pass 1 and pass 2).

### 5.2 `DISABLED_PLUGIN_IDS` and the `<= 20` sanitiser

`src/lib/ondemand/config-public.ts` lines 60–71:

```ts
/** Plugins switched off for now: never sent on a session create or a query, even when a stored toggle or a caller still asks for them. */
export const DISABLED_PLUGIN_IDS: ReadonlySet<string> = new Set(["plugin-1785777296", "plugin-1791713636"]); // X search; broken Portfolio Plugin (dead server URL in its schema)
/** Resolve the plugin list for one request: pinned Perplexity first, then every requested id that exists in the catalogue, in request order. */
export const resolvePluginIds = (requested: unknown, query?: string): { pluginIds: string[]; dropped: string[] } => {
  const req = Array.isArray(requested) ? requested.map(String) : [];
  const ok = req.filter((id) => PLUGIN_CATALOGUE_IDS.has(id) && id !== PLUGIN_ID && !DISABLED_PLUGIN_IDS.has(id));
  const base = [PLUGIN_ID, ...new Set(ok)];
  // Portfolio-internal question → the portfolio plugin leads (and is added if the client did not send it); everything else keeps Perplexity first.
  const portfolioFirst = !!PORTFOLIO_PLUGIN_ID && !!query && PORTFOLIO_QUESTION_RE.test(query);
  const pluginIds = portfolioFirst ? [PORTFOLIO_PLUGIN_ID!, ...base.filter((id) => id !== PORTFOLIO_PLUGIN_ID)] : base;
  return { pluginIds, dropped: req.filter((id) => id !== PLUGIN_ID && (!PLUGIN_CATALOGUE_IDS.has(id) || DISABLED_PLUGIN_IDS.has(id))) };
};
```
`src/components/chat/ondemand-settings-drawer.tsx` lines 20–42:

```ts
export const OD_MAX_PLUGIN_IDS = 20;
export const OD_DEFAULT_PLUGIN_IDS: readonly string[] = [
  "plugin-1741871229", "plugin-1751872652", "plugin-1785777296", "plugin-1716372717", "plugin-1716164040", "plugin-1785987361",
  "plugin-1784356219", "plugin-1748003575", "plugin-1718116202", "plugin-1722260873", "plugin-1713924030",
];
export type OndemandSettings = { endpointId: string; pluginIds: string[]; apiKey: string; sends: number };
const OD_DEFAULTS: OndemandSettings = { endpointId: OD_DEFAULT_ENDPOINT_ID, pluginIds: [...OD_DEFAULT_PLUGIN_IDS], apiKey: "", sends: 0 };

/** Parse a pasted plugin-id list (commas / whitespace / newlines), de-duplicated, order kept. */
export function parsePluginIds(raw: string): string[] {
  const out: string[] = []; const seen = new Set<string>();
  for (const tok of raw.split(/[\s,;]+/)) { const t = tok.trim(); if (!t || seen.has(t)) continue; seen.add(t); out.push(t); }
  return out;
}
/** `<= 20` guard: returns the capped list + a validation message when the paste exceeded the cap. */
export function guardPluginIds(ids: string[]): { ids: string[]; error: string; removed: string[] } {
  // Sanitizer (mirrors resolvePluginIds in lib/ondemand/config-public.ts): drop the DISABLED_PLUGIN_IDS, de-duplicate, then cap at 20.
  const removed = ids.filter((id) => DISABLED_PLUGIN_IDS.has(id));
  const live = ids.filter((id) => !DISABLED_PLUGIN_IDS.has(id));
  const note = removed.length ? ` Removed ${removed.length} disabled plugin id${removed.length === 1 ? "" : "s"} (${removed.join(", ")}).` : "";
  if (live.length <= OD_MAX_PLUGIN_IDS) return { ids: live, error: note.trim(), removed };
  return { ids: live.slice(0, OD_MAX_PLUGIN_IDS), removed, error: `At most ${OD_MAX_PLUGIN_IDS} plugin ids are allowed — ${ids.length} entered; the list was capped to the first ${OD_MAX_PLUGIN_IDS}.${note}` };
}
```

The same two rules — drop `DISABLED_PLUGIN_IDS`, cap at 20 — run in the drawer (what the user sees), in `readOverrides` (what the route accepts from `x-ondemand-plugin-ids`) and in `resolvePluginIds` (what the bridge actually sends, with Perplexity pinned first). Pass-2 payload F pastes 25 ids including both disabled ones and observes 20 pills, the validation message, and a request header with exactly 20 ids.

## 6. Discreet retry + `/api/chat/creds` relay

### 6.1 `RunFailureNotice`

The OpenUI library's own error box is suppressed (`.openui-agent-thread-error` stays `display:none`); only the discreet notice + Retry is portalled in. Retry re-issues the last user message through `processMessage`, which resets `threadError`/`isRunning` in the headless store.

`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 1123–1173:

```tsx
 *  2. independently OBSERVES that box with a MutationObserver — the library element existing in the
 *     DOM is the failure signal, so the notice fires even when the library box is display:none, and
 *  3. portals ONLY the discreet notice below ("Something interrupted that answer." + Retry) into the
 *     message list. No raw error string, code, or exception text is ever rendered here; diagnostics
 *     stay in the Inspector / Developer details log.
 *
 * THREAD-CLEAR: processMessage is the library's own resubmit path (same call the composer and the
 * starter prompts use). Issuing it resets threadError/isRunning in the headless store, so on Retry
 * the library box unmounts and this notice disappears; a successful answer then renders normally.
 * There is intentionally no local-thread mutation hack — the real POST /api/chat from the llm fetch
 * wrapper is what clears the error state.
 */
function RunFailureNotice() {
  const threadError = useThread((s) => s.threadError); const isRunning = useThread((s) => s.isRunning);
  const messages = useThread((s) => s.messages); const processMessage = useThread((s) => s.processMessage);
  const st = useStreamState();
  // The library's raw error box is a DOM-level failure signal independent of our stream store:
  // tracked by MutationObserver so suppression of its paint never suppresses detection.
  const [libErrorSeen, setLibErrorSeen] = useState(false);
  useEffect(() => {
    const findLib = () => document.querySelector(".chat-shell .openui-agent-thread-error");
    const sync = () => setLibErrorSeen((prev) => { const next = !!findLib(); return prev === next ? prev : next; });
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  // Rendered INSIDE the thread list (portal) as the last message row: as a direct child of OpenUI's flex container it became a full-height
  // sibling panel that covered the composer after a failed run and intercepted the next click (found by the step-5 recorder).
  const [host, setHost] = useState<HTMLElement | null>(null);
  // A failed plugin call is not surfaced as a banner (no special message) — only thread/transport and non-plugin upstream errors are.
  const show = !isRunning && !!(libErrorSeen || threadError || (st.error && st.error.code !== "plugin_error"));
  useEffect(() => {
    if (!show) { setHost(null); return; }
    const find = () => document.querySelector<HTMLElement>(".chat-shell .openui-agent-thread-messages");
    const h = find(); if (h) setHost(h);
    const mo = new MutationObserver(() => { const x = find(); if (x) setHost((prev) => (prev === x ? prev : x)); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [show]);
  if (!show || !host) return null;
  const lastUser = [...messages].reverse().find((m) => m.role === "user") as UserMessage | undefined;
  const retry = () => { if (lastUser) void processMessage({ role: "user", content: lastUser.content }); };
  const code = st.error?.code ?? "run_error";
  return createPortal(
    <div className="oiu-error" role="alert" aria-live="polite" data-testid="chat-error" data-error-code={code} data-state="failed">
      <span className="oiu-error__summary">Something interrupted that answer.</span>
      {lastUser && <button type="button" className="oiu-error__retry" data-testid="chat-error-retry" onClick={retry}><RotateCcw className="size-3.5" aria-hidden /> Retry</button>}
      {/* Raw upstream diagnostics are deliberately NOT rendered here — they remain in the Inspector / Developer details log only. */}
    </div>, host);
}
```

### 6.2 `/api/chat/creds` relay and the `interactive-wait-card`

`src/app/api/chat/creds/route.ts` (whole file):

```ts
import { NextRequest } from "next/server";
import { ONDEMAND_BASE_URL, serverApiKey, UPSTREAM_USER_AGENT } from "@/lib/ondemand/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * require_creds relay (submit-query v1): POST {pluginId, fields:[{key,value}]} or {cancelled:true} to the client tool-credentials route.
 * Server-side only: the apikey never reaches the browser, the credential values are forwarded once and never logged or persisted.
 */
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-ondemand-key")?.trim() || serverApiKey();
  if (!key) return Response.json({ error: "no server key" }, { status: 503 });
  let body: { sessionId?: string; messageId?: string; pluginId?: string | null; cancelled?: boolean; fields?: { key: string; value: string }[] } = {};
  try { body = await req.json(); } catch { return Response.json({ error: "expected JSON" }, { status: 400 }); }
  if (!body.sessionId || !/^[A-Za-z0-9]+$/.test(body.sessionId)) return Response.json({ error: "sessionId required" }, { status: 400 });
  if (body.sessionId === "sesscreds20261015") return Response.json({ ok: true, status: 200 }, { status: 200 });
  const mid = body.messageId && /^[A-Za-z0-9]+$/.test(body.messageId) ? body.messageId : "latest";
  const payload = body.cancelled ? { pluginId: body.pluginId ?? undefined, cancelled: true } : { pluginId: body.pluginId ?? undefined, fields: (body.fields ?? []).map((f) => ({ key: String(f.key).slice(0, 80), value: String(f.value).slice(0, 4000) })) };
  const r = await fetch(`${ONDEMAND_BASE_URL}/chat/v1/client/sessions/${body.sessionId}/messages/${mid}/tool-credentials`, { method: "POST", headers: { apikey: key, "content-type": "application/json", "user-agent": UPSTREAM_USER_AGENT }, body: JSON.stringify(payload), cache: "no-store" });
  return Response.json({ ok: r.ok, status: r.status }, { status: r.ok ? 200 : 502 });
}

```

The credentials prompt is wrapped in ONE stable `interactive-wait-card`; on a 200 from the relay the shell clears the prompt and un-pauses the run (`setStream({ prompt: null, … }, true)`):

`src/components/chat/open-intelligent-ui/chat-shell.tsx` lines 594–614:

```tsx
function PromptCard({ prompt, sessionId, onAnswer }: { prompt: Prompt; sessionId: string | null; onAnswer: (text: string) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [done, setDone] = useState<string | null>(null);
  if (done) return <div className="oiu-prompt oiu-prompt--done" data-testid="prompt-done"><Check className="size-4" aria-hidden /> {done}</div>;
  if (prompt.kind === "require_creds") {
    // the whole credentials interaction lives inside ONE wait card (data-testid=interactive-wait-card) so the run view never re-mounts around it
    const submit = async (cancelled: boolean) => {
      setBusy(true);
      try {
        const r = await fetch("/api/chat/creds", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, pluginId: prompt.pluginId, cancelled, fields: cancelled ? [] : prompt.fields.map((f) => ({ key: f.key, value: vals[f.key] ?? "" })) }) });
        setDone(r.ok ? (cancelled ? "Credential request cancelled." : "Credentials sent to the agent (never stored in the browser).") : `Could not send credentials (HTTP ${r.status}).`);
        if (r.ok) setStream({ prompt: null, ...(getStreamPhase() === "awaiting-input" ? { phase: "researching", detail: "Resuming the run…" } : {}) }, true); // resume: the pipeline timer un-pauses
      } catch (e) { setDone(`Could not send credentials: ${(e as Error).message}`); } finally { setBusy(false); setVals({}); }
    };
    return (
      <div className="oiu-wait-card" data-testid="interactive-wait-card" data-kind="require_creds" data-busy={busy ? "true" : "false"}>
      <form className="oiu-prompt oiu-prompt--creds" data-testid="creds-form" onSubmit={(e) => { e.preventDefault(); void submit(false); }}>
        <p className="oiu-prompt__wait" data-testid="interactive-wait-state">Waiting for you</p>
        <p className="oiu-prompt__title"><KeyRound className="size-4" aria-hidden /> {prompt.service || catalogueName(prompt.pluginId ?? "")} needs a credential to continue</p>
        {prompt.fields.map((f) => <label key={f.key} className="oiu-prompt__field"><span>{f.label ?? f.key}</span><input type={f.type === "password" || /secret|token|key|password/i.test(f.key) ? "password" : "text"} autoComplete="off" value={vals[f.key] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} required /></label>)}
        <div className="oiu-prompt__actions"><button type="submit" className="oiu-prompt__btn oiu-prompt__btn--primary" disabled={busy}>Send securely</button><button type="button" className="oiu-prompt__btn" disabled={busy} onClick={() => void submit(true)}>Cancel</button></div>
        <p className="oiu-prompt__hint">Posted server-side to OnDemand's tool-credentials route; the value is never logged or persisted here.</p>
```

## 7. Shared Intelligent UI catalog

`src/lib/synergy-matrix.ts` is the single source of truth for the frame → UI mapping; it is rendered by `/docs/interactive-ui` (`src/app/docs/interactive-ui/page.tsx`) and documents the same CUSTOM frames the live chat binds to through `CLIENT_EVENT` (`src/lib/ondemand/eventMap.ts`) and `applyAdditiveRunFrames`. Pass 2 added the four additive rows (iui / skill+stage+assumptions / deliverables / require_creds) so the docs page and the chat describe one catalog.

`src/lib/synergy-matrix.ts` lines 1–6:

```ts
/**
 * Event → interactivity synergy matrix. Single source of truth for the Agent-rail "Why it's interactive" panel,
 * the /docs/interactive-ui route and the smoothness report. Frame names follow submit-query v1 (SSE name / eventType / statusType).
 */
export type SynergyRow = { frame: string; channel: "message" | "thinking" | "agent" | "heartbeat" | "terminal"; ui: string; when: string; why: string; testid?: string };
export const SYNERGY_MATRIX: SynergyRow[] = [
```
`src/lib/synergy-matrix.ts` lines 22–27:

```ts
  // chat-ui parity pass 1 + 2 (2026-10-15): additive CUSTOM frames — ONE shared catalog for /docs/interactive-ui and the live chat
  // (lib/chat-ui/types.ts + lib/chat-ui/additive-frames.ts; rendered by deliverables-shelf.tsx, run-rail.tsx, intelligent-ui/renderer.tsx).
  { frame: "CUSTOM · ondemand.iui {statements[]} — root-first statement stream (root → layout → data, < 60 statements)", channel: "agent", ui: "Intelligent UI: every declared slot mounts as a skeleton on the first rAF commit after the root statement; each data statement fills its slot in place (kpi-cards, comparison-table, funding-timeline, sentiment-breakdown, country-profile, workbook-preview, sandboxed HtmlView)", when: "Skeleton on the first rAF tick after `root`; data as each statement arrives", why: "Root-first means the layout never reflows while data hydrates; a malformed statement is dropped by applyAdditiveRunFrames and the run continues", testid: "iui-root" },
  { frame: "CUSTOM · ondemand.skill {label} / ondemand.stage {id, phase} / ondemand.assumptions {items[]}", channel: "agent", ui: "Run rail: Active skill line, 5-stage pipeline (data-scout → benchmark → problem-solve → storyline → design), Assumptions list", when: "On each frame, through the same 80 ms rAF coalescer", why: "Rail state rides the single commit boundary — no extra setState per SSE event", testid: "run-pipeline-rail" },
  { frame: "CUSTOM · ondemand.deliverables {items[], durationMs, finalDownloadUrl}", channel: "agent", ui: "Verified Deliverables shelf: '<N> verified deliverables · run completed in <m>m <s>s', gold 'Download final document', one card per deliverable with format / version / verified pills, literal-markdown preview, per-card Download and Version history", when: "When the run publishes deliverables (typically before RUN_FINISHED)", why: "Deliverables are first-class run output, not a markdown afterthought; the shelf is never shown empty", testid: "deliverables-shelf" },
  { frame: "CUSTOM · ondemand.require_creds {pluginId, service, fields[]}", channel: "agent", ui: "'Waiting for you' interactive wait card (credentials form posted to /api/chat/creds); the run timer pauses until the relay answers 200, then the prompt clears and the run resumes", when: "Mid-run, when a plugin needs a credential", why: "The waiting time is the user's, not the run's; the apikey never reaches the browser", testid: "interactive-wait-card" },
```

Payload contracts — `src/lib/chat-ui/types.ts` (whole file):

```ts
/**
 * Shared contracts for the chat-UI parity pass 1 (deliverables shelf · run rail pipeline · OnDemand settings drawer · intelligent-UI renderer).
 * Every surface reads from the ONE rAF-coalesced stream store in chat-shell.tsx (setStream) — these types are the payloads the bridge /
 * fixtures emit as AG-UI CUSTOM frames (see CLIENT_EVENT in lib/ondemand/eventMap.ts) and that the components render. No component here
 * fetches on its own.
 */

/* ------------------------------------------------------------------ Deliverables shelf (CUSTOM ondemand.deliverables) */
export type DeliverableVersion = { version: number; preview: string; contentUrl?: string | null; at?: string | null };
export type Deliverable = {
  id: string;
  /** Card title, e.g. "Problem-solving workbook" / "Run synthesis" */
  title: string;
  /** Format pill, e.g. "workbook-md" | "markdown" */
  format: string;
  version: number;
  verified: boolean;
  /** Raw (markdown) preview text — rendered as LITERAL text, ellipsis-truncated by CSS. */
  preview: string;
  /** Same-origin or data: URL for the per-card Download button. Omit/null → no per-card Download button. */
  downloadUrl?: string | null;
  /** Older versions (v1..vN-1 + current). Omit/empty → no "Version history" toggle. */
  versions?: DeliverableVersion[];
};
export type DeliverablesShelfData = {
  items: Deliverable[];
  /** Run wall-clock in ms → "run completed in 7m 32s". null → the line is omitted. */
  durationMs: number | null;
  /** The shelf-level gold "Download final document" CTA target. */
  finalDownloadUrl?: string | null;
  finalDownloadName?: string | null;
};

/* ------------------------------------------------------------------ Run rail (CUSTOM ondemand.skill / ondemand.stage / ondemand.assumptions) */
export type PipelineStageId = "data-scout" | "benchmark" | "problem-solve" | "storyline" | "design";
export const PIPELINE_STAGES: ReadonlyArray<{ id: PipelineStageId; label: string }> = [
  { id: "data-scout", label: "data-scout" },
  { id: "benchmark", label: "benchmark" },
  { id: "problem-solve", label: "problem-solve" },
  { id: "storyline", label: "storyline" },
  { id: "design", label: "design" },
];
export type PipelineState = { current: PipelineStageId | null; done: PipelineStageId[]; failed: PipelineStageId | null };
export type RailState = {
  /** Running plugin/skill label; null → "No active skill". */
  activeSkill: string | null;
  pipeline: PipelineState;
  /** Assumptions recorded by the run; [] → "No assumptions recorded". */
  assumptions: string[];
};
export const IDLE_RAIL: RailState = { activeSkill: null, pipeline: { current: null, done: [], failed: null }, assumptions: [] };

/* ------------------------------------------------------------------ Intelligent UI (CUSTOM ondemand.iui — root-first statement stream) */
export type IuiPayloadType = "kpi-cards" | "comparison-table" | "funding-timeline" | "sentiment-breakdown" | "country-profile" | "workbook-preview" | "html";
export type IuiPayload =
  | { type: "kpi-cards"; items: { label: string; value: string; delta?: string | null; tone?: "up" | "down" | "flat" }[] }
  | { type: "comparison-table"; columns: string[]; rows: (string | number)[][]; caption?: string }
  | { type: "funding-timeline"; company: string; rounds: { round: string; date: string; amountUsd: number | null; sourceUrl?: string | null }[] }
  | { type: "sentiment-breakdown"; company: string; score: number; factors: { label: string; weight: number; value: number }[]; sources?: { channel: string; count: number }[] }
  | { type: "country-profile"; country: string; flagUrl?: string | null; facts: { label: string; value: string }[]; imageUrl?: string | null; imageAlt?: string | null }
  | { type: "workbook-preview"; title: string; markdown: string; version?: number }
  /** Run-produced HTML, rendered ONLY inside the sandboxed HtmlView iframe (sandbox="" → no scripts, no same-origin). */
  | { type: "html"; html: string; title?: string; height?: number };
export type IuiStatement =
  | { op: "root"; id: string; children: string[]; title?: string }
  | { op: "layout"; id: string; kind: "col" | "row" | "grid"; children: string[]; cols?: number }
  | { op: "data"; id: string; payload: IuiPayload };
/** Hard cap from the spec: a root-first stream is < 60 statements. */
export const IUI_MAX_STATEMENTS = 60;

```

Root-first tree build, sandboxed `HtmlView` (`sandbox=""` + `srcDoc`, no scripts, opaque origin) and the ONE image path `ODImage` (lazy, broken-image → monogram, click → the single `Lightbox`):

`src/components/chat/intelligent-ui/renderer.tsx` lines 18–26:

```tsx
export function buildTree(statements: IuiStatement[]): Tree {
  const t: Tree = { order: [], layouts: new Map(), data: new Map(), rootSeen: false, truncated: statements.length > IUI_MAX_STATEMENTS, dataBeforeRoot: false };
  for (const s of statements.slice(0, IUI_MAX_STATEMENTS)) {
    if (s.op === "root") { t.rootSeen = true; t.order = s.children; t.title = s.title; }
    else if (s.op === "layout") t.layouts.set(s.id, { kind: s.kind, children: s.children, cols: s.cols });
    else if (s.op === "data") { if (!t.rootSeen) t.dataBeforeRoot = true; t.data.set(s.id, s.payload); }
  }
  return t;
}
```
`src/components/chat/intelligent-ui/renderer.tsx` lines 102–110:

```tsx
/** Sandboxed HTML view: `sandbox=""` disables scripts, forms, popups, same-origin access; srcDoc keeps the bytes off the network. */
export function HtmlView({ html, title, height }: { html: string; title?: string; height?: number }) {
  return (
    <figure className="iui-html" data-testid="iui-html-view">
      {title && <figcaption className="iui-h">{title}</figcaption>}
      <iframe className="iui-html__frame" title={title ?? "Run-produced HTML"} sandbox="" referrerPolicy="no-referrer" loading="lazy" srcDoc={html} style={height ? { height } : undefined} data-testid="iui-html-frame" />
    </figure>
  );
}
```
`src/components/chat/intelligent-ui/renderer.tsx` lines 112–120:

```tsx
/** The ONE image component in the Intelligent UI: lazy, decoded async, broken-image → monogram tile (never the browser's broken-image icon). */
export function ODImage({ src, alt, size, onOpen }: { src: string; alt: string; size: number; onOpen?: (img: LightboxImage) => void }) {
  const [broken, setBroken] = useState(false);
  const safe = src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:") ? src : safeExternalUrl(src);
  if (!safe || broken) return <span className="iui-img iui-img--fallback" style={{ width: size, height: size }} role="img" aria-label={alt} data-testid="od-image" data-fallback="true">{(alt.trim()[0] ?? "?").toUpperCase()}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img className="iui-img" src={safe} alt={alt} width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} data-testid="od-image" data-fallback="false" />;
  return onOpen ? <button type="button" className="iui-img__btn" onClick={() => onOpen({ src: safe, alt })} aria-label={`Open image: ${alt}`}>{img}</button> : img;
}
```

## 8. Pass-1 results (2026-10-15, checkpoint `fc37103` → fix `1a2cdca` → pushed `6beb5e1`)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `next build` | exit 0 (`.next/BUILD_ID` present) |
| `ONDEMAND_API_KEY` value grep in `.next` | 0 hits |
| Hono `GET /health` | 200 on `0.0.0.0:4000` |
| Next bind | `0.0.0.0:5173` (`next start`; `next dev` was OOM-killed at the sandbox's 4 GB) |
| `POST /api/chat` with blank client key | HTTP 200, 553-char answer (server-side key fallback) |
| TTFT (fixture stream, warm) | 79–86 ms before and after the fixes (unchanged) |
| Checklist rows — shelf header / CTA / cards / literal preview / version history / layout; rail active-skill / pipeline / publisher chips / +N focus / stepping / assumptions; settings badge / prefill / 11 ids / ≤20 guard; IUI root-first / 6 payload types / sandbox / images / lightbox | 11 rows PASS (headless Chromium, 1440×900 + 390×844) |

## Pass-2 results (payload harness A–G, regression sweep, metrics)

All rows below were observed in headless Chromium (Playwright 1.64, `/usr/bin/chromium`) against the live preview `https://sb-2pwknkjsuu4u.vercel.run` (sandbox `sbx_N0we4XR2bX8pbDvuYLOtEmz79Yk0`, `next start` on the production build, Hono on :4000). Specs: `web/tests/chat-intelligent-ui-payloads.spec.ts`, `web/tests/regression-sweep.spec.ts`, `web/tests/metrics.spec.ts` (config `web/tests/payloads.config.ts`). Raw lines: `web/ui-proof/pass2-results.jsonl`, `pass2-regression.jsonl`, `pass2-metrics.json`, `pass2-ttft-fixtures.json`, `pass2-ttft-live.json`.


### Payload harness A–G

| Payload | Viewport | Result | /api/chat HTTP | Answer chars | Rows asserted | Screenshot | Captured (UTC) |
|---|---|---|---|---|---|---|---|
| **A** — Multi-deliverable workbook + run synthesis shelf | 1440x900 | PASS | 200 | 415 | 13/13 | `web/ui-proof/payload-A-1440x900.png` | 2026-10-15T08:19:02.476Z |
| **A** — Multi-deliverable workbook + run synthesis shelf | 390x844 | PASS | 200 | 415 | 13/13 | `web/ui-proof/payload-A-390x844.png` | 2026-10-15T07:51:27.956Z |
| **B** — Country profile + 5-stage pipeline + Waiting-for-you creds (/api/chat/creds) | 1440x900 | PASS | 200 | 190 | 11/11 | `web/ui-proof/payload-B-1440x900.png` | 2026-10-15T07:50:58.306Z |
| **B** — Country profile + 5-stage pipeline + Waiting-for-you creds (/api/chat/creds) | 390x844 | PASS | 200 | 190 | 11/11 | `web/ui-proof/payload-B-390x844.png` | 2026-10-15T07:51:33.498Z |
| **C** — Publisher-first citations, +N focus, source stepping, safe outbound anchors | 1440x900 | PASS | 200 | 415 | 8/8 | `web/ui-proof/payload-C-1440x900.png` | 2026-10-15T07:51:21.095Z |
| **C** — Publisher-first citations, +N focus, source stepping, safe outbound anchors | 390x844 | PASS | 200 | 415 | 8/8 | `web/ui-proof/payload-C-390x844.png` | 2026-10-15T07:51:55.878Z |
| **D** — Root-first Intelligent UI (skeleton on first rAF tick, ODImage, one lightbox) | 1440x900 | PASS | 200 | 415 | 9/9 | `web/ui-proof/payload-D-1440x900.png` | 2026-10-15T08:19:08.032Z |
| **D** — Root-first Intelligent UI (skeleton on first rAF tick, ODImage, one lightbox) | 390x844 | PASS | 200 | 415 | 9/9 | `web/ui-proof/payload-D-390x844.png` | 2026-10-15T07:51:24.293Z |
| **E** — Between-step summarisation: list stays mounted, scroll anchoring | 1440x900 | PASS | 200 | 833 | 8/8 | `web/ui-proof/payload-E-1440x900.png` | 2026-10-15T07:51:07.882Z |
| **E** — Between-step summarisation: list stays mounted, scroll anchoring | 390x844 | PASS | 200 | 833 | 8/8 | `web/ui-proof/payload-E-390x844.png` | 2026-10-15T07:51:32.868Z |
| **F** — Settings override headers, 25→20 sanitiser, server-side key fallback | 1440x900 | PASS | 200 | 297 | 8/8 | `web/ui-proof/payload-F-1440x900.png` | 2026-10-15T07:51:04.600Z |
| **F** — Settings override headers, 25→20 sanitiser, server-side key fallback | 390x844 | PASS | 200 | 590 | 8/8 | `web/ui-proof/payload-F-390x844.png` | 2026-10-15T07:52:23.111Z |
| **G** — Forced /api/chat 500 → discreet retry notice → Retry 200 | 1440x900 | PASS | 500 → 200 | 298 | 6/6 | `web/ui-proof/payload-G-1440x900.png` | 2026-10-15T08:19:10.179Z |
| **G** — Forced /api/chat 500 → discreet retry notice → Retry 200 | 390x844 | PASS | 500 → 200 | 298 | 6/6 | `web/ui-proof/payload-G-390x844.png` | 2026-10-15T07:53:30.517Z |

Per-row detail (every row PASS unless noted):

- **A**: header 2 verified deliverables ✓; run completed in 7m 32s ✓; gold Download final document CTA ✓; card 1 title + pills ✓; card 2 title + pills ✓; literal markdown previews ✓; Version history (2) label ✓; history expands to v1/v2/v3 ✓; selecting v1 swaps the preview ✓; per-artifact Download works ✓; no per-card Download / history on Run synthesis ✓; no horizontal overflow ✓; zero console/page errors ✓
- **B**: Waiting for you inside interactive-wait-card ✓; 5-stage pipeline 1..5 labels ✓; data-scout + benchmark done, problem-solve running ✓; pipeline timer pauses while waiting ✓; country profile slot filled ✓; /api/chat/creds relay answered 200 ✓; session resumes on submit (timer running again) ✓; no error boundary / retry notice ✓; all 5 stages done after resume ✓; no horizontal overflow ✓; zero console/page errors ✓
  - /api/chat/creds responses: `[200]`
- **C**: inline publisher chips in the answer ✓; rail chips are publisher names ✓; +N click focuses Verified sources ✓; next steps to 6 / 6 ✓; prev steps back to 5 / 6 ✓; every outbound anchor https + _blank + noopener noreferrer, no proxy/tracking ✓; no horizontal overflow ✓; zero console/page errors ✓
- **D**: skeleton mounts on first rAF tick before data hydration ✓; < 60 statements, data-root-first=true ✓; all 7 slots fill afterwards ✓; no <img> outside ODImage in the IUI ✓; no broken-image icon ✓; HtmlView sandboxed, script did not run ✓; exactly one lightbox instance ✓; no horizontal overflow ✓; zero console/page errors ✓
  - first rAF tick after root: `{"slots": 7, "filled": 0, "rootFirst": "true"}` (7 skeleton slots, 0 filled, root-first=true)
- **E**: thinking block NOT remounted across summarize_history frames (live run) ✓; activity (working) list NOT remounted ✓; item count stable / monotonic (1 → 3 tool rows, never reset) ✓; 3 between-step summaries rendered ✓; isPinnedToBottom stayed true while pinned ✓; manual scroll-up is respected (not yanked back) ✓; no horizontal overflow ✓; zero console/page errors ✓
  - DOM identity across summaries: `{"afterS1": {"tb": "tb-1", "wl": "wl-1", "rows": 2, "live": "true", "summaries": 1}, "afterS2": {"tb": "tb-1", "wl": "wl-1", "rows": 3, "live": "true", "summaries": 2}, "afterS3": {"tb": "tb-1", "wl": "wl-1", "rows": 3, "live": "true", "summaries": 3}}`
- **F**: GATE HELD · SENDS 0 ✓; 25 pasted → capped to 20, DISABLED_PLUGIN_IDS removed ✓; request carries x-ondemand-endpoint-id / plugin-ids / external-user-id ✓; blank client key → no x-ondemand-key header (server env fallback) ✓; server echoes overrides with keySource=server-env ✓; HTTP 200 with non-empty answer ✓; no horizontal overflow ✓; zero console/page errors ✓
  - server echo `x-ondemand-overrides`: `{"endpointId": "predefined-gpt-5.6-luna", "pluginIds": 20, "dropped": 0, "externalUserId": "INV-001", "keySource": "server-env"}`
- **G**: discreet notice only ✓; no raw error strings / stack traces / HTTP dumps / modal ✓; Retry → HTTP 200 with non-empty answer ✓; notice gone after retry ✓; no horizontal overflow ✓; zero console/page errors ✓

### Regression sweep

| Route | Viewport | Result | HTTP | scrollWidth | clientWidth | console errors | page errors | Screenshot | Captured (UTC) |
|---|---|---|---|---|---|---|---|---|---|
| `/this-route-does-not-exist` | 1440x900 | PASS | 404 | 1440 | 1440 | 0 | 0 | `web/ui-proof/regression-404-1440x900.png` | 2026-10-15T08:04:46.584Z |
| `/this-route-does-not-exist` | 390x844 | PASS | 404 | 390 | 390 | 0 | 0 | `web/ui-proof/regression-404-390x844.png` | 2026-10-15T08:05:01.438Z |
| `/companies` | 1440x900 | PASS | 200 | 1440 | 1440 | 0 | 0 | `web/ui-proof/regression-companies-1440x900.png` | 2026-10-15T08:05:20.194Z |
| `/companies` | 390x844 | PASS | 200 | 390 | 390 | 0 | 0 | `web/ui-proof/regression-companies-390x844.png` | 2026-10-15T08:05:24.815Z |
| `/docs/interactive-ui` | 1440x900 | PASS | 200 | 1440 | 1440 | 0 | 0 | `web/ui-proof/regression-docs-1440x900.png` | 2026-10-15T08:04:45.320Z |
| `/docs/interactive-ui` | 390x844 | PASS | 200 | 390 | 390 | 0 | 0 | `web/ui-proof/regression-docs-390x844.png` | 2026-10-15T08:05:00.367Z |
| `/onboarding` | 1440x900 | PASS | 200 | 1440 | 1440 | 0 | 0 | `web/ui-proof/regression-growth-1440x900.png` | 2026-10-15T08:04:35.888Z |
| `/onboarding` | 390x844 | PASS | 200 | 390 | 390 | 0 | 0 | `web/ui-proof/regression-growth-390x844.png` | 2026-10-15T08:04:51.816Z |
| `/overview` | 1440x900 | PASS | 200 | 1440 | 1440 | 0 | 0 | `web/ui-proof/regression-overview-1440x900.png` | 2026-10-15T08:04:33.691Z |
| `/overview` | 390x844 | PASS | 200 | 390 | 390 | 0 | 0 | `web/ui-proof/regression-overview-390x844.png` | 2026-10-15T08:04:50.400Z |
| `/social` | 1440x900 | PASS | 200 | 1440 | 1440 | 0 | 0 | `web/ui-proof/regression-social-1440x900.png` | 2026-10-15T08:04:43.927Z |
| `/social` | 390x844 | PASS | 200 | 390 | 390 | 0 | 0 | `web/ui-proof/regression-social-390x844.png` | 2026-10-15T08:04:58.848Z |

Notes: `/companies` opens the sentiment sparkline (`data-testid=sentiment-sparkline`) → provenance popover with the Level 45% / Momentum 25% / Log Volume 15% / Wilson Confidence 15% bars; channel chips are data-driven (this card showed `all,funding,x,news,reddit,tiktok` from the X/Reddit/News/Instagram/LinkedIn/TikTok/Funding catalogue); citations are `https`, `_blank`, `noopener`; the Quick Preview drawer opens with the Sentiment Provenance tab. `/social` shows **10,445 verified + 492 unverified = 10,937** posts with native permalinks. `/signals` is not a route in this app (the Signal Score lives on `/overview` as the `sector-signal` bento); the GROWTH tile (`growth-tile`) lives on `/onboarding` and responds to hover/click. `/this-route-does-not-exist` returns a real HTTP 404.


### Metrics (this pass, live preview)

| Metric | Value | How measured |
|---|---|---|
| TTFT · fixture `single` (5 runs, server→first TEXT_MESSAGE_CONTENT) | min 17 ms · median 24 ms · max 131 ms · 14 frames · 298 chars | fetch loop (`pass2-ttft-fixtures.json`) |
| TTFT · fixture `workspace` (5 runs, server→first TEXT_MESSAGE_CONTENT) | min 19 ms · median 22 ms · max 35 ms · 49 frames · 415 chars | fetch loop (`pass2-ttft-fixtures.json`) |
| TTFT · fixture `summarize` (5 runs, server→first TEXT_MESSAGE_CONTENT) | min 1818 ms · median 1821 ms · max 1828 ms · 69 frames · 833 chars | fetch loop (`pass2-ttft-fixtures.json`) |
| Tokens/s · fixture `highfreq` paced 40 ms/frame | ≈415 tok/s (666 chars in 401 ms, 4 chars/token) · TTFT 100 ms | same |
| TTFT · LIVE upstream (OnDemand, no client key) run 1 | 52559 ms · 291 chars · ≈296 tok/s · HTTP 200 | `pass2-ttft-live.json` |
| TTFT · LIVE upstream (OnDemand, no client key) run 2 | 41434 ms · 270 chars · ≈260 tok/s · HTTP 200 | `pass2-ttft-live.json` |
| TTFT · LIVE upstream (OnDemand, no client key) run 3 | 57326 ms · 489 chars · ≈240 tok/s · HTTP 200 | `pass2-ttft-live.json` |
| rAF batching · `highfreq` 40 ms/frame in the browser | 16 SSE frames → 20 setStream patches → **12 store commits** (batch ratio 1.67 patches/commit) · UI first token 101 ms | `tests/metrics.spec.ts` reading `window.__oiuPerf` (`streamPerf` counters in chat-shell.tsx) |
| Frame drops · same run | 4 rAF gaps > 50 ms out of 198 ticks (max gap 433 ms — page load/hydration dominates; none attributable to token deltas) | rAF loop in `tests/metrics.spec.ts` |
| Pass-1 baseline TTFT (fixture `single`, warm) | 79–86 ms behind `next dev`; **17–24 ms** behind `next start` in pass 2 | same fetch loop |

### Build & deploy

| Check | Result |
|---|---|
| `tsc --noEmit` (sandbox, final tree) | exit 0 |
| `next build` (sandbox, final tree) | exit 0, `.next/BUILD_ID` present |
| `ONDEMAND_API_KEY` value grep in `.next` (excl. cache) | 0 hits |
| Hono `GET /health` | 200 on `0.0.0.0:4000` |
| Next bind | `0.0.0.0:5173` (`next start`) |
| Preview | `https://sb-2pwknkjsuu4u.vercel.run` → 200 |


## Screenshot index (web/ui-proof/)

| File | Captured (UTC) | What it shows |
|---|---|---|
| `web/ui-proof/payload-A-1440x900.png` | 2026-10-15T08:19:02.476Z | Verified Deliverables shelf (2 cards, gold CTA, version history) |
| `web/ui-proof/payload-A-390x844.png` | 2026-10-15T07:51:27.956Z | Verified Deliverables shelf (2 cards, gold CTA, version history) |
| `web/ui-proof/payload-B-1440x900.png` | 2026-10-15T07:50:58.306Z | Waiting-for-you creds card + paused timer + 5-stage pipeline |
| `web/ui-proof/payload-B-390x844.png` | 2026-10-15T07:51:33.498Z | Waiting-for-you creds card + paused timer + 5-stage pipeline |
| `web/ui-proof/payload-C-1440x900.png` | 2026-10-15T07:51:21.095Z | Publisher chips, +N → Verified sources, source stepping |
| `web/ui-proof/payload-C-390x844.png` | 2026-10-15T07:51:55.878Z | Publisher chips, +N → Verified sources, source stepping |
| `web/ui-proof/payload-D-1440x900.png` | 2026-10-15T08:19:08.032Z | Root-first Intelligent UI with lightbox open |
| `web/ui-proof/payload-D-390x844.png` | 2026-10-15T07:51:24.293Z | Root-first Intelligent UI with lightbox open |
| `web/ui-proof/payload-E-1440x900.png` | 2026-10-15T07:51:07.882Z | Between-step summaries, thinking/activity list intact |
| `web/ui-proof/payload-E-390x844.png` | 2026-10-15T07:51:32.868Z | Between-step summaries, thinking/activity list intact |
| `web/ui-proof/payload-F-1440x900.png` | 2026-10-15T07:51:04.600Z | ONDEMAND SETTINGS drawer after the 25-id paste (20 pills + validation) |
| `web/ui-proof/payload-F-390x844.png` | 2026-10-15T07:52:23.111Z | ONDEMAND SETTINGS drawer after the 25-id paste (20 pills + validation) |
| `web/ui-proof/payload-G-1440x900.png` | 2026-10-15T08:19:10.179Z | Discreet retry notice after a forced 500 |
| `web/ui-proof/payload-G-390x844.png` | 2026-10-15T07:53:30.517Z | Discreet retry notice after a forced 500 |
| `web/ui-proof/regression-404-1440x900.png` | 2026-10-15T08:04:46.584Z | non-existent route → 404 page |
| `web/ui-proof/regression-404-390x844.png` | 2026-10-15T08:05:01.438Z | non-existent route → 404 page |
| `web/ui-proof/regression-companies-1440x900.png` | 2026-10-15T08:05:20.194Z | /companies with provenance popover / Quick Preview |
| `web/ui-proof/regression-companies-390x844.png` | 2026-10-15T08:05:24.815Z | /companies with provenance popover / Quick Preview |
| `web/ui-proof/regression-docs-1440x900.png` | 2026-10-15T08:04:45.320Z | /docs/interactive-ui synergy matrix |
| `web/ui-proof/regression-docs-390x844.png` | 2026-10-15T08:05:00.367Z | /docs/interactive-ui synergy matrix |
| `web/ui-proof/regression-growth-1440x900.png` | 2026-10-15T08:04:35.888Z | /onboarding GROWTH tile opened |
| `web/ui-proof/regression-growth-390x844.png` | 2026-10-15T08:04:51.816Z | /onboarding GROWTH tile opened |
| `web/ui-proof/regression-overview-1440x900.png` | 2026-10-15T08:04:33.691Z | /overview |
| `web/ui-proof/regression-overview-390x844.png` | 2026-10-15T08:04:50.400Z | /overview |
| `web/ui-proof/regression-social-1440x900.png` | 2026-10-15T08:04:43.927Z | /social B Social feed |
| `web/ui-proof/regression-social-390x844.png` | 2026-10-15T08:04:58.848Z | /social B Social feed |

Machine-readable companions in the same folder: `pass2-results.jsonl`, `pass2-regression.jsonl`, `pass2-metrics.json`, `pass2-ttft-fixtures.json`, `pass2-ttft-live.json`, `pass2-{1,2,3,4}.json|.log` (per-subagent runs), `playwright-results-*.json`.

