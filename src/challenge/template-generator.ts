import * as fs from 'fs';
import * as path from 'path';
import { ChallengePlan, ChallengeScenario } from './types';

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderUiScenario(scenario: ChallengeScenario): string {
  return `test('${scenario.id}: ${scenario.title} @smoke', async ({ page }) => {
  await page.goto(process.env.BASE_URL!);
  await expect(page).toHaveTitle(/.+/);

  // Replace this baseline check with the page-object actions from implementation-plan.md.
  expect(${JSON.stringify(scenario.expectedResults)}.length).toBeGreaterThan(0);
});
`;
}

function renderApiScenario(scenario: ChallengeScenario): string {
  return `test('${scenario.id}: ${scenario.title} @smoke', async ({ request }) => {
  const response = await request.get(process.env.CHALLENGE_API_ENDPOINT!);
  expect(response.ok()).toBeTruthy();

  // Add contract, negative, and lifecycle assertions from implementation-plan.md.
  expect(${JSON.stringify(scenario.expectedResults)}.length).toBeGreaterThan(0);
});
`;
}

export function writeChallengeTemplates(plan: ChallengePlan, outputDir: string): void {
  const generatedDir = path.join(outputDir, 'generated');
  fs.mkdirSync(generatedDir, { recursive: true });

  const uiScenarios = plan.scenarios.filter((scenario) => scenario.scope === 'ui' || scenario.scope === 'hybrid');
  const apiScenarios = plan.scenarios.filter((scenario) => scenario.scope === 'api' || scenario.scope === 'hybrid');

  if (uiScenarios.length > 0) {
    fs.writeFileSync(
      path.join(generatedDir, `challenge-ui-${safeName(uiScenarios[0].title)}.spec.ts`),
      `import { test, expect } from '@playwright/test';\n\ntest.skip(!process.env.BASE_URL, 'Set BASE_URL before running the generated UI scaffold');\n\n${uiScenarios.map(renderUiScenario).join('\n')}`,
    );
  }
  if (apiScenarios.length > 0) {
    fs.writeFileSync(
      path.join(generatedDir, `challenge-api-${safeName(apiScenarios[0].title)}.spec.ts`),
      `import { test, expect } from '@playwright/test';\n\ntest.skip(!process.env.CHALLENGE_API_ENDPOINT, 'Set CHALLENGE_API_ENDPOINT before running the generated API scaffold');\n\n${apiScenarios.map(renderApiScenario).join('\n')}`,
    );
  }
  fs.writeFileSync(
    path.join(generatedDir, 'README.md'),
    '# Generated Challenge Tests\n\nThese are conservative smoke scaffolds. Replace the baseline checks with page-object, API contract, and negative assertions from `implementation-plan.md` before presenting results.\n',
  );
}