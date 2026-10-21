import type { Metadata } from "next";
import { SENTIMENT, SENT_CLASSES, CLASS_COLOR, ORGS, META, ageDays, orgName, countBy, classCounts } from "@/lib/uae/data";
import { SectionHeader, Panel, ClassDot } from "@/components/uae/bits";
import { SentimentUniverse, type U } from "@/components/uae/sentiment-universe";

export const metadata: Metadata = {
  title: "Sentiment Universe",
  description: "Public discourse about AI in the UAE — 7-class OnDemand classification with provenance and limitations.",
};

export default async function SentimentPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const sp = await searchParams;
  const items: U[] = SENTIMENT.map((r) => ({
    id: r.id,
    text: r.text,
    author: r.author,
    outlet: r.outlet,
    platform: r.platform,
    url: r.url,
    url_verified: r.url_verified,
    date: r.date,
    age: ageDays(r.date),
    org_ids: r.org_ids,
    orgNames: r.org_ids.map(orgName),
    topic_cluster: r.topic_cluster,
    location_evidence: r.location_evidence,
    lane: r.lane ?? "UAE-topic",
    sentiment_class: r.sentiment_class,
    class_confidence: r.class_confidence,
    rationale: r.rationale,
    x: r.x,
    y: r.y,
    mentions: r.mentions,
    is_verbatim: r.is_verbatim,
  }));
  const topics = [...new Set(SENTIMENT.map((r) => r.topic_cluster))].sort();
  const orgs = ORGS.filter((o) => SENTIMENT.some((r) => r.org_ids.includes(o.id)))
    .map((o) => ({ id: o.id, name: o.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const plat = Object.entries(countBy(SENTIMENT, (r) => r.platform)).sort((a, b) => b[1] - a[1]);
  const loc = countBy(SENTIMENT, (r) => r.location_evidence);
  const cc = classCounts();
  const byTopic = topics.map((t) => ({ t, rs: SENTIMENT.filter((r) => r.topic_cluster === t) })).sort((a, b) => b.rs.length - a.rs.length);

  return (
    <>
      <SectionHeader
        eyebrow="Sentiment Universe"
        title="How the UAE talks about AI"
        lede={`${SENTIMENT.length} de-duplicated, attributable public statements (news quotes, editorials, think-tanks, surveys, Reddit, Hacker News, social posts quoted in reporting), each classified by an OnDemand agent into 7 classes.`}
      />
      <SentimentUniverse items={items} classes={SENT_CLASSES} colors={CLASS_COLOR} topics={topics} orgs={orgs} initialOrg={sp.org} />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="National Pulse" testId="pulse-panel">
          <p className="mb-2 text-[11px] text-muted" data-testid="lane-split">
            Lanes: UAE-topic {SENTIMENT.filter((r) => (r.lane ?? "UAE-topic") === "UAE-topic").length} · global-discourse {SENTIMENT.filter((r) => r.lane === "global-discourse").length} (comparator only; excluded from the pulse table below).
          </p>
          <ul className="space-y-1.5 text-sm">
            {SENT_CLASSES.map((k) => (
              <li key={k} className="flex items-center gap-2">
                <ClassDot k={k} />
                <span className="flex-1 text-muted">{k}</span>
                <span className="h-1.5 w-24 rounded-full bg-[var(--surface-3)]">
                  <span className="block h-1.5 rounded-full" style={{ width: `${(cc[k] / SENTIMENT.length) * 100}%`, background: CLASS_COLOR[k] }} />
                </span>
                <span className="w-8 text-right tabular-nums">{cc[k]}</span>
              </li>
            ))}
          </ul>
          <table className="mt-3 w-full text-xs" data-testid="pulse-windows">
            <thead>
              <tr className="text-left text-muted">
                <th className="font-medium">Window (to {META.as_of})</th>
                <th className="text-right font-medium">Statements</th>
                <th className="text-right font-medium">Opt.+Prag.</th>
                <th className="text-right font-medium">Skept.+Concern</th>
              </tr>
            </thead>
            <tbody>
              {([["24h", 1], ["7d", 7], ["30d", 30]] as const).map(([w, d]) => {
                const rs = SENTIMENT.filter((r) => {
                  if (r.lane === "global-discourse") return false;
                  const a = ageDays(r.date);
                  return a != null && a >= 0 && a <= d;
                });
                const pos = rs.filter((r) => r.sentiment_class === "Optimists" || r.sentiment_class === "Pragmatists").length;
                const neg = rs.filter((r) => ["Skeptics", "Disruption Concerned", "Pessimists/Doomers", "Safety Advocates"].includes(r.sentiment_class)).length;
                return (
                  <tr key={w} className="border-t border-border" data-testid={`pulse-${w}`}>
                    <td className="py-1 font-medium">{w}</td>
                    <td className="py-1 text-right tabular-nums">{rs.length}</td>
                    <td className="py-1 text-right tabular-nums">{rs.length ? `${pos} (${Math.round((pos / rs.length) * 100)}%)` : "—"}</td>
                    <td className="py-1 text-right tabular-nums">{rs.length ? `${neg} (${Math.round((neg / rs.length) * 100)}%)` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-muted">
            Dated statements only ({SENTIMENT.filter((r) => ageDays(r.date) != null).length}/{SENTIMENT.length}); small windows hold few items — read as signals, not rates. Live increments from the 2-hourly workflow appear on the Overview.
          </p>
          <p className="mt-3 rounded-md border border-[#E5E5E5] bg-[#F9F9F9] p-2.5 text-xs text-[#5D5D5D]" data-testid="sampling-disclaimer">
            <strong className="text-[#0D0D0D]">Not a population survey.</strong> {META.sampling}
          </p>
        </Panel>
        <Panel title="Coverage by platform & location evidence" testId="coverage-panel">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {plat.map(([p, n]) => (
              <li key={p} className="flex justify-between">
                <span className="text-muted">{p}</span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-2 text-xs text-muted">
            {Object.entries(loc).map(([k, n]) => (
              <p key={k}>
                <code>{k}</code>: {n}
              </p>
            ))}
            <p className="mt-1">
              Platforms covered (sampling/coverage): Reddit public API, Hacker News, press, public LinkedIn/Instagram posts. X, TikTok and YouTube native ingestion was not run. Latest capture 2026-10-21T03:50Z. This is NOT a population survey.
            </p>
          </div>
        </Panel>
        <Panel title="Topic clusters" testId="topics-panel">
          <ul className="space-y-2 text-sm">
            {byTopic.map(({ t, rs }) => {
              const c = classCounts(rs);
              return (
                <li key={t}>
                  <div className="flex justify-between">
                    <span>{t}</span>
                    <span className="tabular-nums text-muted">{rs.length}</span>
                  </div>
                  <div className="mt-1 flex h-1.5 overflow-hidden rounded-full border border-[#E5E5E5] bg-[#F9F9F9]">
                    {SENT_CLASSES.map((k) =>
                      c[k] ? <span key={k} style={{ width: `${(c[k] / rs.length) * 100}%`, background: CLASS_COLOR[k] }} /> : null
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <Panel title="Method & limitations" className="mt-4" testId="limitations">
        <ul className="ml-4 list-disc space-y-1 text-xs text-muted">
          <li>
            Ingestion: statements were extracted by an OnDemand Sentiment-Ingestion agent from research-plugin results (Perplexity, GPT Search, Internet search) — only text present in a retrieved source was kept; the URL must match the source corpus or the link is disabled.
          </li>
          <li>
            De-duplication: normalised-text and author+URL keys; {SENTIMENT.reduce((a, r) => a + r.mentions, 0)} raw extractions collapsed to {SENTIMENT.length} statements (bubble size = surviving duplicates).
          </li>
          <li>
            Classification: OnDemand chat sessions (endpoint predefined-gpt-5.6-luna) with a fixed 7-class rubric, per-item confidence and a ≤15-word rationale; topic clusters assigned in the same pass.
          </li>
          <li>
            Position: TF-IDF (1–2-grams) → 30-d SVD → t-SNE (perplexity 18) — nearby bubbles say similar things; axes have no meaning.
          </li>
          <li>
            Neutral/Informational dominates because much of the sample is news reporting; this is a property of the sources, not of national opinion. Never read class shares as population percentages.
          </li>
        </ul>
      </Panel>
    </>
  );
}
