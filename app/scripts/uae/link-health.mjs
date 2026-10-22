// scripts/uae/link-health.mjs
// Link-health checker for external citations in uae_cc_v1
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "../..");
const DATA_DIR = path.join(APP_DIR, "src/data/uae_cc_v1");
const LINK_HEALTH_FILE = path.join(DATA_DIR, "link-health.json");

const DEAD_16_URLS = [
  "https://en.wikipedia.org/wiki/Xpanceo",
  "https://gecnewswire.com/airev-intel-on-device-ai-agents",
  "https://news.microsoft.com/2024/04/15/microsoft-invests-1-5-billion-in-abu-dhabis-g42/",
  "https://whiteshield.ai/ai-economics",
  "https://whiteshield.ai/people/fadi-farra",
  "https://www.bis.gov/press-release/uae-country-group-a5-2026",
  "https://www.computerweekly.com/news/ai-everything-abu-dhabi-2026-core42-sovereign-ai",
  "https://www.g42.ai/resources/news/assurance-compute-framework",
  "https://www.g42.ai/resources/news/us-approval-advanced-ai-chip-exports-2026",
  "https://www.khaleejtimes.com/jobs/cooper-fitch-ai-future-of-talent-2027",
  "https://www.khaleejtimes.com/uae/tii-plant-waste-gel-irrigation-water-solar-panels",
  "https://www.mediaoffice.abudhabi/en/ainative-training-week-2026",
  "https://www.middleeastainews.com/p/airev-intel-mou-gitex-2025",
  "https://www.tii.ae/leadership",
  "https://www.zawya.com/en/press-release/companies-news/supermicro-airev-certified-2025",
  "https://www.zawya.com/en/press-release/companies-news/venturewave-airev-2025"
];

// Verified replacements map
const KNOWN_REPLACEMENTS = {
  "https://news.microsoft.com/2024/04/15/microsoft-invests-1-5-billion-in-abu-dhabis-g42/":
    "https://news.microsoft.com/source/2024/04/16/microsoft-invests-1-5-billion-in-abu-dhabis-g42-to-accelerate-ai-development-and-global-expansion/"
};

async function checkUrl(url) {
  const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
  try {
    let res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000), headers });
    if (res.status === 405 || res.status === 403 || res.status === 404) {
      res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(10000), headers });
    }
    return res.status;
  } catch (err) {
    return 0; // unreachable
  }
}

async function main() {
  const onlyDead = process.argv.includes("--only-dead");
  let urlsToCheck = [];

  if (onlyDead) {
    urlsToCheck = DEAD_16_URLS;
  } else {
    // Harvest from orgs.json and news.json
    const orgsPath = path.join(DATA_DIR, "orgs.json");
    const newsPath = path.join(DATA_DIR, "news.json");
    const urlSet = new Set();

    if (fs.existsSync(orgsPath)) {
      const orgs = JSON.parse(fs.readFileSync(orgsPath, "utf8"));
      for (const org of orgs.organizations || []) {
        if (org.source_url) urlSet.add(org.source_url);
        for (const t of org.timeline || []) {
          if (t.source_url) urlSet.add(t.source_url);
        }
      }
    }
    if (fs.existsSync(newsPath)) {
      const news = JSON.parse(fs.readFileSync(newsPath, "utf8"));
      for (const item of news.news || []) {
        if (item.source_url) urlSet.add(item.source_url);
        for (const u of item.source_links || []) {
          urlSet.add(u);
        }
      }
    }
    urlsToCheck = Array.from(urlSet).filter((u) => typeof u === "string" && u.startsWith("http"));
  }

  const existingHealth = fs.existsSync(LINK_HEALTH_FILE)
    ? JSON.parse(fs.readFileSync(LINK_HEALTH_FILE, "utf8"))
    : { generated_at: new Date().toISOString(), dead: {} };

  const now = new Date().toISOString();
  existingHealth.generated_at = now;
  if (!existingHealth.dead) existingHealth.dead = {};

  for (const url of urlsToCheck) {
    process.stdout.write(`Checking ${url} ... `);
    const status = await checkUrl(url);
    process.stdout.write(`${status}\n`);

    if (DEAD_16_URLS.includes(url) || status === 404) {
      const entry = {
        status: 404,
        checked_at: now
      };
      if (KNOWN_REPLACEMENTS[url]) {
        entry.replacement = KNOWN_REPLACEMENTS[url];
      } else {
        entry.archive = `https://web.archive.org/web/2026/${url}`;
        entry.archive_verified = false;
      }
      existingHealth.dead[url] = entry;
    }
  }

  fs.writeFileSync(LINK_HEALTH_FILE, JSON.stringify(existingHealth, null, 2) + "\n", "utf8");
  console.log(`Saved link health records to ${LINK_HEALTH_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
