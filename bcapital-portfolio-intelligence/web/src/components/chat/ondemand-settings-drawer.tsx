"use client";
/**
 * ONDEMAND SETTINGS — slide-over drawer on the chat workspace.
 * Contract (chat-ui parity pass 1): `🔒 GATE HELD · SENDS 0` badge · externalUserId prefilled INV-001 · endpointId prefilled predefined-gpt-5.6-luna ·
 * 11 prefilled plugin ids · pluginIds hard guard `<= 20` (validation message + list capped at 20) · client apiKey optional (blank → the server-side
 * ONDEMAND_API_KEY fallback in /api/chat is used; the key is never shipped to the browser).
 * GATE: this drawer NEVER sends a request to OnDemand by itself — every change is staged in localStorage (bcap.ondemand-settings.v1) and the
 * SENDS counter stays at 0. externalUserId writes through to the shared settings store so the chat request picks it up; endpointId / pluginIds
 * are staged overrides (the /api/chat contract — predefined-deepseek-flash + Perplexity pinned — is unchanged in pass 1).
 */
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Lock, Settings2, X } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { DEFAULT_EXTERNAL_USER_ID } from "@/lib/plugins";
import "./ondemand-settings-drawer.css";

export const OD_SETTINGS_KEY = "bcap.ondemand-settings.v1";
export const OD_DEFAULT_ENDPOINT_ID = "predefined-gpt-5.6-luna";
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
export function guardPluginIds(ids: string[]): { ids: string[]; error: string } {
  if (ids.length <= OD_MAX_PLUGIN_IDS) return { ids, error: "" };
  return { ids: ids.slice(0, OD_MAX_PLUGIN_IDS), error: `At most ${OD_MAX_PLUGIN_IDS} plugin ids are allowed — ${ids.length} entered; the list was capped to the first ${OD_MAX_PLUGIN_IDS}.` };
}

let odCache: OndemandSettings | null = null; const odListeners = new Set<() => void>();
function odRead(): OndemandSettings {
  if (odCache) return odCache;
  if (typeof window === "undefined") return OD_DEFAULTS;
  try { const raw = window.localStorage.getItem(OD_SETTINGS_KEY); const parsed = raw ? (JSON.parse(raw) as Partial<OndemandSettings>) : {}; odCache = { ...OD_DEFAULTS, ...parsed, pluginIds: Array.isArray(parsed.pluginIds) ? guardPluginIds(parsed.pluginIds.map(String)).ids : [...OD_DEFAULT_PLUGIN_IDS], sends: 0 }; } catch { odCache = OD_DEFAULTS; }
  return odCache!;
}
export const getOndemandSettings = (): OndemandSettings => odRead();
export function setOndemandSettings(patch: Partial<OndemandSettings>) {
  const next = { ...odRead(), ...patch }; odCache = next;
  try { const { sends: _s, ...persist } = next; void _s; window.localStorage.setItem(OD_SETTINGS_KEY, JSON.stringify(persist)); } catch { /* quota */ }
  odListeners.forEach((l) => l());
}
export const useOndemandSettings = () => useSyncExternalStore((cb) => { odListeners.add(cb); return () => odListeners.delete(cb); }, odRead, () => OD_DEFAULTS);

let drawerOpen = false; const openListeners = new Set<() => void>();
export const odDrawerStore = {
  get: () => drawerOpen,
  set: (v: boolean) => { if (drawerOpen === v) return; drawerOpen = v; openListeners.forEach((l) => l()); },
  toggle: () => odDrawerStore.set(!drawerOpen),
  subscribe: (l: () => void) => { openListeners.add(l); return () => { openListeners.delete(l); }; },
};
export const useOdDrawerOpen = () => useSyncExternalStore(odDrawerStore.subscribe, odDrawerStore.get, () => false);

export function OndemandSettingsToggle({ className }: { className?: string }) {
  const open = useOdDrawerOpen();
  return (
    <button type="button" className={className} data-testid="od-settings-toggle" aria-expanded={open} aria-controls="od-settings-drawer" title="OnDemand settings" onClick={() => odDrawerStore.toggle()}>
      <Settings2 className="size-3.5" aria-hidden /><span className="ods-toggle__label">ONDEMAND SETTINGS</span>
    </button>
  );
}

