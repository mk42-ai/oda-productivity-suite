"use client";
import { useEffect, useState } from "react";

/**
 * Hydration-safe clock. Returns `null` during SSR AND the first client render (so both produce identical markup), then the real
 * time right after mount, refreshed every `intervalMs`. Callers render a deterministic absolute timestamp while it is null and switch
 * to relative time ("5 h ago") once mounted — no Date.now() during render, no suppressHydrationWarning.
 */
export function useNow(intervalMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
