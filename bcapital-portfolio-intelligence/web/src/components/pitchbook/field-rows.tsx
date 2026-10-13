"use client";

import { useCallback, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { fmtUsd } from "@/lib/format";
import { composerStore } from "@/components/chat/open-intelligent-ui/composer-store";
import { addContextChip, chipId, setChipTransfer, PITCHBOOK_PLUGIN_ID, type ContextChip } from "@/components/chat/open-intelligent-ui/context-chips";
import { PB_STORE_NA, isPbLeaf, isPbNA, type PbStoreProvenance } from "@/lib/pitchbook-store-types";
import "./pitchbook-sidebar.css";

/* ------------------------------------------------------------------ chat hook */

/** Adds a chip + appends text to the composer; navigates to /chat only when not already there (never a new session). */
export function usePbAskInChat() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (chip: ContextChip, question: string) => {
      addContextChip(chip);
      composerStore.append(question);
      if (!pathname || !pathname.startsWith("/chat")) router.push("/chat?skip=1");
    },
    [router, pathname]
  );
}
export type PbAsk = ReturnType<typeof usePbAskInChat>;

export function makePbChip(company: string, field: string, value: string, prov?: PbStoreProvenance | null): ContextChip {
  return {
    id: chipId(company, field, value),
    company,
    field,
    value,
    source: prov ? `${prov.source} · batch ${prov.batch_id}` : null,
    fetched_at: prov?.fetched_at ?? null,
    plugin_id: PITCHBOOK_PLUGIN_ID,
  };
}

/* ------------------------------------------------------------------ formatting */

export const utc = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(+d) ? iso : d.toISOString().replace(".000Z", "Z");
};

export const labelOf = (key: string) =>
  key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const MONEY_RE = /(usd|amount|raised|valuation|size|revenue|ebitda|netIncome|aum|price|capital|money|value)/i;
const isMoneyKey = (key: string) => MONEY_RE.test(key) && !/count|date|year|employees/i.test(key);

/** Resolves a leaf/raw value into a display primitive. Objects with {value, provenance} are unwrapped. */
export function fmtPrimitive(key: string, raw: unknown): string {
  const v = isPbLeaf(raw) ? raw.value : raw;
  if (v == null || v === "") return "—";
  if (isPbNA(v)) return PB_STORE_NA;
  if (typeof v === "number") return isMoneyKey(key) ? fmtUsd(v) : v.toLocaleString("en-US");
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map((x) => fmtPrimitive(key, x)).filter((s) => s !== "—").join(", ") || "—";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.name === "string") return o.name;
    if (typeof o.formatted === "string") return o.formatted;
    if (typeof o.amount === "number") return `${fmtUsd(o.amount)}${o.currency && o.currency !== "USD" ? ` ${String(o.currency)}` : ""}`;
    if (typeof o.city === "string" || typeof o.country === "string")
      return [o.city, o.state, o.country].filter(Boolean).map(String).join(", ");
    return Object.entries(o).filter(([, x]) => x != null && typeof x !== "object").map(([k, x]) => `${labelOf(k)}: ${String(x)}`).join(" · ") || "—";
  }
  return String(v);
}

const isUrl = (s: string) => /^https?:\/\//i.test(s);

export function ProvenanceLine({ prov }: { prov: PbStoreProvenance }) {
  return (
    <span className="pbs-prov" data-testid="pb-provenance" title={prov.note ?? undefined}>
      {prov.source} · batch {prov.batch_id} · fetched <time dateTime={prov.fetched_at}>{utc(prov.fetched_at)}</time>
    </span>
  );
}

/* ------------------------------------------------------------------ compact tables */

function tableColumns(rows: Record<string, unknown>[], max = 6): string[] {
  const seen: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!seen.includes(k) && k !== "provenance") seen.push(k);
  return seen.slice(0, max);
}

