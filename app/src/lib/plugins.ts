/**
 * Client-visible OnDemand constants. ONE model, ONE pinned plugin (Perplexity) — no fallback chain anywhere (preserved product rule:
 * a failed plugin is reported as an honest red failure, never silently substituted). Model switched for this build to the endpoint the
 * live /config/v1/public/endpoints list exposes and the user's Settings screenshots name: predefined-gpt-5.6-luna (verified 2026-10-20, HTTP 200).
 */
export type PluginDef = { id: string | null; name: string; purpose: string; status: "active" | "builtin"; defaultOn: boolean };
export const EARLIEST_TEST_UTC = process.env.NEXT_PUBLIC_EARLIEST_TEST_UTC || "2026-10-20T21:27:31Z";
export const PLUGIN_ID = "plugin-1722260873";
export const PLUGIN_NAME = "Perplexity";
export const MODEL_ID = "predefined-gpt-5.6-luna";
export const MODEL_LABEL = "GPT-5.6 Luna";
export const REASONING_MODE = "medium";
const CONTEXT_ROW: PluginDef = { id: null, name: "UAE AI watchlist context", purpose: "Built-in: the uae_cc_v1 watchlist digest (50 organisations, news, attributed sentiment) is injected into the first turn of every thread as grounded context", status: "builtin", defaultOn: true };
const PERPLEXITY_PLUGIN: PluginDef = { id: PLUGIN_ID, name: PLUGIN_NAME, purpose: "Live web research with cited sources — pinned, always on", status: "active", defaultOn: true };
export const PLUGINS: PluginDef[] = [CONTEXT_ROW, PERPLEXITY_PLUGIN];
export const PLUGIN_IDS_IN_ORDER: string[] = [PLUGIN_ID];
export const DEFAULT_EXTERNAL_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_EXTERNAL_USER_ID || "uae-cc-demo";
/** Default organisations in the chat context (watchlist ids). */
export const DEFAULT_FOCUS = ["tii", "g42", "edge", "mbzuai", "core42"];
