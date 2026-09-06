import { Page, Request, Response } from '@playwright/test';
import { logger } from './logger';

export interface NetworkEntry {
  url: string;
  method: string;
  resourceType: string;
  startTime: number;
  status?: number;
  responseTime?: number;
  failureReason?: string;
}

export interface PerformanceMetrics {
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  domContentLoaded: number | null;
  pageLoad: number | null;
}

export interface NetworkReport {
  totalRequests: number;
  failedCount: number;
  slowCount: number;
  avgResponseTime: number;
  failedRequests: NetworkEntry[];
  slowRequests: NetworkEntry[];
  performanceMetrics: PerformanceMetrics | null;
}

export class NetworkInterceptor {
  private entries = new Map<Request, NetworkEntry>();
  private failedRequests: NetworkEntry[] = [];

  attach(page: Page): void {
    page.on('request', (request) => {
      this.entries.set(request, {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        startTime: Date.now(),
      });
    });

    page.on('response', (response: Response) => {
      const entry = this.entries.get(response.request());
      if (entry) {
        entry.status = response.status();
        entry.responseTime = Date.now() - entry.startTime;
        if (response.status() >= 400) {
          this.failedRequests.push(entry);
        }
      }
    });

    page.on('requestfailed', (request) => {
      const entry = this.entries.get(request);
      if (entry) {
        entry.failureReason = request.failure()?.errorText || 'Unknown error';
        this.failedRequests.push(entry);
      } else {
        this.failedRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          startTime: Date.now(),
          failureReason: request.failure()?.errorText || 'Unknown error',
        });
      }
    });
  }

  getFailedRequests(): NetworkEntry[] {
    return this.failedRequests;
  }

  getSlowRequests(thresholdMs = 3000): NetworkEntry[] {
    return Array.from(this.entries.values()).filter(
      (e) => e.responseTime !== undefined && e.responseTime > thresholdMs
    );
  }

  async getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
    return page.evaluate(() => {
      const perf = performance as any;
      const navEntries = perf.getEntriesByType('navigation');
      const nav = navEntries[0];
      const paintEntries = perf.getEntriesByType('paint');
      const fcp = paintEntries.find((e: any) => e.name === 'first-contentful-paint');

      let lcp: number | null = null;
      try {
        const lcpEntries = perf.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          lcp = lcpEntries[lcpEntries.length - 1].startTime;
        }
      } catch {
        // LCP not available in all browsers
      }

      return {
        ttfb: nav ? nav.responseStart - nav.requestStart : null,
        fcp: fcp ? fcp.startTime : null,
        lcp,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
        pageLoad: nav ? nav.loadEventEnd - nav.startTime : null,
      };
    });
  }

  getReport(): NetworkReport {
    const allEntries = Array.from(this.entries.values());
    const withResponse = allEntries.filter((e) => e.responseTime !== undefined);
    const avgResponseTime =
      withResponse.length > 0
        ? withResponse.reduce((sum, e) => sum + (e.responseTime || 0), 0) / withResponse.length
        : 0;

    const slowRequests = this.getSlowRequests();

    return {
      totalRequests: allEntries.length,
      failedCount: this.failedRequests.length,
      slowCount: slowRequests.length,
      avgResponseTime: Math.round(avgResponseTime),
      failedRequests: this.failedRequests,
      slowRequests,
      performanceMetrics: null,
    };
  }

  async getFullReport(page: Page): Promise<NetworkReport> {
    const report = this.getReport();
    report.performanceMetrics = await this.getPerformanceMetrics(page);
    return report;
  }

  logSummary(): void {
    const report = this.getReport();
    logger.info(`Network Summary: ${report.totalRequests} requests, ${report.failedCount} failed, ${report.slowCount} slow (>3s), avg ${report.avgResponseTime}ms`);

    if (report.failedRequests.length > 0) {
      logger.warn('Failed requests:');
      report.failedRequests.forEach((r) => {
        logger.warn(`  ${r.method} ${r.url} — ${r.failureReason || `HTTP ${r.status}`}`);
      });
    }

    if (report.slowRequests.length > 0) {
      logger.warn('Slow requests (>3s):');
      report.slowRequests.forEach((r) => {
        logger.warn(`  ${r.method} ${r.url} — ${r.responseTime}ms`);
      });
    }
  }

  reset(): void {
    this.entries.clear();
    this.failedRequests = [];
  }
}
