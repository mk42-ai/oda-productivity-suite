import { NextRequest } from 'next/server';
import { buildGraphPayload } from '@/lib/reputation/corpus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Interactive-graph dataset for /reputation — the 2026-10-18 evidence corpus (web/data/reputation/graph.json + evidence.json, adapted by
 * lib/reputation/corpus.ts to the engine's CoNode / CoEdge shape): the four BCAP registers, publisher / portfolio-company / social / podcast
 * nodes, the engine's co-occurrence edges with their WHY CONNECTED trails, and the evidence rows those trails reference. Served here so the
 * payload never ships in a client bundle (the canvas lazy-loads it after first paint behind a skeleton); `?slim=1` drops the evidence map.
 * Next's compression layer strips `accept-encoding` before a route handler sees it; every browser accepts gzip, so the pre-compressed buffer
 * (≈1.5 MB instead of ≈12 MB) is the default and `?raw=1` opts out for tools.
 */
export async function GET(req: NextRequest) {
  const d = buildGraphPayload();
  if (!d) return Response.json({ error: 'graph dataset missing (web/data/reputation/graph.json)' }, { status: 503 });
  const slim = req.nextUrl.searchParams.get('slim') === '1';
  const ae = req.headers.get('accept-encoding');
  const gzip = req.nextUrl.searchParams.get('raw') !== '1' && (ae === null || /\bgzip\b/i.test(ae));
  const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', Vary: 'Accept-Encoding' };
  if (gzip) { const buf = slim ? d.slimGz : d.gz; headers['Content-Encoding'] = 'gzip'; headers['Content-Length'] = String(buf.byteLength); return new Response(new Uint8Array(buf), { status: 200, headers }); }
  return new Response(slim ? d.slim : d.json, { status: 200, headers });
}
