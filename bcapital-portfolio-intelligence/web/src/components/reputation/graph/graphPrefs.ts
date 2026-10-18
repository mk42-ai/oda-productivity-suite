/**
 * Correlation graph toolbar preferences (zustand, persisted to localStorage under
 * `gulf-io-light-workbench:graph-prefs`).
 *
 * Every correlation run navigates to a new `/correlation/:runId`, which remounts the route shell,
 * and switching between the 2D and 3D renderers remounts that renderer's component tree. Toolbar
 * state (render mode, halos, labels, the live max-age filter) used to live in component state and
 * was lost on every one of those remounts. It now lives here instead, outside React, so it survives
 * unmount/remount for free and is restored on reload.
 *
 * Framework-agnostic: no React import. All localStorage access (ours and the legacy-key read below)
 * is wrapped in try/catch so a private-mode / SSR environment with no storage never throws.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Port note (B Capital): one store instead of the Rilian per-investigation scoped store (there is exactly one subject register here).

export type GraphMode = '2d' | '3d';

/** Slider value meaning "no age filter" (display all edges regardless of age). */
export const MAX_AGE_ALL = 120;

export const GRAPH_PREFS_KEY = 'bcap:reputation:graph-prefs';

/** Old, pre-store key that held the bare render-mode string ('2d' | '3d'); read once to seed `mode`. */
export const LEGACY_MODE_KEY = 'bcap:reputation:graph-mode';

interface GraphPrefsState {
  mode: GraphMode;
  showHalos: boolean;
  showLabels: boolean;
  /** Live display filter in days; `null` means "all" (slider parked at `MAX_AGE_ALL`). */
  maxAgeDays: number | null;
  /** VISUAL_FIX_2: opt-in neighbourhood view — only the selected edge's endpoints and their neighbours. Session-only, default OFF, cleared on Expand entry. */
  connectionsOnly: boolean;
  /** DEF-022 (2026-09-15): show the run's degree-0 accounts (isolates) on the canvas. Default OFF = the linked subject set only; persisted. */
  showIsolates: boolean;

  setMode: (m: GraphMode) => void;
  toggleMode: () => void;
  setShowHalos: (v: boolean) => void;
  toggleHalos: () => void;
  setShowLabels: (v: boolean) => void;
  toggleLabels: () => void;
  /** Normalises input: values >= MAX_AGE_ALL or non-finite collapse to `null`; otherwise clamped to >= 1. */
  setMaxAgeDays: (days: number | null) => void;
  setConnectionsOnly: (v: boolean) => void;
  setShowIsolates: (v: boolean) => void;
  toggleIsolates: () => void;
  reset: () => void;
}

type PersistedGraphPrefs = Pick<GraphPrefsState, 'mode' | 'showHalos' | 'showLabels' | 'maxAgeDays' | 'showIsolates'>;

const DEFAULTS: PersistedGraphPrefs = {
  mode: '3d',
  showHalos: true,
  showLabels: true,
  maxAgeDays: null,
  showIsolates: false,
};

function normalizeMaxAgeDays(days: number | null): number | null {
  if (days === null || !Number.isFinite(days) || days >= MAX_AGE_ALL) return null;
  return Math.max(1, days);
}

/** `showIsolates` is optional here so a snapshot written before 2026-09-15 still rehydrates (it falls back to the default, false). */
function isPersistedGraphPrefs(value: unknown): value is Omit<PersistedGraphPrefs, 'showIsolates'> & { showIsolates?: boolean } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mode === '2d' || v.mode === '3d') &&
    typeof v.showHalos === 'boolean' &&
    typeof v.showLabels === 'boolean' &&
    (v.maxAgeDays === null || typeof v.maxAgeDays === 'number') &&
    (v.showIsolates === undefined || typeof v.showIsolates === 'boolean')
  );
}

/** Reads the legacy bare-string render-mode key, if present and valid. Never throws. */
function readLegacyMode(): GraphMode | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LEGACY_MODE_KEY);
    return raw === '2d' || raw === '3d' ? raw : null;
  } catch {
    return null;
  }
}

export const useGraphPrefs = create<GraphPrefsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      connectionsOnly: false,
      setMode: (m) => set({ mode: m }),
      toggleMode: () => set((s) => ({ mode: s.mode === '2d' ? '3d' : '2d' })),
      setShowHalos: (v) => set({ showHalos: v }),
      toggleHalos: () => set((s) => ({ showHalos: !s.showHalos })),
      setShowLabels: (v) => set({ showLabels: v }),
      toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
      setMaxAgeDays: (days) => set({ maxAgeDays: normalizeMaxAgeDays(days) }),
      setConnectionsOnly: (v) => set({ connectionsOnly: v }),
      setShowIsolates: (v) => set({ showIsolates: v }),
      toggleIsolates: () => set((s) => ({ showIsolates: !s.showIsolates })),
      reset: () => set({ ...DEFAULTS, connectionsOnly: false }),
    }),
    {
      name: GRAPH_PREFS_KEY,
      version: 1,
      partialize: (s) => ({ mode: s.mode, showHalos: s.showHalos, showLabels: s.showLabels, maxAgeDays: s.maxAgeDays, showIsolates: s.showIsolates }),
      // No persisted state yet under the new key (fresh install, or a browser that only ever knew the
      // old bare-string key): seed `mode` from LEGACY_MODE_KEY instead of falling back to the default.
      merge: (persisted, current) => {
        if (isPersistedGraphPrefs(persisted)) {
          return { ...current, ...persisted, showIsolates: persisted.showIsolates ?? current.showIsolates };
        }
        const legacyMode = readLegacyMode();
        return legacyMode ? { ...current, mode: legacyMode } : current;
      },
    },
  ),
);

/** Convenience: read the persisted prefs as a plain snapshot from anywhere (no hook needed). */
export function readGraphPrefs(): PersistedGraphPrefs {
  const { mode, showHalos, showLabels, maxAgeDays, showIsolates } = useGraphPrefs.getState();
  return { mode, showHalos, showLabels, maxAgeDays, showIsolates };
}
