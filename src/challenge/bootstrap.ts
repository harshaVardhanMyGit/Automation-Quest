import * as fs from 'fs';
import * as path from 'path';
import {
  ChallengePlan,
  ChallengeRequirement,
  ChallengeScenario,
  ChallengeScope,
  ScenarioPriority,
} from './types';
import { writeChallengeTemplates } from './template-generator';

interface PatternDefinition {
  title: string;
  scope: ChallengeScope;
  priority: ScenarioPriority;
  keywords: string[];
  tags: string[];
  steps: string[];
  expectedResults: string[];
}

const patterns: PatternDefinition[] = [
  {
    title: 'Authentication and access control',
    scope: 'hybrid',
    priority: 'critical',
    keywords: ['login', 'log in', 'authentication', 'authorize', 'role', 'permission', 'logout'],
    tags: ['smoke', 'security', 'critical'],
    steps: ['Submit valid and invalid credentials', 'Verify authorized and unauthorized paths'],
    expectedResults: ['Valid users reach the permitted feature', 'Invalid or unauthorized requests are rejected safely'],
  },
  {
    title: 'Create, read, update, and delete workflow',
    scope: 'api',
    priority: 'critical',
    keywords: ['crud', 'create', 'retrieve', 'read', 'update', 'delete', 'resource', 'record'],
    tags: ['api', 'smoke', 'crud'],
    steps: ['Create a valid record', 'Retrieve it', 'Update it', 'Delete it', 'Repeat with invalid data'],
    expectedResults: ['The lifecycle returns the expected status and data', 'Invalid operations return a useful client error'],
  },
  {
    title: 'Form validation and error handling',
    scope: 'ui',
    priority: 'high',
    keywords: ['form', 'field', 'validation', 'required', 'invalid', 'error message'],
    tags: ['ui', 'negative'],
    steps: ['Submit valid data', 'Submit missing, malformed, and boundary values', 'Inspect validation feedback'],
    expectedResults: ['Valid data is accepted', 'Invalid data is rejected with field-level, actionable feedback'],
  },
  {
    title: 'Search, filtering, sorting, and pagination',
    scope: 'ui',
    priority: 'high',
    keywords: ['search', 'filter', 'sort', 'pagination', 'page', 'results'],
    tags: ['ui', 'data-driven'],
    steps: ['Search for an existing and a missing value', 'Apply filters and sorting', 'Move between result pages'],
    expectedResults: ['Results match the requested criteria', 'Empty, boundary, and navigation states are handled correctly'],
  },
  {
    title: 'Accessibility and responsive behavior',
    scope: 'ui',
    priority: 'medium',
    keywords: ['accessibility', 'wcag', 'keyboard', 'screen reader', 'responsive', 'mobile', 'viewport'],
    tags: ['a11y', 'responsive'],
    steps: ['Run an automated accessibility scan', 'Navigate key flows with the keyboard', 'Check desktop and mobile viewports'],
    expectedResults: ['No critical accessibility violations are present', 'Content remains usable at supported viewports'],
  },
  {
    title: 'Performance and resilience',
    scope: 'api',
    priority: 'medium',
    keywords: ['performance', 'latency', 'response time', 'throughput', 'load', 'timeout', 'retry', 'response within', 'complete within', 'threshold', 'sla', ' ms'],
    tags: ['performance', 'resilience'],
    steps: ['Measure representative requests', 'Exercise timeout and transient failure paths', 'Compare results with stated thresholds'],
    expectedResults: ['Response times and error rates stay within agreed thresholds', 'Failures are observable and recoverable where required'],
  },
  {
    title: 'File and external integration workflow',
    scope: 'hybrid',
    priority: 'medium',
    keywords: ['upload', 'download', 'file', 'webhook', 'integration', 'notification', 'email'],
    tags: ['integration', 'boundary'],
    steps: ['Exercise a valid integration flow', 'Use missing, oversized, malformed, and unavailable inputs'],
    expectedResults: ['Valid data crosses the integration boundary correctly', 'Boundary failures are reported without data loss'],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

function inferScope(text: string): ChallengeScope {
  const hasUi = /ui|web|browser|page|form|screen|frontend|responsive/.test(text);
  const hasApi = /api|rest|endpoint|service|http|graphql|request|response/.test(text);
  const hasMobile = /android|ios|native mobile|appium|mobile app/.test(text);
  if ((hasUi && hasApi) || (hasMobile && (hasUi || hasApi))) return 'hybrid';
  if (hasMobile) return 'mobile';
  if (hasApi) return 'api';
  return 'ui';
}

function requirementFromPattern(
  pattern: PatternDefinition,
  index: number,
  sourceText: string,
): ChallengeRequirement | null {
  const matchedKeywords = pattern.keywords.filter((keyword) => sourceText.includes(keyword));
  if (matchedKeywords.length === 0) return null;
  return {
    id: `REQ-${String(index).padStart(3, '0')}`,
    title: pattern.title,
    scope: pattern.scope,
    priority: pattern.priority,
    evidence: `Matched: ${matchedKeywords.join(', ')}`,
    sourceKeywords: matchedKeywords,
  };
}

function scenarioFromRequirement(
  requirement: ChallengeRequirement,
  pattern: PatternDefinition,
): ChallengeScenario {
  return {
    id: `SCN-${requirement.id.slice(4)}`,
    requirementId: requirement.id,
    title: pattern.title,
    scope: requirement.scope,
    priority: requirement.priority,
    tags: pattern.tags,
    preconditions: ['Target environment is configured', 'Test data is isolated from other runs'],
    steps: pattern.steps,
    expectedResults: pattern.expectedResults,
  };
}

export function buildChallengePlan(problemStatement: string, sourceFile: string): ChallengePlan {
  const sourceText = normalize(problemStatement);
  const requirements: ChallengeRequirement[] = [];
  const scenarios: ChallengeScenario[] = [];

  patterns.forEach((pattern) => {
    const requirement = requirementFromPattern(pattern, requirements.length + 1, sourceText);
    if (!requirement) return;
    requirements.push(requirement);
    scenarios.push(scenarioFromRequirement(requirement, pattern));
  });

  if (requirements.length === 0) {
    const fallback: ChallengeRequirement = {
      id: 'REQ-001',
      title: 'Core acceptance flow',
      scope: inferScope(sourceText),
      priority: 'critical',
      evidence: 'No known keywords matched; manual review required',
      sourceKeywords: [],
    };
    requirements.push(fallback);
    scenarios.push({
      id: 'SCN-001',
      requirementId: fallback.id,
      title: 'Core acceptance flow',
      scope: fallback.scope,
      priority: fallback.priority,
      tags: ['smoke', 'manual-review'],
      preconditions: ['Target environment is configured'],
      steps: ['Identify the primary user journey from the statement', 'Automate the smallest valuable acceptance path', 'Add negative coverage after the smoke path passes'],
      expectedResults: ['The primary journey satisfies the stated acceptance criteria'],
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceFile,
    scope: inferScope(sourceText),
    requirements,
    scenarios,
  };
}

export function writeChallengeArtifacts(plan: ChallengePlan, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'challenge-plan.json'), `${JSON.stringify(plan, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'requirements.json'), `${JSON.stringify(plan.requirements, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'scenarios.json'), `${JSON.stringify(plan.scenarios, null, 2)}\n`);
  writeChallengeTemplates(plan, outputDir);

  const criticalScenarios = plan.scenarios.filter((scenario) => scenario.priority === 'critical');
  const presentationRows = plan.scenarios
    .map((scenario) => `| ${scenario.id} | ${scenario.title} | ${scenario.scope} | ${scenario.priority} | ${scenario.tags.join(', ')} |`)
    .join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'presentation-summary.md'),
    `# TestAutothon Presentation Summary\n\n## Executive Summary\n\nThis solution targets a **${plan.scope}** challenge with **${plan.requirements.length} requirements** and **${plan.scenarios.length} executable scenarios**. The critical path contains **${criticalScenarios.length} scenarios** and is validated first through the generated smoke suite.\n\n## Demonstration Order\n\n1. Show the requirement and scenario traceability in \`traceability.md\`.\n2. Run \`npm run challenge:smoke\` and show the critical-path result.\n3. Demonstrate one successful business flow and one negative or boundary flow.\n4. Show the generated Playwright evidence, network diagnostics, and report artifacts.\n5. Explain the extension path for accessibility, performance, mobile, and integration coverage.\n\n## Coverage Matrix\n\n| Scenario | Capability | Priority | Tags |\n|---|---|---|---|\n${presentationRows}\n\n## Evidence Checklist\n\n- [ ] Smoke output and pass/skip/fail summary\n- [ ] Screenshots or trace for the primary flow\n- [ ] Negative-path evidence\n- [ ] API response or network evidence where applicable\n- [ ] Accessibility or performance evidence when required\n- [ ] Known limitations clearly stated\n\n## Known Limitations\n\n- Generated scaffolds are starting points; selectors, contracts, data, and business assertions must be adapted to the supplied application.\n- AI-assisted generation is optional and should not be treated as the source of truth.\n- Performance and native mobile scenarios require their respective target environments.\n`,
  );
  const presentationPath = path.join(outputDir, 'presentation-summary.md');
  const presentationSummary = fs.readFileSync(presentationPath, 'utf8');
  fs.writeFileSync(presentationPath, presentationSummary.replace('| Scenario | Capability | Priority | Tags |', '| Scenario ID | Scenario | Capability | Priority | Tags |').replace('|---|---|---|---|', '|---|---|---|---|---|'));

  const implementationItems = plan.scenarios
    .map((scenario) => {
      const testFile = scenario.scope === 'api'
        ? 'src/tests/specs/challenge-api.spec.ts'
        : scenario.scope === 'mobile'
          ? 'src/mobile/challenge-mobile.spec.ts'
          : 'src/tests/specs/challenge-ui.spec.ts';
      return `## ${scenario.id}: ${scenario.title}\n\n- Priority: **${scenario.priority}**\n- Tags: \`${scenario.tags.join('`, `')}\`\n- Suggested file: \`${testFile}\`\n- Preconditions: ${scenario.preconditions.join('; ')}\n- Steps:\n${scenario.steps.map((step) => `  - ${step}`).join('\n')}\n- Assertions:\n${scenario.expectedResults.map((result) => `  - ${result}`).join('\n')}\n`;
    })
    .join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'implementation-plan.md'),
    `# Challenge Implementation Plan\n\nScope: **${plan.scope}**\n\nImplement critical scenarios first, tag their tests with \`@smoke\`, and run \`npm run test:smoke\` before expanding browser coverage.\n\n${implementationItems}`,
  );

  const rows = plan.requirements
    .map((requirement) => {
      const scenario = plan.scenarios.find((item) => item.requirementId === requirement.id);
      return `| ${requirement.id} | ${requirement.title} | ${requirement.scope} | ${requirement.priority} | ${scenario?.id || 'manual review'} |`;
    })
    .join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'traceability.md'),
    `# Challenge Traceability\n\nGenerated: ${plan.generatedAt}\n\n| Requirement | Capability | Scope | Priority | Scenario |\n|---|---|---|---|---|\n${rows}\n`,
  );
  fs.writeFileSync(
    path.join(outputDir, 'RUNBOOK.md'),
    `# Event-Day Runbook\n\n1. Review \`challenge-plan.json\` and confirm the inferred scope.\n2. Use \`implementation-plan.md\` to create the smallest critical-path tests.\n3. Configure \`.env\` with the target URL and credentials.\n4. Run \`npm run challenge:validate -- ${path.relative(process.cwd(), outputDir) || '.'}\`.\n5. Run \`npm run challenge:smoke\` before the full browser matrix.\n6. Use \`presentation-summary.md\` to structure the jury demo and state evidence gaps honestly.\n`,
  );
}