"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { setChipTransfer } from "@/components/chat/open-intelligent-ui/context-chips";
import { PB_STORE_EMPTY_COPY, isPbLeaf, isPbNA, pitchbookProfileUrl, type PbMatchedOn, type PbStoreBatch, type PbStoreCompanyDetail, type PbStoreCompanyRow, type PbStoredProfile } from "@/lib/pitchbook-store-types";
import { FieldRow, RecordRows, ProvenanceLine, makePbChip, usePbAskInChat, utc, type PbAsk } from "./field-rows";
import "./pitchbook-sidebar.css";

export type PitchbookSidebarProps = {
  companies: PbStoreCompanyRow[];
  batch: PbStoreBatch | null;
  initialSlug: string | null;
  initialDetail: PbStoreCompanyDetail | null;
  /** Same-origin endpoint returning PbStoreCompanyDetail for `${detailEndpoint}/${slug}`. */
  detailEndpoint?: string;
  /** Mirror the selected slug into `?slug=` (the /pitchbook page). The chat dock passes false so selecting a company never re-navigates /chat. */
  syncUrl?: boolean;
  /** Compact single-column layout for the fixed dock beside the chat. */
  variant?: "page" | "dock";
};

const SECTIONS: Array<{ key: keyof PbStoredProfile; title: string }> = [
  { key: "summary", title: "Summary" },
  { key: "deals", title: "Deals" },
  { key: "investors", title: "Investors" },
  { key: "people", title: "People" },
  { key: "offices", title: "Offices" },
  { key: "employeeHistory", title: "Employee history" },
  { key: "newsLast30Days", title: "News (last 30 days)" },
  { key: "similarCompanies", title: "Similar companies" },
  { key: "affiliates", title: "Affiliates" },
  { key: "financialsMostRecent", title: "Financials" },
  { key: "exitPredictions", title: "Exit predictions" },
];

function matchedOnOf(profile: PbStoredProfile | null): PbMatchedOn | null {
  const m = profile?.matchedOn;
  if (!m || isPbNA(m)) return null;
  return (isPbLeaf(m) ? (m.value as PbMatchedOn) : m) ?? null;
}

function firstProvenance(profile: PbStoredProfile | null) {
  const s = profile?.summary;
  if (s && !isPbNA(s)) for (const v of Object.values(s)) if (isPbLeaf(v)) return v.provenance;
  return null;
}

/** Sections rendered for a stored profile — shared with the company card (`sections` limits which). */
export function PbStoreSections({ company, profile, ask, only, limit }: { company: string; profile: PbStoredProfile; ask: PbAsk; only?: Array<keyof PbStoredProfile>; limit?: number }) {
  const list = only ? SECTIONS.filter((s) => only.includes(s.key)) : SECTIONS;
  return (
    <>
      {list.map(({ key, title }) => {
        const val = profile[key];
        const isRecordSection = key === "summary" || key === "people" || key === "offices" || key === "financialsMostRecent" || key === "exitPredictions";
        return (
          <section key={key} className="pbs-section" data-testid="pb-section" data-section={key}>
            <h3>{title}</h3>
            {val == null ? (
              <FieldRow company={company} fieldKey={key} label={title} value={null} ask={ask} />
            ) : isRecordSection && !isPbNA(val) && !isPbLeaf(val) && !Array.isArray(val) ? (
              <RecordRows company={company} record={val} ask={ask} limit={limit} />
            ) : (
              <FieldRow company={company} fieldKey={key} label={title} value={val} ask={ask} limit={limit} />
            )}
          </section>
        );
      })}
    </>
  );
}

export function PbStoreDetail({ detail, batch, ask }: { detail: PbStoreCompanyDetail; batch: PbStoreBatch | null; ask: PbAsk }) {
  const profile = detail.profile;
  const matched = matchedOnOf(profile);
  const link = pitchbookProfileUrl(detail.pb_id);
  const prov = firstProvenance(profile);
  const batchId = detail.batch_id ?? batch?.batch_id ?? null;
  const headerChip = makePbChip(detail.name, "PitchBook company", [detail.name, detail.pb_id ? `PitchBook ID ${detail.pb_id}` : null, link].filter(Boolean).join(" · "), prov);

  return (
    <div className="pbs-detail pbs-pane" data-testid="pb-detail" data-slug={detail.slug} data-state={detail.state}>
      <header className="pbs-head">
        <h2>{detail.name}</h2>
        <span className="pbs-head-meta">PitchBook ID {detail.pb_id ?? "—"}</span>
        {matched && (
          <span className="pbs-head-meta" data-testid="pb-matched-on">
            matched {matched.score != null ? `score ${matched.score}` : ""}{matched.source ? ` · ${matched.source}` : ""}
          </span>
        )}
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pbs-head-meta">PitchBook profile ↗</a>}
        <button type="button" className="pbs-drag" draggable onDragStart={(e) => setChipTransfer(e.dataTransfer, headerChip)} onClick={() => ask(headerChip, `Tell me about ${detail.name} (PitchBook).`)} data-testid="pb-drag-company" title="Drag company into chat">
          <GripVertical className="size-3" aria-hidden /> Drag company into chat
        </button>
      </header>
      <div className="pbs-prov" data-testid="pb-detail-provenance">
        {prov?.source ?? "PitchBook batch store"} · batch {batchId ?? "—"} · fetched {utc(detail.fetched_at ?? prov?.fetched_at)}
      </div>

      {detail.state === "Unmatched in PitchBook" ? (
        <div className="pbs-unmatched" data-testid="pb-unmatched">
          <strong>Unmatched in PitchBook</strong>
          <span className="pbs-muted">Lookup tried: {matched?.lookup ?? matched?.query ?? matched?.name ?? detail.name}{matched?.source ? ` via ${matched.source}` : ""}. No PitchBook record was returned for this company.</span>
        </div>
      ) : !profile ? (
        <div className="pbs-empty" data-testid="pb-empty">{PB_STORE_EMPTY_COPY}</div>
      ) : (
        <>
          <PbStoreSections company={detail.name} profile={profile} ask={ask} />
          {profile.unavailable && profile.unavailable.length > 0 && (
            <p className="pbs-muted" style={{ marginTop: 12 }} data-testid="pb-unavailable-list">Not available in PitchBook: {profile.unavailable.join(", ")}</p>
          )}
        </>
      )}
      {prov && <div style={{ marginTop: 12 }}><ProvenanceLine prov={prov} /></div>}
    </div>
  );
}

