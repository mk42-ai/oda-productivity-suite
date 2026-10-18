/**
 * useFullscreen — Fullscreen API on one element, with a CSS "fixed inset" fallback for when native
 * fullscreen is unavailable or actively rejects the request.
 *
 * DEF-005: inside a cross-origin iframe without `allow="fullscreen"`, `document.fullscreenEnabled` is
 * `false` and `el.requestFullscreen()` rejects with `TypeError: Disallowed by permissions policy`. The old
 * hook swallowed that rejection in an empty catch and reported `supported=true` because it only checked
 * that the method *existed* — so the Expand button looked enabled and silently did nothing.
 *
 * `nativeSupported` reflects whether the browser will actually grant native fullscreen here — it is
 * `document.fullscreenEnabled || document.webkitFullscreenEnabled`, NOT merely whether `requestFullscreen`
 * exists as a method (a cross-origin iframe still has the method; calling it is what fails). `supported`
 * additionally allows for the CSS fallback (`nativeSupported || allowFallback`), so the Expand button can
 * stay enabled and still do something useful when native fullscreen is blocked.
 *
 * Native state mirrors `document.fullscreenElement === el`, refreshed from the `fullscreenchange` /
 * `webkitfullscreenchange` events (so a native ESC exit is reflected too). `fullscreenerror` /
 * `webkitfullscreenerror` are also observed: an asynchronous native failure records `lastError` and falls
 * back too. `onChange(isFullscreen, mode)` fires once per transition, in both modes.
 *
 * Fallback mode never touches the Fullscreen API — it toggles a CSS class/attribute that the consumer must
 * style (nothing here injects CSS). Contract:
 *   .fullscreen-fallback { position: fixed; inset: 0; z-index: 9999; background: #fff; }
 * The element also gets `data-fullscreen-fallback="1"`, and `document.body` gets the `has-fullscreen-fallback`
 * class (e.g. so the consumer can suppress the page scrollbar while the fallback covers the viewport).
 *
 * v4.3 (DEF-017 pass) — every outcome now runs through the pure `expandMachine` (`nextExpandState`), is published to
 * `window.__graphState.expand = { mode: 'fullscreen' | 'inpage' | 'none', reason }` and exposed as `expandMode` /
 * `statusNote` ("Fullscreen blocked by permissions policy — expanded in-page"). While expanded (EITHER mode) the hook owns:
 *   • Escape → exit (document keydown, skipped when a child — the Connections drawer — already handled the key), also in
 *     native mode so a headless / kiosk browser that does not exit on ESC by itself still collapses;
 *   • a focus trap: Tab / Shift+Tab cycle inside the expanded element (nothing outside it is visible);
 *   • focus restore: the element that had focus before `enter()` gets it back on exit.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { EXPAND_INITIAL, expandModeOf, expandStatusNote, nextExpandState, type ExpandEvent, type ExpandSnapshot } from './expandMachine';
import { publishExpandState, type ExpandMode } from './graphState';

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}

/** Which mechanism is currently showing "fullscreen": the real Fullscreen API, or the CSS fallback. */
type FullscreenMode = 'native' | 'fallback' | null;

export interface UseFullscreenOptions {
  /** Called after every transition with the new state (true = the element is now fullscreen, either mode); `reason` explains a fallback. */
  onChange?: (isFullscreen: boolean, mode: FullscreenMode, reason?: string | null) => void;
  /** Allow the CSS fallback when native fullscreen is unavailable or rejects the request (default true). */
  allowFallback?: boolean;
  /** v4.3 — keep Tab / Shift+Tab inside the expanded element (default true). */
  trapFocus?: boolean;
}

