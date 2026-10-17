import { notFound, redirect } from 'next/navigation';
import { getEntity } from '@/lib/reputation/data/entities';

/** /reputation/<entity-id> — a known id lands on the main view (anchored); an unknown id is a REAL HTTP 404 (not-found boundary). */
export const dynamic = 'force-static';
export const dynamicParams = true;
export function generateStaticParams() {
  return [{ entity: 'b-capital' }, { entity: 'eduardo-saverin' }, { entity: 'raj-ganguly' }, { entity: 'karan-mohla' }];
}
export default async function ReputationEntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!getEntity(entity)) notFound();
  redirect(`/reputation#${entity}`);
}
