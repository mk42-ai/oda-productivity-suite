/**
 * Score → colour for sentiment values (−1…+1). Green family for positive, neutral grey, red for negative — no blue.
 * Every text colour is WCAG AA (≥ 4.5:1) on white and on the brand-green tint #eefbf5.
 */
export type SentimentTone = "strong" | "positive" | "neutral" | "negative" | "none";
export const SENTIMENT_TONE_COLOR: Record<SentimentTone, string> = {
  strong: "#067a52",   // ≥ 0.6  (5.6:1 on white)
  positive: "#2e7d32", // 0.2 … 0.6 (5.1:1)
  neutral: "#5c6168",  // −0.2 … 0.2
  negative: "#b42318", // ≤ −0.2 (6.3:1)
  none: "#5c6168",
};
export function sentimentTone(score: number | null | undefined): SentimentTone {
  if (score == null || !Number.isFinite(score)) return "none";
  if (score >= 0.6) return "strong";
  if (score >= 0.2) return "positive";
  if (score > -0.2) return "neutral";
  return "negative";
}
export const sentimentColor = (score: number | null | undefined) => SENTIMENT_TONE_COLOR[sentimentTone(score)];
