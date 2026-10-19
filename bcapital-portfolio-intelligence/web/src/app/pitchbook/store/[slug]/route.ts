import { NextResponse } from "next/server";
import { getPitchbookStoreProfile } from "@/lib/pitchbook-store";

export const dynamic = "force-dynamic";

/** Same-origin proxy so client components (company card) can read the batch store without a public API URL. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const detail = await getPitchbookStoreProfile(slug);
  if (!detail) return NextResponse.json({ slug, name: slug, state: "pending", pb_id: null, batch_id: null, query_id: null, fetched_at: null, profile: null }, { status: 404 });
  return NextResponse.json(detail);
}
