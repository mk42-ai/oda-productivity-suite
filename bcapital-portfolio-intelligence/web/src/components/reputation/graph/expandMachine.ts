/**
 * expandMachine — the Expand control as a pure state machine (v4.3, DEF-005 / DEF-017).
 *
 *   none ──REQUEST──▶ requesting ──GRANTED──────────▶ fullscreen ──EXIT | NATIVE_EXITED──▶ none
 *                                ──REJECTED(reason)──▶ inpage      ──EXIT────────────────▶ none
 *        ──UNAVAILABLE(reason)──▶ inpage (fullscreenEnabled=false: the API is never called)
 *   fullscreen ──ERROR_EVENT(reason)──▶ inpage   (an asynchronous fullscreenerror after a granted request)
 *
 * `useFullscreen` drives the real DOM (requestFullscreen / the fixed-inset CSS fallback / body scroll lock / focus) and feeds
 * every outcome through `nextExpandState`, so the published `window.__graphState.expand = { mode, reason }` and the status-line
 * note (`expandStatusNote`) come from ONE table that the unit tests exercise without a browser. Reasons are classified
 * (`classifyExpandReason`) so the status line can say *why* — "Fullscreen blocked by permissions policy — expanded in-page"
 * — instead of swallowing the rejection.
 */

export type ExpandState = 'none' | 'requesting' | 'fullscreen' | 'inpage';

export type ExpandEvent =
  | { type: 'REQUEST' }
  | { type: 'GRANTED' }
  | { type: 'REJECTED'; reason: string }
  | { type: 'UNAVAILABLE'; reason: string }
  | { type: 'ERROR_EVENT'; reason: string }
  | { type: 'EXIT' }
  | { type: 'NATIVE_EXITED' };

export interface ExpandSnapshot {
  state: ExpandState;
  /** Why the in-page fallback is (or was last) used; null while native fullscreen is granted or nothing is expanded. */
  reason: string | null;
  /** Last native failure text (kept across an exit for the button tooltip). */
  lastError: string | null;
}

export const EXPAND_INITIAL: ExpandSnapshot = { state: 'none', reason: null, lastError: null };

/** Pure transition table — unknown (state, event) pairs return the same snapshot object (no-op). */
export function nextExpandState(snap: ExpandSnapshot, event: ExpandEvent): ExpandSnapshot {
  switch (event.type) {
    case 'REQUEST':
      return snap.state === 'none' ? { ...snap, state: 'requesting' } : snap;
    case 'GRANTED':
      return snap.state === 'requesting' || snap.state === 'none' ? { state: 'fullscreen', reason: null, lastError: snap.lastError } : snap;
    case 'REJECTED':
      return snap.state === 'requesting' || snap.state === 'none' ? { state: 'inpage', reason: event.reason, lastError: event.reason } : snap;
    case 'UNAVAILABLE':
      return snap.state === 'none' || snap.state === 'requesting' ? { state: 'inpage', reason: event.reason, lastError: snap.lastError } : snap;
    case 'ERROR_EVENT':
      return snap.state === 'fullscreen' || snap.state === 'requesting' ? { state: 'inpage', reason: event.reason, lastError: event.reason } : snap;
    case 'EXIT':
      return snap.state === 'none' ? snap : { ...snap, state: 'none', reason: null };
    case 'NATIVE_EXITED':
      return snap.state === 'fullscreen' || snap.state === 'requesting' ? { ...snap, state: 'none', reason: null } : snap;
    default:
      return snap;
  }
}

/** The mode published to `window.__graphState.expand.mode` ('requesting' is transient and reads as 'none'). */
export function expandModeOf(state: ExpandState): 'fullscreen' | 'inpage' | 'none' {
  if (state === 'fullscreen') return 'fullscreen';
  if (state === 'inpage') return 'inpage';
  return 'none';
}

type ExpandReasonKind = 'permissions-policy' | 'unavailable' | 'rejected' | 'error-event' | 'unknown';

/**
 * Classify a fallback reason string. A cross-origin iframe without allow="fullscreen" shows up either as
 * `document.fullscreenEnabled=false` (the permissions policy disables the feature before the API is called) or as
 * `TypeError: Disallowed by permissions policy` / `Permissions check failed` from `requestFullscreen()`.
 */
export function classifyExpandReason(reason: string | null | undefined): ExpandReasonKind {
  if (!reason) return 'unknown';
  const r = reason.toLowerCase();
  // a cross-origin frame without allow="fullscreen" reports fullscreenEnabled=false — the reason string carries the frame hint
  if (r.includes('permissions policy') || r.includes('permission policy') || r.includes('permissions check') || r.includes('cross-origin iframe') || r.includes('allow="fullscreen"') || r.includes('feature policy')) return 'permissions-policy';
  if (r.startsWith('native fullscreen unavailable')) return 'unavailable';
  if (r.startsWith('requestfullscreen rejected')) return 'rejected';
  if (r.startsWith('fullscreenerror')) return 'error-event';
  return 'unknown';
}

/** Short, human status-line note for the current Expand state (null when nothing is expanded). */
export function expandStatusNote(mode: 'fullscreen' | 'inpage' | 'none', reason: string | null | undefined): string | null {
  if (mode === 'fullscreen') return 'expanded: native fullscreen';
  if (mode !== 'inpage') return null;
  switch (classifyExpandReason(reason)) {
    case 'permissions-policy':
      return 'Fullscreen blocked by permissions policy — expanded in-page';
    case 'unavailable':
      return 'Fullscreen unavailable in this browser — expanded in-page';
    case 'rejected':
      return `Fullscreen request rejected — expanded in-page (${shortReason(reason)})`;
    case 'error-event':
      return 'Fullscreen error event — expanded in-page';
    default:
      return 'expanded in-page';
  }
}

function shortReason(reason: string | null | undefined): string {
  if (!reason) return 'unknown';
  const m = reason.match(/requestFullscreen rejected:\s*(.*)$/i);
  const body = (m ? m[1] : reason).replace(/\s*—\s*cross-origin iframe.*$/i, '').trim();
  return body.length > 60 ? `${body.slice(0, 57)}…` : body;
}
