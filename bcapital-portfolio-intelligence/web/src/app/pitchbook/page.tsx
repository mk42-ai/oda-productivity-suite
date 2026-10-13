import type { Metadata } from "next";
import { PitchbookSidebar } from "@/components/pitchbook/pitchbook-sidebar";
import { getPitchbookStoreIndex, getPitchbookStoreProfile } from "@/lib/pitchbook-store";

export const metadata: Metadata = { title: "PitchBook — batch store", description: "Queryable PitchBook profiles for every portfolio company, from the batch pull." };
export const dynamic = "force-dynamic";

export default async function PitchbookPage({ searchParams }: { searchParams: Promise<{ slug?: string | string[] }> }) {
  const sp = await searchParams;
  const requested = Array.isArray(sp.slug) ? sp.slug[0] : sp.slug;
  const { batch, companies, source } = await getPitchbookStoreIndex();
  const initialSlug = (requested && companies.some((c) => c.slug === requested) ? requested : null) ?? companies.find((c) => c.state === "populated")?.slug ?? companies[0]?.slug ?? null;
  const initialDetail = initialSlug ? await getPitchbookStoreProfile(initialSlug) : null;
  const fallbackDetail = initialSlug && !initialDetail ? (() => { const r = companies.find((c) => c.slug === initialSlug)!; return { slug: r.slug, name: r.name, state: r.state, pb_id: r.pb_id, batch_id: r.batch_id, query_id: r.query_id, fetched_at: r.fetched_at, profile: null }; })() : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6" data-testid="pb-page" data-source={source}>
      <header className="mb-4">
        <h1 className="text-xl font-semibold" style={{ color: "#16181b" }}>PitchBook</h1>
        <p className="text-sm" style={{ color: "#5c6168" }}>Batch pull across {companies.length} portfolio companies · every field carries its provenance or reads “Not available in PitchBook”.</p>
      </header>
      <PitchbookSidebar companies={companies} batch={batch} initialSlug={initialSlug} initialDetail={initialDetail ?? fallbackDetail} />
    </main>
  );
}
