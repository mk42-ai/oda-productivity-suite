import type { Metadata } from 'next';
import { PageHeader } from '@/components/shell/page-header';
import { ReputationView } from '@/components/reputation/ReputationView';
import { ENTITIES } from '@/lib/reputation/data/entities';
import { factorLookup, runReputationEngine } from '@/lib/reputation/adapter';
import { PLATES } from '@/lib/reputation/assets';

export const metadata: Metadata = { title: 'Reputation & Prestige', description: 'Correlation engine over sourced reputation factors for B Capital, Eduardo Saverin, Raj Ganguly and Karan Mohla — co-occurrence weights, communities, centrality and an OnDemand quick-chat.' };
export const dynamic = 'force-static';

export default function ReputationPage() {
  const result = runReputationEngine();
  const lookup: Record<string, NonNullable<ReturnType<typeof factorLookup>>> = {};
  for (const e of ENTITIES) for (const f of e.factors) { const v = factorLookup(`${e.id}/${f.id}`); if (v) lookup[v.id] = v; }
  const total = ENTITIES.reduce((n, e) => n + e.factors.length, 0);
  return (
    <>
      <section className="rep-hero" data-testid="reputation-hero" style={{ backgroundImage: `url(${PLATES.hero})` }}>
        <div className="rep-hero__scrim">
          <PageHeader title="Reputation & Prestige" lede={`B Capital and its leadership — ${ENTITIES.length} subjects · ${total} sourced VC factors (fund size & AUM, exits, board seats, press tier, network centrality, sector leadership, geography) · every factor cites its URL and date`} />
        </div>
      </section>
      <ReputationView entities={ENTITIES} result={result} lookup={lookup} plates={PLATES} />
    </>
  );
}
