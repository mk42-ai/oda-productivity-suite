/**
 * v5.2 (fix A) — temporal precision of a post timestamp and pair eligibility per window.
 *
 * A date-only source ("2026-09-11") is coerced to T00:00:00Z when it becomes an ISO datetime; two such rows then look
 * simultaneous (Δt = 0 s) and satisfy any window. That is an artefact of the coercion, not co-action. Every post carries
 * its `tsPrecision`; the scorer only pairs rows whose precisions can actually resolve the configured window.
 */
export type TsPrecision = 'second' | 'minute' | 'hour' | 'date';

/** Coarsest Δt (seconds) a precision can resolve. */
const PRECISION_RESOLUTION_S: Record<TsPrecision, number> = { second: 1, minute: 60, hour: 3600, date: 86400 };
/** Weight multiplier per precision (fix B: precision_factor). */
export const PRECISION_FACTOR: Record<TsPrecision, number> = { second: 1, minute: 0.8, hour: 0.4, date: 0.1 };
/** Same-day mode: date-only pairs are never scored as co-action; when kept they are labelled and capped here. */
export const SAME_DAY_WEIGHT_CAP = 0.1;

/** Derive the precision from the source string format (never from the coerced value). */
export function derivePrecision(ts: string | null | undefined, hint?: string | null): TsPrecision {
  const s = (ts ?? '').trim();
  if (hint === 'day' || hint === 'date') return 'date';
  if (!s) return 'date';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'date';
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(s)) return /T00:00:00(\.0+)?(Z|[+-]00:?00)?$/.test(s) && hint !== 'second' ? 'date' : 'second';
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(Z|[+-]\d{2}:?\d{2})?$/.test(s)) return 'minute';
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}(Z|[+-]\d{2}:?\d{2})?$/.test(s)) return 'hour';
  return 'date';
}

/** A precision supports a window when its resolution is no coarser than the window. */
export function precisionSupportsWindow(p: TsPrecision, windowSeconds: number): boolean {
  return PRECISION_RESOLUTION_S[p] <= windowSeconds;
}

export type PairEligibility = { eligible: true; factor: number; sameDay: false } | { eligible: true; factor: number; sameDay: true } | { eligible: false; reason: 'precision_insufficient' };

/** Both precisions must support the window; two date-only rows go to the labelled same-day mode (capped), never to co-action. */
export function pairEligibility(a: TsPrecision, b: TsPrecision, windowSeconds: number): PairEligibility {
  const okA = precisionSupportsWindow(a, windowSeconds);
  const okB = precisionSupportsWindow(b, windowSeconds);
  if (okA && okB) return { eligible: true, factor: Math.min(PRECISION_FACTOR[a], PRECISION_FACTOR[b]), sameDay: false };
  if (a === 'date' && b === 'date') return { eligible: true, factor: PRECISION_FACTOR.date, sameDay: true };
  return { eligible: false, reason: 'precision_insufficient' };
}