export function PitchbookSidebar({ companies, batch, initialSlug, initialDetail, detailEndpoint = "/pitchbook/store", syncUrl = true, variant = "page" }: PitchbookSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ask = usePbAskInChat();
  const [q, setQ] = useState("");
  const [slug, setSlug] = useState<string | null>(initialSlug ?? companies.find((c) => c.state === "populated")?.slug ?? companies[0]?.slug ?? null);
  const cache = useRef<Map<string, PbStoreCompanyDetail>>(new Map(initialDetail ? [[initialDetail.slug, initialDetail]] : []));
  const [detail, setDetail] = useState<PbStoreCompanyDetail | null>(initialDetail);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? companies.filter((c) => c.name.toLowerCase().includes(needle) || c.slug.includes(needle)) : companies;
  }, [companies, q]);

  useEffect(() => {
    if (!slug) return;
    const row = companies.find((c) => c.slug === slug) ?? null;
    const hit = cache.current.get(slug);
    if (hit) { setDetail(hit); return; }
    let alive = true;
    setLoading(true);
    fetch(`${detailEndpoint}/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d: PbStoreCompanyDetail | null) => {
        if (!alive) return;
        const resolved: PbStoreCompanyDetail = d && d.slug ? d : { slug, name: row?.name ?? slug, state: row?.state ?? "pending", pb_id: row?.pb_id ?? null, batch_id: row?.batch_id ?? null, query_id: row?.query_id ?? null, fetched_at: row?.fetched_at ?? null, profile: null };
        cache.current.set(slug, resolved);
        setDetail(resolved);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [slug, companies, detailEndpoint]);

  const select = (s: string) => {
    setSlug(s);
    if (syncUrl && pathname) router.replace(`${pathname}?slug=${encodeURIComponent(s)}`, { scroll: false });
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const btns = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button.pbs-row") ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? Math.min(btns.length - 1, i + 1) : Math.max(0, i - 1);
    btns[next]?.focus();
    e.preventDefault();
  };

  const counts = useMemo(() => companies.reduce((a, c) => { a[c.state] = (a[c.state] ?? 0) + 1; return a; }, {} as Record<string, number>), [companies]);

  return (
    <div className={`pbs-root${variant === "dock" ? " pbs-root--dock" : ""}`} data-testid="pb-sidebar" data-variant={variant}>
      <aside className="pbs-pane pbs-list-pane" aria-label="PitchBook companies">
        <input type="search" className="pbs-search" placeholder={`Search ${companies.length} companies`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search companies by name" data-testid="pb-search" />
        <div className="pbs-batch" data-testid="pb-batch">
          {batch ? <>Batch {batch.batch_id} · {batch.status} · {batch.succeeded}/{batch.total} succeeded · {batch.unmatched} unmatched · {batch.failed} failed{batch.completed_at ? ` · completed ${utc(batch.completed_at)}` : ""}</> : PB_STORE_EMPTY_COPY}
          {" · "}{counts.populated ?? 0} populated · {counts["Unmatched in PitchBook"] ?? 0} unmatched · {counts.pending ?? 0} pending
        </div>
        <ul className="pbs-list" data-testid="pb-company-list" ref={listRef} onKeyDown={onListKey} role="listbox" aria-label="Companies">
          {filtered.map((c) => (
            <li key={c.slug} role="option" aria-selected={c.slug === slug}>
              <button type="button" className="pbs-row" data-testid="pb-company-row" data-slug={c.slug} data-state={c.state} aria-current={c.slug === slug ? "true" : undefined} onClick={() => select(c.slug)}>
                <span className="pbs-row-name">{c.name}</span>
                <span className="pbs-state" data-state={c.state}>{c.state}</span>
                <span className="pbs-row-meta">{c.sector_label && <span className="pbs-chip">{c.sector_label}</span>}{c.pb_id && <span className="pbs-muted" style={{ fontSize: 11 }}>{c.pb_id}</span>}</span>
              </button>
            </li>
          ))}
          {!filtered.length && <li className="pbs-muted" style={{ padding: 8 }}>No companies match “{q}”.</li>}
        </ul>
      </aside>
      {detail ? (
        <div aria-busy={loading || undefined}><PbStoreDetail detail={detail} batch={batch} ask={ask} /></div>
      ) : (
        <div className="pbs-pane pbs-detail pbs-empty" data-testid="pb-detail" data-state="pending">{slug && loading ? "Loading…" : PB_STORE_EMPTY_COPY}</div>
      )}
    </div>
  );
}
