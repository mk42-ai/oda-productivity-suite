/** Persistent, non-dismissable disclaimer shown on every route (and printed into every briefing). */
export const DISCLAIMER = "Concept Demonstration — not an official government system";
export function DisclaimerBar() {
  return (
    <div role="note" aria-label="Disclaimer" data-testid="disclaimer-bar" className="sticky top-0 z-[55] flex h-[var(--disc-h)] items-center justify-center gap-2 overflow-hidden whitespace-nowrap px-3 text-center text-[11.5px] font-medium tracking-wide" style={{ background: "var(--disclaimer-bg)", color: "var(--disclaimer-fg)" }}>
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-[var(--uae-gold)]" />
      <span>{DISCLAIMER}</span>
      <span className="hidden opacity-75 md:inline">· Public-source data, as of 20 Oct 2026 · No government logo or endorsement implied</span>
    </div>
  );
}
