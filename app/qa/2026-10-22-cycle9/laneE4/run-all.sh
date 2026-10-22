#!/bin/bash
# Full-suite shard runner — cycle 9 (HEAD b91d69c) against the local production build (next start :5190, real OnDemand key).
cd "$(dirname "$0")/../../.."
D=qa/2026-10-22-cycle9/laneE4
export BASE_URL=${BASE_URL:-http://127.0.0.1:5190}
export PROOF_DIR=$D/proof-navret
export CHROME_PATH=/usr/bin/chromium

mkdir -p "$D" "$PROOF_DIR"

run() {
  local name=$1 cap=$2; shift 2
  echo "START $name $(date -u +%FT%TZ)" >> $D/timeline.txt
  PLAYWRIGHT_JSON_OUTPUT_NAME=$D/$name.json timeout $cap node node_modules/@playwright/test/cli.js test "$@" --workers=1 --timeout=150000 --reporter=list,json --output=/tmp/pw-c9-$name > $D/$name.log 2>&1
  local rc=$?
  echo "END $name rc=$rc $(date -u +%FT%TZ)" >> $D/timeline.txt
  return $rc
}

E=e2e

run_concurrent() {
  echo "Starting concurrent shards s1, s2, s3..."
  run s1 1100 $E/navigation.spec.ts $E/a11y.spec.ts $E/axe-sweep.spec.ts $E/routes-clean.spec.ts $E/live-smoke.spec.ts $E/navigation-e2e.spec.ts $E/qa-routes.spec.ts $E/copy-and-rail.spec.ts $E/keyboard-nav.spec.ts $E/context-sync.spec.ts $E/chat-error-retry.spec.ts $E/navigation-retry-proof.spec.ts $E/settings.spec.ts $E/release.spec.ts $E/title-ellipsis.spec.ts --project=desktop &
  pid_s1=$!

  run s2 1100 $E/chat.spec.ts $E/qa-chat-timing.spec.ts $E/run-panel-a11y.spec.ts $E/run-panel-acceptance.spec.ts $E/run-panel-visual.spec.ts $E/run-panel-working-header.spec.ts $E/thinking-json-filter.spec.ts $E/thinking-pinned-working-row.spec.ts $E/thread-reopen.spec.ts $E/session-continuity.spec.ts --project=desktop &
  pid_s2=$!

  run s3 1100 $E/nav-stress.spec.ts $E/run-panel-mobile.spec.ts $E/upload.spec.ts $E/upload-e2e.spec.ts $E/upload-journeys.spec.ts $E/upload-artifacts.spec.ts $E/pdf-inline-render.spec.ts $E/voice.spec.ts --project=desktop --project=mobile &
  pid_s3=$!

  wait $pid_s1
  wait $pid_s2
  wait $pid_s3
  echo "Concurrent shards s1, s2, s3 finished."
}

run_s4() {
  # s3p1440 and s3p390 skipped: covered by Lane E2 on local+HTTPS
  echo "SKIP s3p1440 and s3p390 (covered by Lane E2 on local+HTTPS) $(date -u +%FT%TZ)" >> $D/timeline.txt
  run s4 700 $E/mobile.spec.ts $E/run-ux.spec.ts --project=mobile --project=mobile-ux --project=desktop
}

run_s5() {
  QA_LABEL=c9full run s5 700 $E/qa-final.spec.ts --project=qa-final --project=qa-final-mobile
  echo "ALLDONE $(date -u +%FT%TZ)" >> $D/timeline.txt
}

TARGET=${1:-all}
case "$TARGET" in
  s1-s3|concurrent)
    run_concurrent
    ;;
  s4)
    run_s4
    ;;
  s5)
    run_s5
    ;;
  all)
    run_concurrent
    run_s4
    run_s5
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    exit 1
    ;;
esac
