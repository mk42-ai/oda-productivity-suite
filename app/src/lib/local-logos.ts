/**
 * Locally hosted organisation icons (watchlist namespace uae_cc_v1). Only icons fetched from each organisation's own official domain are
 * listed (src/data/uae_cc_v1/logos.json records the source URL); everything else renders the monogram tile. Never AI-generated.
 */
import logos from "@/data/uae_cc_v1/logos.json";
const L = logos as Record<string, { status: string }>;
export const LOCAL_LOGOS: Record<string, string> = Object.fromEntries(Object.entries(L).filter(([, v]) => v.status === "official").map(([k]) => [k, `/logos/uae/${k}.png`]));
export function localLogoFor(slug?: string | null): string | null { return slug && LOCAL_LOGOS[slug] ? LOCAL_LOGOS[slug] : null; }
export function resolveLogo({ slug, logoUrl }: { slug?: string | null; name?: string | null; logoUrl?: string | null }): string | null {
  const local = localLogoFor(slug); if (local) return local;
  return logoUrl && (logoUrl.startsWith("/") || /^https?:\/\//i.test(logoUrl)) ? logoUrl : null;
}
