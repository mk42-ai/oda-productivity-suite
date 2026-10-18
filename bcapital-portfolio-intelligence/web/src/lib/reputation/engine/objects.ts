/**
 * v5.2 (fix B) — object weighting: per-object IDF over the live corpus, a generic-object cut-off (>20 % of rows), an
 * investigation-scoped stoplist and an off-topic filter against the NAR-001…NAR-008 keyword set.
 *
 * DEF-021 (2026-09-15): the edge score is `edgeWeight()` below — distinct post pairs (log-scaled, saturating at 8) × a 0.5–1
 * specificity multiplier × the precision factor, halved by the syndication share. One shared article can no longer score 1.000.
 */
import type { CoMode } from './types';

/** Objects present in more than this share of posts are generic and produce no edges. */
export const GENERIC_DF_RATIO = 0.2;

/** NAR-001…NAR-008 keyword set (lower-case tokens; ASCII + Arabic). An object with zero overlap is off-topic. */
const NARRATIVE_KEYWORDS: readonly string[] = [
  // NAR-001 UAE arms/funds RSF / Sudan
  'uae', 'emirates', 'emirati', 'abu', 'dhabi', 'rsf', 'sudan', 'sudanese', 'darfur', 'fasher', 'khartoum', 'genocide', 'hemedti', 'dagalo', 'arms', 'weapons', 'chad', 'amdjarass', 'الإمارات', 'السودان', 'الدعم', 'السريع', 'حميدتي', 'الفاشر', 'دارفور',
  // NAR-002 separatism
  'separatism', 'separatist', 'yemen', 'stc', 'somaliland', 'libya', 'haftar', 'partition', 'secession', 'اليمن', 'الانتقالي', 'انفصال', 'ليبيا', 'حفتر',
  // NAR-003 Saudi hegemon / MB
  'saudi', 'riyadh', 'hegemon', 'hegemony', 'bully', 'brotherhood', 'ikhwan', 'yasat', 'السعودية', 'الرياض', 'الإخوان', 'الياسات',
  // NAR-004 Saudi economic failure
  'vision', '2030', 'neom', 'pif', 'line', 'economy', 'economic', 'losses', 'collapse', 'deficit', 'نيوم', 'رؤية', 'اقتصاد',
  // NAR-005 Zionist-aligned
  'israel', 'zionist', 'abraham', 'normalisation', 'normalization', 'gaza', 'palestine', 'netanyahu', 'إسرائيل', 'صهيون', 'التطبيع', 'غزة', 'فلسطين',
  // NAR-006 MBS vs MBZ
  'mbs', 'mbz', 'salman', 'zayed', 'rivalry', 'feud', 'بن', 'سلمان', 'زايد',
  // NAR-007 Gulf division / Iran / US
  'gulf', 'gcc', 'iran', 'tehran', 'hormuz', 'washington', 'pentagon', 'الخليج', 'إيران', 'طهران',
  // NAR-008 Boycott UAE
  'boycott', 'boycottuae', 'sanction', 'sanctions', 'divest', 'مقاطعة',
];

/** Investigation-scoped stoplist: generic tags that touch most of the INV-003 corpus regardless of the IDF cut-off. */
const STOPLIST_BY_INVESTIGATION: Record<string, readonly string[]> = {
  'INV-003': ['uae', 'sudan', 'un', 'rsf', 'ai', 'anthropic', 'news', 'breaking', 'world', 'middleeast', 'gulf'],
};

