import { AIClient } from './ai-client';
import * as fs from 'fs';
import * as path from 'path';

const SYSTEM_PROMPT = `You are a senior test automation engineer. Given a problem statement for a hackathon, generate:
1. A list of test scenarios (happy path + edge cases)
2. Playwright TypeScript test code for each scenario
3. Page Object classes with locators
4. API test cases if applicable

Output format:
- First output a JSON block with test scenarios
- Then output TypeScript code blocks for each test file
- Use Page Object Model pattern
- Include assertions using Playwright's expect
- Add @ui or @api tags as comments for categorization`;

export async function generateTestsFromProblemStatement(problemStatement: string): Promise<string> {
  const ai = new AIClient();
  const response = await ai.prompt(problemStatement, SYSTEM_PROMPT);

  const outputDir = path.join(process.cwd(), 'src', 'tests', 'generated');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, 'ai-generated-tests.md'), response.content);

  const codeBlocks = response.content.match(/```typescript\n([\s\S]*?)```/g) || [];
  codeBlocks.forEach((block, index) => {
    const code = block.replace(/```typescript\n/, '').replace(/```$/, '');
    const fileName = `generated-test-${index + 1}.spec.ts`;
    fs.writeFileSync(path.join(outputDir, fileName), code);
  });

  console.log(`Generated ${codeBlocks.length} test files in ${outputDir}`);
  return response.content;
}

if (require.main === module) {
  const problemFile = process.argv[2];
  if (!problemFile) {
    console.log('Usage: ts-node test-generator.ts <problem-statement-file>');
    console.log('Or pipe: echo "problem statement" | ts-node test-generator.ts');
    process.exit(1);
  }

  const statement = fs.readFileSync(problemFile, 'utf-8');
  generateTestsFromProblemStatement(statement).then(() => console.log('Done!'));
}
