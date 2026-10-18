/**
 * Reputation & Prestige — entity / factor data contract (B Capital re-target of the Rilian correlation engine).
 * Every factor is ONE sourced fact (URL + date). Nothing here is scored by hand: the engine derives edges, communities and
 * centrality from the factors exactly as it did for Rilian posts (src/lib/reputation/engine/*).
 */
export type EntityId = 'b-capital' | 'eduardo-saverin' | 'raj-ganguly' | 'karan-mohla';

export type FactorCategory =
  | 'track-record'
  | 'exits'
  | 'unicorns'
  | 'ipos'
  | 'aum-fund-size'
  | 'rankings'
  | 'board-seats'
  | 'media-sentiment'
  | 'thought-leadership'
  | 'network'
  | 'co-investor-lp-quality'
  | 'founder-references'
  | 'risk-controversy';

export const FACTOR_CATEGORIES: FactorCategory[] = [
  'track-record',
  'exits',
  'unicorns',
  'ipos',
  'aum-fund-size',
  'rankings',
  'board-seats',
  'media-sentiment',
  'thought-leadership',
  'network',
  'co-investor-lp-quality',
  'founder-references',
  'risk-controversy',
];

export const FACTOR_CATEGORY_LABEL: Record<FactorCategory, string> = {
  'track-record': 'Track record',
  exits: 'Exits',
  unicorns: 'Unicorns',
  ipos: 'IPOs',
  'aum-fund-size': 'AUM & fund sizes',
  rankings: 'Rankings',
  'board-seats': 'Board seats',
  'media-sentiment': 'Media sentiment',
  'thought-leadership': 'Thought leadership',
  network: 'Network',
  'co-investor-lp-quality': 'Co-investor & LP quality',
  'founder-references': 'Founder references',
  'risk-controversy': 'Risk / controversy flags',
};

export interface ReputationFactor {
  /** Stable id inside the entity, e.g. `F-001`. */
  id: string;
  category: FactorCategory;
  /** One-line fact. */
  title: string;
  /** Supporting detail (one or two sentences, from the cited source only). */
  detail: string;
  /** Exact source URL (cited verbatim). */
  sourceUrl: string;
  /** Publisher / outlet name. */
  sourceName: string;
  /** Source date, ISO `YYYY-MM-DD` (year-only sources use `YYYY-01-01`). */
  sourceDate: string;
  /** false → rendered as "not verified" (no primary source found). */
  verified: boolean;
  /** Shared object this fact is about (fund name, company, institution, award) → the engine's co-share object. */
  sharedObject?: string;
  /** Topic tags → the engine's co-hashtag objects (lower-case, no `#`). */
  tags: string[];
  /** Another entity this fact directly involves → the engine's co-reply target. */
  relatedEntity?: EntityId;
  /** Risk / controversy flag (rendered as a flagged row). */
  riskFlag?: boolean;
}

export interface ReputationEntity {
  id: EntityId;
  /** Engine handle, e.g. `@bcapital`. */
  handle: string;
  kind: 'firm' | 'person';
  name: string;
  role: string;
  location: string;
  headline: string;
  /** Personalised narrative paragraphs written from the cited facts only. */
  narrative: string[];
  photo: { src: string; sourceUrl: string; alt: string; fallbackSourceUrl?: string };
  links: Array<{ label: string; url: string }>;
  /** Quick-chat starter prompts routed through the ported ASK integration. */
  starterPrompts: string[];
  factors: ReputationFactor[];
}
