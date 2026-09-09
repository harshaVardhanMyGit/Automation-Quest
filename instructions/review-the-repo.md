# Automation-Quest Framework — Review & Remediation Plan

## Context

`Automation-Quest` is a Playwright + TypeScript base automation framework built for the
TestAutothon 2026 event. It is intended as a ready-to-fine-tune starting point covering web,
API, Android mobile, accessibility, performance, BDD, AI features, reporting and CI. The goal
of this review is to confirm what is solid and fix the correctness/consistency defects that
would bite a team on event day (broken scripts, red CI out-of-the-box, env-var mismatches,
a no-op "self-healing" fixture). Sample specs that require a live app are expected to fail
until pointed at the target and are intentionally left as templates.

## What works well (keep)

- Clean layered layout (`pages/`, `api/`, `mobile/`, `utils/`, `ai/`, `tests/{specs,features,step-definitions}`), TS path aliases, strict tsconfig.
- `ApiClient` is genuinely good: per-endpoint metrics, percentiles, threshold validation, a real ramp-up load test.
- `NetworkInterceptor` (failed/slow capture + web-vitals) and `accessibility.ts` (axe wrapper with impact filtering) are practical.
- POM via `BasePage`, dual notifications (email HTML + Teams adaptive card), Allure categories, `.env` gitignored, no artifacts committed (47 tracked files).
- Good docs (README + SETUP) and a `quick-start.sh`.

## Defects to fix (priority order)

### P0 — broken out of the box
1. **`notify` script points at a non-existent file.** `package.json` `"notify": "ts-node src/notifications/send-report.ts"` but the file is `send-email-report.ts`. Breaks `notify` and `notify:all`. Same wrong path in `scripts/quick-start.sh` (line 44) and README. Fix: rename references to `send-email-report.ts` (or rename the file). `send-email-report.ts` exports `sendTestReport`, not a `send-report`.
2. **CI is guaranteed red.** `.github/workflows/test.yml` runs `npx playwright test --project=chromium` (all specs) with no `BASE_URL`/`API_BASE_URL`/secrets. `api`, `api-performance`, `network-debug`, `accessibility`, `sample-web` all need a live target → fail. Fix: scope CI to a smoke subset (e.g. tag `@smoke`), or set a demo `BASE_URL` env in the workflow, or `continue-on-error` for the sample layer. Decide with user.
3. **Self-healing fixture is a no-op.** `src/utils/self-healing-fixture.ts` constructs a *new* `BasePage` **after** `use(page)` and reads `getHealingLog()` off that fresh instance → always empty; the real test's heal log is never surfaced. Also every spec does `new BasePage(page)` directly instead of using the `basePage` fixture, so healing summaries never print. Fix: expose one `basePage` fixture, log *its* healing log in teardown, and migrate specs to consume it.

### P1 — correctness / consistency
4. **Env-var name mismatches** (silent misconfig):
   - Email: code reads `EMAIL_RECIPIENTS` (`send-email-report.ts:169`), `.env.example` defines `EMAIL_TO`.
   - Mobile platform: code reads `MOBILE_PLATFORM` (`appium-driver.ts:17`), `.env.example` defines `PLATFORM_NAME`.
   - Appium: `SETUP.md` documents `APPIUM_HOST`/`APPIUM_PORT`, code reads `APPIUM_SERVER`.
   Fix: pick canonical names and align `.env.example`, `SETUP.md`, and code.
5. **Per-endpoint perf thresholds for parameterized paths never match.** `config/performance-thresholds.json` uses keys like `GET /api/items/:id`, but `ApiClient.getMetrics()` builds keys from the real path (`GET /api/items/123`), so those thresholds silently fall back to global. Fix: normalize dynamic segments to `:id` when building the metric key, or document the limitation.
6. **iOS overstated.** README/env claim Android/iOS but `appium-driver.ts` hardcodes `automationName: 'UiAutomator2'` (Android only). Fix: make `automationName` env-driven or scope docs to Android.
7. **Stray junk file.** `.txt` (contents: "shilfa") at repo root — delete.

### P2 — hardening / tuning
8. `playwright.config.ts`: `screenshot: 'on'` → `'only-on-failure'` (perf/disk); consider `workers`/`retries` from env (`process.env.CI`); `baseURL` is `undefined` when `BASE_URL` unset.
9. Hardcoded AI models (`gpt-4o`, `claude-sonnet-4-...`) — make model + `max_tokens` env-configurable; self-healer sends `body.innerHTML.substring(0,5000)` to the LLM on every failed locator (cost/latency/truncation) — gate behind an env flag.
10. Redundant mobile paths: custom `run-mobile-tests.ts` runner **and** `mobile.steps.ts` cucumber steps — pick one story to avoid drift.
11. No quality gates: add `eslint` + `prettier` + `tsc --noEmit` (SETUP mentions tsc but nothing enforces it); optionally a pre-commit hook and a couple of unit tests for pure logic (`percentile`, `parsePlaywrightResults`).
12. BDD `web.steps.ts` launches its own `chromium` (bypasses `playwright.config` tracing/projects) — acceptable but note the divergence; wire `test:bdd` into CI or mark it manual.
13. `package.json` has no `engines` (Node 20) pin; `allure-playwright@^3` + `allure-commandline@2.29` compatibility should be smoke-tested.

## Files to change (representative)

- `package.json`, `scripts/quick-start.sh`, `README.md` — fix `send-report.ts` → `send-email-report.ts`.
- `.github/workflows/test.yml` — smoke scoping / env / secrets.
- `src/utils/self-healing-fixture.ts` + sample specs — real fixture wiring.
- `.env.example`, `SETUP.md`, `src/mobile/appium-driver.ts`, `src/notifications/send-email-report.ts` — env-name alignment.
- `src/api/ApiClient.ts` — dynamic-path key normalization.
- `playwright.config.ts` — screenshot/workers/retries tuning.
- `src/ai/ai-client.ts` — env-driven model/max_tokens.
- Delete `.txt`.

## Verification

- `npx tsc --noEmit` clean.
- `npm run notify` resolves the file (dry-run against a sample `test-results.json`).
- `npm test` against a real demo `BASE_URL` (e.g. a known site/API) — sample layer green; CI smoke subset green with no secrets.
- Trigger a deliberate locator failure and confirm the self-healing summary now prints in teardown.
- Confirm email/Teams senders read the aligned env names.
