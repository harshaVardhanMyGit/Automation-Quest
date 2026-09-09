# Setup & Installation Guide

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 20+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | any | `git --version` |

---

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (Chromium, Firefox, WebKit)
npx playwright install

# Install system dependencies for Playwright (Linux only)
npx playwright install-deps

# Copy environment config and fill in your values
cp .env.example .env
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run in headed mode (see the browser)
npm run test:headed

# Run on specific browsers
npm run test:chrome
npm run test:firefox
npm run test:edge

# Run by test type
npm run test:api          # API tests only
npm run test:ui           # UI tests only
npm run test:a11y         # Accessibility tests
npm run test:perf         # Performance tests

# Run BDD/Cucumber tests
npm run test:bdd

# Run tests in parallel (4 workers)
npm run test:parallel

# Run mobile tests (requires Appium server running)
npm run test:mobile
```

---

## Reports & Notifications

```bash
# Generate and open Allure report
npm run report

# Send email report
npm run notify

# Send MS Teams report
npm run notify:teams

# Send both
npm run notify:all
```

---

## AI-Powered Features

```bash
# Generate tests from problem statement
npm run ai:generate-tests

# Analyze test failures with AI
npm run ai:analyze-failures

# Generate bug report with AI
npm run ai:generate-bug-report
```

---

## Environment Variables (.env)

Copy `.env.example` to `.env` and fill in your values:

```
BASE_URL=https://your-app-url.com
AI_PROVIDER=openai              # or "anthropic"
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SMTP_HOST=smtp.gmail.com        # for email notifications
SMTP_USER=your-email
SMTP_PASS=your-app-password
EMAIL_RECIPIENTS=team@example.com
TEAMS_WEBHOOK_URL=https://...   # for MS Teams notifications
APPIUM_SERVER=http://127.0.0.1:4723
MOBILE_PLATFORM=Android
AUTOMATION_NAME=UiAutomator2
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `BASE_URL` | Yes | Target application URL for UI tests |
| `AI_PROVIDER` | For AI features | `openai` or `anthropic` |
| `OPENAI_API_KEY` | For AI (OpenAI) | GPT-4o API key |
| `ANTHROPIC_API_KEY` | For AI (Anthropic) | Claude API key |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_RECIPIENTS` | For email reports | SMTP server credentials and recipients |
| `TEAMS_WEBHOOK_URL` | For Teams reports | MS Teams incoming webhook URL |
| `APPIUM_SERVER` / `MOBILE_PLATFORM` / `AUTOMATION_NAME` | For mobile tests | Appium server and device automation settings |

---

## Quick Start (One Command)

```bash
npm install && npx playwright install && cp .env.example .env && npm test
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Playwright browsers not found | Run `npx playwright install` |
| Permission errors on Linux | Run `npx playwright install-deps` for system libs |
| AI features not working | Verify `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env` |
| Appium tests failing | Start Appium server first: `appium` |
| Node version mismatch | Use `nvm install 20 && nvm use 20` |
| TypeScript compile errors | Run `npx tsc --noEmit` to check types |
| Allure report not opening | Ensure `allure-commandline` is installed: `npm install -g allure-commandline` |
