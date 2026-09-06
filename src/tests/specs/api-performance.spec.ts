import { test, expect } from '@playwright/test';
import { ApiClient } from '../../api/ApiClient';

let api: ApiClient;

test.beforeAll(async () => {
  api = new ApiClient();
  await api.init();
});

test.afterAll(async () => {
  await api.dispose();
});

test.describe('API Performance Tests @perf', () => {
  test('GET endpoint should respond within threshold', async () => {
    const endpoint = process.env.API_GET_ENDPOINT || '/api/items';

    for (let i = 0; i < 10; i++) {
      const response = await api.get(endpoint);
      expect(response.status).toBeLessThan(500);
    }

    const metrics = api.getMetrics();
    const getMetrics = metrics.find((m) => m.method === 'GET');
    expect(getMetrics).toBeDefined();

    const thresholds = api.loadThresholds();
    const endpointThreshold = thresholds.endpoints[`GET ${endpoint}`];
    const maxTime = endpointThreshold?.maxResponseTimeMs ?? thresholds.global.maxResponseTimeMs;

    expect(getMetrics!.avgResponseTimeMs).toBeLessThanOrEqual(maxTime);
    expect(getMetrics!.p95ResponseTimeMs).toBeLessThanOrEqual(thresholds.global.maxP95ResponseTimeMs);
  });

  test('POST endpoint should respond within threshold', async () => {
    const endpoint = process.env.API_POST_ENDPOINT || '/api/items';
    const payload = { name: 'Perf Test Item', description: 'Performance test', value: 1 };

    for (let i = 0; i < 5; i++) {
      const response = await api.post(endpoint, payload);
      expect(response.status).toBeLessThan(500);
    }

    const violations = api.validatePerformance();
    const postViolations = violations.filter((v) => v.endpoint.startsWith('POST'));
    expect(postViolations).toHaveLength(0);
  });

  test('all endpoints should meet global thresholds after mixed workload', async () => {
    const endpoint = process.env.API_GET_ENDPOINT || '/api/items';
    const payload = { name: 'Mixed Workload', description: 'Test', value: 42 };

    api.resetMetrics();

    for (let i = 0; i < 5; i++) {
      await api.get(endpoint);
      await api.post(endpoint, payload);
    }

    const violations = api.validatePerformance();
    expect(violations).toHaveLength(0);
  });

  test('error rate should stay below threshold', async () => {
    const endpoint = process.env.API_GET_ENDPOINT || '/api/items';

    api.resetMetrics();

    for (let i = 0; i < 20; i++) {
      await api.get(endpoint);
    }

    const metrics = api.getMetrics();
    const thresholds = api.loadThresholds();

    for (const m of metrics) {
      expect(m.errorRatePercent).toBeLessThanOrEqual(thresholds.global.maxErrorRatePercent);
    }
  });

  test('concurrent load should meet throughput requirements', async () => {
    const endpoint = process.env.API_GET_ENDPOINT || '/api/items';

    api.resetMetrics();
    const { metrics, violations } = await api.runLoadTest('GET', endpoint);

    expect(metrics.samples).toBeGreaterThan(0);
    expect(violations).toHaveLength(0);
  });
});
