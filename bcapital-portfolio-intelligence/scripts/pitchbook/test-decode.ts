// Run: npx tsx scripts/pitchbook/test-decode.ts
// Parses the 8 sample getCompanyProfile outputs + probe-query.json and asserts the Meesho decode.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { parseCompanyProfile, coverage, deriveFromUnavailable, NOT_AVAILABLE, UNMATCHED } from "../../src/pitchbook/decode.js";
import { CODES, decodeCode, industryParent } from "../../src/pitchbook/codes.js";

const DIR = process.env.PBIN ?? "/tmp/wt10/pbin";
const samples = ["08", "09", "10", "11", "12", "16", "17", "18"].map((n) => `${n}-getCompanyProfile.json`);
const meta = (slug: string) => ({ slug, batchId: "test-batch", queryId: `q-${slug}`, fetchedAt: new Date().toISOString() });

// --- codes sanity ---
assert.equal(CODES.INDUSTRY["6050"], "Software");
assert.equal(CODES.INDUSTRY["605010"], "Application Software");
assert.equal(industryParent("605010"), "6050");
assert.equal(Object.keys(CODES.DEAL_TYPE).length, 246);
assert.equal(Object.keys(CODES.COUNTRY).length, 231);
assert.equal(decodeCode("INVESTOR_TYPE", "CVC"), "Corporate Venture Capital");
assert.equal(decodeCode("INVESTOR_STATUS", "WO"), "Former Investor");
const w: string[] = [];
assert.equal(decodeCode("DEAL_TYPE", "ZZZ_NOPE", w), "ZZZ_NOPE");
assert.equal(w.length, 1);
console.log("codes: ok");

// --- samples ---
for (const f of samples) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const p = parseCompanyProfile(raw, meta(f.slice(0, 2)));
  const c = coverage(p);
  console.log(
    `${f}: ${p.companyId} ${p.name} state=${p.state} populated=${c.populated} unavailable=${c.unavailable} unmatched=${c.unmatched} warnings=${p.warnings.length}`,
  );
  assert.equal(p.state, "matched");
  assert.equal(p.financialsMostRecent, NOT_AVAILABLE);
}

// --- probe-query answer string (LLM wrapper) ---
const probe = JSON.parse(fs.readFileSync(path.join(DIR, "probe-query.json"), "utf8"));
const answer: string = probe.data.answer;
const pp = parseCompanyProfile(answer, meta("probe"));
const pc = coverage(pp);
console.log(`probe-query.json (answer string, ${answer.length} chars): ${pp.companyId} ${pp.name} state=${pp.state} populated=${pc.populated} unavailable=${pc.unavailable} unmatched=${pc.unmatched}`);
// Also via the envelope object and via fenced string.
assert.equal(parseCompanyProfile(probe, meta("probe-env")).companyId, pp.companyId);
assert.equal(parseCompanyProfile("Here you go:\n```json\n" + answer + "\n```\nDone.", meta("probe-fence")).companyId, pp.companyId);

// --- Meesho assertions (08 = 158661-28) ---
const meesho = parseCompanyProfile(JSON.parse(fs.readFileSync(path.join(DIR, "08-getCompanyProfile.json"), "utf8")), meta("meesho"));
assert.equal(meesho.companyId, "158661-28");
assert.notEqual(typeof meesho.summary, "string");
const summ = meesho.summary as Exclude<typeof meesho.summary, string>;
assert.notEqual(typeof summ.ownershipStatus, "string");
assert.equal((summ.ownershipStatus as { value: string }).value, "Publicly Held");
assert.notEqual(typeof meesho.deals, "string");
const deals = (meesho.deals as { value: { dealTypes: string[]; dealType1: { code: string; description: string } | null }[] }).value;
assert.equal(deals.length, 14);
for (const d of deals) {
  assert.ok(d.dealType1 && d.dealType1.code && d.dealType1.description, "deal has decoded dealType1");
  assert.ok(d.dealTypes.length >= 1);
}
assert.equal(meesho.unavailable.length, 2);
assert.deepEqual(meesho.unavailable.map((u) => u.section).sort(), ["financials", "mostRecentFinancials"]);
assert.equal(meesho.financialsMostRecent, NOT_AVAILABLE);
const derived = deriveFromUnavailable(meesho.unavailable, meesho.provenance);
assert.equal(derived.financialsMostRecent.state, NOT_AVAILABLE);
assert.ok(derived.financialsMostRecent.provenance.note?.includes("404"));
assert.ok(coverage(meesho).unavailableNotes.financialsMostRecent.includes("404"));
console.log("meesho: ownershipStatus=Publicly Held, 14 deals decoded, 2 unavailable → financialsMostRecent NOT_AVAILABLE ✓");
console.log("meesho deal types:", deals.slice(0, 5).map((d) => d.dealTypes.join("/")).join(", "), "…");

// --- unmatched ---
const um = parseCompanyProfile('{"found":false,"name":"Nobody Inc"}', meta("nobody"));
assert.equal(um.state, "unmatched");
assert.equal(um.summary, UNMATCHED);
assert.equal(coverage(um).unmatched > 0, true);
const bad = parseCompanyProfile("I could not find that company.", meta("bad"));
assert.equal(bad.state, "unmatched");
console.log("unmatched: ok");
console.log("ALL OK");
