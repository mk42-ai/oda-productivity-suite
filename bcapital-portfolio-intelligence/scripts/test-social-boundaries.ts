/** Read-only boundary regression tests against existing cached files; no fixture ingestion. */
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
process.env.DB_READONLY = "1";
const { app } = await import("../src/app.js");
const { readDataset, readSocialFeed, queryFeed } = await import("../src/social-data.js");
const raw = readDataset("social-feed");
const original = JSON.stringify(raw);
let passed = 0;
for (const path of ["/data/social-feed", "/data/social-feed.json", "/social/feed", "/social/feed?platform=reddit", "/social/feed?platform=instagram", "/social/feed?sector=fintech&limit=1&offset=1"]) {
  const res = await app.request(`http://local${path}`);
  assert.equal(res.status, 200, path);
  const body = await res.json() as any;
  const records = body.posts ?? body.data;
  const expected = (await readSocialFeed())!.posts.filter((p: any) => !path.includes("platform=") || p.platform === new URL(`http://local${path}`).searchParams.get("platform"));
  if (!path.includes("offset=")) assert.equal(records.length, expected.length, path);
  assert.ok(body.quarantine.excluded >= raw.posts.length);
  assert.equal(body.providers.length, 5);
  assert.equal(body.policy_version, "social-native-v2");
  console.log(`PASS ${path}: ${records.length} receipt-verified posts; raw records remain quarantined`); passed++;
}
for (const platform of ["news", "rss", "facebook", "perplexity", "unknown"]) {
  const res = await app.request(`http://local/social/feed?platform=${platform}`);
  assert.equal(res.status, 400); console.log(`PASS unknown/non-social provider rejected: ${platform}`); passed++;
}
assert.ok((await readSocialFeed())!.count >= 2);
assert.ok((await queryFeed({}))!.total >= 2);
assert.equal(JSON.stringify(readDataset("social-feed")), original);
console.log(`PASS raw cache unchanged across public/API reads (${raw.posts.length} records)`); passed++;
console.log(`PASS ${passed}/${passed} read-only API/cache boundary tests; no live provider retrieval asserted`);
