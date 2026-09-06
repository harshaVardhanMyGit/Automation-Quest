import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { logger } from './logger';

export interface A11yResult {
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
}

export interface A11yViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: number;
}

export async function runAccessibilityAudit(
  page: Page,
  options?: { tags?: string[]; exclude?: string[] }
): Promise<A11yResult> {
  let builder = new AxeBuilder({ page });

  if (options?.tags) {
    builder = builder.withTags(options.tags);
  }
  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  const violations: A11yViolation[] = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact || 'unknown',
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length,
  }));

  if (violations.length > 0) {
    logger.warn(`Accessibility: ${violations.length} violation(s) found`);
    violations.forEach((v) => {
      logger.warn(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes} node(s))`);
    });
  } else {
    logger.info('Accessibility: No violations found');
  }

  return {
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  };
}

export async function assertNoA11yViolations(
  page: Page,
  options?: { tags?: string[]; exclude?: string[]; allowedImpacts?: string[] }
): Promise<void> {
  const result = await runAccessibilityAudit(page, options);

  const critical = result.violations.filter(
    (v) => !(options?.allowedImpacts || []).includes(v.impact)
  );

  if (critical.length > 0) {
    const summary = critical
      .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
      .join('\n');
    throw new Error(`Accessibility violations found:\n${summary}`);
  }
}
