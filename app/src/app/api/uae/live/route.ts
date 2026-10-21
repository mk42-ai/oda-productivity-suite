import { liveSnapshot } from "@/lib/uae/live";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** GET /api/uae/live — latest scheduled-workflow increments for uae_cc_v1 (OnDemand Agents Flow Builder execution store), with provenance. */
export async function GET() {
  const snap = await liveSnapshot();
  return Response.json(snap, { status: snap.ok ? 200 : 502, headers: { "cache-control": "no-store" } });
}
