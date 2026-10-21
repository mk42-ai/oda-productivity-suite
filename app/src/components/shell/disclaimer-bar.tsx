/** Persistent, non-dismissable disclaimer shown on every route (and printed into every briefing). */
export const DISCLAIMER = "Concept Demonstration — not an official government system";
/** Product label required on every route (QA agent 1). */
export const BRAND_LINE = "UAE AI Intelligence — Concept Demonstration";
export function DisclaimerBar() {
  return (
    <div
      role="note"
      aria-label="Disclaimer"
      data-testid="disclaimer-bar"
      className="sticky top-0 z-[55] flex h-[var(--disc-h)] items-center justify-center gap-2 overflow-hidden whitespace-nowrap border-b border-[#E5E5E5] px-3 text-center text-[11.5px] font-medium tracking-wide"
      style={{ background: "var(--disclaimer-bg)", color: "var(--disclaimer-fg)" }}
    >
      <span data-testid="brand-line" className="font-semibold">{BRAND_LINE}</span>
      <span aria-hidden className="opacity-60">·</span>
      <span className="hidden sm:inline">Not an official government system</span>
      <span className="hidden lg:inline">· Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied</span>
    </div>
  );
}
