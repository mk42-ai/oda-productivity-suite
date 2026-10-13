import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backupPitchbookStore } from "../../src/persist/pitchbook-backup.js";

// Load .env if present (orchestrator will supply ONDEMAND_API_KEY)
function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let val = trimmed.slice(eq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      break;
    }
  }
}

async function main() {
  loadEnv();

  const candidates = [
    path.resolve(process.cwd(), "data/pitchbook/profiles.json"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/pitchbook/profiles.json"),
  ];
  const profilesPath = candidates.find((p) => fs.existsSync(p));
  if (!profilesPath) {
    throw new Error("data/pitchbook/profiles.json not found");
  }

  const raw = fs.readFileSync(profilesPath, "utf8");
  const profiles = JSON.parse(raw) as Record<string, unknown>;
  const count = Object.keys(profiles).length;

  const reason = process.argv[2] || "cli-pitchbook-backup";
  console.log(`Starting PitchBook store backup: ${count} companies (reason: ${reason})`);

  const result = await backupPitchbookStore(profiles, reason);
  console.log("PitchBook store backup completed successfully:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("PitchBook backup failed:", err);
  process.exit(1);
});
