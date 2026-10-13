/** One fail-closed policy for B Social ingestion, APIs, caches and rendering.
 * These are existing configured social tools, NOT the entire discovery catalogue.
 * Directory subscription/credentials never count as successful post retrieval.
 */
export const SOCIAL_POLICY_VERSION = "social-native-v3";
export const SOCIAL_PROVIDERS = {
  x: { label: "X", pluginIds: ["plugin-1716326559", "plugin-1751872652"], hosts: ["x.com", "twitter.com"], status: "configured", reason: "Native X search (FetchTweetDetails, plugin-1716326559) per company name, handle and founder; every post passes the snowflake-ID timestamp check and resolves at publish.twitter.com/oembed with the same author." },
  reddit: { label: "Reddit", pluginIds: ["reddit-search-rss"], hosts: ["reddit.com"], status: "configured", reason: "Native reddit.com search per company keyword plus r/venturecapital, r/startups, r/fintech and sector subreddits; only /r/<sub>/comments/<id>/ permalinks with author and publish time are admitted." },
  instagram: { label: "Instagram", pluginIds: ["plugin-1716164040"], hosts: ["instagram.com"], status: "configured", reason: "getUserPostInfo (plugin-1716164040) on configured official company usernames; posts must come from the configured account." },
} as const;
export type SocialPlatform = keyof typeof SOCIAL_PROVIDERS;
export type SocialProviderState = { platform: SocialPlatform; label: string; status: string; reason: string };
export const providerStates = (): SocialProviderState[] => Object.entries(SOCIAL_PROVIDERS).map(([platform, p]) => ({ platform: platform as SocialPlatform, label: p.label, status: p.status, reason: p.reason }));
export type SourcePost = { id?: string; platform: string; url: string | null; source_domain?: string | null; author?: string | null; text?: string; image?: string | null; posted_at?: string | null; [key: string]: unknown };
export function isSocialPlatform(value: string): value is SocialPlatform { return Object.prototype.hasOwnProperty.call(SOCIAL_PROVIDERS, value); }

