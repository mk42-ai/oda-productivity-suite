/** ISOLATED policy fixtures only. No request or fixture is inserted into any feed. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { canonicalSocialPost, socialPostsOnly, socialRejection, filterSocialDataset, publicSocialPost, isPublicSocialPost, SOCIAL_PROVIDERS } from "../../src/lib/social-content";
let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log(`ok - ${name}`); }
function fixture() {
  const item = { id: "123456789", url: "https://x.com/example/status/123456789", author: "Isolated fixture author", text: "Isolated fixture content", posted_at: "2026-10-10T12:00:00Z", media: [{ type: "image", url: "https://cdn.example.com/photo.jpg", alt: "Source description" }, { type: "video", url: "https://cdn.example.com/video.mp4" }] };
  return { id: "local-test-id", platform: "x", url: item.url, author: item.author, text: item.text, posted_at: item.posted_at, image: item.media[0].url, media: item.media, source_domain: "x.com", source_evidence: { kind: "provider-response", provider: "x", authenticated: true, transport: "server", plugin_id: "plugin-1751872652", native_id: item.id, fetched_at: "2026-10-11T12:00:00Z", raw: item } };
}
test("only five explicitly configured social providers, not the discovery catalogue", () => assert.deepEqual(Object.keys(SOCIAL_PROVIDERS), ["x", "reddit", "instagram", "linkedin", "tiktok"]));
for (const url of ["https://x.com/example", "https://www.linkedin.com/company/example", "https://www.linkedin.com/in/example", "https://www.instagram.com/example/", "https://reddit.com/r/startups", "https://lnkd.in/short", "https://facebook.com/posts/1", "https://youtube.com/watch?v=1", "https://bsky.app/profile/example/post/id", "https://news.example.com/article", "https://x.com.evil.example/a/status/123", "http://x.com/a/status/123", "https://x.com/search?q=x"]) {
  test(`reject non-canonical or unconfigured URL: ${url}`, () => assert.equal(canonicalSocialPost(url), null));
}
for (const [platform, url] of Object.entries({ x: "https://x.com/example/status/123", reddit: "https://reddit.com/r/startups/comments/abc123/title/", instagram: "https://instagram.com/p/ABC_123/", linkedin: "https://www.linkedin.com/posts/example_activity-123456-test", tiktok: "https://www.tiktok.com/@example/video/123456" })) test(`${platform}: canonical native post path`, () => assert.equal(canonicalSocialPost(url)?.platform, platform));
test("valid isolated authenticated response receipt passes without rewriting metadata", () => { const p = fixture(); const before = JSON.stringify(p); assert.equal(socialRejection(p), null); assert.equal(socialPostsOnly([p])[0], p); assert.equal(JSON.stringify(p), before); });
test("a social URL alone and a session ID are insufficient evidence", () => { const p: any = fixture(); delete p.source_evidence; p.session_id = "a-session"; assert.equal(socialRejection(p), "missing_authenticated_provider_receipt"); });
test("never relabel a news or general-web result as social", () => { for (const platform of ["news", "rss", "blog", "perplexity", "pitchbook", "unknown"]) assert.equal(socialRejection({ ...fixture(), platform }), "provider_not_allowed"); });
test("LLM-generated raw receipt cannot assert provider authentication", () => { const p = fixture(); p.source_evidence.kind = "model-answer"; assert.equal(socialRejection(p), "missing_authenticated_provider_receipt"); });
test("demo, placeholder, seeded and fabricated flags are excluded", () => { for (const k of ["demo", "placeholder", "seed", "synthetic", "fabricated", "is_demo", "is_seed"]) assert.equal(socialRejection({ ...fixture(), [k]: true }), "non_live_record"); });
test("fixture or synthetic receipts excluded in live-policy branch", () => { const p: any = fixture(); p.source_evidence.fixture = true; assert.equal(socialRejection(p), "non_live_receipt"); });
test("unconfigured tool cannot issue a social receipt", () => { const p = fixture(); p.source_evidence.plugin_id = "plugin-1722260873"; assert.equal(socialRejection(p), "missing_authenticated_provider_receipt"); });
test("native ID, URL, author and content must match raw provider item", () => { for (const key of ["id", "url", "author", "text"]) { const p: any = fixture(); p.source_evidence.raw[key] = "mismatch"; assert.notEqual(socialRejection(p), null); } });
test("publication time must match provider, not be invented", () => { const p = fixture(); p.posted_at = "2099-01-01"; assert.equal(socialRejection(p), "provider_timestamp_mismatch"); });
test("unknown publication time remains unknown", () => { const p: any = fixture(); p.posted_at = null; p.source_evidence.raw.posted_at = null; assert.equal(socialRejection(p), null); });
test("image and video metadata are preserved, not replaced", () => { const p = fixture(); const safe: any = publicSocialPost(p); assert.deepEqual(safe.media, p.media); assert.equal(safe.image, p.image); assert.equal(safe.posted_at, p.posted_at); assert.equal(safe.author, p.author); assert.ok(isPublicSocialPost(safe)); assert.equal(safe.source_evidence, undefined); });
test("reject a substituted image not supplied by provider", () => { const p = fixture(); p.image = "https://cdn.example.com/fabricated.jpg"; assert.equal(socialRejection(p), "provider_media_mismatch"); });
test("counts/pagination inputs exclude all rejected records and expose reasons", () => { const safe = fixture(); const d = filterSocialDataset({ posts: [safe, { ...safe, platform: "news" }] }); assert.equal(d.count, 1); assert.equal(d.quarantine.excluded, 1); assert.equal(d.by_platform.x, 1); });
test("public rendering cannot accept a mismatched or obsolete policy receipt", () => { const p: any = publicSocialPost(fixture()); p.provenance.policy_version = "social-native-v0"; assert.equal(isPublicSocialPost(p), false); });
test("existing real feed is preserved but quarantined, not fabricated into verified posts", () => {
  const raw = JSON.parse(fs.readFileSync(new URL("../../src/data/social/social-feed.json", import.meta.url), "utf8")); const before = JSON.stringify(raw);
  const safe = filterSocialDataset(raw); assert.equal(safe.count, 0); assert.equal(safe.quarantine.excluded, raw.posts.length); assert.equal(JSON.stringify(raw), before);
  console.log(`Actual bundled dataset: ${raw.posts.length} stored, ${safe.count} receipt-verified, ${safe.quarantine.excluded} reversibly excluded.`);
});
console.log(`PASS ${passed}/${passed} isolated policy tests; no live integration claim`);
