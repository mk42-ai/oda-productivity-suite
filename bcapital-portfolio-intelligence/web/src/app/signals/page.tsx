import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { getSignals, listCompanies } from "@/lib/api";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Signals", description: "Evidence-weighted Portfolio Signal Scores for every B Capital portfolio company: score, percentile, sector and confidence, backed by the live /signals feed.", openGraph: { title: "Signals", description: "Evidence-weighted Portfolio Signal Scores for every B Capital portfolio company: score, percentile, sector and confidence, backed by the live /signals feed." }, twitter: { title: "Signals", description: "Evidence-weighted Portfolio Signal Scores for every B Capital portfolio company: score, percentile, sector and confidence, backed by the live /signals feed." }, alternates: { canonical: "/signals" } };
export const revalidate = 120;

export default async function SignalsPage() {
  const [sig, cs] = await Promise.all([getSignals(), listCompanies()]);
  const nameBy = new Map((cs.data ?? []).map((c) => [c.slug, c.name]));
  const rows = [...(sig.data?.data ?? [])].filter((r) => r && typeof r.slug === "string").sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  const mean = Number(sig.data?.portfolio?.mean);
  return (
    <>
      <PageHeader title="Signals" lede={rows.length ? `${rows.length} companies scored · portfolio mean ${Number.isFinite(mean) ? Math.round(mean) : "—"} / 100` : "Signal Score offline — history builds daily"} sources={[{ name: "signals", source: sig.source }]} fetchedAt={cs.fetched_at} />
      <Card elevate>
        <CardHeader><CardTitle>Portfolio Signal Scores</CardTitle><CardDescription>Evidence-weighted Signal Score (0–100). Click a company to open its full profile. Data: backend <code>GET /signals</code>.</CardDescription></CardHeader>
        <CardContent>
          {rows.length ? (
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm" data-testid="signals-table"><caption className="sr-only">Portfolio Signal Scores by company</caption><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted"><th className="py-2 pr-3 font-medium">Company</th><th className="py-2 pr-3 font-medium">Sector</th><th className="py-2 pr-3 font-medium">Score</th><th className="py-2 pr-3 font-medium">Percentile</th><th className="py-2 font-medium">Label</th></tr></thead>
            <tbody>{rows.map((r) => (<tr key={r.slug} className="border-b border-border last:border-b-0"><td className="py-2 pr-3"><Link href={`/company/${r.slug}`} className="font-medium underline-offset-2 hover:underline">{nameBy.get(r.slug) ?? r.slug}</Link></td><td className="py-2 pr-3 text-muted">{r.sector}</td><td className="py-2 pr-3 tabular-nums">{Number.isFinite(Number(r.score)) ? Math.round(Number(r.score)) : "—"}</td><td className="py-2 pr-3 tabular-nums">{r.percentile}</td><td className="py-2 text-muted">{r.label}</td></tr>))}</tbody></table></div>
          ) : (<EmptyState illustration="error" compact title="Signal Score unavailable right now" body="The backend is offline and no snapshot exists yet. Sentiment is still shown on Overview." action={<Link href="/overview" className="underline underline-offset-2 text-sm">Open Overview</Link>} />)}
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted">Prefer the visual view? The same scores power the sector bullets and treemap on <Link href="/overview" className="underline underline-offset-2">Overview</Link>.</p>
    </>
  );
}
