/**
 * Server-side plugin AVAILABILITY with exponential backoff (2026-10-21, lane D).
 *
 * The pinned Perplexity plugin (plugin-1722260873) can fail upstream with "Not enough credits" / "insufficient credits". Re-running the
 * whole chat would only cost the user a duplicate answer, so instead the bridge remembers the last failure here and SKIPS attaching the
 * plugin to new sessions/queries while a backoff window is active: 1 → 2 → 4 → 8 → 16 → 30 min (capped), reset the moment a run completes
 * with the plugin actually delivering sources. Runs inside the window are grounded ONLY on the curated uae_cc_v1 context payload
 * (src/lib/chat/context-payload.ts) and the UI shows the coverage notice from run start (reason "backoff" + nextRetryAt).
 *
 * No other web plugin is ever substituted. The store is per server process (same lifetime as plugin-catalogue.ts' state maps).
 */
export const BACKOFF_SCHEDULE_MIN: readonly number[] = [1, 2, 4, 8, 16, 30];
export const BACKOFF_MAX_MIN = 30;

export type PluginAvailability = {
  id: string;
  available: boolean;
  /** "ok" | "backoff" | "retry-window" (window elapsed → the next run re-attaches the plugin as a probe) */
  reason: "ok" | "backoff" | "retry-window";
  /** Human-readable upstream reason of the last failure (never contains secrets — it is the detectPluginError message). */
  lastError: string | null;
  lastFailureAt: string | null;
  failures: number;
  backoffMinutes: number | null;
  nextRetryAt: string | null;
};

type Entry = { failures: number; lastFailureAt: number; lastError: string; nextRetryAt: number };
type Store = Map<string, Entry>;
const KEY = "__uaecc_plugin_availability__";
function store(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[KEY]) g[KEY] = new Map();
  return g[KEY]!;
}

/** Backoff length in minutes for the n-th consecutive failure (n ≥ 1): 1, 2, 4, 8, 16, then 30 forever. Pure — unit-tested. */
export function backoffMinutes(failures: number): number {
  const n = Math.max(1, Math.floor(failures));
  return Math.min(BACKOFF_MAX_MIN, BACKOFF_SCHEDULE_MIN[Math.min(n, BACKOFF_SCHEDULE_MIN.length) - 1]);
}

/** Record an upstream credits/availability failure → (re)open the backoff window. Returns the new state. */
export const FAILURE_COALESCE_MS = 30_000;
export function recordPluginFailure(id: string, reason: string, now = Date.now()): PluginAvailability {
  const prev = store().get(id);
  // Concurrent runs (e.g. 5 parallel questions) that all hit the same outage count as ONE failure step — observed 2026-10-21T14:11Z: a
  // 5-way parallel suite jumped the window straight to 16 min. Failures within 30 s of the previous one refresh the window, not the counter.
  const burst = !!prev && now - prev.lastFailureAt < FAILURE_COALESCE_MS;
  const failures = burst ? prev!.failures : (prev?.failures ?? 0) + 1;
  const mins = backoffMinutes(failures);
  store().set(id, { failures, lastFailureAt: now, lastError: reason.slice(0, 400), nextRetryAt: now + mins * 60_000 });
  return pluginAvailability(id, now);
}

/** A run completed with the plugin genuinely working (real sources streamed) → clear the window and the failure counter. */
export function recordPluginSuccess(id: string): void {
  store().delete(id);
}

/** Snapshot for the bridge, /api/plugins and /health. Inside the window → available:false ("backoff"); after it → a single probe run is allowed. */
export function pluginAvailability(id: string, now = Date.now()): PluginAvailability {
  const e = store().get(id);
  if (!e) return { id, available: true, reason: "ok", lastError: null, lastFailureAt: null, failures: 0, backoffMinutes: null, nextRetryAt: null };
  const inWindow = now < e.nextRetryAt;
  return {
    id,
    available: !inWindow,
    reason: inWindow ? "backoff" : "retry-window",
    lastError: e.lastError,
    lastFailureAt: new Date(e.lastFailureAt).toISOString(),
    failures: e.failures,
    backoffMinutes: backoffMinutes(e.failures),
    nextRetryAt: new Date(e.nextRetryAt).toISOString(),
  };
}

/** True when the plugin should be attached to the next session/query (no window active, or the window has elapsed → probe). */
export function shouldAttachPlugin(id: string, now = Date.now()): boolean {
  return pluginAvailability(id, now).available;
}

/** Test/ops helper. */
export function resetPluginAvailability(id?: string): void {
  if (id) store().delete(id); else store().clear();
}

/** The user-facing coverage sentence (chat notice + briefing banner share it so the wording stays identical). */
export const COVERAGE_NOTICE_TEXT =
  "Web research source unavailable (Perplexity credits exhausted) — coverage reduced to the curated uae_cc_v1 dossiers, news and sentiment records already loaded. No web facts were added.";
