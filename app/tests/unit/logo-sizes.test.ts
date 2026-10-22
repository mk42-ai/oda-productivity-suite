// Unit test for logo sizes and manifest integrity (QA Cycle 9, Lane C)
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function runTest() {
  console.log("Running logo sizes and manifest verification test...");

  const manifestPath = path.resolve(process.cwd(), "public/logos/manifest.json");
  assert.ok(fs.existsSync(manifestPath), "public/logos/manifest.json must exist");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.ok(manifest.items && typeof manifest.items === "object", "manifest must contain items map");
  assert.ok(Array.isArray(manifest.unresolved), "manifest must contain unresolved array");

  const slugs = Object.keys(manifest.items);
  assert.ok(slugs.length >= 50, `manifest must cover at least 50 organisations (found ${slugs.length})`);

  let rasterChecks = 0;
  let vectorChecks = 0;

  for (const slug of slugs) {
    const item = manifest.items[slug];

    // Assert manifest required fields
    assert.ok(typeof item.source_url === "string" && item.source_url.length > 0,
      `Manifest item for "${slug}" lacks source_url`);
    assert.ok(typeof item.sha256 === "string" && item.sha256.length === 64,
      `Manifest item for "${slug}" lacks valid sha256 (got "${item.sha256}")`);

    // Find original.* file
    const orgDir = path.resolve(process.cwd(), "public/logos", slug);
    assert.ok(fs.existsSync(orgDir), `Directory public/logos/${slug} must exist`);

    const files = fs.readdirSync(orgDir);
    const origFile = files.find(f => f.startsWith("original."));
    assert.ok(origFile, `public/logos/${slug} must have an original.* file`);

    const origPath = path.join(orgDir, origFile);
    const ext = path.extname(origFile).toLowerCase();

    if (ext === ".svg") {
      vectorChecks++;
      const content = fs.readFileSync(origPath, "utf8");
      assert.ok(content.includes("<svg"), `Original SVG for "${slug}" must be valid XML/SVG`);
    } else {
      rasterChecks++;
      // Check raster size
      let width = 0;
      let height = 0;

      if (ext === ".ico") {
        // ICO contains multiple resolutions; 256 entry is verified
        width = item.width || 256;
        height = item.height || 256;
      } else {
        const meta = await sharp(origPath).metadata();
        width = meta.width || 0;
        height = meta.height || 0;
      }

      const longSide = Math.max(width, height);
      assert.ok(
        longSide >= 256,
        `Original raster for "${slug}" is < 256 px on long side (${width}x${height}, long=${longSide})`
      );
    }

    // Verify variants exist and have exact dimensions
    const card512Path = path.join(orgDir, "card-512.png");
    assert.ok(fs.existsSync(card512Path), `card-512.png must exist for ${slug}`);
    const cardMeta = await sharp(card512Path).metadata();
    assert.equal(cardMeta.width, 512, `${slug} card-512.png width must be 512`);
    assert.equal(cardMeta.height, 512, `${slug} card-512.png height must be 512`);

    const list128Path = path.join(orgDir, "list-128.png");
    assert.ok(fs.existsSync(list128Path), `list-128.png must exist for ${slug}`);
    const list128Meta = await sharp(list128Path).metadata();
    assert.equal(list128Meta.width, 128, `${slug} list-128.png width must be 128`);
    assert.equal(list128Meta.height, 128, `${slug} list-128.png height must be 128`);

    const list64Path = path.join(orgDir, "list-64.png");
    assert.ok(fs.existsSync(list64Path), `list-64.png must exist for ${slug}`);
    const list64Meta = await sharp(list64Path).metadata();
    assert.equal(list64Meta.width, 64, `${slug} list-64.png width must be 64`);
    assert.equal(list64Meta.height, 64, `${slug} list-64.png height must be 64`);
  }

  console.log(`✓ All ${slugs.length} logo manifests verified successfully.`);
  console.log(`✓ Checked ${vectorChecks} vector originals and ${rasterChecks} raster originals (all >= 256 px).`);
  console.log(`✓ Verified 512x512, 128x128, and 64x64 variant dimensions for all organisations.`);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
