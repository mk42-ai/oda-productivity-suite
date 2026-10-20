#!/usr/bin/env node
// Scans web/.next/static for the literal ONDEMAND_API_KEY value. Never prints the value.
// Exit 0 = clean, 1 = leak found, 2 = key unavailable / no build.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let key = process.env.ONDEMAND_API_KEY || "";
if (!key) { try { const m = fs.readFileSync(path.join(WEB, ".env"), "utf8").match(/^ONDEMAND_API_KEY=(.*)$/m); key = (m?.[1] ?? "").trim().replace(/^["']|["']$/g, ""); } catch {} }
const root = path.join(WEB, ".next", "static");
if (!key || !fs.existsSync(root)) { console.log(JSON.stringify({ keyPresent: !!key, staticDir: fs.existsSync(root), filesScanned: 0, occurrences: 0, files: [] })); process.exit(2); }
let files = 0, occ = 0; const hit = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { files++; const n = fs.readFileSync(p, "latin1").split(key).length - 1; if (n) { occ += n; hit.push(path.relative(WEB, p)); } } } };
walk(root);
console.log(JSON.stringify({ keyPresent: true, filesScanned: files, occurrences: occ, files: hit }));
process.exit(occ ? 1 : 0);
