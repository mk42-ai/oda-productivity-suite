/**
 * ASK context builders — turn what is ON SCREEN (the WHY CONNECTED payload or a node) plus the stored EVID summaries into a
 * compact context block (≤ 3 KB) that travels inside the query. Nothing else is sent: no ledgers, no corpus, no prompt
 * history. The standing rule is always the last line.
 * FIX DEF-027 (2026-09-15): `buildDatasetContext(question)` is the whole-dataset counterpart — a retrieval-ranked block
 * (src/lib/ondemand/retrieval.ts: BM25 + field filters, ≤ 7 000 B by default, hard cap 8 192 B) behind a dataset summary header.
 */
// Port note (B Capital): the whole-dataset DEF-027 section (retrieval.ts BM25 over the Rilian workbench corpus) is not ported — only the
// subject (edge / node) context builders below are used by the Reputation & Prestige quick-chat.

export const STANDING_RULE = 'Correlation: links show shared sourced facts, not endorsement · CO-OCCURRENCE ≠ CAUSATION';
export const CONTEXT_BYTE_CAP = 3 * 1024; // ~3 KB per call

export interface EvidenceSummary {
  id: string;
  title: string;
  excerpt?: string | null;
  claimStatus?: string | null;
  reliability?: string | null;
  source?: string | null;
  publishedAt?: string | null;
}
type EvidenceLookup = (id: string) => EvidenceSummary | undefined;

interface EdgeContextInput {
  source: string;
  target: string;
  mode: string; // '3D' | '2D'
  weight: number;
  windowSeconds: number | null;
  count: number | null;
  byMode: Record<string, number | undefined> | null;
  minDelta: number | null;
  evidenceIds: string[];
  investigation?: { id: string; cycle: number; baseline: string } | null;
  runLabel?: string | null;
}

interface NodeContextInput {
  handle: string;
  platform?: string | null;
  networkId?: string | null;
  role?: string | null;
  country?: string | null;
  reliability?: string | null;
  claimStatus?: string | null;
  watch?: string | null;
  evidenceIds: string[];
  investigation?: { id: string; cycle: number; baseline: string } | null;
}

export const utf8Bytes = (s: string): number => new TextEncoder().encode(s).length;

/** Clip a string to `maxBytes` UTF-8 bytes at a character boundary, appending an ellipsis marker. */
export function clipBytes(s: string, maxBytes: number): string {
  if (utf8Bytes(s) <= maxBytes) return s;
  let out = '';
  for (const ch of s) {
    if (utf8Bytes(out + ch) > maxBytes - 1) break;
    out += ch;
  }
  return `${out}…`;
}

function evidenceLines(ids: string[], lookup: EvidenceLookup, perLineCap: number): string[] {
  return ids.map((id) => {
    const e = lookup(id);
    if (!e) return `${id}: (not in local evidence store)`;
    const meta = [e.reliability ? `grade ${e.reliability}` : null, e.claimStatus ?? null, e.source ?? null, e.publishedAt ?? null].filter(Boolean).join(' · ');
    const text = e.excerpt && e.excerpt !== e.title ? `${e.title} — ${e.excerpt}` : e.title;
    return clipBytes(`${id}: ${text}${meta ? ` [${meta}]` : ''}`, perLineCap);
  });
}

/** Fit the evidence lines under the byte cap: shrink per-line budgets, then drop trailing ids (listing them as omitted). */
function fitEvidence(head: string, ids: string[], lookup: EvidenceLookup, tail: string, cap: number): string {
  const fixed = utf8Bytes(head) + utf8Bytes(tail) + 2;
  const budget = Math.max(0, cap - fixed);
  if (!ids.length) return `${head}\n${tail}`;
  for (const perLine of [400, 280, 200, 140, 100, 70]) {
    const lines = evidenceLines(ids, lookup, perLine);
    const block = lines.join('\n');
    if (utf8Bytes(block) <= budget) return `${head}\n${block}\n${tail}`;
  }
  // still too big: keep as many ids as fit, note the rest — and re-check the total so the cap is a hard ceiling
  const all = evidenceLines(ids, lookup, 70);
  const noteFor = (kept: number): string => {
    const omitted = ids.slice(kept);
    return omitted.length ? `(+${omitted.length} EVID omitted for size: ${omitted.slice(0, 6).join(', ')}${omitted.length > 6 ? '…' : ''})` : '';
  };
  const assemble = (kept: string[]): string => `${head}\n${[...kept, noteFor(kept.length)].filter(Boolean).join('\n')}\n${tail}`;
  const kept: string[] = [];
  for (const line of all) {
    kept.push(line);
    if (utf8Bytes(assemble(kept)) > cap) {
      kept.pop();
      break;
    }
  }
  while (kept.length && utf8Bytes(assemble(kept)) > cap) kept.pop();
  return assemble(kept);
}

