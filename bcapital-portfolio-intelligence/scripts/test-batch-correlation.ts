/**
 * test-batch-correlation.ts — asserts the evidence batch is complete and numerically clean.
 *   node node_modules/tsx/dist/cli.mjs scripts/test-batch-correlation.ts      (exit 1 on any failure)
 */
import { runBatch, canonicalUrl, normaliseDate, ENTITY_IDS } from "./batch-correlation";

let pass = 0; const fail: string[] = [];
const ok = (c: boolean, m: string) => (c ? pass++ : fail.push(m));
const { summary, kept, rejects, result } = await runBatch({ write: false });

ok(summary.counts.processed >= 3000, `processed >= 3000 (got ${summary.counts.processed})`);
ok(summary.counts.nanScores === 0, `zero NaN scores (got ${summary.counts.nanScores})`);
ok(summary.counts.ingested === summary.counts.processed + summary.counts.rejected + summary.counts.deduped, "ingested = processed + rejected + deduped");
ok(kept.every((x) => /^https:\/\//.test(x.source_url) && /^\d{4}-\d{2}-\d{2}/.test(x.published_date)), "every processed item has an https URL and a normalised date");
ok(kept.every((x) => x.id && x.entity && x.factor && x.category && Number.isFinite(x.sentiment) && Number.isFinite(x.weight) && x.retrieved_at), "every item carries {id, entity, factor, category, sentiment, weight, retrieved_at}");
ok(new Set(kept.map((x) => x.id)).size === kept.length, "item ids are unique");
ok(new Set(kept.map((x) => `${x.entity}|${x.source_url}|${x.headline.toLowerCase()}`)).size === kept.length, "no URL+headline duplicates survive");
ok(rejects.every((r) => typeof r.reason === "string" && r.reason.length > 0), "every reject carries a reason");
ok(rejects.some((r) => r.reason === "entity_mismatch" && /ksmhomes\.ca/.test(r.source_url ?? "")), "ksmhomes.ca logged as entity_mismatch");
ok(!kept.some((x) => /ksmhomes\.ca/.test(x.source_url)), "ksmhomes.ca never processed");
for (const e of ENTITY_IDS) ok((summary.byEntity[e] ?? 0) > 0, `entity ${e} has processed items`);
ok(summary.matrix4.weights.length === 4 && summary.matrix4.weights.every((r) => r.length === 4 && r.every(Number.isFinite)), "4×4 matrix is finite");
ok(summary.scores.every((s) => s.reputation.score >= 0 && s.reputation.score <= 100 && s.prestige.index >= 0 && s.prestige.index <= 100), "scores in 0–100");
ok((result.trailInvariantViolations ?? 0) === 0, "engine trail invariant holds");
ok(result.postsConsidered === kept.length, "engine considered every processed item");
ok(canonicalUrl("https://www.Forbes.com/a/b/?utm_source=x#c") === "https://forbes.com/a/b", "canonicalUrl strips www, tracking params, hash, trailing slash");
ok(normaliseDate("2022-07")?.iso === "2022-07-01" && normaliseDate("2020")?.precision === "year" && normaliseDate("") === null, "normaliseDate handles month/year/empty");

console.log(`batch-correlation: ${pass} passed, ${fail.length} failed · processed ${summary.counts.processed}, rejected ${summary.counts.rejected}, deduped ${summary.counts.deduped}, NaN ${summary.counts.nanScores}`);
if (fail.length) { for (const f of fail) console.error("FAIL:", f); process.exit(1); }
