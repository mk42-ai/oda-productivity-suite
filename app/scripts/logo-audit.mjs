#!/usr/bin/env node
/**
 * Logo audit script (QA Cycle 9, Lane C).
 * Audits public/logos/<slug>/ assets, verifies originals >= 256 px, and reports monogram status.
 * Run with: npm run logo:audit or node scripts/logo-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function audit() {
  console.log('========================================');
  console.log(' UAE Capability Census — Logo Asset Audit');
  console.log('========================================\n');

  const manifestPath = path.resolve(process.cwd(), 'public/logos/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('ERROR: public/logos/manifest.json not found!');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const slugs = Object.keys(manifest.items);

  const stats = {
    official: 0,
    wikimedia: 0,
    linkedin: 0,
    icon: 0,
    monogram: 0,
    total: slugs.length,
    issues: []
  };

  for (const slug of slugs) {
    const item = manifest.items[slug];
    const tier = item.status;
    if (stats[tier] !== undefined) {
      stats[tier]++;
    }

    const orgDir = path.resolve(process.cwd(), 'public/logos', slug);
    if (!fs.existsSync(orgDir)) {
      stats.issues.push(`[${slug}] Directory missing: public/logos/${slug}`);
      continue;
    }

    const files = fs.readdirSync(orgDir);
    const orig = files.find(f => f.startsWith('original.'));
    if (!orig) {
      stats.issues.push(`[${slug}] Original file missing in public/logos/${slug}`);
      continue;
    }

    const origPath = path.join(orgDir, orig);
    const ext = path.extname(orig).toLowerCase();

    if (ext !== '.svg') {
      let width = item.width;
      let height = item.height;
      if (ext !== '.ico') {
        try {
          const meta = await sharp(origPath).metadata();
          width = meta.width;
          height = meta.height;
        } catch (err) {
          stats.issues.push(`[${slug}] Failed to read image metadata: ${err.message}`);
        }
      }

      const longSide = Math.max(width || 0, height || 0);
      if (longSide < 256) {
        stats.issues.push(`[${slug}] Raster original < 256 px: ${width}x${height} (long: ${longSide})`);
      }
    }

    // Check variants
    for (const v of ['card-512.png', 'list-128.png', 'list-64.png']) {
      if (!fs.existsSync(path.join(orgDir, v))) {
        stats.issues.push(`[${slug}] Variant missing: ${v}`);
      }
    }

    if (tier !== 'monogram') {
      const uaeCompat = path.resolve(process.cwd(), 'public/logos/uae', `${slug}.png`);
      if (!fs.existsSync(uaeCompat)) {
        stats.issues.push(`[${slug}] Legacy compat copy missing: public/logos/uae/${slug}.png`);
      }
    }
  }

  console.log(`Audited ${stats.total} entities:`);
  console.log(`  - Official brand assets : ${stats.official}`);
  console.log(`  - Wikimedia / Commons   : ${stats.wikimedia}`);
  console.log(`  - LinkedIn assets       : ${stats.linkedin}`);
  console.log(`  - Icons (apple/og)      : ${stats.icon}`);
  console.log(`  - Monograms             : ${stats.monogram}`);

  console.log(`\nResolved total           : ${stats.official + stats.wikimedia + stats.linkedin + stats.icon}`);
  console.log(`Unresolved (monograms)   : ${stats.monogram}`);

  if (manifest.unresolved && manifest.unresolved.length > 0) {
    console.log('\nUnresolved Organisations (using monogram placeholder):');
    for (const slug of manifest.unresolved) {
      const rec = manifest.items[slug];
      console.log(`  • ${slug.padEnd(22)} : ${rec?.entity_check || 'no official vector/raster logo'}`);
    }
  }

  if (stats.issues.length > 0) {
    console.error(`\nFound ${stats.issues.length} audit issue(s):`);
    for (const issue of stats.issues) {
      console.error(`  ✕ ${issue}`);
    }
    process.exit(1);
  } else {
    console.log('\n✓ Audit PASSED: All originals >= 256 px, variants validated, manifest intact.\n');
  }
}

audit().catch(err => {
  console.error('Audit script encountered error:', err);
  process.exit(1);
});
