import { test, expect } from '../../utils/self-healing-fixture';
import { runAccessibilityAudit, assertNoA11yViolations } from '../../utils/accessibility';

test.describe('Accessibility Tests @a11y', () => {
  test('homepage should have no critical accessibility violations', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'https://stg.gajab.com/');

    const result = await runAccessibilityAudit(page, {
      tags: ['wcag2a', 'wcag2aa'],
    });

    expect(result.passes).toBeGreaterThan(0);

    await assertNoA11yViolations(page, {
      tags: ['wcag2a', 'wcag2aa'],
      allowedImpacts: ['minor'],
    });
  });

  test('page should have proper heading structure', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'https://stg.gajab.com/');

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    const images = page.locator('img');
    const imgCount = await images.count();
    for (let i = 0; i < imgCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'https://stg.gajab.com/');

    const result = await runAccessibilityAudit(page, {
      tags: ['wcag2a'],
    });

    const keyboardViolations = result.violations.filter(
      (v) => v.id.includes('keyboard') || v.id.includes('focus') || v.id.includes('tabindex')
    );
    expect(keyboardViolations).toHaveLength(0);
  });
});
