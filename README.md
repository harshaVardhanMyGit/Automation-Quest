# Automation Framework

A multi-layer test automation framework supporting web, API, mobile, accessibility, and performance testing with AI-powered self-healing and reporting.

**Tech Stack:** Playwright, TypeScript, Cucumber BDD, Allure, Appium, axe-core, OpenAI / Anthropic Claude

---

## Directory Structure

```
automation-framework/
├── src/
│   ├── ai/                        # AI-powered testing features
│   │   ├── ai-client.ts           # Dual-provider client (OpenAI GPT-4o / Anthropic Claude)
│   │   ├── self-healer.ts         # Self-healing locator system
│   │   ├── test-generator.ts      # AI test case generation from requirements
│   │   ├── failure-analyzer.ts    # AI-powered failure root cause analysis
│   │   └── bug-report-generator.ts# AI-generated bug reports from test results
│   ├── api/
│   │   └── ApiClient.ts           # HTTP client for API testing (GET/POST/PUT/DELETE)
│   ├── mobile/
│   │   ├── appium-driver.ts       # Appium WebDriver configuration
│   │   └── run-mobile-tests.ts    # Mobile test runner entry point
│   ├── notifications/
│   │   ├── send-email-report.ts   # SMTP email report sender
│   │   └── send-teams-report.ts   # MS Teams webhook notification
│   ├── pages/
│   │   ├── BasePage.ts            # Base page object (self-healing, network interception, screenshots)
│   │   └── SamplePage.ts          # Example page object implementation
│   ├── tests/
│   │   ├── features/              # Cucumber .feature files (Gherkin)
│   │   │   ├── sample-web.feature
│   │   │   ├── sample-api.feature
│   │   │   └── sample-mobile.feature
│   │   ├── specs/                 # Playwright spec files
│   │   │   ├── sample-web.spec.ts
│   │   │   ├── sample-api.spec.ts
│   │   │   ├── accessibility.spec.ts
│   │   │   ├── api-performance.spec.ts
│   │   │   └── network-debug.spec.ts
│   │   └── step-definitions/      # Cucumber step implementations
│   │       ├── web.steps.ts
│   │       ├── api.steps.ts
│   │       └── mobile.steps.ts
│   └── utils/
│       ├── logger.ts              # Winston-based structured logging
│       ├── network-interceptor.ts # Request/response capture and reporting
│       ├── accessibility.ts       # axe-core accessibility scanning utilities
│       ├── data-scraper.ts        # Web data extraction helpers
│       └── self-healing-fixture.ts# Playwright fixture with self-healing wired in
├── config/
│   ├── test-data.json             # Shared test data (URLs, credentials, endpoints)
│   └── performance-thresholds.json# SLA thresholds per endpoint + load test config
├── allure-config/
│   ├── categories.json            # Allure report failure categories
│   └── environment.properties     # Allure environment metadata
├── templates/
│   ├── bug-report-template.md     # Template for AI-generated bug reports
│   └── test-strategy-template.md  # Test strategy document template
├── scripts/
│   └── quick-start.sh             # One-command hackathon day setup
├── .github/workflows/test.yml     # GitHub Actions CI pipeline
├── playwright.config.ts           # Playwright config (browsers, reporters, parallelism)
├── cucumber.js                    # Cucumber BDD configuration
├── tsconfig.json                  # TypeScript config with path aliases
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and npm scripts
├── SETUP.md                       # Installation & setup commands
└── README.md                      # This file
```

---

## Key Concepts

### Testing Layers

| Layer | What It Does | Files |
|-------|-------------|-------|
| **Web UI Testing** | Browser automation using Playwright across Chrome, Firefox, Edge, and mobile Chrome | `src/tests/specs/sample-web.spec.ts`, `playwright.config.ts` |
| **API Testing** | REST API validation (GET/POST/PUT/DELETE) with status code and response body assertions | `src/api/ApiClient.ts`, `src/tests/specs/sample-api.spec.ts` |
| **Mobile Testing** | Android/iOS app automation via Appium + WebDriverIO | `src/mobile/appium-driver.ts`, `src/mobile/run-mobile-tests.ts` |
| **Accessibility Testing** | Automated WCAG compliance scanning using axe-core to catch a11y violations | `src/utils/accessibility.ts`, `src/tests/specs/accessibility.spec.ts` |
| **Performance Testing** | API response time measurement against configurable SLA thresholds | `config/performance-thresholds.json`, `src/tests/specs/api-performance.spec.ts` |

### Design Patterns

| Pattern | What It Is | Files |
|---------|-----------|-------|
| **Page Object Model (POM)** | Each page of the app is a class with locators and actions. Keeps test logic separate from page interaction logic. New pages extend `BasePage` | `src/pages/BasePage.ts`, `src/pages/SamplePage.ts` |
| **BDD / Cucumber** | Tests written in plain English (Gherkin syntax) in `.feature` files, mapped to TypeScript code via step definitions. Lets non-technical stakeholders read and validate test scenarios | `src/tests/features/`, `src/tests/step-definitions/` |
| **Playwright Specs** | Standard Playwright test files using `test()` and `expect()` for direct browser automation without the Cucumber layer | `src/tests/specs/` |
| **Data-Driven Testing** | Test data externalized into `config/test-data.json` so the same test logic runs with different inputs without code changes | `config/test-data.json` |
| **Path Aliases** | TypeScript import shortcuts (`@pages/BasePage`, `@api/ApiClient`, `@ai/self-healer`, `@utils/logger`, `@config/test-data`) instead of long relative paths | `tsconfig.json` |

### AI-Powered Features

