import * as fs from 'fs';
import * as path from 'path';

const directory = process.argv[2] || path.join(process.cwd(), 'challenge', 'active');
const requiredFiles = ['challenge-plan.json', 'requirements.json', 'scenarios.json', 'implementation-plan.md', 'presentation-summary.md', 'traceability.md', 'RUNBOOK.md'];
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(directory, file)));

if (missingFiles.length > 0) {
  console.error(`Challenge artifacts are incomplete in ${directory}: ${missingFiles.join(', ')}`);
  process.exitCode = 1;
} else {
  const plan = JSON.parse(fs.readFileSync(path.join(directory, 'challenge-plan.json'), 'utf8'));
  const requirementIds = new Set(plan.requirements?.map((requirement: { id: string }) => requirement.id));
  const scenarioIds = new Set(plan.scenarios?.map((scenario: { id: string }) => scenario.id));
  const invalidReferences = (plan.scenarios || []).filter(
    (scenario: { requirementId: string }) => !requirementIds.has(scenario.requirementId),
  );
  const generatedDir = path.join(directory, 'generated');
  const generatedFiles = fs.existsSync(generatedDir)
    ? fs.readdirSync(generatedDir).filter((file) => file.endsWith('.spec.ts'))
    : [];
  if (!Array.isArray(plan.requirements) || !Array.isArray(plan.scenarios) || plan.requirements.length === 0) {
    console.error('Challenge plan must contain at least one requirement and scenario.');
    process.exitCode = 1;
  } else if (requirementIds.size !== plan.requirements.length || scenarioIds.size !== plan.scenarios.length) {
    console.error('Challenge plan contains duplicate requirement or scenario IDs.');
    process.exitCode = 1;
  } else if (invalidReferences.length > 0) {
    console.error(`Challenge plan contains ${invalidReferences.length} scenario(s) with unknown requirement IDs.`);
    process.exitCode = 1;
  } else if (generatedFiles.length === 0) {
    console.error('Challenge plan is missing generated .spec.ts scaffolds.');
    process.exitCode = 1;
  } else {
    console.log(`Challenge artifacts valid: ${plan.requirements.length} requirements, ${plan.scenarios.length} scenarios, ${generatedFiles.length} generated test file(s)`);
  }
}