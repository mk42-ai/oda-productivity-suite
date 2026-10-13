import fs from "node:fs";
import crypto from "node:crypto";
import { importNativeXReceipt, writeCollectionState, readCollectionState, readNativePosts, quarantineLegacyPosts } from "../src/social-native.js";
const [input, signingKeyFile] = process.argv.slice(2);
if (!input || !signingKeyFile) throw new Error("Usage: tsx scripts/import-native-social.ts <source-receipt.json> <private-signing-key-file>; never pass secret values");
const envelope = JSON.parse(fs.readFileSync(input, "utf8"));
const companies = JSON.parse(fs.readFileSync("data/portfolio.json", "utf8")).companies;
const privateKey = fs.readFileSync(signingKeyFile, "utf8");
const publicKey = crypto.createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
const publicFile = "data/social-receipt-public.pem";
if (fs.existsSync(publicFile) && fs.readFileSync(publicFile, "utf8") !== publicKey) throw new Error("Existing receipt key differs; do not overwrite provenance");
fs.writeFileSync(publicFile, publicKey);
const initialExcluded = await quarantineLegacyPosts(JSON.parse(fs.readFileSync("data/social-feed.json", "utf8")).posts);
const result = await importNativeXReceipt(envelope, companies, envelope.source, privateKey);
const old = await readCollectionState(); const all = await readNativePosts();
await writeCollectionState({ ...old, ...result, admitted_unique: all.length, initial_verified: old.initial_verified || 0, initial_excluded: initialExcluded, receipt_imported_at: new Date().toISOString(), last_successful_native_collection_at: null,
  provenance_scope: "Reused platform-attached FetchTweetDetails response; provider fetch time was not supplied. Not a new worker retrieval." });
console.log(JSON.stringify({ ...result, admitted_total: all.length, private_key_exported: false }));
