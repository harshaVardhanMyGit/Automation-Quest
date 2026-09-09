import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

interface TestRecord {
  title: string;
  project: string;
  status: string;
  durationMs: number;
  file?: string;
}

interface ChallengeSummary {
  generatedAt: string;
  sourceResults: string;
  status: 'passed' | 'failed' | 'incomplete';
  totals: { tests: number; passed: number; failed: number; skipped: number; flaky: number; durationMs: number };
  projects: string[];
  tags: Record<string, number>;
  tests: TestRecord[];
  evidence: { htmlReport?: string; tracesDirectory?: string };
}

function collectTests(suites: any[], parentTitles: string[] = [], project = ''): TestRecord[] {
  return suites.flatMap((suite) => {
    const titlePath = [...parentTitles, suite.title].filter(Boolean);
    const suiteTests = (suite.specs || []).flatMap((spec: any) => (spec.tests || []).map((test: any) => {
      const result = test.results?.[test.results.length - 1];
      return {
        title: [...titlePath, spec.title].join(' > '),
        project: test.projectName || project || 'unknown',
        status: result?.status || (spec.ok ? 'passed' : 'failed'),
        durationMs: result?.duration || 0,
        file: spec.file,
      };
    }));
    return [...suiteTests, ...collectTests(suite.suites || [], titlePath, project)];
  });
}

export function buildChallengeSummary(resultsPath: string, evidenceRoot = process.cwd()): ChallengeSummary {
  const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const tests = collectTests(report.suites || []);
  const totals = tests.reduce((acc, test) => {
    acc.tests += 1;
    if (test.status === 'passed') acc.passed += 1;
    else if (test.status === 'failed') acc.failed += 1;
    else if (test.status === 'skipped') acc.skipped += 1;
    if (test.status === 'flaky') acc.flaky += 1;
    acc.durationMs += test.durationMs;
    return acc;
  }, { tests: 0, passed: 0, failed: 0, skipped: 0, flaky: 0, durationMs: 0 });
  const tags: Record<string, number> = {};
  tests.forEach((test) => test.title.match(/@[a-z0-9-]+/gi)?.forEach((tag: string) => { tags[tag] = (tags[tag] || 0) + 1; }));
  return {
    generatedAt: new Date().toISOString(),
    sourceResults: resultsPath,
    status: totals.failed > 0 ? 'failed' : totals.tests === 0 || totals.skipped === totals.tests ? 'incomplete' : 'passed',
    totals,
    projects: [...new Set(tests.map((test) => test.project))],
    tags,
    tests,
    evidence: {
      htmlReport: fs.existsSync(path.join(evidenceRoot, 'playwright-report', 'index.html')) ? 'playwright-report/index.html' : undefined,
      tracesDirectory: fs.existsSync(path.join(evidenceRoot, 'test-results')) ? 'test-results' : undefined,
    },
  };
}

function writeSummary(resultsPath: string, outputPath: string): void {
  const summary = buildChallengeSummary(resultsPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  const markdownPath = outputPath.replace(/\.json$/, '.md');
  fs.writeFileSync(markdownPath, `# Challenge Execution Summary\n\n- Status: **${summary.status.toUpperCase()}**\n- Tests: ${summary.totals.tests}\n- Passed: ${summary.totals.passed}\n- Failed: ${summary.totals.failed}\n- Skipped: ${summary.totals.skipped}\n- Flaky: ${summary.totals.flaky}\n- Duration: ${summary.totals.durationMs} ms\n- Projects: ${summary.projects.join(', ') || 'none'}\n\n## Tags\n\n${Object.entries(summary.tags).map(([tag, count]) => `- ${tag}: ${count}`).join('\n') || '- none'}\n\n## Evidence\n\n- HTML report: ${summary.evidence.htmlReport || 'not found'}\n- Traces: ${summary.evidence.tracesDirectory || 'not found'}\n`);
  console.log(`Challenge summary written to ${outputPath}`);
  console.log(`Status: ${summary.status}; ${summary.totals.tests} tests, ${summary.totals.passed} passed, ${summary.totals.failed} failed, ${summary.totals.skipped} skipped`);
}

const command = process.argv[2] || 'summary';
const resultsPath = process.argv[3] || path.join(process.cwd(), 'reports', 'playwright-results.json');
if (command === 'summary') {
  writeSummary(resultsPath, process.argv[4] || path.join(process.cwd(), 'reports', 'challenge-summary.json'));
} else if (command === 'package') {
  const archivePath = process.argv[4] || path.join(process.cwd(), 'reports', `challenge-evidence-${Date.now()}.zip`);
  const summaryPath = path.join(process.cwd(), 'reports', 'challenge-summary.json');
  writeSummary(resultsPath, summaryPath);
  execFileSync('zip', ['-rq', archivePath, 'playwright-report', 'test-results', 'reports/challenge-summary.json', 'reports/challenge-summary.md'], { cwd: process.cwd() });
  console.log(`Challenge evidence archive written to ${archivePath}`);
} else {
  console.error('Usage: ts-node src/challenge/report.ts <summary|package> [results-json] [output-path]');
  process.exitCode = 1;
}