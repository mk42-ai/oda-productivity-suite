#!/bin/bash
# Full-suite shard runner — cycle 7 (HEAD c20866c+) against the local production build (next start :5190, real OnDemand key).
cd "$(dirname "$0")/../../.."
D=qa/2026-10-21-cycle7/playwright
export BASE_URL=${BASE_URL:-http://127.0.0.1:5190}
export PROOF_DIR=$D/proof-navret
export CHROME_PATH=/usr/bin/chromium
run() { local name=$1 cap=$2; shift 2
  echo "START $name $(date -u +%FT%TZ)" >> $D/timeline.txt
  PLAYWRIGHT_JSON_OUTPUT_NAME=$D/$name.json timeout $cap node node_modules/@playwright/test/cli.js test "$@" --workers=1 --timeout=150000 --reporter=list,json --output=/tmp/pw-c7-$name > $D/$name.log 2>&1
  echo "END $name rc=$? $(date -u +%FT%TZ)" >> $D/timeline.txt; }
E=e2e
run s1 1100 $E/a11y.spec.ts $E/axe-sweep.spec.ts $E/routes-clean.spec.ts $E/live-smoke.spec.ts $E/navigation-e2e.spec.ts $E/qa-routes.spec.ts $E/copy-and-rail.spec.ts $E/keyboard-nav.spec.ts $E/context-sync.spec.ts $E/chat-error-retry.spec.ts $E/navigation-retry-proof.spec.ts $E/settings.spec.ts $E/release.spec.ts $E/title-ellipsis.spec.ts --project=desktop
run s2 1100 $E/chat.spec.ts $E/qa-chat-timing.spec.ts $E/run-panel-a11y.spec.ts $E/run-panel-acceptance.spec.ts $E/run-panel-visual.spec.ts $E/run-panel-working-header.spec.ts $E/thinking-json-filter.spec.ts $E/thinking-pinned-working-row.spec.ts $E/thread-reopen.spec.ts $E/session-continuity.spec.ts --project=desktop
run s3 1100 $E/nav-stress.spec.ts $E/run-panel-mobile.spec.ts $E/upload.spec.ts $E/upload-e2e.spec.ts $E/upload-journeys.spec.ts $E/upload-artifacts.spec.ts $E/pdf-inline-render.spec.ts $E/voice.spec.ts --project=desktop --project=mobile
PW_VIEWPORT=1440x900 PAYLOAD_OUT=$D/payload-1440 run s3p1440 600 $E/chat-intelligent-ui-payloads.spec.ts --project=desktop
PW_VIEWPORT=390x844 PAYLOAD_OUT=$D/payload-390 run s3p390 600 $E/chat-intelligent-ui-payloads.spec.ts --project=desktop
run s4 700 $E/mobile.spec.ts $E/run-ux.spec.ts --project=mobile --project=mobile-ux --project=desktop
QA_LABEL=c7full run s5 700 $E/qa-final.spec.ts --project=qa-final --project=qa-final-mobile
echo ALLDONE >> $D/timeline.txt
