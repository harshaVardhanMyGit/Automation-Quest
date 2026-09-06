import { AIClient } from './ai-client';
import * as fs from 'fs';

const SYSTEM_PROMPT = `You are a test failure analysis expert. Given test failure details (error message, stack trace, screenshot description, test name), provide:

1. **Root Cause**: Most likely reason for the failure
2. **Category**: One of [Locator Issue, Timing Issue, Data Issue, Environment Issue, Application Bug, Network Issue, Authentication Issue]
3. **Suggested Fix**: Specific code-level suggestion
4. **Self-Healing Suggestion**: Alternative locator or approach
5. **Severity**: Critical / High / Medium / Low
6. **Business Impact**: Brief description of user impact

Format as JSON.`;

export interface FailureAnalysis {
  rootCause: string;
  category: string;
  suggestedFix: string;
  selfHealingSuggestion: string;
  severity: string;
  businessImpact: string;
}

export async function analyzeFailure(
  testName: string,
  errorMessage: string,
  stackTrace: string,
  pageUrl?: string
): Promise<FailureAnalysis> {
  const ai = new AIClient();

  const prompt = `Analyze this test failure:
**Test**: ${testName}
**URL**: ${pageUrl || 'N/A'}
**Error**: ${errorMessage}
**Stack Trace**: ${stackTrace}`;

  const response = await ai.prompt(prompt, SYSTEM_PROMPT);

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { rootCause: response.content } as any;
  } catch {
    return {
      rootCause: response.content,
      category: 'Unknown',
      suggestedFix: 'Manual investigation needed',
      selfHealingSuggestion: 'N/A',
      severity: 'Medium',
      businessImpact: 'Unknown',
    };
  }
}

export async function analyzeAllFailures(resultsFile: string): Promise<void> {
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  const failures = results.filter((r: any) => r.status === 'failed');

  console.log(`Analyzing ${failures.length} failures...`);

  const analyses: any[] = [];
  for (const failure of failures) {
    const analysis = await analyzeFailure(
      failure.testName,
      failure.error?.message || '',
      failure.error?.stack || ''
    );
    analyses.push({ test: failure.testName, ...analysis });
    console.log(`  Analyzed: ${failure.testName} -> ${analysis.category}`);
  }

  fs.writeFileSync('reports/failure-analysis.json', JSON.stringify(analyses, null, 2));
  console.log('Analysis saved to reports/failure-analysis.json');
}
