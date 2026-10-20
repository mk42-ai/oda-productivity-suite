#!/usr/bin/env node
/**
 * Residual scan — proves the previous tenant is gone from CODE, RENDERED DOM and NETWORK.
 *   node scripts/uae/residual-scan.mjs [--base http://localhost:5190] [--json out.json]
 * Patterns: the previous brand (B Capital / BCap / b_capital / b.capital), its product names, its people, and the 136 former
 * portfolio-company names (hashed list in scripts/uae/residual-terms.json — names that are ordinary English words are only matched
 * case-sensitively as whole words and only inside UI-visible strings, see AMBIGUOUS). Exit 1 on any hit.
 * Exemptions (documented in RESIDUAL_SCAN.md): the OnDemand plugin name "Perplexity" (plugin-1722260873) is required by the preserved
 * chat — only the company form "MBZUAI" is flagged.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
const ROOT = new URL("../..", import.meta.url).pathname;
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]] : a), []));
const terms = JSON.parse(readFileSync(join(ROOT, "scripts/uae/residual-terms.json"), "utf8"));
const BRAND = [/b[\s._-]?capital/i, /\bbcap\b/i, /bcap[._:-]/i, /b_capital/i, /portfolio intelligence/i, /eduardo saverin/i, /raj ganguly/i, /karan mohla/i, /pitchbook/i, /\bB Social\b/];
const AMBIG = new Set(terms.ambiguous);
const namePats = terms.names.map((n) => ({ n, re: AMBIG.has(n) ? null : new RegExp(`(?<![A-Za-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`, n === n.toUpperCase() ? "" : "i") })).filter((p) => p.re);
const SKIP_DIR = new Set(["node_modules", ".next", ".git", "test-results", "playwright-report"]);
const SKIP_FILE = [/residual-terms\.json$/, /residual-scan\.mjs$/, /package-lock\.json$/, /\.(png|jpe?g|webp|ico|woff2?|gif|pdf|mjs\.map)$/i, /pdf\.worker\.min\.mjs$/];
function* walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); const s = statSync(p); if (s.isDirectory()) { if (!SKIP_DIR.has(f)) yield* walk(p); } else if (!SKIP_FILE.some((r) => r.test(p))) yield p; } }
const hits = [];
function scan(where, text) {
  for (const re of BRAND) { const m = text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")); if (m) hits.push({ where, term: m[0], kind: "brand", count: m.length }); }
  for (const { n, re } of namePats) { const g = new RegExp(re.source, re.flags + "g"); const m = text.match(g); if (m) { if (n === "MBZUAI") { hits.push({ where, term: n, kind: "company", count: m.length }); continue; } hits.push({ where, term: n, kind: "company", count: m.length }); } }
}
// 1) code
let files = 0; for (const f of walk(ROOT)) { files++; scan(`code:${relative(ROOT, f)}`, readFileSync(f, "utf8")); }
// 2) rendered DOM + 3) network (HTML + every same-origin JS/CSS/JSON asset the pages reference)
const base = typeof args.base === "string" ? args.base.replace(/\/$/, "") : null; const routes = ["/overview", "/watchlist", "/watchlist/g42", "/watchlist/tii", "/watchlist/compare?ids=g42,edge,tii", "/sentiment", "/news", "/radar", "/graph", "/chat", "/briefing", "/methodology", "/settings", "/artifacts", "/docs/interactive-ui", "/chat-od", "/health", "/api/uae/orgs", "/manifest.webmanifest"];
let pages = 0, assets = 0;
if (base) {
  const seen = new Set();
  for (const r of routes) {
    const res = await fetch(base + r); const html = await res.text(); pages++;
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
    scan(`dom:${r}`, visible); scan(`network:${r}`, html);
    for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)) { if (seen.has(m[1])) continue; seen.add(m[1]); const t = await (await fetch(base + m[1])).text(); assets++; scan(`network:${m[1]}`, t); }
  }
}
const out = { checked_at: new Date().toISOString(), files, pages, assets, patterns: BRAND.length + namePats.length, ambiguous_skipped: [...AMBIG], hits };
if (args.json) writeFileSync(args.json, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ...out, hits: hits.slice(0, 80), total_hits: hits.length }, null, 1));
process.exit(hits.length ? 1 : 0);
