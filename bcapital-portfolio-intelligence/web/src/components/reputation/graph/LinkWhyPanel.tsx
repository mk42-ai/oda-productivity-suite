/**
 * LinkWhyPanel — the in-canvas WHY CONNECTED card (v4.3, DEF-017 edge-click-in-expand).
 *
 * Lives INSIDE the graph wrapper (the fullscreen element), so it is visible in native fullscreen and in the in-page
 * expanded mode alike — the right-hand WHY CONNECTED tab / aside stays in sync but is outside the expanded element and
 * therefore invisible while expanded. Shows exactly the payload a link click produced: source, target, renderer mode
 * (3D / 2D), weight, run window, the EVID ids behind the pair, raw count / per-mode counts, plus the persistent guardrail.
 * Escape inside the card closes the card only (the key is consumed, so the Expand hook does not exit on it).
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Badge, IdChip, KeyValue, cx } from '../rilian-ui';
import type { LinkWhyPayload } from './linkPayload';
import { buildEdgeContext, contextToMetadata, utf8Bytes } from '@/lib/reputation/ondemand/context';
import { EDGE_PRESETS } from '@/lib/reputation/ondemand/prompts';
import { useAskDock } from '@/lib/reputation/ondemand/askDock';
import { useEvidenceLookup, REPUTATION_INVESTIGATION, type EvidenceRow } from './evidence-context';

/* Port note (B Capital): the Rilian workbench resolved trail refs through its per-investigation ledger (resolveEvidenceRef /
 * getActiveInvestigationId). Here the refs are the batch item ids (`itm-…`) resolved through the host's evidence lookup
 * (`useEvidenceLookup`, fed by /api/reputation/graph); the chip markup is the Rilian EvidRefChip. */
function EvidRefChip({ id, className, lookup }: { id: string; className?: string; lookup: (id: string) => EvidenceRow | undefined }) {
  const row = lookup(id);
  const summary = row ? `${row.title}${row.source ? ` · ${row.source}` : ''} · ${row.publishedAt ?? ''}` : 'row not resolved in the local evidence store';
  return (
    <span className={cx('inline-flex', className)} title={`${id} — ${summary}`} data-testid="evid-ref-chip" data-ref={id} data-resolved={row ? '1' : '0'}>
      {row?.url ? <a className="chip" href={row.url} target="_blank" rel="noopener noreferrer">{id}</a> : <span className="chip cursor-default">{id}</span>}
    </span>
  );
}

export const WHY_PANEL_GUARDRAIL = 'CORRELATION ONLY — links show co-occurrence of sourced evidence inside the time window, not causation, coordination or intent.';
/** DEF-020: badge text for an edge whose distinct post pairs are (≥ 50 %) republished wire copy. */
export const SYNDICATED_BADGE = 'syndicated · wire copy';
/** DEF-019: shown ONLY when an edge with co-occurrences carries no trail — impossible by the engine invariant; report it if seen. */
export const TRAIL_INVARIANT_TEXT = 'no verbatim row resolved (invariant violation — report)';

/** DEF-020: the dedup-count / raw-events / syndication facts travel in the EXISTING context fields (runLabel line) — same buildEdgeContext signature. */
export function edgeFactsLine(count: number | null, rawCount: number | null | undefined, syndicated: boolean | undefined, runLabel: string | null): string | null {
  const parts = [runLabel, count !== null && typeof rawCount === 'number' && rawCount !== count ? `raw events ${rawCount} (co-occurrences = distinct post pairs)` : null, syndicated ? SYNDICATED_BADGE : null].filter((x): x is string => Boolean(x));
  return parts.length ? parts.join(' · ') : null;
}

