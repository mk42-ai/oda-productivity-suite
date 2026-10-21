/**
 * Outbound-link policy (2026-10-15 native-source link audit).
 * Every "open original" social link is rebuilt from the record's NATIVE data only:
 *   X         https://x.com/{author_handle}/status/{native_tweet_id}
 *   Reddit    https://www.reddit.com/r/{subreddit}/comments/{post_id}/
 *   Instagram https://www.instagram.com/p/{shortcode}/  (or /reel/{shortcode}/)
 *   LinkedIn  the stored native post / activity URL
 *   TikTok    https://www.tiktok.com/@{handle}/video/{video_id}
 * And every external news / citation / round / website link passes `safeExternalUrl`,
 * which blocks search-engine wrappers, URL shorteners, redirectors, and proxy pages,
 * and strips tracking query parameters (`utm_*`, `fbclid`, `gclid`, etc.) so the user
 * lands directly on the clean original native publisher permalink.
 */
export type LinkablePost = {
  platform: string;
  url?: string | null;
  author_handle?: string | null;
  provider_native_id?: string | null;
  subreddit?: string | null;
};

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;

export function canonicalOriginalUrl(p: LinkablePost): string | null {
  const u = String(p.url ?? "");
  const nid = String(p.provider_native_id ?? "");
  switch (p.platform) {
    case "x": {
      const m = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/.exec(u);
      const handle = p.author_handle || m?.[1] || "";
      const id = /^\d{5,25}$/.test(nid) ? nid : m?.[2] || "";
      return HANDLE.test(handle) && /^\d{5,25}$/.test(id)
        ? `https://x.com/${handle}/status/${id}`
        : null;
    }
    case "reddit": {
      const m = /^https?:\/\/(?:www\.|old\.)?reddit\.com\/r\/([A-Za-z0-9_]+)\/comments\/([a-z0-9]+)/i.exec(u);
      const sub = p.subreddit || m?.[1] || "";
      const id = (/^[a-z0-9]{3,12}$/i.test(nid) ? nid : m?.[2]) || "";
      return /^[A-Za-z0-9_]{2,30}$/.test(sub) && id
        ? `https://www.reddit.com/r/${sub}/comments/${id}/`
        : null;
    }
    case "instagram": {
      const m = /^https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/.exec(u);
      const code = (/^[A-Za-z0-9_-]{5,20}$/.test(nid) ? nid : m?.[2]) || "";
      return code ? `https://www.instagram.com/${m?.[1] ?? "p"}/${code}/` : null;
    }
    case "linkedin":
      return /^https:\/\/(?:www\.)?linkedin\.com\/(?:posts\/[^/?#]*(?:activity|share|ugcPost)-\d{15,22}[^/?#]*|feed\/update\/urn:li:(?:activity|share|ugcPost):\d{15,22})\/?$/.test(
        u.split("?")[0]
      )
        ? u.split("?")[0]
        : null;
    case "tiktok": {
      const m = /^https:\/\/(?:www\.)?tiktok\.com\/@([^/?#]+)\/video\/(\d+)/.exec(u);
      return m ? `https://www.tiktok.com/@${m[1]}/video/${m[2]}` : null;
    }
    default:
      return null;
  }
}

const BLOCKED_HOST =
  /(^|\.)(perplexity\.ai|google\.[a-z.]+|bing\.com|duckduckgo\.com|t\.co|lnkd\.in|bit\.ly|tinyurl\.com|ow\.ly|buff\.ly|vercel\.run|on-demand\.io|example\.com|localhost)$/i;

const ALLOWED_SUBHOSTS = /^(docs\.perplexity\.ai|cloud\.google\.com|play\.google\.com)$/i;

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "_hsenc",
  "_hsmi",
  "ref_src",
  "ref_url",
]);

/** Generic external link guard for citations / news / markdown links: absolute http(s) to a real native source only. */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase();
    if (BLOCKED_HOST.test(host) && !ALLOWED_SUBHOSTS.test(host)) return null;
    // Block redirect wrappers and broken proxy URLs
    if (
      /\/(search|redirect|url|out|r)\b/i.test(u.pathname) &&
      /[?&](q|url|u|target)=/i.test(u.search)
    ) {
      return null;
    }
    if (/proxyerror\.html|action=lostpassword|vz_url=/i.test(u.href)) {
      return null;
    }
    // Strip tracking query params so the user opens the clean canonical URL
    for (const k of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(k.toLowerCase()) || /^utm_/i.test(k)) {
        u.searchParams.delete(k);
      }
    }
    return u.href;
  } catch {
    return null;
  }
}

/** Stop a parent card / router from intercepting an outbound anchor click. */
export const stopOutbound = (e: { stopPropagation: () => void }) => {
  e.stopPropagation();
};
