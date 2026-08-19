#!/usr/bin/env bash
# 每周访问分析：51la 增量同步 → 数据有变化才 commit + push
# 加 --deploy 时同步后直接部署上线（周五定时任务用，周报 18:00 更新前拿到新数据）
# 密钥读 .env.local（LA51_ACCESS_KEY / LA51_SECRET_KEY），不写进任何提交。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node scripts/sync-analytics.mjs

if ! git diff --quiet -- public/data/site-analytics.json; then
  git add public/data/site-analytics.json
  git commit -m "chore(analytics): 周度访问分析同步 $(date +%F)"
  git push
  echo "已提交并推送新数据"
else
  echo "数据无变化，跳过提交"
fi

if [[ "${1:-}" == "--deploy" ]]; then
  npm run deploy
fi
