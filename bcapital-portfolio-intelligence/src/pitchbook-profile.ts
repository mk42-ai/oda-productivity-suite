/**
 * PitchBook company profiles — read model over data/pitchbook/profiles.json (built weekly by scripts/pitchbook/build-profiles.py from the
 * Investor Finder records, the committed snapshot, the portfolio research batch and the B Capital research documents).
 * Server-rendered store: no run button, no process trigger. Every field is {value, provenance} or null (= "Not available in PitchBook").
 */
import fs from "node:fs";
import path from "node:path";
import type { PbProfile, PbCoverage } from "./pitchbook-profile-schema.js";
import { PB_PROFILE_FIELDS } from "./pitchbook-profile-schema.js";
import { ensurePitchbookStoreSeeded, readAllProfiles, readProfile, normaliseProfile } from "./persist/pitchbook-store.js";

type Store = { synced_at: string; companies: Record<string, PbProfile>; coverage: PbCoverage; research_documents: { document: string; url: string | null; paragraphs: number; companies_matched: number }[] };
const FILE = path.join(process.cwd(), "data", "pitchbook", "profiles.json");
let cache: { mtime: number; store: Store } | null = null;

export function readProfileStore(): Store | null {
  try {
    const st = fs.statSync(FILE);
    if (!cache || cache.mtime !== st.mtimeMs) cache = { mtime: st.mtimeMs, store: JSON.parse(fs.readFileSync(FILE, "utf8")) as Store };
    return cache.store;
  } catch { return null; }
}
export function getProfile(slug: string): PbProfile | null { return readProfileStore()?.companies[slug] ?? null; }
export function coverageOf(store: Store): PbCoverage {
  const out = {} as PbCoverage;
  for (const k of PB_PROFILE_FIELDS) { const populated = Object.values(store.companies).filter((p) => !!(p as any)[k]).length; out[k] = { populated, not_available: Object.keys(store.companies).length - populated }; }
  return out;
}

/** libSQL-first read: the durable store (seeded from the file on first boot, updated by the monthly sync) wins; the file is the fallback. */
export async function readProfileStoreLive(): Promise<(Store & { store: "libsql" | "file" }) | null> {
  try {
    await ensurePitchbookStoreSeeded();
    const companies = await readAllProfiles();
    if (Object.keys(companies).length) {
      const f = readProfileStore();
      const synced = Object.values(companies).map((p) => p.synced_at).filter(Boolean).sort().pop() ?? f?.synced_at ?? "";
      return { synced_at: synced, companies, coverage: coverageOf({ synced_at: synced, companies, coverage: {} as PbCoverage, research_documents: [] }), research_documents: f?.research_documents ?? [], store: "libsql" };
    }
  } catch (e) { console.error(JSON.stringify({ msg: "pitchbook.store.read.failed", error: (e as Error).message })); }
  const f = readProfileStore(); return f ? { ...f, companies: Object.fromEntries(Object.entries(f.companies).map(([k, p]) => [k, normaliseProfile(p)])), store: "file" } : null;
}
export async function getProfileLive(slug: string): Promise<{ profile: PbProfile; store: "libsql" | "file" } | null> {
  try { await ensurePitchbookStoreSeeded(); const p = await readProfile(slug); if (p) return { profile: normaliseProfile(p), store: "libsql" }; } catch { /* fall through */ }
  const p = getProfile(slug); return p ? { profile: normaliseProfile(p), store: "file" } : null;
}
