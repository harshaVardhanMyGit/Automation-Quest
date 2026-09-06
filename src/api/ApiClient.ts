import { APIRequestContext, request } from '@playwright/test';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

dotenv.config();

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  responseTimeMs: number;
}

export interface PerfMetrics {
  endpoint: string;
  method: string;
  samples: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  p95ResponseTimeMs: number;
  p99ResponseTimeMs: number;
  errorCount: number;
  errorRatePercent: number;
}

export interface PerfThresholds {
  global: {
    maxResponseTimeMs: number;
    maxP95ResponseTimeMs: number;
    maxP99ResponseTimeMs: number;
    maxErrorRatePercent: number;
  };
  endpoints: Record<string, { maxResponseTimeMs: number; description?: string }>;
  loadTest: {
    concurrentUsers: number;
    durationSeconds: number;
    rampUpSeconds: number;
    maxAvgResponseTimeMs: number;
    minRequestsPerSecond: number;
  };
}

export interface ThresholdViolation {
  endpoint: string;
  metric: string;
  actual: number;
  threshold: number;
  message: string;
}

export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private context: APIRequestContext | null = null;
  private responseTimes: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();

  constructor(baseUrl?: string, authToken?: string) {
    this.baseUrl = baseUrl || process.env.API_BASE_URL || '';
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (authToken || process.env.API_AUTH_TOKEN) {
      this.headers['Authorization'] = `Bearer ${authToken || process.env.API_AUTH_TOKEN}`;
    }
  }

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: this.headers,
    });
  }

  private recordMetric(key: string, responseTimeMs: number, isError: boolean): void {
    if (!this.responseTimes.has(key)) {
      this.responseTimes.set(key, []);
      this.errorCounts.set(key, 0);
    }
    this.responseTimes.get(key)!.push(responseTimeMs);
    if (isError) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
  }

  async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    if (!this.context) await this.init();
    const start = performance.now();
    const response = await this.context!.post(endpoint, { data });
    const responseTimeMs = Math.round(performance.now() - start);
    const body = await response.json().catch(() => response.text());
    const isError = response.status() >= 400;
    this.recordMetric(`POST ${endpoint}`, responseTimeMs, isError);
    return {
      status: response.status(),
      data: body as T,
      headers: response.headers(),
      responseTimeMs,
    };
  }

  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    if (!this.context) await this.init();
    const start = performance.now();
    const response = await this.context!.get(endpoint, { params });
    const responseTimeMs = Math.round(performance.now() - start);
    const body = await response.json().catch(() => response.text());
    const isError = response.status() >= 400;
    this.recordMetric(`GET ${endpoint}`, responseTimeMs, isError);
    return {
      status: response.status(),
      data: body as T,
      headers: response.headers(),
      responseTimeMs,
    };
  }

  async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    if (!this.context) await this.init();
    const start = performance.now();
    const response = await this.context!.put(endpoint, { data });
    const responseTimeMs = Math.round(performance.now() - start);
    const body = await response.json().catch(() => response.text());
    const isError = response.status() >= 400;
    this.recordMetric(`PUT ${endpoint}`, responseTimeMs, isError);
    return {
      status: response.status(),
      data: body as T,
      headers: response.headers(),
      responseTimeMs,
    };
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    if (!this.context) await this.init();
    const start = performance.now();
    const response = await this.context!.delete(endpoint);
    const responseTimeMs = Math.round(performance.now() - start);
    const body = await response.json().catch(() => response.text());
    const isError = response.status() >= 400;
    this.recordMetric(`DELETE ${endpoint}`, responseTimeMs, isError);
    return {
      status: response.status(),
      data: body as T,
      headers: response.headers(),
      responseTimeMs,
    };
  }

  async postAndValidate(
    postEndpoint: string,
    getEndpoint: string,
    payload: any,
    idField = 'id'
  ): Promise<{ postResponse: ApiResponse; getResponse: ApiResponse; valid: boolean }> {
    const postResponse = await this.post(postEndpoint, payload);
    const itemId = postResponse.data[idField];
    const getResponse = await this.get(`${getEndpoint}/${itemId}`);

    const valid = getResponse.status === 200;
    return { postResponse, getResponse, valid };
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, idx)];
  }

  getMetrics(endpointKey?: string): PerfMetrics[] {
    const keys = endpointKey ? [endpointKey] : Array.from(this.responseTimes.keys());
    return keys
      .filter((k) => this.responseTimes.has(k))
      .map((key) => {
        const times = [...this.responseTimes.get(key)!].sort((a, b) => a - b);
        const errors = this.errorCounts.get(key) || 0;
        const sum = times.reduce((a, b) => a + b, 0);
        return {
          endpoint: key.split(' ').slice(1).join(' '),
          method: key.split(' ')[0],
          samples: times.length,
          avgResponseTimeMs: Math.round(sum / times.length),
          minResponseTimeMs: times[0],
          maxResponseTimeMs: times[times.length - 1],
          p95ResponseTimeMs: this.percentile(times, 95),
          p99ResponseTimeMs: this.percentile(times, 99),
          errorCount: errors,
          errorRatePercent: Math.round((errors / times.length) * 10000) / 100,
        };
      });
  }

  loadThresholds(configPath?: string): PerfThresholds {
    const filePath = configPath || path.join(process.cwd(), 'config', 'performance-thresholds.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  validatePerformance(configPath?: string): ThresholdViolation[] {
    const thresholds = this.loadThresholds(configPath);
    const violations: ThresholdViolation[] = [];
    const allMetrics = this.getMetrics();

    for (const metrics of allMetrics) {
      const key = `${metrics.method} ${metrics.endpoint}`;
      const endpointThreshold = thresholds.endpoints[key];
      const maxTime = endpointThreshold?.maxResponseTimeMs ?? thresholds.global.maxResponseTimeMs;

      if (metrics.avgResponseTimeMs > maxTime) {
        violations.push({
          endpoint: key,
          metric: 'avgResponseTimeMs',
          actual: metrics.avgResponseTimeMs,
          threshold: maxTime,
          message: `${key} avg ${metrics.avgResponseTimeMs}ms exceeds threshold ${maxTime}ms`,
        });
      }

      if (metrics.p95ResponseTimeMs > thresholds.global.maxP95ResponseTimeMs) {
        violations.push({
          endpoint: key,
          metric: 'p95ResponseTimeMs',
          actual: metrics.p95ResponseTimeMs,
          threshold: thresholds.global.maxP95ResponseTimeMs,
          message: `${key} p95 ${metrics.p95ResponseTimeMs}ms exceeds threshold ${thresholds.global.maxP95ResponseTimeMs}ms`,
        });
      }

      if (metrics.errorRatePercent > thresholds.global.maxErrorRatePercent) {
        violations.push({
          endpoint: key,
          metric: 'errorRatePercent',
          actual: metrics.errorRatePercent,
          threshold: thresholds.global.maxErrorRatePercent,
          message: `${key} error rate ${metrics.errorRatePercent}% exceeds threshold ${thresholds.global.maxErrorRatePercent}%`,
        });
      }
    }

    if (violations.length > 0) {
      logger.warn(`Performance: ${violations.length} threshold violation(s)`);
      violations.forEach((v) => logger.warn(`  ${v.message}`));
    } else {
      logger.info('Performance: All endpoints within thresholds');
    }

    return violations;
  }

  async runLoadTest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    payload?: any,
    configPath?: string
  ): Promise<{ metrics: PerfMetrics; violations: ThresholdViolation[] }> {
    const thresholds = this.loadThresholds(configPath);
    const { concurrentUsers, durationSeconds, rampUpSeconds } = thresholds.loadTest;
    const violations: ThresholdViolation[] = [];
    const loadKey = `LOAD ${method} ${endpoint}`;

    logger.info(`Load test: ${concurrentUsers} users, ${durationSeconds}s duration, ${rampUpSeconds}s ramp-up`);
    logger.info(`Target: ${method} ${endpoint}`);

    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;
    let totalRequests = 0;

    const runUser = async (userId: number): Promise<void> => {
      const userDelay = (rampUpSeconds * 1000 * userId) / concurrentUsers;
      await new Promise((r) => setTimeout(r, userDelay));

      while (Date.now() < endTime) {
        try {
          const start = performance.now();
          let status: number;

          switch (method) {
            case 'POST':
              status = (await this.post(endpoint, payload)).status;
              break;
            case 'PUT':
              status = (await this.put(endpoint, payload)).status;
              break;
            case 'DELETE':
              status = (await this.delete(endpoint)).status;
              break;
            default:
              status = (await this.get(endpoint)).status;
          }

          const elapsed = Math.round(performance.now() - start);
          this.recordMetric(loadKey, elapsed, status >= 400);
          totalRequests++;
        } catch (err: any) {
          this.recordMetric(loadKey, 0, true);
          totalRequests++;
        }

        await new Promise((r) => setTimeout(r, 100));
      }
    };

    const users = Array.from({ length: concurrentUsers }, (_, i) => runUser(i));
    await Promise.all(users);

    const metrics = this.getMetrics(loadKey)[0];
    const actualRps = Math.round(totalRequests / durationSeconds);

    logger.info(`Load test complete: ${totalRequests} requests, ${actualRps} req/s`);
    logger.info(`Avg: ${metrics.avgResponseTimeMs}ms | P95: ${metrics.p95ResponseTimeMs}ms | Errors: ${metrics.errorCount}`);

    if (metrics.avgResponseTimeMs > thresholds.loadTest.maxAvgResponseTimeMs) {
      violations.push({
        endpoint: loadKey,
        metric: 'avgResponseTimeMs',
        actual: metrics.avgResponseTimeMs,
        threshold: thresholds.loadTest.maxAvgResponseTimeMs,
        message: `Load test avg ${metrics.avgResponseTimeMs}ms exceeds ${thresholds.loadTest.maxAvgResponseTimeMs}ms`,
      });
    }

    if (actualRps < thresholds.loadTest.minRequestsPerSecond) {
      violations.push({
        endpoint: loadKey,
        metric: 'requestsPerSecond',
        actual: actualRps,
        threshold: thresholds.loadTest.minRequestsPerSecond,
        message: `Load test throughput ${actualRps} req/s below minimum ${thresholds.loadTest.minRequestsPerSecond} req/s`,
      });
    }

    return { metrics, violations };
  }

  resetMetrics(): void {
    this.responseTimes.clear();
    this.errorCounts.clear();
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }
}
