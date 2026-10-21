#!/usr/bin/env bash
# Navigation regression + proof runner (2026-10-16). Usage: BASE_URL=... PROOF_DIR=... scripts/run-nav-regression.sh
# Runs navigation-e2e, chat-error-retry, navigation-retry-proof and nav-stress (serial, Chromium), prints per-suite counts,
# then tsc --noEmit and the .next/static key-leak scan. Never runs next build; never prints secrets.
set -uo pipefail
cd "$(dirname "$0")/.."
export BASE_URL="${BASE_URL:-http://localhost:5173}"
export PROOF_DIR="${PROOF_DIR:-$(cd ../../.. && pwd)/.ui-proof}"
mkdir -p /tmp/regress "$PROOF_DIR"
set -a; [ -f .env ] && . ./.env; set +a
for spec in navigation-e2e chat-error-retry navigation-retry-proof nav-stress; do
  f="e2e/$spec.spec.ts"; [ -f "$f" ] || { echo "SUITE $spec skipped (missing)"; continue; }
  PLAYWRIGHT_JSON_OUTPUT_NAME="/tmp/regress/$spec.json" node node_modules/@playwright/test/cli.js test "$f" --project=desktop --workers=1 --reporter=list,json > "/tmp/regress/$spec.log" 2>&1
  node -e 'const s=require(process.argv[1]).stats;console.log(`SUITE ${process.argv[2]} passed=${s.expected} failed=${s.unexpected} flaky=${s.flaky} skipped=${s.skipped}`)' "/tmp/regress/$spec.json" "$spec" 2>/dev/null || echo "SUITE $spec no-json (see /tmp/regress/$spec.log)"
  grep -E "^\s+[0-9]+\) |✘" "/tmp/regress/$spec.log" | head -10
done
node node_modules/typescript/bin/tsc --noEmit > /tmp/regress/tsc.log 2>&1; echo "TSC exit=$?"
node scripts/check-key-leak.mjs; echo "KEYLEAK exit=$?"