interface UseFullscreenResult {
  isFullscreen: boolean;
  mode: FullscreenMode;
  /** The native Fullscreen API is usable here: `document.fullscreenEnabled || webkitFullscreenEnabled`. */
  nativeSupported: boolean;
  /** Something will visibly happen on `enter()`: native fullscreen or the CSS fallback. */
  supported: boolean;
  /** `"<name>: <message>"` of the last native fullscreen failure, if any. */
  lastError: string | null;
  /** v4.3 DEF-005: why the CSS pseudo-fullscreen fallback is (or was last) used — null while native fullscreen is granted. */
  fallbackReason: string | null;
  /** v4.3 DEF-005: the document runs inside a cross-origin iframe (window.top is not accessible). */
  crossOriginFramed: boolean;
  /** v4.3 DEF-017: the published state-machine mode. */
  expandMode: ExpandMode;
  /** v4.3 DEF-017: short status-line note for the current mode (null when not expanded). */
  statusNote: string | null;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

/**
 * CSS-fallback marker class. Nothing in this module injects CSS — the consumer is expected to style it:
 *   .fullscreen-fallback { position: fixed; inset: 0; z-index: 9999; background: #fff; }
 */
export const FULLSCREEN_FALLBACK_CLASS = 'fullscreen-fallback';

/** document.body class toggled while the CSS fallback is active (e.g. to suppress the page scrollbar). */
const FALLBACK_BODY_CLASS = 'has-fullscreen-fallback';

const CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;
const ERROR_EVENTS = ['fullscreenerror', 'webkitfullscreenerror'] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The element currently in native fullscreen, prefixed API included. */
function currentFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** v4.3 DEF-005: framed by another origin — `window.top.location` throws a SecurityError from a cross-origin iframe. */
export function isCrossOriginFramed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.self === window.top) return false;
    void window.top?.location.href;
    return false;
  } catch {
    return true;
  }
}

/** Human-readable reason for taking the CSS fallback (surfaced on the status line and via console.info — never swallowed). */
function describeFallbackReason(kind: 'unavailable' | 'rejected' | 'error-event', detail?: string): string {
  const framed = isCrossOriginFramed() ? ' — cross-origin iframe without allow="fullscreen"' : '';
  if (kind === 'unavailable') return `native fullscreen unavailable (document.fullscreenEnabled=false${framed})`;
  if (kind === 'rejected') return `requestFullscreen rejected: ${detail ?? 'unknown error'}${framed}`;
  return `fullscreenerror event${detail ? `: ${detail}` : ''}${framed}`;
}

/** Whether the browser will actually grant native fullscreen here (flags only — not method existence). */
function nativeFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

/** v4.3 — focusable descendants of the expanded element, in DOM order (visible ones only). */
export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('aria-hidden') && (el.offsetParent !== null || el === document.activeElement || getComputedStyle(el).position === 'fixed'));
}

