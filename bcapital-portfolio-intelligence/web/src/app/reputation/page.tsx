import type { Metadata } from 'next';
import { PageHeader } from '@/components/shell/page-header';
import { ReputationView } from '@/components/reputation/ReputationView';
import { ENTITIES } from '@/lib/reputation/data/entities';
import { factorLookup, runReputationEngine } from '@/lib/reputation/adapter';
import { PLATES } from '@/lib/reputation/assets';
import batch from '@/data/reputation-batch.json';
import type { CorrelationResult } from '@/lib/reputation/engine/types';
import type { BatchSummaryData } from '@/components/reputation/BatchPanels';
import { categoryOf, loadCorpusGraph, loadEvidence } from '@/lib/reputation/corpus';

export const metadata: Metadata = { title: "Reputation & Prestige", description: "Correlation engine over sourced reputation factors for B Capital, Eduardo Saverin, Raj Ganguly and Karan Mohla — co-occurrence weights, communities, centrality and an OnDemand quick-chat.", openGraph: { title: "Reputation & Prestige", description: "Correlation engine over sourced reputation factors for B Capital, Eduardo Saverin, Raj Ganguly and Karan Mohla — co-occurrence weights, communities, centrality and an OnDemand quick-chat." }, twitter: { title: "Reputation & Prestige", description: "Correlation engine over sourced reputation factors for B Capital, Eduardo Saverin, Raj Ganguly and Karan Mohla — co-occurrence weights, communities, centrality and an OnDemand quick-chat." }, alternates: { canonical: "/reputation" } };
export const dynamic = 'force-static';

export default function ReputationPage() {
  // The correlation over the full evidence batch is PRECOMPUTED server-side by scripts/batch-correlation.ts (ported engine, unchanged);
  // the page only renders it. The 59 curated factors still drive the entity cards and their quick-chat context.
  void runReputationEngine;
  const result = batch.result as unknown as CorrelationResult;
  const summary = batch.summary as unknown as BatchSummaryData;
  const lookup: Record<string, NonNullable<ReturnType<typeof factorLookup>>> = { ...(batch.evidence as Record<string, NonNullable<ReturnType<typeof factorLookup>>>) };
  for (const e of ENTITIES) for (const f of e.factors) { const v = factorLookup(`${e.id}/${f.id}`); if (v) lookup[v.id] = v; }
  const total = ENTITIES.reduce((n, e) => n + e.factors.length, 0);
  // Evidence explorer categories come from the 2026-10-18 corpus (web/data/reputation/evidence.json — first hashtag per item), ordered by
  // frequency; the graph section and the table read the same files through the API, so chip counts match the dataset exactly.
  const corpus = loadEvidence();
  const corpusGraph = loadCorpusGraph();
  const catCounts = new Map<string, number>();
  for (const it of corpus.items) { const c = categoryOf(it); catCounts.set(c, (catCounts.get(c) ?? 0) + 1); }
  const categories = [...catCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([c]) => c);
  const corpusItems = corpus.items.length;
  return (
    <>
      <section className="rep-hero" data-testid="reputation-hero" style={{ backgroundImage: `url(${PLATES.hero})` }}>
        <div className="rep-hero__scrim">
          <PageHeader title="Reputation & Prestige" lede={`B Capital and its leadership — ${ENTITIES.length} subjects · ${(corpusItems || summary.counts.processed).toLocaleString('en-US')} sourced evidence items${corpusGraph ? ` · ${corpusGraph.stats.nodes} graph nodes / ${corpusGraph.stats.edges.toLocaleString('en-US')} edges` : ''} · ${total} curated VC factors (fund size & AUM, exits, board seats, press tier, network centrality, sector leadership, geography) · every factor cites its URL and date`} />
        </div>
      </section>
      <ReputationView entities={ENTITIES} result={result} lookup={lookup} plates={PLATES} batch={summary} categories={categories} />
    </>
  );
}
