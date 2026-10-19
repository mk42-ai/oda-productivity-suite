/**
 * B Social / Companies colour system — one distinct palette + gradient per portfolio sector (client-safe, no server imports).
 * Sector keys match data/portfolio.json → companies[].sector (tagged by the 2026-10-12 merge). Images are the Step 6 editorial
 * sector visuals, downloaded into /public/media (the blob SAS URLs expire 2026-10-19).
 */
export type SectorKey = "biotech" | "healthtech" | "fintech" | "robotics" | "climate" | "ai-infra" | "edtech" | "logistics" | "consumer" | "ai-enterprise";
export type SectorTheme = { key: SectorKey; label: string; image: string; from: string; to: string; ink: string; soft: string };
export const SECTOR_THEMES: Record<SectorKey, SectorTheme> = {
  biotech: { key: "biotech", label: "Biotech", image: "/media/sector-biotech.webp", from: "#9c2f73", to: "#9c2f73", ink: "#9c2f73", soft: "#faeaf3" },
  healthtech: { key: "healthtech", label: "Healthtech", image: "/media/sector-healthtech.webp", from: "#0f766e", to: "#0f766e", ink: "#0f766e", soft: "#e6f7f5" },
  fintech: { key: "fintech", label: "Fintech & Crypto", image: "/media/sector-fintech.webp", from: "#b45309", to: "#b45309", ink: "#b45309", soft: "#fdf3e3" },
  robotics: { key: "robotics", label: "Robotics & Space", image: "/media/sector-robotics-space.webp", from: "#475569", to: "#475569", ink: "#475569", soft: "#eef1f5" },
  climate: { key: "climate", label: "Climate & Mobility", image: "/media/sector-climate-mobility.webp", from: "#3f7f1f", to: "#3f7f1f", ink: "#3f7f1f", soft: "#ecf7e6" },
  "ai-infra": { key: "ai-infra", label: "AI Infrastructure", image: "/media/sector-ai-infra.webp", from: "#047857", to: "#047857", ink: "#047857", soft: "#e3f6ee" },
  edtech: { key: "edtech", label: "Edtech", image: "/media/sector-edtech.webp", from: "#c2410c", to: "#c2410c", ink: "#c2410c", soft: "#fdeee6" },
  logistics: { key: "logistics", label: "Logistics", image: "/media/sector-logistics.webp", from: "#6b6a12", to: "#6b6a12", ink: "#6b6a12", soft: "#f3f3e2" },
  consumer: { key: "consumer", label: "Consumer & Marketplaces", image: "/media/sector-consumer.webp", from: "#be3a7a", to: "#be3a7a", ink: "#be3a7a", soft: "#fbe9f2" },
  "ai-enterprise": { key: "ai-enterprise", label: "AI & Enterprise", image: "/media/sector-ai-enterprise.webp", from: "#15785a", to: "#15785a", ink: "#15785a", soft: "#e8f6f0" },
};
export const SECTOR_KEYS = Object.keys(SECTOR_THEMES) as SectorKey[];
export const sectorTheme = (k: string | null | undefined): SectorTheme => SECTOR_THEMES[(k ?? "ai-enterprise") as SectorKey] ?? SECTOR_THEMES["ai-enterprise"];
export const sectorGradient = (k: string | null | undefined, angle = 135) => { const t = sectorTheme(k); return `linear-gradient(${angle}deg, ${t.from}, ${t.to})`; };
export const faviconUrl = (domain: string | null | undefined) => (domain ? `/api/favicon?host=${encodeURIComponent(domain.replace(/^www\./, ""))}` : null);
export const PLATFORM_LABEL: Record<string, string> = { news: "News", linkedin: "LinkedIn", x: "X", reddit: "Reddit", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube", threads: "Threads", bluesky: "Bluesky", mastodon: "Mastodon", pitchbook: "PitchBook", perplexity: "Perplexity" };
export const PLATFORM_DOMAIN: Record<string, string> = { linkedin: "linkedin.com", x: "x.com", reddit: "reddit.com", instagram: "instagram.com", tiktok: "tiktok.com", facebook: "facebook.com", youtube: "youtube.com", threads: "threads.net", bluesky: "bsky.app", mastodon: "mastodon.social", pitchbook: "pitchbook.com", perplexity: "perplexity.ai" };
