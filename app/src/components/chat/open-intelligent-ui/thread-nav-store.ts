"use client";
import { useSyncExternalStore } from "react";

export type ThreadNavItem = {
  id: string;
  title?: string;
  createdAt?: string | number;
  isPending?: boolean;
};

export type ThreadNavState = {
  threads: ThreadNavItem[];
  selectedId: string | null;
  select: (id: string) => void;
  newThread: () => void;
};

type Listener = () => void;

function readInitialThreads(): ThreadNavItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("uaecc.chat.threads.v2");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ThreadNavItem[]) : [];
  } catch {
    return [];
  }
}

let state: ThreadNavState = {
  threads: [],
  selectedId: null,
  select: () => {},
  newThread: () => {},
};

if (typeof window !== "undefined") {
  state.threads = readInitialThreads();
}

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) {
    try {
      l();
    } catch {
      // ignore
    }
  }
}

export const threadNavStore = {
  get: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish: (next: Partial<ThreadNavState>) => {
    state = { ...state, ...next };
    emit();
  },
};

/** Server/hydration snapshot: always empty so the SSR markup (no threads) matches the first client render; the
 *  localStorage-backed list arrives on the post-hydration render (fixes React error 418 on /chat reload with saved threads). */
const SERVER_STATE: ThreadNavState = { threads: [], selectedId: null, select: () => {}, newThread: () => {} };
export function useThreadNav(): ThreadNavState {
  return useSyncExternalStore(threadNavStore.subscribe, threadNavStore.get, () => SERVER_STATE);
}
