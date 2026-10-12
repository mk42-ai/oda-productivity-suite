/**
 * B Social / Companies colour system — one distinct palette + gradient per portfolio sector (client-safe, no server imports).
 * Sector keys match data/portfolio.json → companies[].sector (tagged by the 2026-10-12 merge). Images are the Step 6 editorial
 * sector visuals, downloaded into /public/media (the blob SAS URLs expire 2026-10-19).
 */
export type SectorKey = "biotech" | "healthtech" | "fintech" | "robotics" | "climate" | "ai-infra" | "edtech" | "logistics" | "consumer" | "ai-enterprise";
export type SectorTheme = { key: SectorKey; label: string; image: string; from: string; to: string; ink: string; soft: string };
export const SECTOR_THEMES: Record<SectorKey, SectorTheme> = {
  biotech: { key: "biotech", label: "Biotech", image: "/media/sector-biotech.webp", from: "#7C3AED", to: "#DB2777", ink: "#5B21B6", soft: "#F3E8FF" },
  healthtech: { key: "healthtech", label: "Healthtech", image: "/media/sector-healthtech.webp", from: "#0D9488", to: "#10B981", ink: "#115E59", soft: "#E6FAF5" },
  fintech: { key: "fintech", label: "Fintech & Crypto", image: "/media/sector-fintech.webp", from: "#D97706", to: "#E11D48", ink: "#9A3412", soft: "#FFF4E5" },
  robotics: { key: "robotics", label: "Robotics & Space", image: "/media/sector-robotics-space.webp", from: "#334155", to: "#6366F1", ink: "#3730A3", soft: "#EEF0FF" },
  climate: { key: "climate", label: "Climate & Mobility", image: "/media/sector-climate-mobility.webp", from: "#65A30D", to: "#059669", ink: "#3F6212", soft: "#F0FAE6" },
  "ai-infra": { key: "ai-infra", label: "AI Infrastructure", image: "/media/sector-ai-infra.webp", from: "#0891B2", to: "#7C3AED", ink: "#155E75", soft: "#E6F7FB" },
  edtech: { key: "edtech", label: "Edtech", image: "/media/sector-edtech.webp", from: "#EA580C", to: "#CA8A04", ink: "#9A3412", soft: "#FFF1E6" },
  logistics: { key: "logistics", label: "Logistics", image: "/media/sector-logistics.webp", from: "#0284C7", to: "#14B8A6", ink: "#075985", soft: "#E6F4FB" },
  consumer: { key: "consumer", label: "Consumer & Marketplaces", image: "/media/sector-consumer.webp", from: "#DB2777", to: "#F97316", ink: "#9D174D", soft: "#FDE8F1" },
  "ai-enterprise": { key: "ai-enterprise", label: "AI & Enterprise", image: "/media/sector-ai-enterprise.webp", from: "#0AC985", to: "#0E7490", ink: "#047857", soft: "#E6FAF3" },
};
export const SECTOR_KEYS = Object.keys(SECTOR_THEMES) as SectorKey[];
export const sectorTheme = (k: string | null | undefined): SectorTheme => SECTOR_THEMES[(k ?? "ai-enterprise") as SectorKey] ?? SECTOR_THEMES["ai-enterprise"];
export const sectorGradient = (k: string | null | undefined, angle = 135) => { const t = sectorTheme(k); return `linear-gradient(${angle}deg, ${t.from}, ${t.to})`; };
export const faviconUrl = (domain: string | null | undefined) => (domain ? `/api/favicon?host=${encodeURIComponent(domain.replace(/^www\./, ""))}` : null);
export const PLATFORM_LABEL: Record<string, string> = { news: "News", linkedin: "LinkedIn", x: "X", reddit: "Reddit", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube", threads: "Threads", bluesky: "Bluesky", mastodon: "Mastodon", pitchbook: "PitchBook", perplexity: "Perplexity" };
export const PLATFORM_DOMAIN: Record<string, string> = { linkedin: "linkedin.com", x: "x.com", reddit: "reddit.com", instagram: "instagram.com", tiktok: "tiktok.com", facebook: "facebook.com", youtube: "youtube.com", threads: "threads.net", bluesky: "bsky.app", mastodon: "mastodon.social", pitchbook: "pitchbook.com", perplexity: "perplexity.ai" };
