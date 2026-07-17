#!/bin/bash
# Main entry point for HK Hot Topics pipeline
# Runs: scraper → generator → deploy

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
TODAY=$(date +%Y-%m-%d)

# Create log directory
mkdir -p "$LOG_DIR"

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/pipeline_${TODAY}.log"
}

log "=== Starting HK Hot Topics Pipeline ==="

# Step 1: Run scraper
log "Step 1: Running scraper..."
cd "$SCRIPT_DIR"
python -m scraper.scraper 2>&1 | tee -a "$LOG_DIR/scraper.log"

if [ $? -ne 0 ]; then
  log "[ERROR] Scraper failed, but continuing..."
fi

# Step 2: Check if trends file exists
TRENDS_FILE="${SCRIPT_DIR}/data/trends_${TODAY}.json"
if [ ! -f "$TRENDS_FILE" ]; then
  log "[ERROR] Trends file not found: $TRENDS_FILE"
  exit 1
fi

# Step 3: Run generator
log "Step 3: Running LLM generator..."
source "${SCRIPT_DIR}/.env" 2>/dev/null || true  # Load env vars if exists
node "${SCRIPT_DIR}/generator/generator.js" 2>&1 | tee -a "$LOG_DIR/generator.log"

if [ $? -ne 0 ]; then
  log "[ERROR] Generator failed, but continuing..."
fi

# Step 4: Check if HTML was generated
HTML_FILE="${SCRIPT_DIR}/output/${TODAY}.html"
if [ ! -f "$HTML_FILE" ]; then
  log "[ERROR] HTML file not found: $HTML_FILE"
  exit 1
fi

# Step 5: Deploy
log "Step 5: Deploying..."
node "${SCRIPT_DIR}/deploy/deploy.js" 2>&1 | tee -a "$LOG_DIR/deploy.log"

if [ $? -ne 0 ]; then
  log "[ERROR] Deploy failed"
  exit 1
fi

log "=== Pipeline complete! ==="
log "Tool available at: http://your-server/${TODAY}.html"