export function CompactTable({ rows, limit }: { rows: Record<string, unknown>[]; limit?: number }) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const cols = tableColumns(shown);
  if (!cols.length) return <span className="pbs-muted">None listed</span>;
  return (
    <div className="pbs-table-wrap">
      <table className="pbs-table">
        <thead>
          <tr>{cols.map((c) => <th key={c}>{labelOf(c)}</th>)}</tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => {
                const s = fmtPrimitive(c, r[c]);
                return (
                  <td key={c} className={typeof (isPbLeaf(r[c]) ? r[c].value : r[c]) === "number" ? "tabular-nums" : undefined}>
                    {s === PB_STORE_NA ? <span className="pbs-na">{s}</span> : isUrl(s) ? <a href={s} target="_blank" rel="noopener noreferrer">{s}</a> : s}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {limit && rows.length > limit && <div className="pbs-muted" style={{ fontSize: 11, marginTop: 4 }}>Showing {limit} of {rows.length}</div>}
    </div>
  );
}

/** Earliest provenance found inside a list of records (for the list-level provenance line). */
function listProvenance(rows: Record<string, unknown>[]): PbStoreProvenance | null {
  for (const r of rows) {
    if (isPbLeaf(r)) return r.provenance;
    for (const v of Object.values(r)) if (isPbLeaf(v)) return v.provenance;
    const p = (r as { provenance?: PbStoreProvenance }).provenance;
    if (p && typeof p === "object" && "batch_id" in p) return p;
  }
  return null;
}

function summariseRows(key: string, rows: Record<string, unknown>[]): string {
  const cols = tableColumns(rows, 3);
  return rows.slice(0, 5).map((r) => cols.map((c) => fmtPrimitive(c, r[c])).filter((s) => s !== "—" && s !== PB_STORE_NA).join(" ")).filter(Boolean).join("; ") || `${rows.length} ${labelOf(key).toLowerCase()}`;
}

/* ------------------------------------------------------------------ field row */

export type FieldRowProps = {
  company: string;
  fieldKey: string;
  label?: string;
  /** Leaf `{value, provenance}`, literal N/A, a record list, or a raw value (treated as populated without provenance). */
  value: unknown;
  ask: PbAsk;
  limit?: number;
};

export function FieldRow({ company, fieldKey, label, value, ask, limit }: FieldRowProps) {
  const lbl = label ?? labelOf(fieldKey);
  const na = value == null || isPbNA(value) || (isPbLeaf(value) && (value.value == null || isPbNA(value.value))) || (Array.isArray(value) && value.length === 0);
  const prov: PbStoreProvenance | null = isPbLeaf(value) ? value.provenance : Array.isArray(value) ? listProvenance(value as Record<string, unknown>[]) : null;
  const inner = isPbLeaf(value) ? value.value : value;
  const isList = Array.isArray(inner) && inner.length > 0 && typeof inner[0] === "object" && inner[0] !== null && !isPbLeaf(inner[0]);
  const strVal = na ? PB_STORE_NA : isList ? summariseRows(fieldKey, inner as Record<string, unknown>[]) : fmtPrimitive(fieldKey, inner);

  const chip = makePbChip(company, lbl, na ? "unknown" : strVal, prov);
  const question = na
    ? `What is ${company}'s ${lbl}? PitchBook reports it as not available.`
    : `What do we know about ${company}'s ${lbl} (${strVal})?`;

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ask(chip, question); }
  };

  let body: ReactNode;
  if (na) body = <span className="pbs-na" data-testid="pb-not-available" title="No value for this field in the PitchBook batch store (never inferred)">{PB_STORE_NA}</span>;
  else if (isList) body = <CompactTable rows={inner as Record<string, unknown>[]} limit={limit} />;
  else if (isUrl(strVal)) body = <a href={strVal} target="_blank" rel="noopener noreferrer" className="pbs-link">{strVal}</a>;
  else body = <span className={typeof inner === "number" ? "tabular-nums" : undefined}>{strVal}</span>;

  return (
    <dl
      className="pbs-field"
      data-testid="pb-field"
      data-field={fieldKey}
      data-state={na ? "not-available" : "populated"}
      tabIndex={0}
      role="group"
      aria-label={`${lbl}: ${strVal}. Press Enter to ask in chat.`}
      onKeyDown={onKey}
      draggable={!na}
      onDragStart={!na ? (e) => setChipTransfer(e.dataTransfer, chip) : undefined}
    >
      <dt className="pbs-field-dt">{lbl}</dt>
      <dd className="pbs-field-dd">
        <div data-testid="pb-value">{body}</div>
        {!na && prov && <ProvenanceLine prov={prov} />}
      </dd>
      <dd className="pbs-field-action">
        <button type="button" className="pbs-ask" onClick={() => ask(chip, question)} data-testid="pb-ask" aria-label={`Ask in chat about ${lbl}`} title="Ask in chat" tabIndex={-1}>
          <MessageSquarePlus className="size-3.5" aria-hidden />
        </button>
      </dd>
    </dl>
  );
}

/** Renders a record (object of leaves) as a list of FieldRows; a leaf or list renders as one row. */
export function RecordRows({ company, record, ask, prefix, limit }: { company: string; record: unknown; ask: PbAsk; prefix?: string; limit?: number }) {
  if (record == null) return null;
  if (isPbNA(record) || isPbLeaf(record) || Array.isArray(record)) return <FieldRow company={company} fieldKey={prefix ?? "value"} value={record} ask={ask} limit={limit} />;
  const entries = Object.entries(record as Record<string, unknown>);
  if (!entries.length) return <span className="pbs-muted">None listed</span>;
  return <>{entries.map(([k, v]) => <FieldRow key={k} company={company} fieldKey={prefix ? `${prefix}.${k}` : k} label={labelOf(k)} value={v} ask={ask} limit={limit} />)}</>;
}