function tokens(object: string): string[] {
  return object
    .toLowerCase()
    .replace(/^#/, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .concat(object.toLowerCase().replace(/^#/, '').match(/[\p{L}]{3,}/gu) ?? []);
}

/** Off-topic = zero overlap with the narrative keyword set. URLs / shared ids are judged on their tokens too. */
/** FULL_CORPUS_CORRELATION: the narrative keyword set is INVESTIGATION-SCOPED — INV-001's default run lost 47 objects (20n/17e → 4n/2e) to a list written for INV-003. */
export const OFF_TOPIC_KEYWORDS_BY_INVESTIGATION: Record<string, readonly string[]> = { 'INV-003': NARRATIVE_KEYWORDS };
export function offTopicKeywordsFor(investigationId: string | null | undefined): readonly string[] | null {
  return (investigationId && OFF_TOPIC_KEYWORDS_BY_INVESTIGATION[investigationId]) || null;
}
export function isOffTopic(object: string, mode: CoMode, keywords: readonly string[] | null = NARRATIVE_KEYWORDS): boolean {
  if (!keywords) return false; // no keyword set for this investigation → the gate is off
  if (mode === 'co-text') return false; // text similarity objects are already sentence excerpts of on-topic rows
  const kw = new Set(keywords.map((k) => k.toLowerCase()));
  const toks = tokens(object);
  for (const t of toks) {
    if (kw.has(t)) return false;
    for (const k of kw) if (k.length >= 4 && (t.startsWith(k) || t.endsWith(k))) return false;
  }
  return true;
}

export function isStoplisted(object: string, investigationId: string | null | undefined, extra: readonly string[] = []): boolean {
  const o = object.toLowerCase().replace(/^#/, '');
  const list = new Set([...(investigationId ? (STOPLIST_BY_INVESTIGATION[investigationId] ?? []) : []), ...extra].map((s) => s.toLowerCase()));
  return list.has(o);
}

/** Smoothed inverse document frequency; N = posts in scope, df = posts carrying the object. */
export function idf(df: number, n: number): number {
  return Math.log((n + 1) / (Math.max(0, df) + 1));
}
/** The largest idf a real shared object can reach (df = 2: two posts share it). */
export function idfMax(n: number): number {
  return idf(2, n);
}
export function isGeneric(df: number, n: number, ratio = GENERIC_DF_RATIO): boolean {
  return n > 0 && df / n > ratio;
}

/** Distinct post pairs at which `pairsTerm` saturates (log-scaled): 8 pairs → 1.0, 1 pair → 0.315, 2 → 0.5, 4 → 0.73. */
export const PAIRS_SATURATION = 8;
/** Floor of the specificity multiplier: rarity can at most halve a score, never zero it. */
export const SPECIFICITY_FLOOR = 0.5;

export interface EdgeScoreInput {
  /** DEF-020: DISTINCT post pairs (dedup-adjusted co-occurrences) — NOT raw mode events. */
  count: number;
  /** One entry per shared object (event): its idf over the posts in scope and the precision factor applied. */
  shared: Array<{ idf: number; factor: number }>;
  /** Posts in scope (for idfMax). */
  n: number;
  /** syndicatedPairs / count (0..1). */
  syndicationShare: number;
}

/**
 * DEF-021 (2026-09-15) — discriminating edge score, replaces the saturating `min(1, Σidf·f / (√(aA·aB)·idfMax))` under which ONE
 * republished article between two 1-post outlets already scored 1.000 (16/24 default-run edges saturated):
 *
 *     pairsTerm   = log2(1 + count) / log2(1 + 8)          // 8 distinct post pairs → 1.0; 1 pair → 0.315; 2 → 0.5; 4 → 0.73
 *     specificity = clamp(mean(idf_i) / idfMax(n), 0.5, 1)  // the v5.2 rarity signal, kept only as a 0.5–1 multiplier
 *     precision   = mean(precisionFactor_i)                 // the v5.2 precision factor (1 for second-precision rows)
 *     weight      = min(1, pairsTerm × specificity × precision × 1 / (1 + syndicationShare))
 *
 * Consequences: a single shared article can never reach 1.000 (max 0.315; 0.158 when it is wire copy), 1.000 needs ≥ 8 distinct
 * non-syndicated pairs at full specificity and second precision, and a fully syndicated edge scores half of an organic one. The
 * same-day cap (SAME_DAY_WEIGHT_CAP) and the precision rejects are applied by the engine around this function, unchanged.
 */
export function edgeWeight(input: EdgeScoreInput): number {
  const count = Math.max(0, Math.floor(input.count));
  if (count === 0 || input.shared.length === 0) return 0;
  const pairsTerm = Math.min(1, Math.log2(1 + count) / Math.log2(1 + PAIRS_SATURATION));
  const meanIdf = input.shared.reduce((acc, s) => acc + s.idf, 0) / input.shared.length;
  const specificity = Math.min(1, Math.max(SPECIFICITY_FLOOR, meanIdf / Math.max(1e-9, idfMax(input.n))));
  const precision = input.shared.reduce((acc, s) => acc + s.factor, 0) / input.shared.length;
  const share = Math.min(1, Math.max(0, Number.isFinite(input.syndicationShare) ? input.syndicationShare : 0));
  return Math.min(1, pairsTerm * specificity * precision * (1 / (1 + share)));
}
