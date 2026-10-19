import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getEntity } from '@/lib/reputation/data/entities';

/** /reputation/<entity-id> — a known id lands on the main view (anchored); an unknown id is a REAL HTTP 404 (not-found boundary). */
export const dynamic = 'force-static';
export const dynamicParams = true;
export function generateStaticParams() {
  return [{ entity: 'b-capital' }, { entity: 'eduardo-saverin' }, { entity: 'raj-ganguly' }, { entity: 'karan-mohla' }];
}
export async function generateMetadata({ params }: { params: Promise<{ entity: string }> }): Promise<Metadata> {
  const { entity } = await params;
  const e = getEntity(entity);
  if (!e) return { title: 'Reputation entity', robots: { index: false, follow: false } };
  const title = `${e.name} · Reputation`;
  const description = `Sourced reputation and prestige factors for ${e.name}: evidence, co-occurrence weights and correlation within the B Capital network.`;
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}
export default async function ReputationEntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!getEntity(entity)) notFound();
  redirect(`/reputation#${entity}`);
}
