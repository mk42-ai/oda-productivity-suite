/** Read model for the PitchBook batch store (pitchbook_batch_runs / pitchbook_batch_queries / pitchbook_company_profiles in the durable libSQL DB). */
import fs from "node:fs";
import path from "node:path";
import { store } from "./persist/store.js";

type Co = { slug: string; name: string; sector: string; sector_label: string; domain: string | null; website: string | null };
let coCache: { m: number; rows: Co[] } | null = null;
function portfolioCompanies(): Co[] {
  const f = path.join(process.cwd(), "data", "portfolio.json"); const m = fs.statSync(f).mtimeMs;
  if (!coCache || coCache.m !== m) { const d = JSON.parse(fs.readFileSync(f, "utf8")); coCache = { m, rows: (d.companies as any[]).map((c) => ({ slug: c.slug, name: c.name, sector: c.sector, sector_label: c.sector_label, domain: c.domain ?? null, website: c.website ?? null })) }; }
  return coCache.rows;
}
export async function latestBatch() {
  const c = await store();
  const r = await c.execute("select batch_id,status,method,endpoint_id,plugin_id,submitted_at,completed_at,total,succeeded,failed,retried,unmatched,notes_json from pitchbook_batch_runs order by submitted_at desc limit 1");
  if (!r.rows.length) return null; const row = Object.fromEntries(r.columns.map((k, i) => [k, r.rows[0][i]])) as any;
  return { ...row, notes: row.notes_json ? JSON.parse(String(row.notes_json)) : null };
}
export async function storeIndex() {
  const c = await store(); const batch = await latestBatch();
  const r = await c.execute("select slug,pb_id,state,batch_id,query_id,fetched_at,fields_populated,fields_unavailable from pitchbook_company_profiles");
  const by = new Map(r.rows.map((row) => [String(row[0]), Object.fromEntries(r.columns.map((k, i) => [k, row[i]]))]));
  const companies = portfolioCompanies().map((co) => { const p = by.get(co.slug) as any; return { slug: co.slug, name: co.name, sector: co.sector, sector_label: co.sector_label, pb_id: p?.pb_id ?? null, state: p ? String(p.state) : "pending", fetched_at: p?.fetched_at ?? null, batch_id: p?.batch_id ?? null, query_id: p?.query_id ?? null, fields_populated: Number(p?.fields_populated ?? 0), fields_unavailable: Number(p?.fields_unavailable ?? 0) }; });
  const counts = { populated: companies.filter((x) => x.state === "populated").length, unmatched: companies.filter((x) => x.state === "Unmatched in PitchBook").length, pending: companies.filter((x) => x.state === "pending").length, fields_populated: companies.reduce((n, x) => n + x.fields_populated, 0), fields_unavailable: companies.reduce((n, x) => n + x.fields_unavailable, 0) };
  return { batch, counts, companies };
}
export async function storeDetail(slug: string) {
  const c = await store(); const co = portfolioCompanies().find((x) => x.slug === slug); if (!co) return null;
  const r = await c.execute({ sql: "select slug,pb_id,state,batch_id,query_id,fetched_at,profile_json,fields_populated,fields_unavailable from pitchbook_company_profiles where slug=?", args: [slug] });
  if (!r.rows.length) return { slug, name: co.name, state: "pending", pb_id: null, batch_id: null, query_id: null, fetched_at: null, profile: null, lookup: null };
  const row = Object.fromEntries(r.columns.map((k, i) => [k, r.rows[0][i]])) as any; const profile = JSON.parse(String(row.profile_json));
  const q = await c.execute({ sql: "select query_id,lookup,status,attempt,session_id,message_id,submitted_at,completed_at,http_status,error from pitchbook_batch_queries where slug=? order by submitted_at", args: [slug] });
  return { slug, name: co.name, state: String(row.state), pb_id: row.pb_id ?? null, batch_id: row.batch_id, query_id: row.query_id, fetched_at: row.fetched_at, fields_populated: Number(row.fields_populated ?? 0), fields_unavailable: Number(row.fields_unavailable ?? 0), profile: row.state === "populated" || profile?.state === "unmatched" ? profile : profile, queries: q.rows.map((qr) => Object.fromEntries(q.columns.map((k, i) => [k, qr[i]]))) };
}
export async function storeQueries(batchId?: string) {
  const c = await store(); const b = batchId ?? (await latestBatch())?.batch_id; if (!b) return { batch_id: null, queries: [] };
  const q = await c.execute({ sql: "select query_id,slug,pb_id,lookup,status,attempt,session_id,message_id,submitted_at,completed_at,http_status,error,answer_chars from pitchbook_batch_queries where batch_id=? order by submitted_at", args: [b] });
  return { batch_id: b, queries: q.rows.map((qr) => Object.fromEntries(q.columns.map((k, i) => [k, qr[i]]))) };
}
