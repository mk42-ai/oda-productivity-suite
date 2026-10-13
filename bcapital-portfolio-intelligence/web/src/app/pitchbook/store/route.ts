import { NextResponse } from "next/server";
import { getPitchbookStoreIndex } from "@/lib/pitchbook-store";

export const dynamic = "force-dynamic";

/** Same-origin index of the PitchBook batch store (all portfolio companies + latest batch), read server-side from the API / fallback file. */
export async function GET() {
  const { batch, companies, source } = await getPitchbookStoreIndex();
  return NextResponse.json({ batch, companies, source });
}
