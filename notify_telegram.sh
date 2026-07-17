#!/bin/bash
# Send deployed tool to Telegram

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/.env"

DATE=$(date +%Y-%m-%d)
GITHUB_URL="https://stonemokkkk.github.io/hk-hot-topics/${DATE}.html"

# Message content
MESSAGE="🇭🇰 *香港每日熱話小工具*

📅 日期：${DATE}
🔗 [點擊查看今日熱話](${GITHUB_URL})

每日自動收集香港熱門話題，用 AI 生成互動小工具 🔥"

# Send to Telegram
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
    \"text\": \"${MESSAGE}\",
    \"parse_mode\": \"Markdown\",
    \"disable_web_page_preview\": false
  }" > /dev/null

echo "[INFO] Telegram notification sent for ${DATE}"
