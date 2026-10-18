/**
 * Run the PitchBook batch pull for every portfolio company and persist it in the durable store.
 *   npx tsx scripts/pitchbook/run-batch.ts [--limit N] [--slugs a,b] [--only-missing]
 * Targets: data/portfolio.json companies; pbId from data/pitchbook/match-table.json (user-supplied ids + B Capital Group's
 * PitchBook portfolio list, investor 155248-48); companies without an id fall back to name + website domain lookup.
 */
import { runPitchbookBatch, buildTargets, type BatchTarget } from "../../src/pitchbook-batch.js";
import { store } from "../../src/persist/store.js";

const args = process.argv.slice(2); const arg = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
let targets: BatchTarget[] = buildTargets(); // deduped by pbId / normalised name (firm row excluded)
const only = arg("--slugs"); if (only) { const set = new Set(only.split(",")); targets = targets.filter((t) => set.has(t.slug)); }
if (args.includes("--only-missing")) { const c = await store(); const have = new Set((await c.execute("select slug from pitchbook_company_profiles where state='populated'")).rows.map((r) => String(r[0]))); targets = targets.filter((t) => !have.has(t.slug)); }
// --retry-unmatched: individual single-query retries for every item of the latest (or --batch-id) run that is not populated; attempts continue after the highest stored attempt.
let extend: { batchId: string; attemptOffset: number } | null = null;
if (args.includes("--retry-unmatched")) {
  const c = await store(); const bid = arg("--batch-id") ?? String((await c.execute("select batch_id from pitchbook_batch_runs order by submitted_at desc limit 1")).rows[0]?.[0] ?? "");
  if (!bid) throw new Error("no batch run to retry");
  const bad = new Set((await c.execute({ sql: "select slug from pitchbook_company_profiles where batch_id=? and state!='populated'", args: [bid] })).rows.map((r) => String(r[0])));
  const maxAttempt = Number((await c.execute({ sql: "select coalesce(max(attempt),0) from pitchbook_batch_queries where batch_id=?", args: [bid] })).rows[0][0]);
  targets = targets.filter((t) => bad.has(t.slug)); extend = { batchId: bid, attemptOffset: maxAttempt };
}
// --extend --batch-id X: fold the selected targets (e.g. --slugs) into an EXISTING run (same batch id, attempts continue after its highest attempt).
if (args.includes("--extend") && !extend) {
  const c = await store(); const bid = arg("--batch-id"); if (!bid) throw new Error("--extend needs --batch-id");
  const maxAttempt = Number((await c.execute({ sql: "select coalesce(max(attempt),0) from pitchbook_batch_queries where batch_id=?", args: [bid] })).rows[0][0]);
  extend = { batchId: bid, attemptOffset: maxAttempt };
}
const limit = Number(arg("--limit") || 0); if (limit) targets = targets.slice(0, limit);
const res = await runPitchbookBatch(targets, extend ? { batchId: extend.batchId, extendRun: true, attemptOffset: extend.attemptOffset, endpointId: arg("--endpoint") } : { batchId: arg("--batch-id"), endpointId: arg("--endpoint") });
console.log(JSON.stringify({ batch_id: res.batchId, submitted: res.submitted, completed: res.completed, total: res.total, succeeded: res.succeeded, failed: res.failed, retried: res.retried, unmatched: res.unmatched }));
process.exit(0);