| Feature | What It Does | Files |
|---------|-------------|-------|
| **Dual AI Client** | Switchable between OpenAI (GPT-4o) and Anthropic (Claude) via `AI_PROVIDER` env var. All AI features use this shared client | `src/ai/ai-client.ts` |
| **Self-Healing Locators** | When an element's selector breaks (element moved, renamed, restructured), AI analyzes the page and suggests alternative locators so the test keeps running instead of failing | `src/ai/self-healer.ts`, `src/pages/BasePage.ts`, `src/utils/self-healing-fixture.ts` |
| **AI Test Generation** | Generates test cases from natural language problem statements or requirements documents | `src/ai/test-generator.ts` |
| **AI Failure Analysis** | Analyzes test failure logs, screenshots, and stack traces to suggest root causes and fix recommendations | `src/ai/failure-analyzer.ts` |
| **AI Bug Reports** | Generates structured bug reports from test failure data using the template in `templates/bug-report-template.md` | `src/ai/bug-report-generator.ts` |

### Cross-Browser Testing

Configured in `playwright.config.ts` with 4 browser projects:

| Project | Browser | Viewport |
|---------|---------|----------|
| `chromium` | Chrome | 1280x720 |
| `firefox` | Firefox | 1280x720 |
| `msedge` | Microsoft Edge | 1280x720 |
| `mobile-chrome` | Chrome (mobile emulation) | Mobile viewport |

### Network Interception

`BasePage.ts` and `src/utils/network-interceptor.ts` capture all HTTP traffic during tests:
- Log all requests and responses for debugging
- Mock API responses for isolated UI testing
- Measure response times for performance assertions
- Detect failed network calls automatically

### Reporting & Notifications

| Channel | What It Does | Files |
|---------|-------------|-------|
| **Allure Reports** | Interactive HTML reports with test history, failure categories, timelines, environment info, and screenshots | `allure-config/`, `npm run report` |
| **HTML Report** | Built-in Playwright HTML report | `playwright.config.ts` (reporter config) |
| **Email (SMTP)** | Sends test result summary via email | `src/notifications/send-email-report.ts` |
| **MS Teams** | Posts test results to a Teams channel via incoming webhook | `src/notifications/send-teams-report.ts` |

### CI/CD

### Event-Day Challenge Bootstrap

The framework includes an offline-first planner for the live problem statement. It turns a Markdown or text statement into a structured plan, reusable scenario checklist, traceability matrix, and runbook without requiring an AI key.

```bash
npm run challenge:init -- path/to/problem-statement.md
npm run challenge:validate
npm run challenge:preflight
npm run challenge:smoke
npm run challenge:summary
npm run challenge:package
```

The default output is `challenge/active/`:

- `challenge-plan.json` - inferred scope, requirements, and scenarios
- `requirements.json` - prioritized requirements with matched source evidence
- `scenarios.json` - implementation-ready acceptance scenarios
- `implementation-plan.md` - reusable UI/API/mobile test-file recommendations and assertions
- `generated/` - executable UI/API smoke scaffolds to adapt during the challenge
- `presentation-summary.md` - jury demo order, coverage matrix, evidence checklist, and limitations
- `traceability.md` - requirement-to-scenario matrix for the jury presentation
- `RUNBOOK.md` - event-day execution checklist

The planner is deliberately deterministic. Use its output as the contract for implementation, adapt the generated scaffolds, run `npm run challenge:smoke`, then expand to the normal browser matrix and attach traces, screenshots, reports, and generated bug reports. The `ai:generate-tests` command automatically uses this planner when no AI provider key is configured.

Run `npm run challenge:preflight` before execution to check the inferred scope, required target variables, and Chromium installation.

### Reproducible Sample Challenge

The repository includes a local Inventory Control challenge under `sample-challenge/`. It exercises API CRUD, invalid payload handling, UI search, form submission, accessibility-oriented selectors, and desktop/mobile execution without external services.

```bash
npm run sample:challenge
```

The sample target is intentionally simple but real: it exposes HTTP endpoints, serves a browser UI, shares state across workers, and produces normal Playwright screenshots, traces, and HTML results. Use it to validate framework changes before the event.

For a more complex rehearsal, run `npm run complex:challenge`. It covers authentication, role-based authorization, stock-conflict handling, supervisor operations, UI session state, mobile execution, and an API response-time assertion. Generate its factual result summary with `npm run complex:challenge:summary`.

After a run, `challenge:summary` creates factual JSON and Markdown result summaries from Playwright's JSON reporter. `challenge:package` adds the summary, HTML report, traces, and result artifacts to a ZIP archive for the jury.

Self-healing only accepts a unique visible locator whose model confidence meets `HEALING_MIN_CONFIDENCE` (default `0.7`). Keep healing evidence in the report and verify the resulting business assertion; healing should recover locator drift, not hide behavior regressions.

GitHub Actions workflow (`.github/workflows/test.yml`):
1. Checks out code
2. Sets up Node.js 20
3. Installs dependencies (`npm ci`)
4. Installs Playwright browsers
5. Runs all tests
6. Generates Allure report
7. Uploads report as artifact

---

## How to Add a New Test

### New Playwright Spec

1. Create `src/tests/specs/your-test.spec.ts`
2. Import the page object or create a new one in `src/pages/`
3. Write tests using `test()` and `expect()`
4. Run with `npm test`

### New BDD Feature

1. Create `src/tests/features/your-feature.feature` with Gherkin scenarios
2. Create `src/tests/step-definitions/your.steps.ts` with step implementations
3. Run with `npm run test:bdd`

### New Page Object

1. Create `src/pages/YourPage.ts` extending `BasePage`
2. Define locators and action methods
3. Self-healing is inherited from `BasePage` automatically

---

## Quick Start

See [SETUP.md](SETUP.md) for all installation commands, environment variables, and troubleshooting.

```bash
npm install && npx playwright install && npm test
```
