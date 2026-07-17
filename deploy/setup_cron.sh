#!/bin/bash
# Setup cron job for HK Hot Topics pipeline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Create cron job
CRON_JOB="0 3 * * * cd ${SCRIPT_DIR} && ./main.sh >> ${LOG_DIR}/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "hk-hot-topics"; then
  echo "Cron job already exists, updating..."
  crontab -l 2>/dev/null | grep -v "hk-hot-topics" | { cat; echo "$CRON_JOB"; } | crontab -
else
  echo "Adding new cron job..."
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
fi

echo "Cron job installed!"
echo "Pipeline will run daily at 3:00 AM"
echo ""
echo "To verify: crontab -l"
echo "To remove: crontab -l | grep -v 'hk-hot-topics' | crontab -"
