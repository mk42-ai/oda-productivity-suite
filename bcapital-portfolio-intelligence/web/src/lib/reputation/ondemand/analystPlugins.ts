/**
 * v5.1.0 — THE plugin set of the Analyst Chat / ASK · OnDemand surfaces (DEF-046). ONE constant, used everywhere a chat turn is sent;
 * nothing else in the app hard-codes a plugin id for the chat.
 *
 * Provenance: the five plugin bindings of the `uae-saudi-info-investigation` skill (`reference/TOOL_BINDINGS.json`, generated
 * 2026-09-10T21:15:47Z — every id OBSERVED in a real captured call with HTTP 200, none invented), copied verbatim to
 * `docs/live_sessions_2026-09-16/ANALYST_CHAT_PLUGIN_IDS_from_skill_TOOL_BINDINGS.json`. Two of them (`X`, `Perplexity`) are also
 * rows of the account listing in `src/data/ondemand/pluginResolution.json` (docs/PLUGIN_RESOLUTION.md). The ids are `plugin-<digits>`
 * (the shape the proxy's PLUGIN_ID_PATTERN accepts, ≤ 20 per request); the `agentId` column is the platform's alias of the same
 * plugin (null where the skill never resolved one) and is informational only — the wire field is `pluginIds`.
 */
export interface AnalystPlugin {
  pluginId: string;
  agentId: string | null;
  name: string;
  /** What the plugin contributes to the "(b) What is happening now" section of the Ledger × Live answer. */
  role: string;
  /** Tool names observed on this plugin (from the skill's TOOL_BINDINGS.json). */
  tools: readonly string[];
}

export const ANALYST_CHAT_PLUGINS: readonly AnalystPlugin[] = [
  { pluginId: 'plugin-1785777296', agentId: 'agent-1785777296', name: 'X', role: 'X (Twitter) search — recent posts, timelines and mentions of the roster handles, dated with URLs', tools: ['search_recent_tweets', 'get_user_timeline', 'get_user_mentions', 'get_user_by_username', 'get_me'] },
  { pluginId: 'plugin-1722260873', agentId: 'agent-1722260873', name: 'Perplexity', role: 'web / news search with citations — what is being reported now', tools: ['perplexity'] },
  { pluginId: 'plugin-1740470947', agentId: 'agent-1740470947', name: 'Deep Translation', role: 'translation of Arabic-language rows and live items', tools: ['translateText', 'getSupportedLanguages'] },
  { pluginId: 'plugin-1743257072', agentId: 'agent-1743257072', name: 'File Retrieval', role: 'the persisted investigation corpus / prior artefacts', tools: ['searchFileDirectory'] },
  { pluginId: 'plugin-1775547203', agentId: null, name: 'OnDemand Agent', role: 'general-purpose tool agent (documented Terminal Agent)', tools: ['executePrompt'] },
];

/** Exactly the ids sent as `pluginIds` on every Analyst Chat / ASK turn (order preserved, ≤ 20). */
/** Port note (B Capital, 2026-10-17): `plugin-1785777296` (X) answers HTTP 400 "One or more agents are inactive or missing configuration: X"
 * on this account at POST /chat/v1/sessions, which failed EVERY ASK turn at createSession. It stays in the table above (Rilian parity)
 * but is withheld from the wire until re-activated; the other four ids were each verified live (HTTP 200) on the same day. */
export const WITHHELD_PLUGIN_IDS: readonly string[] = ['plugin-1785777296'];
export const ANALYST_CHAT_PLUGIN_IDS: readonly string[] = ANALYST_CHAT_PLUGINS.map((p) => p.pluginId).filter((id) => !WITHHELD_PLUGIN_IDS.includes(id));

export function analystPluginName(pluginId: string): string {
  return ANALYST_CHAT_PLUGINS.find((p) => p.pluginId === pluginId)?.name ?? pluginId;
}
