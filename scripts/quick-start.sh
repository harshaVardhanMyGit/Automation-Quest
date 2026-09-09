#!/bin/bash
# Quick-start script for hackathon day
# Usage: bash scripts/quick-start.sh <BASE_URL> <API_URL>

set -e

BASE_URL=${1:-"https://stg.gajab.com/"}
API_URL=${2:-"https://stg.gajab.com/"}

echo "=== TestAutothon Quick Setup ==="

# Copy .env template if no .env exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from template"
fi

# Update URLs in .env
sed -i "s|BASE_URL=.*|BASE_URL=$BASE_URL|" .env
sed -i "s|API_BASE_URL=.*|API_BASE_URL=$API_URL|" .env
echo "[OK] Updated BASE_URL=$BASE_URL"
echo "[OK] Updated API_BASE_URL=$API_URL"

# Install dependencies
echo "[...] Installing dependencies..."
npm install
echo "[OK] Dependencies installed"

# Install Playwright browsers
echo "[...] Installing Playwright browsers..."
npx playwright install chromium
echo "[OK] Browsers installed"

# Create output directories
mkdir -p reports/screenshots reports/logs

echo ""
echo "=== Ready! ==="
echo "  Run tests:       npx playwright test"
echo "  Run specific:    npx playwright test sample-web"
echo "  Run headed:      npx playwright test --headed"
echo "  Generate report: npx allure generate allure-results -o allure-report"
echo "  AI test gen:     npx ts-node src/ai/test-generator.ts problem.txt"
echo "  Send report:     npx ts-node src/notifications/send-report.ts test-results.json"
