/**
 * Concept identity lockup (neural lattice + dune contours; charcoal #1E2124 / sand #D8C3A0 / gold #B8975A). NOT a government emblem:
 * the identity check returned OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND, so no official logo is used anywhere. Retina variants via srcSet.
 */
export const BRAND_NAME = "UAE AI National Intelligence Command Centre";
export const BRAND_SHORT = "UAE AI Command Centre";
export const BRAND_MARK_SRC = "/brand/uae/mark.webp";
export function BrandLogo({ height = 28, className, variant = "auto" }: { height?: number; className?: string; variant?: "auto" | "mark" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`} data-testid="brand-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/uae/mark.webp" srcSet="/brand/uae/mark.webp 1x, /brand/uae/mark@2x.webp 2x" width={height} height={height} alt="" aria-hidden className="rounded-md" style={{ width: height, height }} />
      {variant === "auto" && (
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">UAE AI Command Centre</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--uae-gold-ink)] dark:text-[var(--uae-gold)]">Concept demonstration</span>
        </span>
      )}
      <span className="sr-only">{BRAND_NAME} — concept demonstration, not an official government system</span>
    </span>
  );
}