interface LinkWhyPanelProps {
  payload: LinkWhyPayload | null;
  open: boolean;
  onClose: () => void;
  /** Extra rows appended after the standard ones (ego graph: kind / relation / newest activity). */
  extraRows?: Array<[string, ReactNode]>;
  /** Label of the window row when the payload has no window (ego graph edges are ledger links, not time windows). */
  noWindowLabel?: string;
  /** Called after the panel opened for a new payload (focus management / telemetry). */
  className?: string;
  /** v4.5/v4.8: publish this edge as the ASK subject of the chat dock (on by default; the ego graph passes its own run label / none). */
  ask?: boolean;
  /** Label of the run shown in the RUNS dropdown — travels inside the ASK context. */
  runLabel?: string | null;
}

export function LinkWhyPanel({ payload, open, onClose, extraRows = [], noWindowLabel = '— (ledger / reply edge, no time window)', className, ask = true, runLabel = null }: LinkWhyPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const openedFor = useRef<string | null>(null);
  // v4.5 ASK context: ONLY what this card shows + the stored EVID summaries (≤ 3 KB) + the standing rule
  const invId = REPUTATION_INVESTIGATION.id;
  const lookup = useEvidenceLookup();
  const askContext = useMemo(() => {
    if (!payload) return '';
    const inv = REPUTATION_INVESTIGATION;
    // DEF-019: EVID summaries resolve through the run's own refs (the batch items), never a foreign index
    return buildEdgeContext(
      { source: payload.source, target: payload.target, mode: payload.mode, weight: payload.weight, windowSeconds: payload.windowSeconds, count: payload.count, byMode: payload.byMode, minDelta: payload.minDelta, evidenceIds: payload.evidenceIds, investigation: { id: inv.id, cycle: inv.cycle, baseline: inv.baseline }, runLabel: edgeFactsLine(payload.count, payload.rawCount, payload.syndicated, runLabel) },
      (id) => {
        const e = lookup(id);
        return e ? { id, title: e.title, excerpt: e.excerpt, claimStatus: e.claimStatus, reliability: e.reliability, source: e.source, publishedAt: e.publishedAt } : undefined;
      },
    );
  }, [payload, lookup, runLabel]);
  // v4.8 — the prompt lives in the chat dock: publish the on-screen context as the ASK subject (pure state, nothing is sent)
  const setSubject = useAskDock((st) => st.setSubject);
  useEffect(() => {
    if (!ask || !open || !payload) return;
    setSubject({
      scope: 'edge',
      subjectKey: payload.id,
      title: `${payload.source} × ${payload.target} · ${payload.mode} · via ${payload.via}${payload.syndicated ? ` · ${SYNDICATED_BADGE}` : ''}`,
      investigationId: invId,
      context: askContext,
      presets: EDGE_PRESETS,
      contextMetadata: contextToMetadata(askContext, 'edge'),
      placeholder: 'quick query on this edge…',
    });
  }, [ask, open, payload, askContext, invId, setSubject]);
  const openAskInChat = (): void => {
    useAskDock.getState().setTab('ask');
    document.getElementById('reputation-ask')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  // non-modal live region: focus is NEVER stolen (a drawer user keeps arrowing through rows while the card follows); the
  // aria-live announcement carries the new pair. Escape inside the card closes only the card.
  useEffect(() => {
    if (!open || !payload) {
      openedFor.current = null;
      return;
    }
    openedFor.current = payload.id;
  }, [open, payload]);
  if (!open || !payload) return null;
  const rows: Array<[string, ReactNode]> = [
    ['source', <IdChip id={payload.source} />],
    ['target', <IdChip id={payload.target} />],
    ['mode', <span className="mono" data-testid="why-panel-mode">{payload.mode}</span>],
    ['weight', <span className="mono" data-testid="why-panel-weight">{payload.weight.toFixed(3)}</span>],
    ['window', payload.windowSeconds !== null ? <span className="mono" data-testid="why-panel-window">{payload.windowSeconds}s</span> : <span className="text-secondary" data-testid="why-panel-window">{noWindowLabel}</span>],
  ];
  // DEF-020: co-occurrences = distinct post pairs; the raw mode-event total is shown next to it when the run carries it
  if (payload.count !== null)
    rows.push([
      'co-occurrences',
      <span className="mono" data-testid="why-panel-count" data-count={payload.count} data-raw-count={payload.rawCount ?? ''}>
        {payload.count}
        {typeof payload.rawCount === 'number' && <span className="text-secondary"> (raw events {payload.rawCount})</span>}
        {payload.syndicated && (
          <span className="ml-2" data-testid="why-panel-syndicated">
            <Badge pattern="dashed" className="normal-case" title="≥ 50 % of the distinct post pairs are the same article republished (identical title / text or URL path, Δt inside the window) — co-action of a wire feed, not of these accounts">
              {SYNDICATED_BADGE}
            </Badge>
          </span>
        )}
      </span>,
    ]);
  if (payload.byMode && Object.keys(payload.byMode).length > 0)
    rows.push([
      'per mode',
      <span className="flex flex-wrap gap-1">
        {Object.entries(payload.byMode)
          .filter(([, c]) => (c ?? 0) > 0)
          .map(([m, c]) => (
            <Badge key={m} pattern="muted">
              {m} <span className="mono">{c}</span>
            </Badge>
          ))}
      </span>,
    ]);
  if (payload.minDelta !== null) rows.push(['min Δt', <span className="mono">{payload.minDelta}s</span>]);
  rows.push(...extraRows);
  return (
    <section
      className={cx('why-connected-panel', className)}
      role="region"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Why connected: ${payload.source} × ${payload.target}`}
      data-testid="why-connected-panel"
      data-edge={payload.id}
      data-mode={payload.mode}
      data-via={payload.via}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-1.5">
        <span className="label-xs">Why connected</span>
        <span className="flex items-center gap-1">
          <Badge pattern="dashed" className="badge-unproven">CORRELATION ONLY</Badge>
          <button ref={closeRef} type="button" className="btn btn-sm" onClick={onClose} aria-label="Close why connected" data-testid="why-panel-close">
            <X size={12} />
          </button>
        </span>
      </header>
      <div className="flex flex-col gap-2 p-3 text-[12px]">
        <div className="flex flex-wrap items-center gap-1" data-testid="why-panel-pair">
          <span className="mono text-ink">{payload.source}</span>
          <span className="text-tertiary">×</span>
          <span className="mono text-ink">{payload.target}</span>
          <span className="mono ml-auto text-[10px] text-secondary">{payload.mode} · via {payload.via}</span>
        </div>
        <KeyValue rows={rows} />
        <div className="flex flex-col gap-1" data-testid="why-panel-evidence" data-evid-count={payload.evidenceIds.length}>
          <div className="label-xs">
            EVID trail <span className="mono normal-case">{payload.evidenceIds.length}</span>
            <span className="ml-1 normal-case text-tertiary">· rows of this run's corpus</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {payload.evidenceIds.length ? (
              payload.evidenceIds.slice(0, 12).map((id) => <EvidRefChip key={id} id={id} className="why-panel-evid" lookup={lookup} />)
            ) : (
              <span className="text-[11px] text-tertiary" data-testid="why-panel-no-evid">
                {payload.count !== null && payload.count > 0 ? TRAIL_INVARIANT_TEXT : 'no EVID row cites either account'}
              </span>
            )}
            {payload.evidenceIds.length > 12 && <span className="text-[11px] text-tertiary">+{payload.evidenceIds.length - 12} more</span>}
          </div>
        </div>
        {ask && (
          <div className="flex items-center gap-2 border-t border-hairline pt-2" data-testid="why-panel-ask">
            <button type="button" className="btn btn-primary btn-sm" onClick={openAskInChat} data-testid="why-panel-ask-in-chat" title="The prompt, presets and preview live in the chat panel (speech-bubble dock)">
              <MessageSquare size={11} /> Ask about this link →
            </button>
            <span className="mono text-[10px] text-tertiary">subject loaded · ctx {utf8Bytes(askContext)} B</span>
          </div>
        )}
        <p className="m-0 border-l-2 border-hairline-2 pl-2 text-[10px] leading-4 text-secondary" data-testid="why-panel-guardrail">
          {WHY_PANEL_GUARDRAIL}
        </p>
      </div>
    </section>
  );
}
