import type { Metadata } from "next";
import Link from "next/link";
import { ORGS, SENTIMENT, NEWS, RADAR, HF, META, ECOSYSTEM_GROUPS, SENT_CLASSES, CLASS_COLOR, classCounts, countBy, coverageStats, orgName, ageDays, GRAPH } from "@/lib/uae/data";
import { SectionHeader, Stat, Panel, ClassDot, SourceLink, OrgLogo, hostOf } from "@/components/uae/bits";
import { LivePipelinePanel } from "@/components/uae/live-pipeline";
export const metadata: Metadata = { title: "National Overview", description: "UAE AI ecosystem at a glance — concept demonstration." };

export default function OverviewPage() {
  const cov = coverageStats(); const cc = classCounts(); const total = SENTIMENT.length;
  const byType = countBy(ORGS, (o) => o.type); const recent = NEWS.filter((n) => (ageDays(n.date) ?? 999) <= 30);
  const orgNewsCounts = countBy(NEWS.flatMap((n) => n.org_ids.map((id) => ({ id }))), (x) => x.id);
  const airevNewsCount = orgNewsCounts["airev"] ?? 0;
  const otherTopOrgs = Object.entries(orgNewsCounts)
    .filter(([id]) => id !== "airev")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const negJobs = SENTIMENT.filter((r) => r.topic_cluster === "Jobs & skills");
  const explicit = SENTIMENT.filter((r) => r.location_evidence === "EXPLICIT_UAE").length;
  const plat = Object.entries(countBy(SENTIMENT, (r) => r.platform)).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-6" data-testid="overview">
      <SectionHeader eyebrow="National Overview · as of 21 Oct 2026" title="UAE AI National Intelligence Command Centre"
        lede="A concept demonstration of how public-source signals about the UAE AI ecosystem — organisations, announcements, models and public discourse — can be fused into one command view. Every figure links back to its source; gaps are shown as gaps.">
        <Link href="/briefing" className="rounded-lg bg-[#0D0D0D] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2F2F2F]" data-testid="cta-briefing">Generate National AI Briefing</Link>
        <Link href="/chat" className="rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-medium text-[#0D0D0D] hover:bg-[#F0F0F0]">Ask the analyst</Link>
      </SectionHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="kpis">
        <Stat label="Organisations" value={cov.orgs} sub={`${ECOSYSTEM_GROUPS.length} independent ecosystems (parents ⊃ subsidiaries de-duplicated)`} href="/watchlist" />
        <Stat label="Research coverage" value={`${Math.round(cov.meanCoverage * 100)}%`} sub={`${cov.withVerifiedSource}/${cov.orgs} with a verified source URL`} href="/methodology" />
        <Stat label="Public statements" value={total} sub={`${explicit} explicit-UAE · ${plat.length} platforms`} href="/sentiment" />
        <Stat label="News events" value={NEWS.length} sub={`${recent.length} in the last 30 days`} href="/news" />
        <Stat label="Open models (HF)" value={HF.models.length} sub="tiiuae · inception42 · IFM · MBZUAI" href="/radar" />
        <Stat label="Relationships" value={GRAPH.edges.length} sub={`${GRAPH.nodes.length} nodes`} href="/graph" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="National Pulse — public discourse by class" testId="national-pulse" className="lg:col-span-2" action={<Link href="/sentiment" className="text-xs font-medium text-[#2563EB] hover:underline">Open Sentiment Universe →</Link>}>
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-[#E5E5E5] bg-[#F9F9F9]" role="img" aria-label="Class distribution">
            {SENT_CLASSES.map((k) => cc[k] ? <span key={k} title={`${k}: ${cc[k]}`} style={{ width: `${(cc[k] / total) * 100}%`, background: CLASS_COLOR[k] }} /> : null)}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
            {SENT_CLASSES.map((k) => <li key={k} className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-muted"><ClassDot k={k} />{k}</span><span className="tabular-nums font-medium">{cc[k]}</span></li>)}
          </ul>
          <p className="mt-3 rounded-md border border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2 text-xs text-muted" data-testid="sampling-disclaimer"><strong className="text-foreground">Sampling disclaimer:</strong> {META.sampling}</p>
          <p className="mt-2 text-xs text-muted">Jobs &amp; skills is the most contested topic: {negJobs.length} statements, of which {negJobs.filter((r) => ["Disruption Concerned", "Skeptics", "Pessimists/Doomers"].includes(r.sentiment_class)).length} skeptical or disruption-concerned.</p>
        </Panel>
        <Panel title="Watchlist composition" testId="composition">
          <ul className="space-y-2 text-sm">{Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => <li key={t} className="flex items-center gap-2"><span className="w-28 capitalize text-muted">{t}</span><span className="h-2 flex-1 rounded-full bg-[#F0F0F0]"><span className="block h-2 rounded-full bg-[#0D0D0D]" style={{ width: `${(n / ORGS.length) * 100}%` }} /></span><span className="w-6 text-right tabular-nums">{n}</span></li>)}</ul>
          <p className="mt-3 text-xs text-muted">Identity check: <strong>OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND</strong> — no government logo is used; this is a concept identity.</p>
          <p className="mt-2 text-xs text-muted">Policy anchor: the UAE Cabinet created the <Link className="underline" href="/watchlist/ai-data-authority">Artificial Intelligence and Data Authority</Link> on 2026-06-14, led by H.E. Omar Sultan Al Olama.</p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Latest signals (last 30 days)" testId="latest-news" className="lg:col-span-2" action={<Link href="/news" className="text-xs font-medium text-[#2563EB] hover:underline">All news →</Link>}>
          <ul className="divide-y divide-border">{recent.slice(0, 8).map((n) => (
            <li key={n.id} className="flex gap-3 py-2.5 text-sm"><time className="w-20 shrink-0 tabular-nums text-xs text-muted">{n.date}</time>
              <div className="min-w-0"><SourceLink url={n.url} className="font-medium no-underline hover:underline">{n.headline}</SourceLink>
                <p className="mt-0.5 text-xs text-muted">{n.publisher || hostOf(n.url) || "source unverified"} · {n.org_ids.map(orgName).join(", ") || "—"}</p></div></li>))}</ul>
        </Panel>
        <Panel title="Most-cited organisations" testId="top-orgs">
          <ul className="space-y-2">
            <li key="airev">
              <Link href="/watchlist/airev" className="flex items-center gap-2 rounded-md p-1 hover:bg-surface-2">
                <OrgLogo id="airev" name={orgName("airev")} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{orgName("airev")}</span>
                <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F0F0F0] px-1.5 py-0.5 text-[10px] font-medium text-[#0D0D0D]" data-testid="pinned-chip">Reference dossier</span>
                <span className="text-xs tabular-nums text-muted">{airevNewsCount} news</span>
              </Link>
            </li>
            {otherTopOrgs.map(([id, n]) => (
              <li key={id}>
                <Link href={`/watchlist/${id}`} className="flex items-center gap-2 rounded-md p-1 hover:bg-surface-2">
                  <OrgLogo id={id} name={orgName(id)} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm">{orgName(id)}</span>
                  <span className="text-xs tabular-nums text-muted">{n} news</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <LivePipelinePanel />

      <Panel title="Technology & Innovation Radar — snapshot" testId="radar-snapshot" action={<Link href="/radar" className="text-xs font-medium text-[#2563EB] hover:underline">Open radar →</Link>}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{RADAR.slice().sort((a, b) => b.signals - a.signals).slice(0, 8).map((r) => <div key={r.name} className="rounded-lg border border-border p-3"><p className="text-sm font-medium">{r.name}</p><p className="mt-1 text-xs text-muted"><span className="font-semibold uppercase text-[#0D0D0D]">{r.ring}</span> · {r.signals} signals · latest {r.latest || "n/a"}</p></div>)}</div>
      </Panel>
    </div>
  );
}
