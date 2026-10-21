"use client";
import { useSyncExternalStore } from "react";
import { DEFAULT_EXTERNAL_USER_ID, DEFAULT_FOCUS, MODEL_ID, PLUGINS } from "./plugins";

/** User settings live ONLY in browser localStorage. The OnDemand apikey is held server-side (ONDEMAND_API_KEY); an optional
 *  per-user key may still be pasted here and is forwarded as `x-ondemand-key` to /api/ondemand/*, overriding the server key. */
export type Settings = {
  apikey: string; externalUserId: string; model: string; plugins: Record<string, boolean>; backendUrl: string;
  companies: string[]; onboarded: boolean;
};
const KEY = "uaecc.settings.v1"; // fresh key: nothing from the previous build is read
const defaults: Settings = {
  apikey: "", externalUserId: DEFAULT_EXTERNAL_USER_ID, model: MODEL_ID,
  plugins: Object.fromEntries(PLUGINS.filter((p) => p.id).map((p) => [p.id as string, p.defaultOn])),
  backendUrl: "", companies: DEFAULT_FOCUS, onboarded: true,
};
let cache: Settings | null = null;
const listeners = new Set<() => void>();
function read(): Settings {
  if (cache) return cache;
  if (typeof window === "undefined") return defaults;
  // `model` and `plugins` are fixed product-wide (GPT-5.6 Luna · Perplexity pinned) — stored values from earlier builds are ignored.
  try { const raw = window.localStorage.getItem(KEY); cache = raw ? { ...defaults, ...JSON.parse(raw), model: MODEL_ID, plugins: defaults.plugins } : defaults; } catch { cache = defaults; }
  return cache!;
}
export function getSettings(): Settings { return read(); }
export function setSettings(patch: Partial<Settings>) {
  const next = { ...read(), ...patch }; cache = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota / private mode */ }
  listeners.forEach((l) => l());
}
export function useSettings(): [Settings, (p: Partial<Settings>) => void] {
  const s = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, read, () => defaults);
  return [s, setSettings];
}
export function clearSettings() { cache = null; try { window.localStorage.removeItem(KEY); } catch {} listeners.forEach((l) => l()); }