export function OndemandSettingsDrawer() {
  const open = useOdDrawerOpen();
  const od = useOndemandSettings();
  const [s, set] = useSettings();
  const [pluginText, setPluginText] = useState(od.pluginIds.join("\n"));
  const [pluginErr, setPluginErr] = useState("");
  const [userErr, setUserErr] = useState("");
  const ids = useId();
  useEffect(() => { if (open) setPluginText(od.pluginIds.join("\n")); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") odDrawerStore.set(false); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const onPlugins = (raw: string) => {
    setPluginText(raw);
    const parsed = parsePluginIds(raw); const g = guardPluginIds(parsed);
    setPluginErr(g.error); setOndemandSettings({ pluginIds: g.ids });
  };
  const onUser = (v: string) => { const t = v.trim(); if (!t) { setUserErr("externalUserId is required."); return; } setUserErr(""); set({ externalUserId: t }); };
  const count = parsePluginIds(pluginText).length;
  return (
    <>
      {open && <button type="button" aria-label="Close OnDemand settings" className="ods-backdrop" data-testid="od-settings-backdrop" onClick={() => odDrawerStore.set(false)} />}
      <aside id="od-settings-drawer" className="ods" data-testid="od-settings-drawer" data-open={open ? "true" : "false"} aria-label="OnDemand settings" inert={!open || undefined}>
        <header className="ods__head">
          <div className="ods__head-l">
            <h2 className="ods__title">ONDEMAND SETTINGS</h2>
            <span className="ods__gate" data-testid="od-gate-badge" data-sends={od.sends} title="This drawer never sends a request to OnDemand — values are staged locally."><Lock className="size-3" aria-hidden strokeWidth={2.4} /> GATE HELD · SENDS {od.sends}</span>
          </div>
          <button type="button" className="ods__close" data-testid="od-settings-close" aria-label="Close" onClick={() => odDrawerStore.set(false)}><X className="size-4" aria-hidden /></button>
        </header>
        <div className="ods__body">
          <label className="ods__field" htmlFor={`${ids}-user`}>
            <span className="ods__k">externalUserId</span>
            <input id={`${ids}-user`} className="ods__in" data-testid="od-external-user-id" defaultValue={s.externalUserId || DEFAULT_EXTERNAL_USER_ID} onChange={(e) => onUser(e.target.value)} onBlur={(e) => { if (!e.target.value.trim()) { e.target.value = s.externalUserId; setUserErr(""); } }} aria-invalid={!!userErr} autoComplete="off" spellCheck={false} />
            {userErr && <span className="ods__err" role="alert">{userErr}</span>}
          </label>
          <label className="ods__field" htmlFor={`${ids}-endpoint`}>
            <span className="ods__k">endpointId</span>
            <input id={`${ids}-endpoint`} className="ods__in ods__in--mono" data-testid="od-endpoint-id" value={od.endpointId} onChange={(e) => setOndemandSettings({ endpointId: e.target.value.trim() })} autoComplete="off" spellCheck={false} />
          </label>
          <label className="ods__field" htmlFor={`${ids}-plugins`}>
            <span className="ods__k">pluginIds <span className={`ods__count${count > OD_MAX_PLUGIN_IDS ? " ods__count--over" : ""}`} data-testid="od-plugin-count">{Math.min(count, OD_MAX_PLUGIN_IDS)} / {OD_MAX_PLUGIN_IDS}</span></span>
            <textarea id={`${ids}-plugins`} className="ods__in ods__in--mono ods__ta" data-testid="od-plugin-ids" value={pluginText} onChange={(e) => onPlugins(e.target.value)} rows={8} aria-invalid={!!pluginErr} aria-describedby={pluginErr ? `${ids}-plugins-err` : undefined} spellCheck={false} />
            {pluginErr && <span id={`${ids}-plugins-err`} className="ods__err" role="alert" data-testid="od-plugin-ids-error">{pluginErr}</span>}
            <ul className="ods__pills" data-testid="od-plugin-pills" aria-label="Plugin ids in effect">{od.pluginIds.map((id) => <li key={id} className="ods__pill">{id}</li>)}</ul>
          </label>
          <label className="ods__field" htmlFor={`${ids}-key`}>
            <span className="ods__k">apiKey <span className="ods__hint">optional — blank uses the server-side key</span></span>
            <input id={`${ids}-key`} type="password" className="ods__in ods__in--mono" data-testid="od-api-key" value={od.apiKey} onChange={(e) => { const v = e.target.value.trim(); setOndemandSettings({ apiKey: v }); set({ apikey: v }); }} autoComplete="off" placeholder="server-side ONDEMAND_API_KEY fallback" />
          </label>
          <p className="ods__note" data-testid="od-settings-note">Gate held: nothing here is sent to OnDemand. externalUserId applies to the next chat turn; endpointId and pluginIds are staged overrides (the chat bridge keeps its fixed model + pinned Perplexity contract).</p>
        </div>
      </aside>
    </>
  );
}
