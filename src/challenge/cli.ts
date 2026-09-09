import * as fs from 'fs';
import * as path from 'path';
import { buildChallengePlan, writeChallengeArtifacts } from './bootstrap';

function main(): void {
  const sourceFile = process.argv[2];
  if (!sourceFile) {
    console.error('Usage: npm run challenge:init -- <problem-statement.md> [output-directory]');
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(sourceFile)) {
    console.error(`Problem statement not found: ${sourceFile}`);
    process.exitCode = 1;
    return;
  }

  const outputDir = process.argv[3] || path.join(process.cwd(), 'challenge', 'active');
  const statement = fs.readFileSync(sourceFile, 'utf8');
  const plan = buildChallengePlan(statement, sourceFile);
  writeChallengeArtifacts(plan, outputDir);
  console.log(`Challenge plan written to ${outputDir}`);
  console.log(`Scope: ${plan.scope}; requirements: ${plan.requirements.length}; scenarios: ${plan.scenarios.length}`);
}

main();