export function useFullscreen<T extends HTMLElement>(ref: RefObject<T | null>, options: UseFullscreenOptions = {}): UseFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<FullscreenMode>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [expandMode, setExpandMode] = useState<ExpandMode>('none');
  const reasonRef = useRef<string | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null); // v4.3 DEF-005: focus goes back to the toggle button on exit
  const machineRef = useRef<ExpandSnapshot>(EXPAND_INITIAL);

  const onChangeRef = useRef(options.onChange);
  useEffect(() => {
    onChangeRef.current = options.onChange;
  }, [options.onChange]);

  const mountedRef = useRef(true);
  const lastEmittedRef = useRef<{ isFullscreen: boolean; mode: FullscreenMode }>({ isFullscreen: false, mode: null });
  const keyHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);

  const nativeSupported = nativeFullscreenSupported();
  const allowFallback = options.allowFallback ?? true;
  const trapFocus = options.trapFocus ?? true;
  const supported = nativeSupported || allowFallback;

  /** Run the pure machine and mirror its mode to state + window.__graphState.expand. */
  const dispatch = useCallback((event: ExpandEvent): ExpandSnapshot => {
    const next = nextExpandState(machineRef.current, event);
    if (next === machineRef.current) return next;
    machineRef.current = next;
    const m = expandModeOf(next.state);
    publishExpandState(m, next.reason);
    if (mountedRef.current) setExpandMode(m);
    return next;
  }, []);

  /** Update state + fire onChange exactly once per real (isFullscreen, mode) transition. */
  const applyState = useCallback((nextIsFullscreen: boolean, nextMode: FullscreenMode): void => {
    if (!mountedRef.current) return;
    const prev = lastEmittedRef.current;
    if (prev.isFullscreen === nextIsFullscreen && prev.mode === nextMode) return;
    lastEmittedRef.current = { isFullscreen: nextIsFullscreen, mode: nextMode };
    setIsFullscreen(nextIsFullscreen);
    setMode(nextMode);
    // the third argument is only passed on a fallback transition (keeps the two-argument contract for native / exit callers)
    if (nextMode === 'fallback') onChangeRef.current?.(nextIsFullscreen, nextMode, reasonRef.current);
    else onChangeRef.current?.(nextIsFullscreen, nextMode);
  }, []);

  const noteFallbackReason = useCallback((reason: string): void => {
    reasonRef.current = reason;
    if (mountedRef.current) setFallbackReason(reason);
    console.info(`[useFullscreen] CSS pseudo-fullscreen fallback — ${reason}`);
  }, []);

  const recordError = useCallback((err: unknown): void => {
    if (!mountedRef.current) return;
    setLastError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
  }, []);

  /** v4.3 — document keydown while expanded (either mode): Escape exits, Tab cycles inside the element. */
  const detachKeys = useCallback((): void => {
    if (keyHandlerRef.current) {
      document.removeEventListener('keydown', keyHandlerRef.current);
      keyHandlerRef.current = null;
    }
  }, []);

  const exit = useCallback(async (): Promise<void> => {
    const el = ref.current;
    if (el) {
      el.classList.remove(FULLSCREEN_FALLBACK_CLASS);
      el.removeAttribute('data-fullscreen-fallback');
    }
    document.body.classList.remove(FALLBACK_BODY_CLASS);
    detachKeys();
    if (lastEmittedRef.current.mode === 'fallback') applyState(false, null);
    dispatch({ type: 'EXIT' });
    const focusTarget = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (focusTarget && typeof focusTarget.focus === 'function' && document.contains(focusTarget)) focusTarget.focus();

    const doc = document as FullscreenDocument;
    if (currentFullscreenElement() !== null && currentFullscreenElement() === ref.current) {
      try {
        if (typeof doc.exitFullscreen === 'function') await doc.exitFullscreen();
        else if (typeof doc.webkitExitFullscreen === 'function') await doc.webkitExitFullscreen();
      } catch (err) {
        recordError(err);
      }
    }
  }, [ref, applyState, recordError, dispatch, detachKeys]);

  const attachKeys = useCallback((): void => {
    if (keyHandlerRef.current) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (event.defaultPrevented) return; // a child (Connections drawer / WHY panel) consumed it
        event.preventDefault();
        void exit();
        return;
      }
      if (event.key === 'Tab' && trapFocus) {
        const root = ref.current;
        if (!root) return;
        const items = focusableWithin(root);
        if (items.length === 0) {
          event.preventDefault();
          root.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const inside = active !== null && root.contains(active);
        if (!inside) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };
    keyHandlerRef.current = onKeyDown;
    document.addEventListener('keydown', onKeyDown);
  }, [exit, ref, trapFocus]);

  /** Engage the CSS fallback: classes/attribute on the element, a body class, and the Escape / Tab listener. */
  const enterFallback = useCallback((): void => {
    if (lastEmittedRef.current.mode === 'fallback') return;
    const el = ref.current;
    if (!el) return;
    el.classList.add(FULLSCREEN_FALLBACK_CLASS);
    el.setAttribute('data-fullscreen-fallback', '1');
    document.body.classList.add(FALLBACK_BODY_CLASS);
    attachKeys();
    applyState(true, 'fallback');
  }, [ref, applyState, attachKeys]);

  const enter = useCallback(async (): Promise<void> => {
    const el = ref.current as FullscreenElement | null;
    if (!el) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (nativeSupported) {
      dispatch({ type: 'REQUEST' });
      try {
        if (typeof el.requestFullscreen === 'function') await el.requestFullscreen();
        else if (typeof el.webkitRequestFullscreen === 'function') await el.webkitRequestFullscreen();
        else throw new Error('requestFullscreen is not available on this element');
        reasonRef.current = null;
        if (mountedRef.current) setFallbackReason(null);
        return; // success — state follows the fullscreenchange event, never set optimistically
      } catch (err) {
        recordError(err);
        const reason = describeFallbackReason('rejected', err instanceof Error ? `${err.name}: ${err.message}` : String(err));
        noteFallbackReason(reason);
        if (allowFallback) {
          dispatch({ type: 'REJECTED', reason });
          enterFallback();
        } else {
          dispatch({ type: 'EXIT' });
        }
        return;
      }
    }
    const reason = describeFallbackReason('unavailable');
    noteFallbackReason(reason);
    if (allowFallback) {
      dispatch({ type: 'UNAVAILABLE', reason });
      enterFallback();
    }
  }, [ref, nativeSupported, allowFallback, recordError, enterFallback, noteFallbackReason, dispatch]);

  const toggle = useCallback(async (): Promise<void> => {
    if (isFullscreen) await exit();
    else await enter();
  }, [isFullscreen, enter, exit]);

  // Native fullscreen state + asynchronous native error reporting. Always-on for the life of the component.
  useEffect(() => {
    const syncNative = (): void => {
      const activeEl = currentFullscreenElement();
      const isOurs = activeEl !== null && activeEl === ref.current;
      if (isOurs) {
        dispatch({ type: 'GRANTED' });
        attachKeys();
        applyState(true, 'native');
      } else if (lastEmittedRef.current.mode === 'native') {
        detachKeys();
        dispatch({ type: 'NATIVE_EXITED' });
        applyState(false, null);
        const focusTarget = restoreFocusRef.current;
        restoreFocusRef.current = null;
        if (focusTarget && typeof focusTarget.focus === 'function' && document.contains(focusTarget)) focusTarget.focus();
      }
    };
    const onFullscreenErrorEvent = (event: Event): void => {
      recordError(new Error(`${event.type}: the browser rejected the fullscreen request`));
      const reason = describeFallbackReason('error-event', event.type);
      noteFallbackReason(reason);
      if (allowFallback && currentFullscreenElement() !== ref.current) {
        dispatch({ type: 'ERROR_EVENT', reason });
        enterFallback();
      }
    };

    syncNative();
    for (const ev of CHANGE_EVENTS) document.addEventListener(ev, syncNative);
    for (const ev of ERROR_EVENTS) document.addEventListener(ev, onFullscreenErrorEvent);
    return () => {
      for (const ev of CHANGE_EVENTS) document.removeEventListener(ev, syncNative);
      for (const ev of ERROR_EVENTS) document.removeEventListener(ev, onFullscreenErrorEvent);
    };
  }, [ref, applyState, recordError, allowFallback, enterFallback, noteFallbackReason, dispatch, attachKeys, detachKeys]);

  // Mount bookkeeping + fallback teardown on unmount ONLY (never as a side effect of the deps above changing).
  useEffect(() => {
    mountedRef.current = true;
    const el = ref.current;
    return () => {
      mountedRef.current = false;
      if (el) {
        el.classList.remove(FULLSCREEN_FALLBACK_CLASS);
        el.removeAttribute('data-fullscreen-fallback');
      }
      document.body.classList.remove(FALLBACK_BODY_CLASS);
      if (keyHandlerRef.current) {
        document.removeEventListener('keydown', keyHandlerRef.current);
        keyHandlerRef.current = null;
      }
      if (machineRef.current.state !== 'none') {
        machineRef.current = { ...machineRef.current, state: 'none', reason: null };
        publishExpandState('none', null);
      }
    };
  }, [ref]);

  return { isFullscreen, mode, nativeSupported, supported, lastError, fallbackReason, crossOriginFramed: isCrossOriginFramed(), expandMode, statusNote: expandStatusNote(expandMode, fallbackReason), enter, exit, toggle };
}
