/**
 * PitchBook profile store on the durable libSQL DB (tables pitchbook_profiles / pitchbook_sync_runs, migration 0001).
 * Written by the monthly workflow via POST /pitchbook/sync/webhook, seeded once from data/pitchbook/profiles.json, read server-side by the
 * company section. Both tables are in PERSIST_TABLES, so the OnDemand Media snapshot/restore carries them automatically.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { store, upsert, scheduleBackup } from "./store.js";
import type { PbProfile, PbField } from "../pitchbook-profile-schema.js";
import { PB_PROFILE_FIELDS } from "../pitchbook-profile-schema.js";
import { computeAvailability, emptyStateCount, fieldsPopulated } from "../pitchbook-availability.js";

export type SyncRun = { run_id: string; started_at: string; finished_at: string | null; trigger: string; companies_refreshed: number; fields_populated: number; empty_state_count: number; errors: string[]; detail?: Record<string, unknown> | null };
export type IncomingRecord = { slug: string; name?: string; fields?: Record<string, { value: unknown; source?: string; url?: string | null; synced_at?: string } | null>; source_url?: string | null; fetched_at?: string; availability?: Record<string, string> };

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const FILE = () => path.join(process.cwd(), "data", "pitchbook", "profiles.json");
let seeded: Promise<void> | null = null;

export async function readAllProfiles(): Promise<Record<string, PbProfile>> {
  const c = await store(); const out: Record<string, PbProfile> = {};
  const r = await c.execute("select company_id, profile_json from pitchbook_profiles");
  for (const row of r.rows) { try { out[String(row[0])] = JSON.parse(String(row[1])) as PbProfile; } catch { /* skip corrupt row */ } }
  return out;
}
export async function readProfile(slug: string): Promise<PbProfile | null> {
  const c = await store(); const r = await c.execute({ sql: "select profile_json from pitchbook_profiles where company_id = ?", args: [slug] });
  if (!r.rows.length) return null; try { return JSON.parse(String(r.rows[0][0])) as PbProfile; } catch { return null; }
}
export async function profileCount(): Promise<number> {
  const c = await store(); const r = await c.execute("select count(*) as n from pitchbook_profiles"); return Number(r.rows[0]?.[0] ?? 0);
}
export async function upsertProfiles(profiles: Record<string, PbProfile>, fetched_at = nowIso()): Promise<number> {
  const c = await store(); const ts = nowIso();
  const rows = Object.values(profiles).map((p) => ({
    company_id: p.slug, name: p.name, profile_json: JSON.stringify(p), availability_json: JSON.stringify(computeAvailability(p)),
    source_url: p.pitchbook_profile_url?.value ?? null, fetched_at: p.synced_at || fetched_at, updated_at: ts,
  }));
  return upsert(c, "pitchbook_profiles", rows);
}
/** Seed the table from data/pitchbook/profiles.json when it is empty (first boot of a fresh instance). Never throws. */
export function ensurePitchbookStoreSeeded(): Promise<void> {
  if (!seeded) seeded = (async () => {
    try {
      if ((await profileCount()) > 0) return;
      const f = FILE(); if (!fs.existsSync(f)) return;
      const j = JSON.parse(fs.readFileSync(f, "utf8")) as { synced_at?: string; companies: Record<string, PbProfile> };
      const profiles = Object.fromEntries(Object.entries(j.companies).map(([k, p]) => [k, normaliseProfile(p)]));
      const n = await upsertProfiles(profiles, j.synced_at);
      await appendRun({ run_id: `seed-${Date.now().toString(36)}`, started_at: nowIso(), finished_at: nowIso(), trigger: "boot-seed", companies_refreshed: n, fields_populated: fieldsPopulated(profiles), empty_state_count: emptyStateCount(profiles), errors: [], detail: { source: "data/pitchbook/profiles.json" } });
      console.log(JSON.stringify({ msg: "pitchbook.store.seeded", companies: n }));
    } catch (e) { console.error(JSON.stringify({ msg: "pitchbook.store.seed.failed", error: (e as Error).message })); seeded = null; }
  })();
  return seeded;
}
/** Older profiles (18 fields) get the two newer fields as explicit nulls. */
export function normaliseProfile(p: PbProfile): PbProfile {
  const q = { ...p } as PbProfile;
  for (const k of PB_PROFILE_FIELDS) if (!(k in q)) (q as any)[k] = null;
  if (!Array.isArray(q.research_documents)) q.research_documents = [];
  return q;
}
/** Merge an incoming workflow record into the stored profile: a field is replaced only by a sourced, non-empty value; never by null (no data loss). */
export function mergeIncoming(existing: PbProfile | null, rec: IncomingRecord, name: string): PbProfile {
  const base: PbProfile = existing ? normaliseProfile(existing) : normaliseProfile({ slug: rec.slug, name, research_documents: [], synced_at: nowIso(), next_sync_utc: "1st of each month 06:00 UTC", sources: [] } as unknown as PbProfile);
  const fetched = rec.fetched_at || nowIso();
  for (const [k, f] of Object.entries(rec.fields ?? {})) {
    if (!(PB_PROFILE_FIELDS as readonly string[]).includes(k)) continue;
    if (!f || f.value === null || f.value === undefined || f.value === "" || (Array.isArray(f.value) && !f.value.length)) continue;
    const field: PbField<unknown> = { value: f.value, provenance: { source: f.source || "PitchBook (monthly sync)", url: f.url ?? rec.source_url ?? null, synced_at: f.synced_at || fetched, plugin_id: "plugin-1777018662" } };
    (base as any)[k] = field;
  }
  if (rec.source_url && !base.pitchbook_profile_url) base.pitchbook_profile_url = { value: rec.source_url, provenance: { source: "PitchBook public profile", url: rec.source_url, synced_at: fetched } };
  base.synced_at = fetched; base.next_sync_utc = "1st of each month 06:00 UTC";
  base.sources = Array.from(new Set([...(base.sources ?? []), ...PB_PROFILE_FIELDS.map((k) => (base as any)[k]?.provenance?.source).filter(Boolean)]));
  return base;
}
export const SUPERSEDED_WEEKLY_WORKFLOW_ID = "6aca3d3faeef8927baa25a05";
export async function applySync(records: IncomingRecord[], trigger: string, names: Record<string, string>, extra: Record<string, unknown> = {}): Promise<SyncRun> {
  const started = nowIso(); const run_id = `pbsync-${started.replace(/[-:]/g, "").replace("T", "-").slice(0, 15)}-${crypto.randomBytes(2).toString("hex")}`;
  const errors: string[] = []; const merged: Record<string, PbProfile> = {};
  for (const rec of records) {
    try { if (!rec?.slug || !names[rec.slug]) { errors.push(`unknown slug ${rec?.slug}`); continue; } merged[rec.slug] = mergeIncoming(await readProfile(rec.slug), rec, names[rec.slug]); }
    catch (e) { errors.push(`${rec?.slug}: ${(e as Error).message.slice(0, 120)}`); }
  }
  const n = Object.keys(merged).length ? await upsertProfiles(merged) : 0;
  const all = await readAllProfiles();
  const run: SyncRun = { run_id, started_at: started, finished_at: nowIso(), trigger, companies_refreshed: n, fields_populated: fieldsPopulated(all), empty_state_count: emptyStateCount(all), errors, detail: { records_received: records.length, companies_in_store: Object.keys(all).length, ...(trigger === "monthly-workflow" ? { superseded_weekly_workflow_id: SUPERSEDED_WEEKLY_WORKFLOW_ID, superseded_weekly_status: "deactivated" } : {}), ...extra } };
  await appendRun(run); scheduleBackup(`pitchbook-sync:${run_id}`);
  return run;
}
export async function appendRun(run: SyncRun) {
  const c = await store();
  await upsert(c, "pitchbook_sync_runs", [{ run_id: run.run_id, started_at: run.started_at, finished_at: run.finished_at, trigger: run.trigger, companies_refreshed: run.companies_refreshed, fields_populated: run.fields_populated, empty_state_count: run.empty_state_count, errors_json: JSON.stringify(run.errors), detail_json: run.detail ? JSON.stringify(run.detail) : null }]);
}
export async function listRuns(limit = 20): Promise<SyncRun[]> {
  const c = await store(); const r = await c.execute({ sql: "select run_id, started_at, finished_at, trigger, companies_refreshed, fields_populated, empty_state_count, errors_json, detail_json from pitchbook_sync_runs order by started_at desc limit ?", args: [limit] });
  return r.rows.map((row) => ({ run_id: String(row[0]), started_at: String(row[1]), finished_at: row[2] == null ? null : String(row[2]), trigger: String(row[3]), companies_refreshed: Number(row[4]), fields_populated: Number(row[5]), empty_state_count: Number(row[6]), errors: JSON.parse(String(row[7] ?? "[]")), detail: row[8] ? JSON.parse(String(row[8])) : null }));
}
