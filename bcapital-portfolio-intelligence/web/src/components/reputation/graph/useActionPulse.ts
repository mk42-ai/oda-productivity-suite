/**
 * useActionPulse — a short, accessible confirmation for idempotent toolbar actions (DEF-006, v4.3).
 *
 * Fit and Reset are visually idempotent when the view is already fitted, so the toolbar looked dead. `trigger('fitted ✓')`
 * shows a monochrome pill for PULSE_MS inside an always-mounted `role="status" aria-live="polite"` region (screen readers
 * announce it, sighted users see it fade) and mirrors the text to `window.__graphState.lastPulse` for the headless proof.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { publishGraphState } from './graphState';

export const PULSE_MS = 900;

interface ActionPulse {
  text: string;
  /** Changes on every trigger so consecutive identical pulses restart the CSS animation. */
  id: number;
}

interface UseActionPulseResult {
  pulse: ActionPulse | null;
  trigger: (text: string) => void;
}

export function useActionPulse(durationMs: number = PULSE_MS): UseActionPulseResult {
  const [pulse, setPulse] = useState<ActionPulse | null>(null);
  const timer = useRef<number | null>(null);
  const seq = useRef(0);

  const trigger = useCallback(
    (text: string): void => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      seq.current += 1;
      setPulse({ text, id: seq.current });
      publishGraphState({ lastPulse: text });
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setPulse(null);
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return { pulse, trigger };
}