/** Only canonical, native post paths; never a company/profile/search/short-link. */
export function canonicalSocialPost(value: string | null | undefined): { platform: SocialPlatform; nativeId: string; url: string } | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    const h = u.hostname.toLowerCase().replace(/\.$/, "");
    const platform = (Object.keys(SOCIAL_PROVIDERS) as SocialPlatform[]).find((p) => SOCIAL_PROVIDERS[p].hosts.some((host) => h === host || h.endsWith(`.${host}`)));
    if (!platform) return null;
    const patterns: Record<SocialPlatform, RegExp> = {
      x: /^\/(?:[A-Za-z0-9_]+|i\/web)\/status\/(\d+)\/?$/,
      reddit: /^\/r\/[A-Za-z0-9_]+\/comments\/([A-Za-z0-9]+)(?:\/[^/]*)?\/?$/,
      instagram: /^\/(?:p|reel)\/([A-Za-z0-9_-]+)\/?$/,
    };
    const match = patterns[platform].exec(decodeURI(u.pathname));
    if (!match) return null;
    u.search = ""; u.hash = "";
    return { platform, nativeId: match[1], url: u.href.replace(/\/$/, "") };
  } catch { return null; }
}
/** Native post permalinks for RESTORED (unverified) legacy social records — includes LinkedIn/TikTok post URLs. Never company/profile/news pages. */
export type AnySocialPlatform = SocialPlatform | "linkedin" | "tiktok";
export function canonicalAnySocialPost(value: string | null | undefined): { platform: AnySocialPlatform; nativeId: string; url: string } | null {
  const v = canonicalSocialPost(value); if (v) return v;
  if (!value) return null;
  try {
    const u = new URL(value); if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase(); const path = decodeURI(u.pathname);
    let m: RegExpExecArray | null = null; let platform: AnySocialPlatform | null = null;
    if (h === "linkedin.com" || h.endsWith(".linkedin.com")) { m = /^\/(?:feed\/update\/urn:li:(?:activity|share):|posts\/[^/]*?-)(\d{15,22})(?:-[^/]*)?\/?$/.exec(path) ?? /^\/posts\/[^/]*activity-(\d{15,22})/.exec(path); platform = "linkedin"; }
    else if (h === "tiktok.com" || h.endsWith(".tiktok.com")) { m = /^\/@[^/]+\/video\/(\d+)\/?$/.exec(path); platform = "tiktok"; }
    if (!m || !platform) return null;
    u.search = ""; u.hash = "";
    return { platform, nativeId: m[1], url: u.href.replace(/\/$/, "") };
  } catch { return null; }
}
export const UNVERIFIED_LABELS: Record<AnySocialPlatform, string> = { x: "X", reddit: "Reddit", instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok" };
export const socialPlatformFromUrl = (url: string | null | undefined): SocialPlatform | null => canonicalSocialPost(url)?.platform ?? null;

/** A record must carry a matching raw item from an authenticated configured tool.
 * No adapter here synthesizes receipts from LLM text, URLs or catalogue flags.
 * Raw receipts are consumed internally; public responses expose only a summary.
 */
export function socialRejection(post: SourcePost, now = Date.now()): string | null {
  if (!post || typeof post !== "object") return "malformed_record";
  if (!isSocialPlatform(post.platform)) return "provider_not_allowed";
    if (["demo", "seed", "placeholder", "synthetic", "fabricated", "is_demo", "is_seed", "is_placeholder"].some((k) => post[k] === true) || /^(demo|seed|placeholder|synthetic|fixture)$/i.test(String(post.record_kind ?? ""))) return "non_live_record";
  const canonical = canonicalSocialPost(post.url);
  if (!canonical || canonical.platform !== post.platform) return "not_canonical_provider_post";
  const receipt = post.source_evidence as Record<string, unknown> | undefined;
  if (!receipt || receipt.kind !== "provider-response" || (post.platform !== "reddit" && receipt.authenticated !== true) || receipt.provider !== post.platform || receipt.transport !== "server" || (post.platform !== "reddit" && !(SOCIAL_PROVIDERS[post.platform].pluginIds as readonly string[]).includes(String(receipt.plugin_id)))) return "missing_authenticated_provider_receipt";
  if (receipt.test === true || receipt.fixture === true || receipt.synthetic === true) return "non_live_receipt";
  const fetched = Date.parse(String(receipt.fetched_at ?? ""));
  if (!Number.isFinite(fetched) || fetched > now + 60_000) return "invalid_retrieval_time";
  const raw = receipt.raw as Record<string, unknown> | undefined;
  if (!raw || String(raw.id ?? "") !== canonical.nativeId || String(receipt.native_id ?? "") !== canonical.nativeId || canonicalSocialPost(String(raw.url ?? ""))?.url !== canonical.url) return "provider_receipt_id_mismatch";
  if (typeof post.text !== "string" || !post.text.trim() || raw.text !== post.text || typeof post.author !== "string" || !post.author.trim() || raw.author !== post.author) return "provider_content_mismatch";
  if (post.posted_at) {
    const published = Date.parse(post.posted_at);
    if (!Number.isFinite(published) || published > fetched + 60_000 || raw.posted_at !== post.posted_at) return "provider_timestamp_mismatch";
  }
  if (!post.posted_at && raw.posted_at) return "provider_timestamp_mismatch";
  if (post.author_avatar && raw.author_avatar !== post.author_avatar) return "provider_avatar_mismatch";
  const rawMedia = Array.isArray(raw.media) ? raw.media : [];
  if (post.image && !rawMedia.some((m) => typeof m === "object" && m !== null && (m as Record<string, unknown>).url === post.image)) return "provider_media_mismatch";
  if (Array.isArray(post.media) && !post.media.every((m) => typeof m === "object" && m !== null && rawMedia.some((r) => typeof r === "object" && r !== null && (r as Record<string, unknown>).url === (m as Record<string, unknown>).url))) return "provider_media_mismatch";
  return null;
}
export function socialPostsOnly<T extends SourcePost>(posts: readonly T[]): T[] { return posts.filter((post) => socialRejection(post) === null); }

export function filterSocialDataset<T extends SourcePost>(dataset: { posts?: T[]; generated_at?: string; [key: string]: unknown }) {
  const raw = Array.isArray(dataset.posts) ? dataset.posts : [];
  const reasons: Record<string, number> = {}; const posts: T[] = [];
  for (const p of raw) { const reason = socialRejection(p); if (reason) reasons[reason] = (reasons[reason] ?? 0) + 1; else posts.push(p); }
  const by_platform: Record<string, number> = {};
  for (const p of posts) by_platform[p.platform] = (by_platform[p.platform] ?? 0) + 1;
  return { generated_at: dataset.generated_at ?? null, policy_version: SOCIAL_POLICY_VERSION, posts, count: posts.length, by_platform,
    quarantine: { excluded: raw.length - posts.length, reasons, reversible: true },
    providers: providerStates(), unavailable_sources: providerStates().map((p) => ({ platform: p.platform, reason: p.reason })) };
}
/** Never forward a raw provider receipt or arbitrary upstream fields to a browser. */
export function publicSocialPost<T extends SourcePost>(post: T) {
  const canonical = canonicalSocialPost(post.url)!;
  const rest = Object.fromEntries(["id", "platform", "source_domain", "author", "text", "image", "posted_at", "company_slug", "company", "sector", "company_domain", "top_comments", "agent_takeaway", "media", "author_avatar", "provider_native_id", "author_handle", "retrieved_at", "first_seen_at", "relevance_evidence", "sentiment", "subreddit", "title", "engagement"].filter((key) => key in post).map((key) => [key, post[key]]));
  return { ...rest, url: canonical.url, provenance: { kind: "provider-response", provider: post.platform, native_id: canonical.nativeId, policy_version: SOCIAL_POLICY_VERSION } };
}
/** Render/query guard for a public record received from the validated server route. */
export function isPublicSocialPost(post: unknown): post is SourcePost {
  if (!post || typeof post !== "object") return false;
  const p = post as SourcePost; const canonical = canonicalSocialPost(p.url);
  const proof = p.provenance as Record<string, unknown> | undefined;
  if (p.verification === "unverified") { const any = canonicalAnySocialPost(p.url); return !!any && any.platform === p.platform && proof?.kind === "restored-legacy" && proof.policy_version === SOCIAL_POLICY_VERSION && proof.native_id === any.nativeId && typeof p.text === "string" && !!p.text.trim(); }
  return !!canonical && canonical.platform === p.platform && proof?.kind === "provider-response" && proof.policy_version === SOCIAL_POLICY_VERSION && proof.provider === p.platform && proof.native_id === canonical.nativeId && typeof p.text === "string" && !!p.text.trim();
}
