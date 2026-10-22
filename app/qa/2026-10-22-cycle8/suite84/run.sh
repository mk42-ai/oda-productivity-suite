#!/bin/bash
cd "$(dirname "$0")/../../.."
D=qa/2026-10-22-cycle8/suite84
export BASE_URL=https://sb-4pt9zz78srbe.vercel.run SHOT_DIR=$D/shots QA_OUT=$D CHROME_PATH=/usr/bin/chromium
for a in 1 2 3 5 4; do echo "START agent$a $(date -u +%FT%TZ)" >> $D/timeline.txt; ROUND=c8 timeout 900 node scripts/uae/qa/agent$a.mjs > $D/agent$a-c8.log 2>&1; echo "END agent$a rc=$? $(date -u +%FT%TZ)" >> $D/timeline.txt; done
echo "START agent4b $(date -u +%FT%TZ)" >> $D/timeline.txt; ROUND=c8b timeout 900 node scripts/uae/qa/agent4.mjs > $D/agent4-c8b.log 2>&1; echo "END agent4b rc=$? $(date -u +%FT%TZ)" >> $D/timeline.txt
echo ALLDONE >> $D/timeline.txt
