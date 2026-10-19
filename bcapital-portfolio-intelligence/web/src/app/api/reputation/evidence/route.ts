import { NextRequest } from 'next/server';
import { REGISTER_IDS, SECTOR_IDS, categoryOf, itemAgeDays, loadCorpusGraph, loadEvidence, type EvidenceItem } from '@/lib/reputation/corpus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Paged, filterable evidence for /reputation — served from the merged 2026-10-19 corpus (web/data/reputation/evidence.json). The rows
 * never ship in a client bundle: the virtualized list fetches windows of ≤ 500 rows from here.
 *   GET /api/reputation/evidence?entity=<BCAP-00n|portfolio-only|all>&category=<name|all>&sector=<sector|all>&q=<text>&maxAge=<days|all>&offset=0&limit=200
 *   → { total, offset, limit, rows: [[id, entityIdx, category, title, url, publisher, publishedAt, registersMask, matchBasis, platformGlyph], …],
 *       counts: { entity: {...}, category: {...}, sector: {...} }, entities: REGISTER_IDS, sectors: SECTOR_IDS, source, nowIso }
 * `entity=portfolio-only` = rows with registers [] (portfolio social posts that never name a subject — in the corpus, never on a subject chip).
 * `entityIdx` = index of the item's FIRST register in REGISTER_IDS; `registersMask` = bitmask over REGISTER_IDS (an item may carry several).
 * `maxAge` mirrors the graph's MAX AGE slider (age of published_at relative to the graph's now_iso; 'all' / ≥120 = no filter).
 */
type Row = [string, number, string, string, string, string, string, number, string, string];
function toRow(it: EvidenceItem): Row {
  let mask = 0;
  for (const r of it.registers) { const i = REGISTER_IDS.indexOf(r); if (i >= 0) mask |= 1 << i; }
  return [it.id, Math.max(0, REGISTER_IDS.indexOf(it.registers[0] ?? 'BCAP-001')), categoryOf(it), it.title, it.canonical_url, it.publisher, it.published_at, mask, it.match_basis, it.platform_glyph];
}

export async function GET(req: NextRequest) {
  const { items } = loadEvidence();
  const nowIso = loadCorpusGraph()?.now_iso ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const sp = req.nextUrl.searchParams;
  const entity = sp.get('entity') ?? 'all';
  const category = sp.get('category') ?? 'all';
  const sector = sp.get('sector') ?? 'all';
  const q = (sp.get('q') ?? '').trim().toLowerCase().slice(0, 100);
  const maxAgeRaw = sp.get('maxAge') ?? 'all';
  const maxAge = maxAgeRaw === 'all' ? null : Math.max(1, Number(maxAgeRaw) || 0) || null;
  const offset = Math.max(0, Number(sp.get('offset') ?? 0) || 0);
  const limit = Math.min(500, Math.max(1, Number(sp.get('limit') ?? 200) || 200));
  const ei = entity === 'all' || entity === 'portfolio-only' ? -1 : REGISTER_IDS.indexOf(entity as (typeof REGISTER_IDS)[number]);
  const portfolioOnly = entity === 'portfolio-only';
  const matchQ = (it: EvidenceItem) => !q || it.title.toLowerCase().includes(q) || it.publisher.toLowerCase().includes(q) || (it.snippet ?? '').toLowerCase().includes(q);
  const matchAge = (it: EvidenceItem) => maxAge === null || maxAge >= 120 || itemAgeDays(it, nowMs) <= maxAge;
  // counts are computed for the OTHER filter (register counts honour the category filter and vice versa) so the chips show what a click yields
  const entityCounts: Record<string, number> = { all: 0, 'portfolio-only': 0 };
  const categoryCounts: Record<string, number> = { all: 0 };
  const sectorCounts: Record<string, number> = { all: 0 };
  const filtered: Row[] = [];
  for (const it of items) {
    if (!matchQ(it) || !matchAge(it)) continue;
    const cat = categoryOf(it);
    const secs = it.sectors ?? [];
    const eOk = portfolioOnly ? it.registers.length === 0 : ei < 0 || it.registers.includes(REGISTER_IDS[ei]);
    const cOk = category === 'all' || cat === category;
    const sOk = sector === 'all' || secs.includes(sector);
    if (cOk && sOk) { entityCounts.all++; if (!it.registers.length) entityCounts['portfolio-only']++; for (const r of it.registers) entityCounts[r] = (entityCounts[r] ?? 0) + 1; }
    if (eOk && sOk) { categoryCounts.all++; categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1; }
    if (eOk && cOk) { sectorCounts.all++; for (const sc of secs) sectorCounts[sc] = (sectorCounts[sc] ?? 0) + 1; }
    if (eOk && cOk && sOk) filtered.push(toRow(it));
  }
  return Response.json({ total: filtered.length, offset, limit, rows: filtered.slice(offset, offset + limit), counts: { entity: entityCounts, category: categoryCounts, sector: sectorCounts }, entities: REGISTER_IDS, sectors: SECTOR_IDS, source: 'web/data/reputation/evidence.json', nowIso });
}
