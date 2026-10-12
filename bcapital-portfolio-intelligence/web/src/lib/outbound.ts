/**
 * Outbound-link policy (2026-10-12 link audit). Every "open original" link is rebuilt from the record's NATIVE data only:
 *   X         https://x.com/{author_handle}/status/{native_tweet_id}
 *   Reddit    https://www.reddit.com/r/{subreddit}/comments/{post_id}/
 *   Instagram https://www.instagram.com/p/{shortcode}/  (or /reel/{shortcode}/)
 *   LinkedIn  the stored native post / activity URL
 * No profile, search, hashtag, t.co, proxy, internal-route or homepage substitution. When no native URL exists → null
 * (the UI renders a non-clickable "Original source unavailable" label).
 */
export type LinkablePost = { platform: string; url?: string | null; author_handle?: string | null; provider_native_id?: string | null; subreddit?: string | null };

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
export function canonicalOriginalUrl(p: LinkablePost): string | null {
  const u = String(p.url ?? "");
  const nid = String(p.provider_native_id ?? "");
  switch (p.platform) {
    case "x": {
      const m = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/.exec(u);
      const handle = p.author_handle || m?.[1] || ""; const id = /^\d{5,25}$/.test(nid) ? nid : m?.[2] || "";
      return HANDLE.test(handle) && /^\d{5,25}$/.test(id) ? `https://x.com/${handle}/status/${id}` : null;
    }
    case "reddit": {
      const m = /^https?:\/\/(?:www\.|old\.)?reddit\.com\/r\/([A-Za-z0-9_]+)\/comments\/([a-z0-9]+)/i.exec(u);
      const sub = p.subreddit || m?.[1] || ""; const id = (/^[a-z0-9]{3,12}$/i.test(nid) ? nid : m?.[2]) || "";
      return /^[A-Za-z0-9_]{2,30}$/.test(sub) && id ? `https://www.reddit.com/r/${sub}/comments/${id}/` : null;
    }
    case "instagram": {
      const m = /^https?:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/.exec(u);
      const code = (/^[A-Za-z0-9_-]{5,20}$/.test(nid) ? nid : m?.[2]) || "";
      return code ? `https://www.instagram.com/${m?.[1] ?? "p"}/${code}/` : null;
    }
    case "linkedin":
      return /^https:\/\/(?:www\.)?linkedin\.com\/(?:posts\/[^/?#]*(?:activity|share|ugcPost)-\d{15,22}[^/?#]*|feed\/update\/urn:li:(?:activity|share|ugcPost):\d{15,22})\/?$/.test(u.split("?")[0]) ? u.split("?")[0] : null;
    case "tiktok": {
      const m = /^https:\/\/(?:www\.)?tiktok\.com\/@([^/]+)\/video\/(\d+)/.exec(u);
      return m ? `https://www.tiktok.com/@${m[1]}/video/${m[2]}` : null;
    }
    default: return null;
  }
}

/** Generic external link guard for citations / markdown links: absolute http(s) to a real source only. */
const BLOCKED_HOST = /(^|\.)(perplexity\.ai|google\.[a-z.]+|bing\.com|duckduckgo\.com|t\.co|lnkd\.in|bit\.ly|vercel\.run|on-demand\.io)$/i;
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (BLOCKED_HOST.test(u.hostname)) return null;
    if (/\/(search|redirect|url|out|r)\b/i.test(u.pathname) && /[?&](q|url|u|target)=/i.test(u.search)) return null; // redirect wrappers
    return u.href;
  } catch { return null; }
}
/** Stop a parent card / router from intercepting an outbound anchor click. */
export const stopOutbound = (e: { stopPropagation: () => void }) => { e.stopPropagation(); };
