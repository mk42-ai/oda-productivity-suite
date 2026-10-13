#!/usr/bin/env bash
set -euo pipefail

WORKTREE_DIR="/tmp/wt9/a9"
cd "$WORKTREE_DIR"

DB_FILE="/tmp/wt9/a9-qa-empty.db"
LOG_FILE="$WORKTREE_DIR/web/proof/turn9/agent-9/isolated-4100.log"
STATUS_JSON="$WORKTREE_DIR/web/proof/turn9/agent-9/isolated-persistence-status.json"
FEED_JSON="$WORKTREE_DIR/web/proof/turn9/agent-9/isolated-social-feed.json"

mkdir -p "$WORKTREE_DIR/web/proof/turn9/agent-9"

# Ensure clean slate before starting
rm -f "${DB_FILE}"*

SERVER_PID=""

cleanup() {
  echo "Cleaning up..."
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping isolated server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    # wait a bit and force kill if still running
    sleep 2
    kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "${DB_FILE}"*
  echo "Cleanup complete."
}
trap cleanup EXIT INT TERM

echo "Starting isolated instance on PORT=4100..."
# Notice: Never print .env values
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a

PORT=4100 BASE_PATH= PERSIST_DB_URL="file:$DB_FILE" DB_PATH=./data/portfolio.sqlite nohup setsid npx tsx src/server.ts > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "Isolated server PID: $SERVER_PID"

echo "Waiting for http://127.0.0.1:4100/health (up to 120s)..."
READY=0
for i in $(seq 1 120); do
  if curl -s -f http://127.0.0.1:4100/health >/dev/null 2>&1; then
    echo "Server healthy after ${i}s"
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "ERROR: Server on 4100 failed to become healthy within 120s"
  tail -n 50 "$LOG_FILE"
  exit 1
fi

echo "Fetching persistence status..."
curl -s http://127.0.0.1:4100/persistence/status > "$STATUS_JSON"
cp "$STATUS_JSON" "$WORKTREE_DIR/web/proof/turn9/agent-9/persistence-status-4100.json"

echo "Fetching social feed..."
curl -s "http://127.0.0.1:4100/social/feed?limit=1" > "$FEED_JSON"
cp "$FEED_JSON" "$WORKTREE_DIR/web/proof/turn9/agent-9/social-feed-4100.json"

echo "Running assert-counts against http://127.0.0.1:4100..."
"$WORKTREE_DIR/scripts/turn9/assert-counts.sh" http://127.0.0.1:4100

echo "Restore guard check PASSED successfully!"
