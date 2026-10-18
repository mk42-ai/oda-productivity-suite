import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Paged, filterable evidence for the /reputation batch (12k+ rows from scripts/batch-correlation.ts → web/data/reputation-items.json).
 * The rows never ship in a client bundle: the virtualized list fetches windows of ≤ 500 rows from here.
 *   GET /api/reputation/evidence?entity=<id|all>&category=<cat|all>&q=<text>&offset=0&limit=200
 *   → { total, offset, rows: [[id, entityIdx, category, headline, url, source, date, sentiment, weight], …], counts: { entity: {...}, category: {...} } }
 */
type Data = { columns: string[]; entities: string[]; rows: [string, number, string, string, string, string, string, number, number][] };
let cache: Data | null = null;
function load(): Data {
  if (cache) return cache;
  const p = [path.join(process.cwd(), 'data/reputation-items.json'), path.join(process.cwd(), 'web/data/reputation-items.json')].find((x) => fs.existsSync(x));
  cache = p ? (JSON.parse(fs.readFileSync(p, 'utf8')) as Data) : { columns: [], entities: [], rows: [] };
  return cache;
}

export async function GET(req: NextRequest) {
  const d = load();
  const sp = req.nextUrl.searchParams;
  const entity = sp.get('entity') ?? 'all';
  const category = sp.get('category') ?? 'all';
  const q = (sp.get('q') ?? '').trim().toLowerCase().slice(0, 100);
  const offset = Math.max(0, Number(sp.get('offset') ?? 0) || 0);
  const limit = Math.min(500, Math.max(1, Number(sp.get('limit') ?? 200) || 200));
  const ei = entity === 'all' ? -1 : d.entities.indexOf(entity);
  const matchQ = (r: Data['rows'][number]) => !q || r[3].toLowerCase().includes(q) || r[5].toLowerCase().includes(q);
  // counts are computed for the OTHER filter (entity counts honour the category filter and vice versa) so the chips show what a click yields
  const entityCounts: Record<string, number> = { all: 0 };
  const categoryCounts: Record<string, number> = { all: 0 };
  const filtered: Data['rows'] = [];
  for (const r of d.rows) {
    if (!matchQ(r)) continue;
    const eOk = ei < 0 || r[1] === ei;
    const cOk = category === 'all' || r[2] === category;
    if (cOk) { entityCounts.all++; const k = d.entities[r[1]] ?? '?'; entityCounts[k] = (entityCounts[k] ?? 0) + 1; }
    if (eOk) { categoryCounts.all++; categoryCounts[r[2]] = (categoryCounts[r[2]] ?? 0) + 1; }
    if (eOk && cOk) filtered.push(r);
  }
  return Response.json({ total: filtered.length, offset, limit, rows: filtered.slice(offset, offset + limit), counts: { entity: entityCounts, category: categoryCounts } }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
