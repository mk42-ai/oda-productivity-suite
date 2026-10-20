#!/usr/bin/env bash
# Idempotent resume for the UAE AI Command Centre mission. Safe to re-run; each step checks state first.
#   scripts/resume-mission.sh status|build|scan|deploy|push|all
# Needs: ONDEMAND_API_KEY (server), VERCEL_AUTH_TOKEN/VERCEL_TOKEN + VERCEL_TEAM_ID + VERCEL_PROJECT_ID (deploy), GITHUB_TOKEN (push/PR).
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"; REPO="$(cd "$APP/.." && pwd)"; cd "$APP"
TAG=bcap-pre-uae-20261020T2130Z; BRANCH=uae-ai-command-centre; BASE_SHA=816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d
step=${1:-status}
status() { echo "branch: $(git -C "$REPO" branch --show-current)  head: $(git -C "$REPO" rev-parse --short HEAD)"; git -C "$REPO" tag -l "$TAG" | sed 's/^/tag: /'; jq -r '.new.preview_url' mission_state.json 2>/dev/null | sed 's/^/last preview: /'; }
build() { [ -d node_modules ] || npm ci --no-audit --no-fund --ignore-scripts; npx tsc --noEmit -p .; NEXT_TELEMETRY_DISABLED=1 npm run build; }
scan() { node scripts/uae/residual-scan.mjs ${BASE_URL:+--base "$BASE_URL"} --json mission/residual_scan.json; }
deploy() {
  export VERCEL_AUTH_TOKEN="${VERCEL_AUTH_TOKEN:-${VERCEL_TOKEN:-}}"; : "${VERCEL_AUTH_TOKEN:?}"; : "${VERCEL_TEAM_ID:?}"; : "${VERCEL_PROJECT_ID:?}"; : "${ONDEMAND_API_KEY:?set ONDEMAND_API_KEY}"
  A=(--scope "$VERCEL_TEAM_ID" --project "$VERCEL_PROJECT_ID")
  OUT=$(sandbox create "${A[@]}" --runtime node22 --timeout 90m --publish-port 5173 2>&1); echo "$OUT"
  SID=$(grep -o 'sbx_[A-Za-z0-9]*' <<<"$OUT" | head -1); URL=$(grep -o 'https://sb-[a-z0-9]*\.vercel\.run' <<<"$OUT" | head -1)
  tar czf /tmp/uaecc.tgz --exclude=node_modules --exclude=.next --exclude=tsconfig.tsbuildinfo .
  ( umask 077; printf 'ONDEMAND_API_KEY=%s\n' "$ONDEMAND_API_KEY" > /tmp/uaecc.env.local )
  sandbox copy "${A[@]}" /tmp/uaecc.tgz "$SID:/vercel/sandbox/app.tgz"; sandbox copy "${A[@]}" /tmp/uaecc.env.local "$SID:/vercel/sandbox/.env.local"; rm -f /tmp/uaecc.env.local
  sandbox exec "${A[@]}" --workdir /vercel/sandbox "$SID" bash -lc 'tar xzf app.tgz && rm app.tgz && npm ci --no-audit --no-fund --ignore-scripts >/tmp/npm.log 2>&1 && set -a && . ./.env && . ./.env.local && set +a && NEXT_TELEMETRY_DISABLED=1 npm run build >/tmp/build.log 2>&1 && (PORT=5173 nohup npm run start >/tmp/start.log 2>&1 </dev/null &)'
  for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' "$URL/health")" = 200 ] && break; sleep 2; done
  echo "SANDBOX_ID: $SID"; echo "SANDBOX_PORT: 5173"; echo "PREVIEW_URL: $URL"
}
push() {
  : "${GITHUB_TOKEN:?GITHUB_TOKEN with Contents+Pull requests write is required}"
  T="$REPO/../.goose/skills/github/tools"; [ -d "$T" ] || T=/home/appuser/.agents/skills/github/tools
  git -C "$REPO" rev-parse -q --verify "refs/tags/$TAG" >/dev/null || git -C "$REPO" tag -a "$TAG" "$BASE_SHA" -m "Rollback point before UAE AI Command Centre"
  (cd "$REPO" && git push origin "refs/tags/$TAG" || true)   # tag push (idempotent)
  (cd "$REPO" && "$T/push_branch.sh")
  (cd "$REPO" && GITHUB_OWNER=mk42-ai GITHUB_REPO=oda-productivity-suite python3 "$T/create_pr.py" --title "UAE AI National Intelligence Command Centre — Concept Demonstration" --source "$BRANCH" --base main --description "$(cat "$APP/PR_BODY.md")") || echo "PR may already exist (422) — reuse it."
}
case "$step" in status) status;; build) build;; scan) scan;; deploy) deploy;; push) push;; all) build; scan; deploy; push;; *) echo "usage: $0 status|build|scan|deploy|push|all"; exit 2;; esac
