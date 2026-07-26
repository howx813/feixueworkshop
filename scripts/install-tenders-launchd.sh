#!/usr/bin/env bash
# 安装 / 卸载 macOS 每日标讯 launchd（默认每天 09:05 本机同步 + commit + push）
# 凭证读项目 .env.local（BXND_USERNAME / BXND_PASSWORD），不写进 plist。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.feixue.workshop.tenders-daily"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$ROOT/.logs"
LOG_OUT="$LOG_DIR/tenders-daily.out.log"
LOG_ERR="$LOG_DIR/tenders-daily.err.log"

# 可选：第二个参数改点钟，默认 9 点 5 分
HOUR="${2:-9}"
MINUTE="${3:-5}"

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
    <string>cd '${ROOT}' &amp;&amp; ./scripts/tenders-daily.sh --commit --push</string>
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
echo "  动作: tenders:sync → commit → push"
echo "  日志: ${LOG_OUT}"
echo "  卸载: $0 --uninstall"
echo ""
echo "线上要看到新数据，还需在 push 后部署一次，或手动:"
echo "  npm run deploy"
echo "也可改 tenders-daily.sh 加 --deploy（会跑完整预检，更重）。"
