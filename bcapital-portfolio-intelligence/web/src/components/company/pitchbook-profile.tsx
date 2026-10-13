"use client";

import { useCallback, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { fmtUsd } from "@/lib/format";
import type {
  PbProfile,
  PbProfileFieldKey,
  PbField,
  PbSource,
  PbInvestor,
  PbDeal,
  PbPerson,
  PbCompanyRef,
} from "@/lib/pitchbook-profile-types";
import { NOT_AVAILABLE_LABEL } from "@/lib/pitchbook-profile-types";
import { composerStore } from "@/components/chat/open-intelligent-ui/composer-store";
import {
  addContextChip,
  chipId,
  setChipTransfer,
  PITCHBOOK_PLUGIN_ID,
  type ContextChip,
} from "@/components/chat/open-intelligent-ui/context-chips";
import "./pitchbook-profile.css";

export type PitchbookProfileProps = {
  profile: PbProfile | null;
  slug: string;
  name: string;
};

export const ymd = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(+d) ? iso.slice(0, 10) : d.toISOString().slice(0, 10);
};

const FIELD_LABELS: Record<PbProfileFieldKey, string> = {
  overview: "Overview",
  hq: "HQ",
  founded: "Founded",
  status: "Status",
  employees: "Employees",
  website: "Website",
  contact: "Contact",
  last_financing_date: "Last financing date",
  last_financing_size_usd: "Last financing size",
  last_financing_type: "Last financing type",
  post_money_valuation_usd: "Post-money valuation",
  total_raised_usd: "Total raised",
  investors: "Investors",
  deal_history: "Deal history",
  executives: "Executives",
  board_members: "Board members",
  competitors: "Competitors",
  similar_companies: "Similar companies",
  investments_count: "Investments count",
  pitchbook_profile_url: "PitchBook profile URL",
};

function useAskInChat() {
  const router = useRouter();
  return useCallback(
    (chip: ContextChip, question: string) => {
      addContextChip(chip);
      composerStore.append(question);
      router.push("/chat?skip=1");
    },
    [router]
  );
}

function ProvenanceLine({ provenance }: { provenance: PbSource }) {
  const date = ymd(provenance.synced_at) ?? provenance.synced_at;
  return (
    <span className="pb-provenance-line" data-testid="pb-provenance">
      Source:{" "}
      {provenance.url ? (
        <a href={provenance.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {provenance.source}
        </a>
      ) : (
        <span>{provenance.source}</span>
      )}
      {" · synced "}
      <time dateTime={provenance.synced_at}>{date}</time>
    </span>
  );
}

function stringifyValue(key: PbProfileFieldKey, val: unknown): string {
  if (val == null) return "";
  if (typeof val === "number") return fmtUsd(val) || String(val);
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    if (key === "investors") return (val as PbInvestor[]).map((i) => i.name).slice(0, 5).join(", ");
    if (key === "executives" || key === "board_members")
      return (val as PbPerson[]).map((p) => `${p.name}${p.title ? ` (${p.title})` : ""}`).slice(0, 5).join(", ");
    if (key === "deal_history")
      return (val as PbDeal[]).map((d) => `${d.date || "deal"}: ${d.type || ""} ${d.size_usd ? fmtUsd(d.size_usd) : ""}`).slice(0, 3).join("; ");
    if (key === "competitors" || key === "similar_companies")
      return (val as PbCompanyRef[]).map((c) => c.name).slice(0, 5).join(", ");
    return `${val.length} items`;
  }
  return String(val);
}

