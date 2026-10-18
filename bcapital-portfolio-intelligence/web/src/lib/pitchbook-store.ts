import fs from "node:fs";
import path from "node:path";
import { listCompanies } from "./api";
import type { PbStoreCompanyDetail, PbStoreCompanyRow, PbStoreFile, PbStoreIndex, PbStoreSource, PbStoredProfile } from "./pitchbook-store-types";

const PORTFOLIO_API_URL = (process.env.PORTFOLIO_API_URL || process.env.NEXT_PUBLIC_PORTFOLIO_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

const FILE_CANDIDATES = () => [
  path.join(process.cwd(), "src/data/pitchbook-store.json"),
  path.join(process.cwd(), "web/src/data/pitchbook-store.json"),
];

function readStoreFile(): PbStoreFile | null {
  try {
    for (const p of FILE_CANDIDATES()) {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8")) as PbStoreFile;
    }
  } catch { /* unparseable fallback */ }
  return null;
}

async function fetchJson<T>(url: string, ms = 2500): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(ms), next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const pendingRow = (c: { slug: string; name: string; sector: string }): PbStoreCompanyRow => ({
  slug: c.slug, name: c.name, sector: c.sector, sector_label: c.sector, pb_id: null, state: "pending",
  fetched_at: null, batch_id: null, query_id: null, fields_populated: 0, fields_unavailable: 0,
});

/** Index of all portfolio companies merged with the batch store; never empty when the portfolio list is known. */
export async function getPitchbookStoreIndex(): Promise<PbStoreIndex & { source: PbStoreSource }> {
  let source: PbStoreSource = "none";
  let index: PbStoreIndex | null = await fetchJson<PbStoreIndex>(`${PORTFOLIO_API_URL}/pitchbook/store`);
  if (index && Array.isArray(index.companies)) source = "live";
  else {
    const file = readStoreFile();
    if (file && Array.isArray(file.companies)) { index = { batch: file.batch ?? null, companies: file.companies }; source = "file"; }
    else index = null;
  }
  const bySlug = new Map<string, PbStoreCompanyRow>();
  for (const row of index?.companies ?? []) if (row?.slug) bySlug.set(row.slug, { ...pendingRow(row), ...row, sector_label: row.sector_label || row.sector || "" });
  try {
    const all = await listCompanies();
    // portfolio companies only — the firm row (b_capital_role "firm") is the investor itself, not a batch target
    for (const c of all.data) if (!bySlug.has(c.slug) && c.b_capital_role !== "firm") bySlug.set(c.slug, pendingRow(c));
  } catch { /* portfolio list unavailable; keep store rows */ }
  const companies = [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { batch: index?.batch ?? null, companies, source };
}

/** Detail for one company; null when neither the API nor the fallback file knows it. */
export async function getPitchbookStoreProfile(slug: string): Promise<PbStoreCompanyDetail | null> {
  const live = await fetchJson<PbStoreCompanyDetail>(`${PORTFOLIO_API_URL}/pitchbook/store/${encodeURIComponent(slug)}`);
  if (live && live.slug) return { ...live, profile: live.profile ?? null };
  const file = readStoreFile();
  if (!file) return null;
  const row = file.companies?.find((c) => c.slug === slug) ?? null;
  const raw = file.profiles?.[slug];
  if (!row && !raw) return null;
  const isDetail = !!raw && typeof raw === "object" && "slug" in raw && "profile" in raw;
  const profile: PbStoredProfile | null = isDetail ? ((raw as PbStoreCompanyDetail).profile ?? null) : ((raw as PbStoredProfile | undefined) ?? null);
  return {
    slug, name: row?.name ?? (raw as PbStoreCompanyDetail | undefined)?.name ?? slug, state: row?.state ?? (profile ? "populated" : "pending"),
    pb_id: row?.pb_id ?? null, batch_id: row?.batch_id ?? file.batch?.batch_id ?? null, query_id: row?.query_id ?? null, fetched_at: row?.fetched_at ?? null, profile,
  };
}
