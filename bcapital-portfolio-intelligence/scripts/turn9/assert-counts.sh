#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:4000}"
BASE_URL="${BASE_URL%/}"

echo "Checking counts against $BASE_URL ..."

# Use node to fetch and assert
node -e '
const url = process.argv[1];

async function run() {
  let hasError = false;

  function assert(condition, message) {
    if (!condition) {
      console.error(`FAIL: ${message}`);
      hasError = true;
    } else {
      console.log(`PASS: ${message}`);
    }
  }

  // 1. Check persistence/status
  console.log(`\n--- Checking ${url}/persistence/status ---`);
  const statusRes = await fetch(`${url}/persistence/status`);
  if (!statusRes.ok) {
    console.error(`FAIL: ${url}/persistence/status returned status ${statusRes.status}`);
    process.exit(1);
  }
  const status = await statusRes.json();

  assert(status.ready === true, `status.ready is true (actual: ${status.ready})`);
  assert(status.boot?.action === "restored-from-ondemand-media", `boot.action === "restored-from-ondemand-media" (actual: ${status.boot?.action})`);
  assert(status.boot?.restored_from?.verified === true, `boot.restored_from.verified === true (actual: ${status.boot?.restored_from?.verified})`);
  assert(!!status.boot?.restored_from?.sha256, `boot.restored_from.sha256 present (actual: ${status.boot?.restored_from?.sha256})`);
  assert(status.counts?.posts_by_status?.verified === 10445, `posts_by_status.verified === 10445 (actual: ${status.counts?.posts_by_status?.verified})`);
  assert(status.counts?.posts_by_status?.unverified === 221, `posts_by_status.unverified === 221 (actual: ${status.counts?.posts_by_status?.unverified})`);
  assert(status.counts?.posts_by_status?.hidden === 1162, `posts_by_status.hidden === 1162 (actual: ${status.counts?.posts_by_status?.hidden})`);
  assert(status.counts?.tables?.companies === 136, `counts.tables.companies === 136 (actual: ${status.counts?.tables?.companies})`);
  assert(status.counts?.tables?.sectors === 10, `counts.tables.sectors === 10 (actual: ${status.counts?.tables?.sectors})`);

  // 2. Check social/feed?limit=1
  console.log(`\n--- Checking ${url}/social/feed?limit=1 ---`);
  const feedRes = await fetch(`${url}/social/feed?limit=1`);
  if (!feedRes.ok) {
    console.error(`FAIL: ${url}/social/feed returned status ${feedRes.status}`);
    process.exit(1);
  }
  const feed = await feedRes.json();

  assert(feed.total === 10666, `feed.total === 10666 (actual: ${feed.total})`);
  assert(feed.verified_count === 10445, `feed.verified_count === 10445 (actual: ${feed.verified_count})`);
  assert(feed.unverified_count === 221, `feed.unverified_count === 221 (actual: ${feed.unverified_count})`);

  assert(feed.by_platform?.x === 7443, `by_platform.x === 7443 (actual: ${feed.by_platform?.x})`);
  assert(feed.by_platform?.reddit === 3035, `by_platform.reddit === 3035 (actual: ${feed.by_platform?.reddit})`);
  assert(feed.by_platform?.instagram === 34, `by_platform.instagram === 34 (actual: ${feed.by_platform?.instagram})`);
  assert(feed.by_platform?.linkedin === 154, `by_platform.linkedin === 154 (actual: ${feed.by_platform?.linkedin})`);

  assert(feed.by_platform_split?.x?.verified === 7426, `by_platform_split.x.verified === 7426 (actual: ${feed.by_platform_split?.x?.verified})`);
  assert(feed.by_platform_split?.x?.unverified === 17, `by_platform_split.x.unverified === 17 (actual: ${feed.by_platform_split?.x?.unverified})`);
  assert(feed.by_platform_split?.reddit?.verified === 2994, `by_platform_split.reddit.verified === 2994 (actual: ${feed.by_platform_split?.reddit?.verified})`);
  assert(feed.by_platform_split?.reddit?.unverified === 41, `by_platform_split.reddit.unverified === 41 (actual: ${feed.by_platform_split?.reddit?.unverified})`);
  assert(feed.by_platform_split?.instagram?.verified === 25, `by_platform_split.instagram.verified === 25 (actual: ${feed.by_platform_split?.instagram?.verified})`);
  assert(feed.by_platform_split?.instagram?.unverified === 9, `by_platform_split.instagram.unverified === 9 (actual: ${feed.by_platform_split?.instagram?.unverified})`);
  assert(feed.by_platform_split?.linkedin?.verified === 0, `by_platform_split.linkedin.verified === 0 (actual: ${feed.by_platform_split?.linkedin?.verified})`);
  assert(feed.by_platform_split?.linkedin?.unverified === 154, `by_platform_split.linkedin.unverified === 154 (actual: ${feed.by_platform_split?.linkedin?.unverified})`);

  const expectedSectors = [
    "ai-enterprise", "ai-infra", "biotech", "climate", "consumer",
    "edtech", "fintech", "healthtech", "logistics", "robotics"
  ];
  const actualSectors = Object.keys(feed.by_sector || {});
  assert(actualSectors.length === 10, `exactly 10 sectors (actual: ${actualSectors.length})`);
  for (const s of expectedSectors) {
    const count = feed.by_sector?.[s];
    assert(typeof count === "number" && count > 0, `sector "${s}" count > 0 (actual: ${count})`);
  }

  if (hasError) {
    console.error("\nassert-counts: One or more assertions failed!");
    process.exit(1);
  } else {
    console.log("\nassert-counts: ALL ASSERTIONS PASSED!");
  }
}

run().catch(err => {
  console.error("assert-counts unhandled error:", err);
  process.exit(1);
});
' "$BASE_URL"
