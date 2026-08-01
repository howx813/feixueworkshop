#!/usr/bin/env bash
# 方案 C · 本机每日标讯：同步快照，可选提交 / 部署
#
# 用法:
#   ./scripts/tenders-daily.sh              # 只同步
#   ./scripts/tenders-daily.sh --commit     # 同步后 git commit（不 push）
#   ./scripts/tenders-daily.sh --commit --push
#   ./scripts/tenders-daily.sh --deploy     # 同步后走完整 predeploy+deploy（慎用）
#
# 定时（macOS launchd）:
#   ./scripts/install-tenders-launchd.sh
#   ./scripts/install-tenders-launchd.sh --uninstall

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DO_COMMIT=0
DO_PUSH=0
DO_DEPLOY=0

for arg in "$@"; do
  case "$arg" in
    --commit) DO_COMMIT=1 ;;
    --push) DO_PUSH=1; DO_COMMIT=1 ;;
    --deploy) DO_DEPLOY=1 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
  esac
done

export PATH="/usr/bin:/bin:/opt/homebrew/bin:$PATH"

echo "[tenders-daily] $(date '+%Y-%m-%d %H:%M:%S') sync…"
npm run tenders:sync

echo "[tenders-daily] $(date '+%Y-%m-%d %H:%M:%S') aggregate…"
npm run tenders:aggregate

if [[ "$DO_COMMIT" -eq 1 ]]; then
  git add src/data/tenders.generated.json public/data/tenders.json \
    src/data/tender-trends.generated.json public/data/tender-trends.json \
    public/data/agent-activity.json data/tenders-history data/agent-activity.jsonl
  if git diff --staged --quiet; then
    echo "[tenders-daily] 快照无变化，不提交"
  else
    git commit -m "chore(tenders): daily snapshot $(date +%Y-%m-%d)"
    echo "[tenders-daily] 已 commit"
    if [[ "$DO_PUSH" -eq 1 ]]; then
      git push
      echo "[tenders-daily] 已 push"
    fi
  fi
fi

if [[ "$DO_DEPLOY" -eq 1 ]]; then
  echo "[tenders-daily] 开始 deploy（含预检）…"
  npm run deploy
fi

echo "[tenders-daily] 完成"
