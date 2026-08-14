#!/usr/bin/env bash
# 安装 / 卸载 macOS 每日标讯 launchd
# 默认：每天 10:00 同步 + commit + push + deploy（线上自动更新）
# 凭证读项目 .env.local（BXND_USERNAME / BXND_PASSWORD），不写进 plist。
#
# 用法:
#   ./scripts/install-tenders-launchd.sh              # 10:00 + deploy
#   ./scripts/install-tenders-launchd.sh install 10 0
#   ./scripts/install-tenders-launchd.sh install 10 0 --no-deploy
#   ./scripts/install-tenders-launchd.sh --uninstall

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.feixue.workshop.tenders-daily"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$ROOT/.logs"
LOG_OUT="$LOG_DIR/tenders-daily.out.log"
LOG_ERR="$LOG_DIR/tenders-daily.err.log"

# 参数：install [HOUR] [MINUTE] [--no-deploy]
HOUR="10"
MINUTE="0"
DO_DEPLOY=1
ARGS=()
for a in "$@"; do
  case "$a" in
    --uninstall) ARGS+=("$a") ;;
    --no-deploy) DO_DEPLOY=0 ;;
    install) ;;
    *) ARGS+=("$a") ;;
  esac
done
if [[ "${ARGS[0]:-}" == "--uninstall" ]]; then
  :
elif [[ "${#ARGS[@]}" -ge 1 && "${ARGS[0]}" =~ ^[0-9]+$ ]]; then
  HOUR="${ARGS[0]}"
  MINUTE="${ARGS[1]:-0}"
elif [[ "${#ARGS[@]}" -ge 2 && "${ARGS[1]}" =~ ^[0-9]+$ ]]; then
  # install 10 0
  HOUR="${ARGS[0]}"
  MINUTE="${ARGS[1]}"
fi

uninstall() {
  if launchctl print "gui/$(id -u)/${LABEL}" &>/dev/null; then
    launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  fi
  rm -f "$PLIST"
  echo "已卸载 ${LABEL}"
}

if [[ "${1:-}" == "--uninstall" ]]; then
  uninstall
  exit 0
fi

mkdir -p "$LOG_DIR" "$(dirname "$PLIST")"
chmod +x "$ROOT/scripts/tenders-daily.sh"

# 先卸载旧任务，再写 plist（避免写完又被 uninstall 删掉）
uninstall 2>/dev/null || true

DAILY_FLAGS="--commit --push"
if [[ "$DO_DEPLOY" -eq 1 ]]; then
  DAILY_FLAGS="--commit --push --deploy"
fi

# 用 login shell 加载 nvm/homebrew；工作目录固定仓库
cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd '${ROOT}' &amp;&amp; ./scripts/tenders-daily.sh ${DAILY_FLAGS}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${HOUR}</integer>
    <key>Minute</key>
    <integer>${MINUTE}</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOG_OUT}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_ERR}</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

plutil -lint "$PLIST"
if ! launchctl bootstrap "gui/$(id -u)" "$PLIST" 2>/tmp/feixue-launchd-err.txt; then
  # 兼容旧系统
  launchctl load -w "$PLIST" 2>>/tmp/feixue-launchd-err.txt || {
    echo "launchd 加载失败:"
    cat /tmp/feixue-launchd-err.txt 2>/dev/null || true
    exit 1
  }
fi
launchctl enable "gui/$(id -u)/${LABEL}" 2>/dev/null || true

echo "已安装 ${LABEL}"
echo "  时间: 每天 ${HOUR}:$(printf '%02d' "$MINUTE")（本机时区）"
echo "  动作: tenders:sync → aggregate → commit → push${DO_DEPLOY:+ → deploy}"
echo "  日志: ${LOG_OUT}"
echo "  卸载: $0 --uninstall"
if [[ "$DO_DEPLOY" -eq 1 ]]; then
  echo "  说明: 含完整 predeploy+deploy，约数分钟；本机需开机且 tcb 已登录"
else
  echo "  说明: 仅 push，线上需另跑 npm run deploy"
fi
