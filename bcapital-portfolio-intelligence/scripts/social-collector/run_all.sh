#!/bin/bash
# Launch every job in /tmp/jobs.txt as an independent background process (one process = one worker).
cd "$(dirname "$0")"
while IFS='|' read -r id src sec slugs; do
  nohup setsid python3 job.py "$id" "$src" "$sec" "$slugs" > "../../data/social/raw/$id.log" 2>&1 < /dev/null &
  sleep 0.3
done < "${1:-/tmp/jobs.txt}"
