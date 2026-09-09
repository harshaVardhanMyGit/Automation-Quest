import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test';

const directory = process.argv[2] || path.join(process.cwd(), 'challenge', 'active');
const planPath = path.join(directory, 'challenge-plan.json');
const problems: string[] = [];

if (!fs.existsSync(planPath)) {
  problems.push(`Missing challenge plan: ${planPath}`);
} else {
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  if (plan.scope === 'ui' || plan.scope === 'hybrid') {
    if (!process.env.BASE_URL) problems.push('BASE_URL is required for UI or hybrid scenarios.');
  }
  if (plan.scope === 'api' || plan.scope === 'hybrid') {
    if (!process.env.CHALLENGE_API_ENDPOINT && !process.env.API_BASE_URL) {
      problems.push('CHALLENGE_API_ENDPOINT or API_BASE_URL is required for API or hybrid scenarios.');
    }
  }
  if (plan.scope === 'mobile' && !process.env.APPIUM_SERVER) {
    problems.push('APPIUM_SERVER is required for mobile scenarios.');
  }
}

if (!fs.existsSync(chromium.executablePath())) {
  problems.push('Chromium is not installed. Run `npx playwright install chromium`.');
}

if (problems.length > 0) {
  console.error('Challenge preflight failed:');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
} else {
  console.log('Challenge preflight passed: plan, target configuration, and Chromium are ready.');
}