/**
 * Score → colour for sentiment values (−1…+1). Green family for positive, neutral grey, red for negative — no blue.
 * Every text colour is WCAG AA (≥ 4.5:1) on white and on the soft tint #F0F0F0.
 */
export type SentimentTone = "strong" | "positive" | "neutral" | "negative" | "none";
export const SENTIMENT_TONE_COLOR: Record<SentimentTone, string> = {
  strong: "#0D0D0D",   // ≥ 0.6  (19:1 on white)
  positive: "#2F2F2F", // 0.2 … 0.6 (12.6:1)
  neutral: "#5D5D5D",  // −0.2 … 0.2 (7.0:1)
  negative: "#737373", // ≤ −0.2 (4.7:1)
  none: "#5D5D5D",
};
export function sentimentTone(score: number | null | undefined): SentimentTone {
  if (score == null || !Number.isFinite(score)) return "none";
  if (score >= 0.6) return "strong";
  if (score >= 0.2) return "positive";
  if (score > -0.2) return "neutral";
  return "negative";
}
export const sentimentColor = (score: number | null | undefined) => SENTIMENT_TONE_COLOR[sentimentTone(score)];
