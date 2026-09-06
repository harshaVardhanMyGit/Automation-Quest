import { AIClient } from './ai-client';
import * as fs from 'fs';
import * as path from 'path';

const SYSTEM_PROMPT = `You are a QA expert. Generate a professional bug report from the provided failure details. Include:

1. **Bug ID**: BUG-XXX format
2. **Title**: Clear, concise summary
3. **Severity**: Critical / High / Medium / Low
4. **Priority**: P1 / P2 / P3 / P4
5. **Environment**: Browser, OS, URL
6. **Prerequisites**: Any setup needed
7. **Steps to Reproduce**: Numbered steps
8. **Expected Result**: What should happen
9. **Actual Result**: What actually happened
10. **Screenshots/Evidence**: Reference to attached evidence
11. **Business Impact**: How this affects users
12. **Suggested Fix**: Technical recommendation

Format the output as a clean, well-structured bug report in markdown.`;

export interface BugDetails {
  testName: string;
  errorMessage: string;
  pageUrl: string;
  browser: string;
  screenshotPath?: string;
  stepsPerformed: string[];
  expectedBehavior: string;
  actualBehavior: string;
}

export async function generateBugReport(details: BugDetails): Promise<string> {
  const ai = new AIClient();

  const prompt = `Generate a bug report from these details:
- **Test**: ${details.testName}
- **URL**: ${details.pageUrl}
- **Browser**: ${details.browser}
- **Error**: ${details.errorMessage}
- **Steps Performed**: ${details.stepsPerformed.map((s, i) => `${i + 1}. ${s}`).join('\n')}
- **Expected**: ${details.expectedBehavior}
- **Actual**: ${details.actualBehavior}
- **Screenshot**: ${details.screenshotPath || 'N/A'}`;

  const response = await ai.prompt(prompt, SYSTEM_PROMPT);
  return response.content;
}

export async function generateBugReportFile(details: BugDetails, outputPath?: string): Promise<string> {
  const report = await generateBugReport(details);
  const filePath = outputPath || path.join(process.cwd(), 'reports', `bug-report-${Date.now()}.md`);

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, report);
  console.log(`Bug report saved to: ${filePath}`);
  return filePath;
}
