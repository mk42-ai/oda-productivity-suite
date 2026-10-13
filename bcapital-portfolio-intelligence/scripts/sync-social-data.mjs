#!/usr/bin/env node
// Copies the merged chat-batch datasets (data/*.json, served live by the backend at GET /data/{name}) into web/src/data/social/
// so the Next server has an offline fallback bundle. Run after every merge / daily refresh: `node scripts/sync-social-data.mjs`.
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("web/src/data/social", { recursive: true });
for (const n of ["portfolio", "people", "social-feed"]) { copyFileSync(`data/${n}.json`, `web/src/data/social/${n}.json`); console.log(`synced ${n}.json`); }
