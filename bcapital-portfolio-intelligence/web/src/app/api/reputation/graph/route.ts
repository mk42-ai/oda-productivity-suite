import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Interactive-graph dataset for /reputation (scripts/build-reputation-graph.ts → web/data/reputation-graph.json): the four subject
 * registers, publisher / account / company nodes, the ported engine's co-occurrence edges (WHY CONNECTED trails included) and the
 * evidence rows the trails reference. Served here so the ~3.5 MB payload never ships in a client bundle; `?slim=1` drops the
 * evidence map (the panel fetches rows lazily through /api/reputation/evidence).
 */
let cache: { raw: string; slim: string; mtime: number } | null = null;
function load() {
  const p = [path.join(process.cwd(), 'data/reputation-graph.json'), path.join(process.cwd(), 'web/data/reputation-graph.json')].find((x) => fs.existsSync(x));
  if (!p) return null;
  const mtime = fs.statSync(p).mtimeMs;
  if (cache && cache.mtime === mtime) return cache;
  const raw = fs.readFileSync(p, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const { evidence: _e, ...rest } = parsed;
  void _e;
  cache = { raw, slim: JSON.stringify(rest), mtime };
  return cache;
}

export async function GET(req: NextRequest) {
  const d = load();
  if (!d) return Response.json({ error: 'graph dataset not built (run scripts/build-reputation-graph.ts)' }, { status: 503 });
  const slim = req.nextUrl.searchParams.get('slim') === '1';
  return new Response(slim ? d.slim : d.raw, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } });
}
