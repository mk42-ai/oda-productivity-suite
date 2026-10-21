/**
 * Concept identity lockup (monochrome geometric emblem; charcoal / white). NOT a government emblem:
 * the identity check returned OFFICIAL_ASSET_NOT_PERMITTED / NOT_FOUND, so no official logo is used anywhere.
 */
export const BRAND_NAME = "UAE AI National Intelligence Command Centre";
export const BRAND_SHORT = "UAE AI Command Centre";
export const BRAND_MARK_SRC = "/brand/mark-light.png";
export function BrandLogo({ height = 28, className, variant = "auto" }: { height?: number; className?: string; variant?: "auto" | "mark" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`} data-testid="brand-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark-light.png" width={height} height={height} alt="" aria-hidden className="rounded-md dark:hidden" style={{ width: height, height }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark-dark.png" width={height} height={height} alt="" aria-hidden className="rounded-md hidden dark:block" style={{ width: height, height }} />
      {variant === "auto" && (
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">UAE AI Command Centre</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#8E8E8E]">Concept demonstration</span>
        </span>
      )}
      <span className="sr-only">{BRAND_NAME} — concept demonstration, not an official government system</span>
    </span>
  );
}