export function buildEdgeContext(e: EdgeContextInput, lookup: EvidenceLookup, cap = CONTEXT_BYTE_CAP): string {
  const perMode = e.byMode ? Object.entries(e.byMode).filter(([, c]) => (c ?? 0) > 0).map(([m, c]) => `${m} ${c}`).join(', ') : '';
  const inv = e.investigation ? `investigation ${e.investigation.id} · cycle ${e.investigation.cycle} · baseline C1 ${e.investigation.baseline}` : null;
  const head = [
    'CONTEXT (exactly what the WHY CONNECTED panel shows):',
    inv,
    e.runLabel ? `run: ${e.runLabel}` : null,
    `source: ${e.source}`,
    `target: ${e.target}`,
    `renderer mode: ${e.mode}`,
    `weight: ${e.weight.toFixed(3)}`,
    `window: ${e.windowSeconds === null ? 'none (ledger / reply edge)' : `${e.windowSeconds}s`}`,
    e.count === null ? null : `co-occurrences: ${e.count}`,
    perMode ? `per mode: ${perMode}` : null,
    e.minDelta === null ? null : `min Δt: ${e.minDelta}s`,
    `EVID trail (${e.evidenceIds.length}): ${e.evidenceIds.join(', ') || 'none'}`,
    'EVID summaries from the local evidence store:',
  ]
    .filter(Boolean)
    .join('\n');
  const tail = `STANDING RULE: ${STANDING_RULE}`;
  return fitEvidence(head, e.evidenceIds, lookup, tail, cap);
}

export function buildNodeContext(n: NodeContextInput, lookup: EvidenceLookup, cap = CONTEXT_BYTE_CAP): string {
  const inv = n.investigation ? `investigation ${n.investigation.id} · cycle ${n.investigation.cycle} · baseline C1 ${n.investigation.baseline}` : null;
  const head = [
    'CONTEXT (exactly what the node inspector shows):',
    inv,
    `handle: ${n.handle}`,
    n.platform ? `platform: ${n.platform}` : null,
    `network: ${n.networkId ?? 'none'}`,
    n.role ? `role: ${n.role}` : null,
    n.country ? `country: ${n.country}` : null,
    n.reliability ? `source reliability (A–F, separate from claim status): ${n.reliability}` : null,
    n.claimStatus ? `claim status: ${n.claimStatus}` : null,
    n.watch ? `watch list: ${n.watch}` : null,
    `EVID citing this handle (${n.evidenceIds.length}): ${n.evidenceIds.join(', ') || 'none'}`,
    'EVID summaries from the local evidence store:',
  ]
    .filter(Boolean)
    .join('\n');
  const tail = `STANDING RULE: ${STANDING_RULE}`;
  return fitEvidence(head, n.evidenceIds, lookup, tail, cap);
}

/** v4.7 — the on-screen edge/node facts (source, target, window, co-occurrences, EVID trail…) travel as session contextMetadata
 * on the live-session path, in addition to the query text. Key/value strings only, ≤ 20 entries. */
export function contextToMetadata(context: string, scope: 'edge' | 'node'): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [{ key: 'surface', value: scope === 'edge' ? 'why-connected-edge' : 'node-inspector' }];
  for (const line of context.split('\n')) {
    const m = /^([A-Za-z][A-Za-z0-9 _Δ()-]{0,40}?)\s*:\s*(.{1,200})$/.exec(line.trim());
    if (!m) continue;
    const key = m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!key || key === 'evid_summaries_from_the_local_evidence_store' || out.some((x) => x.key === key)) continue;
    out.push({ key, value: m[2].trim() });
    if (out.length >= 20) break;
  }
  return out;
}

