import { test, expect } from '@playwright/test';
import { NetworkInterceptor } from '../../utils/network-interceptor';

test.describe('Network Monitoring @debug', () => {
  let interceptor: NetworkInterceptor;

  test.beforeEach(async ({ page }) => {
    interceptor = new NetworkInterceptor();
    interceptor.attach(page);
  });

  test.afterEach(() => {
    interceptor.logSummary();
    interceptor.reset();
  });

  test('should capture all network requests and detect failures', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'https://stg.gajab.com/');

    const report = await interceptor.getFullReport(page);

    expect(report.totalRequests).toBeGreaterThan(0);
    expect(report.failedCount).toBe(0);

    if (report.performanceMetrics) {
      console.log('Performance Metrics:', JSON.stringify(report.performanceMetrics, null, 2));
    }
  });

  test('should flag slow network requests', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'https://stg.gajab.com/');

    const slowRequests = interceptor.getSlowRequests(3000);
    if (slowRequests.length > 0) {
      console.warn('Slow requests detected:');
      slowRequests.forEach((r) => {
        console.warn(`  ${r.method} ${r.url} — ${r.responseTime}ms`);
      });
    }

    expect(slowRequests.length).toBe(0);
  });

  test('should collect browser performance metrics', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'https://stg.gajab.com/', { waitUntil: 'load' });

    const metrics = await interceptor.getPerformanceMetrics(page);

    console.log('TTFB:', metrics.ttfb, 'ms');
    console.log('FCP:', metrics.fcp, 'ms');
    console.log('LCP:', metrics.lcp, 'ms');
    console.log('DOM Content Loaded:', metrics.domContentLoaded, 'ms');
    console.log('Page Load:', metrics.pageLoad, 'ms');

    if (metrics.ttfb !== null) {
      expect(metrics.ttfb).toBeLessThan(2000);
    }
    if (metrics.pageLoad !== null) {
      expect(metrics.pageLoad).toBeLessThan(10000);
    }
  });
});