function renderValue(key: PbProfileFieldKey, value: unknown) {
  if (value == null) return null;

  switch (key) {
    case "last_financing_size_usd":
    case "post_money_valuation_usd":
    case "total_raised_usd":
      return <span className="font-medium tabular-nums">{typeof value === "number" ? fmtUsd(value) : String(value)}</span>;

    case "website":
    case "pitchbook_profile_url":
      return typeof value === "string" ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          {value}
        </a>
      ) : (
        String(value)
      );

    case "investors": {
      const invs = Array.isArray(value) ? (value as PbInvestor[]) : [];
      if (!invs.length) return <span className="text-muted">No investors listed</span>;
      return (
        <div className="pb-compact-table-wrap">
          <table className="pb-compact-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Type</th>
                <th>Location</th>
                <th>AUM</th>
              </tr>
            </thead>
            <tbody>
              {invs.map((inv, i) => (
                <tr key={`${inv.name}-${i}`}>
                  <td className="font-medium">
                    {inv.website ? (
                      <a href={inv.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        {inv.name}
                      </a>
                    ) : (
                      inv.name
                    )}
                  </td>
                  <td>{inv.type || "—"}</td>
                  <td>{inv.location || "—"}</td>
                  <td className="tabular-nums">{inv.aum_musd != null ? fmtUsd(inv.aum_musd * 1e6) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "deal_history": {
      const deals = Array.isArray(value) ? (value as PbDeal[]) : [];
      if (!deals.length) return <span className="text-muted">No deal history</span>;
      return (
        <div className="pb-compact-table-wrap">
          <table className="pb-compact-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Round</th>
                <th>Size</th>
                <th>Post-money</th>
                <th>Lead investors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => (
                <tr key={i}>
                  <td>{d.date || "—"}</td>
                  <td className="font-medium">{d.type || "—"}</td>
                  <td className="tabular-nums">{d.size_usd != null ? fmtUsd(d.size_usd) : "—"}</td>
                  <td className="tabular-nums">{d.post_money_usd != null ? fmtUsd(d.post_money_usd) : "—"}</td>
                  <td>{d.lead_investors?.length ? d.lead_investors.join(", ") : "—"}</td>
                  <td>{d.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "executives":
    case "board_members": {
      const persons = Array.isArray(value) ? (value as PbPerson[]) : [];
      if (!persons.length) return <span className="text-muted">None listed</span>;
      return (
        <div className="pb-compact-table-wrap">
          <table className="pb-compact-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((p, i) => (
                <tr key={`${p.name}-${i}`}>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.title || "—"}</td>
                  <td>{p.since || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "competitors":
    case "similar_companies": {
      const comps = Array.isArray(value) ? (value as PbCompanyRef[]) : [];
      if (!comps.length) return <span className="text-muted">None listed</span>;
      return (
        <div className="pb-compact-table-wrap">
          <table className="pb-compact-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {comps.map((c, i) => (
                <tr key={`${c.name}-${i}`}>
                  <td className="font-medium">
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                  </td>
                  <td>{c.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return <span>{String(value)}</span>;
  }
}

/** The 12 rows every company section renders, in this order (user contract). Combined rows derive from the stored fields; a derived
 *  row is populated only when at least one underlying sourced value exists — never inferred, never a fallback to another field. */
type SectionRow = { key: PbProfileFieldKey; label: string; derive: (p: PbProfile | null) => PbField<any> | null };
const pick = (p: PbProfile | null, k: PbProfileFieldKey): PbField<any> | null => (p ? ((p as any)[k] as PbField<any> | null) ?? null : null);
const combine = (parts: (PbField<any> | null)[], join: (vals: string[]) => string): PbField<any> | null => {
  const have = parts.filter((f): f is PbField<any> => !!f && f.value != null && f.value !== "");
  if (!have.length) return null;
  const vals = have.map((f) => (typeof f.value === "number" ? fmtUsd(f.value) || String(f.value) : String(f.value)));
  return { value: join(vals), provenance: have[0].provenance };
};
const SECTION_ROWS: SectionRow[] = [
  { key: "overview", label: "Description", derive: (p) => pick(p, "overview") },
  { key: "founded", label: "Year Founded", derive: (p) => pick(p, "founded") },
  { key: "status", label: "Status", derive: (p) => pick(p, "status") },
  { key: "hq", label: "HQ/Contact", derive: (p) => combine([pick(p, "hq"), pick(p, "contact")], (v) => v.join(" · ")) },
  { key: "employees", label: "Employees", derive: (p) => pick(p, "employees") },
  { key: "investments_count", label: "Investments count", derive: (p) => pick(p, "investments_count") },
  { key: "deal_history", label: "Financing history", derive: (p) => pick(p, "deal_history") },
  { key: "post_money_valuation_usd", label: "Valuation", derive: (p) => pick(p, "post_money_valuation_usd") },
  { key: "investors", label: "Investors", derive: (p) => pick(p, "investors") },
  { key: "last_financing_date", label: "Latest deal", derive: (p) => combine([pick(p, "last_financing_date"), pick(p, "last_financing_type"), pick(p, "last_financing_size_usd")], (v) => v.join(" · ")) },
  { key: "website", label: "Website", derive: (p) => pick(p, "website") },
  { key: "pitchbook_profile_url", label: "PitchBook profile URL", derive: (p) => pick(p, "pitchbook_profile_url") },
];

function FieldRow({
  company,
  fieldKey,
  field,
  ask,
  labelOverride,
}: {
  company: string;
  fieldKey: PbProfileFieldKey;
  field: PbField<any> | null;
  ask: (chip: ContextChip, question: string) => void;
  labelOverride?: string;
}) {
  const isPopulated = field != null && field.value != null && field.value !== "" && !(Array.isArray(field.value) && field.value.length === 0);
  const label = labelOverride || FIELD_LABELS[fieldKey] || fieldKey;
  const strVal = isPopulated ? stringifyValue(fieldKey, field.value) : "";

  const chip: ContextChip = isPopulated
    ? {
        id: chipId(company, fieldKey, strVal),
        company,
        field: label,
        value: strVal,
        source: field.provenance?.url ?? field.provenance?.source ?? null,
        fetched_at: field.provenance?.synced_at ?? null,
        plugin_id: PITCHBOOK_PLUGIN_ID,
      }
    : {
        id: chipId(company, fieldKey, "unknown"),
        company,
        field: label,
        value: "unknown",
        source: null,
        fetched_at: null,
        plugin_id: PITCHBOOK_PLUGIN_ID,
      };

  const question = isPopulated
    ? `What do we know about ${company}'s ${label} (${strVal})?`
    : `What is ${company}'s ${label}? It is not available in our PitchBook store yet.`;

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ask(chip, question);
    }
  };

  return (
    <dl
      data-testid="pb-field"
      data-field={fieldKey}
      data-state={isPopulated ? "populated" : "not-available"}
      tabIndex={0}
      role="group"
      aria-label={`${label}: ${isPopulated ? strVal : NOT_AVAILABLE_LABEL}. Press Enter to ask in chat.`}
      onKeyDown={onKey}
      draggable={isPopulated}
      onDragStart={isPopulated ? (e) => setChipTransfer(e.dataTransfer, chip) : undefined}
      className="pb-field-dl"
    >
      <dt className="pb-field-dt">{label}</dt>
      <dd className="pb-field-dd">
        {isPopulated ? (
          <div>
            <div data-testid="pb-value">{renderValue(fieldKey, field.value)}</div>
            {field.provenance && <ProvenanceLine provenance={field.provenance} />}
          </div>
        ) : (
          <span
            className="pb-not-available"
            title="No value for this field in the synced PitchBook store (never inferred)"
            data-testid="pb-not-available"
          >
            {NOT_AVAILABLE_LABEL}
          </span>
        )}
      </dd>
      <dd className="pb-field-action">
        {isPopulated && (
          <button
            type="button"
            onClick={() => ask(chip, question)}
            data-testid="pb-ask"
            aria-label={`Ask in chat about ${label}`}
            title="Ask in chat"
            tabIndex={-1}
            className="inline-flex size-5 items-center justify-center rounded text-muted hover:bg-[var(--brand-green-soft)] hover:text-[var(--brand-green-ink)]"
          >
            <MessageSquarePlus className="size-3.5" aria-hidden />
          </button>
        )}
      </dd>
    </dl>
  );
}

export function PitchbookProfile({ profile, slug, name }: PitchbookProfileProps) {
  const ask = useAskInChat();
  const companyName = profile?.name || name;
  const syncedDate = profile?.synced_at ? (ymd(profile.synced_at) ?? profile.synced_at) : "—";
  const nextSync = "1st of each month 06:00 UTC";

  return (
    <section className="pb-profile-container" data-testid="pb-profile-section" data-slug={slug}>
      <header className="pb-profile-header" data-testid="pb-profile-header">
        <span className="font-semibold text-foreground">
          PitchBook profile · synced <time dateTime={profile?.synced_at}>{syncedDate}</time> · next sync: {nextSync}
        </span>
      </header>

      <div className="pb-profile-fields" data-testid="pb-profile-fields">
        {SECTION_ROWS.map((row) => {
          const field = row.derive(profile);
          return <FieldRow key={row.key} company={companyName} fieldKey={row.key} field={field} ask={ask} labelOverride={row.label} />;
        })}
      </div>

      {profile?.research_documents && profile.research_documents.length > 0 && (
        <div className="pb-research-section" data-testid="pb-research-docs">
          <h4 className="text-xs font-semibold mb-2">Research documents ({profile.research_documents.length})</h4>
          {profile.research_documents.map((doc, idx) => (
            <details key={idx} className="pb-research-doc">
              <summary className="pb-research-summary">
                <span>{doc.document}</span>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--brand-green-ink)] hover:underline ml-2"
                  >
                    Open document ↗
                  </a>
                )}
              </summary>
              <div className="mt-2 text-muted text-xs pl-2 border-l-2 border-border">
                <p className="whitespace-pre-wrap">{doc.excerpt}</p>
                {doc.fields_touched?.length > 0 && (
                  <p className="mt-1 text-[11px]">Fields: {doc.fields_touched.join(", ")}</p>
                )}
                <p className="text-[10px] mt-1">Ingested: {ymd(doc.ingested_at) ?? doc.ingested_at}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
