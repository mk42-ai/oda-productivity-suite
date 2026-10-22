#!/bin/bash
cd "$(dirname "$0")/../../.."
D=qa/2026-10-22-cycle8; U=https://sb-4pt9zz78srbe.vercel.run
echo "START guard $(date -u +%FT%TZ)" >> $D/laneF/timeline.txt
timeout 900 node $D/tools/white-ui-guard.mjs $U $D/laneF > $D/laneF/white-ui-guard.log 2>&1; echo "END guard rc=$? $(date -u +%FT%TZ)" >> $D/laneF/timeline.txt
echo "START sweep $(date -u +%FT%TZ)" >> $D/laneF/timeline.txt
timeout 1200 node $D/tools/sweep.mjs $U $D/sweep-after-bb15cd8.json > $D/laneF/sweep.log 2>&1; echo "END sweep rc=$? $(date -u +%FT%TZ)" >> $D/laneF/timeline.txt
echo "START residual $(date -u +%FT%TZ)" >> $D/laneF/timeline.txt
timeout 600 node scripts/uae/residual-scan.mjs --base $U --json $D/residual-scan-bb15cd8.json > $D/laneF/residual.log 2>&1; echo "END residual rc=$? $(date -u +%FT%TZ)" >> $D/laneF/timeline.txt
echo ALLDONE >> $D/laneF/timeline.txt
