import fs from "node:fs";
import path from "node:path";
import { storeFile, odList } from "./store.js";
import { coverageOf } from "../pitchbook-availability.js";

export type PitchbookBackupResult = {
  snapshot_ts: string;
  media_id: string;
  media_url: string;
  sha256: string;
  bytes: number;
  verified: boolean;
  companies: number;
};

/**
 * Persists a PitchBook store snapshot to OnDemand Media.
 * Writes /tmp/pitchbook-store-<ts>.json ({snapped_at, reason, companies, coverage, profiles})
 * and calls storeFile("manifest", tmpFile) (uploaded as application/json; named pitchbook-store-<ts>.json).
 */
export async function backupPitchbookStore(
  profiles: Record<string, unknown>,
  reason: string
): Promise<PitchbookBackupResult> {
  const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const snapped_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const companies = Object.keys(profiles).length;
  const coverage = coverageOf(profiles as Record<string, any>);

  const payload = {
    snapped_at,
    reason,
    companies,
    coverage,
    profiles,
  };

  const filename = `pitchbook-store-${ts}.json`;
  const tmpFile = path.join("/tmp", filename);
  fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), "utf8");

  const stored = await storeFile("manifest", tmpFile);

  return {
    snapshot_ts: ts,
    media_id: stored.media_id,
    media_url: stored.media_url,
    sha256: stored.sha256,
    bytes: stored.bytes,
    verified: stored.verified,
    companies,
  };
}

/**
 * Lists PitchBook backups stored in OnDemand Media, filtering odList() by name prefix 'pitchbook-store-'.
 */
export async function listPitchbookBackups(limit = 50, page = 1): Promise<any[]> {
  const list = await odList(limit, page);
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item: any) => typeof item?.name === "string" && item.name.startsWith("pitchbook-store-")
  );
}
