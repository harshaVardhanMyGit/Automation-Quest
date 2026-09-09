import { test, expect } from '@playwright/test';
import { ApiClient } from '../../api/ApiClient';

test.describe('API Tests @api', () => {
  let apiClient: ApiClient;

  test.beforeAll(async () => {
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterAll(async () => {
    await apiClient.dispose();
  });

  test('POST creates a new resource', async () => {
    const payload = {
      name: 'Automation Test Item',
      description: 'Created during hackathon',
    };

    const response = await apiClient.post('/api/resources', payload);
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    console.log('Created resource:', response.data.id);
  });

  test('GET retrieves created resource', async () => {
    const postResponse = await apiClient.post('/api/resources', {
      name: 'Item for GET test',
    });
    const id = postResponse.data.id;

    const getResponse = await apiClient.get(`/api/resources/${id}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.name).toBe('Item for GET test');
  });

  test('POST then GET validation pattern', async () => {
    const result = await apiClient.postAndValidate(
      '/api/resources',
      '/api/resources',
      { name: 'Validated Item', value: 100 }
    );

    expect(result.postResponse.status).toBe(201);
    expect(result.getResponse.status).toBe(200);
    expect(result.valid).toBeTruthy();
  });

  test('GET all resources returns list', async () => {
    const response = await apiClient.get('/api/resources');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBeTruthy();
  });

  test('invalid POST returns error', async () => {
    const response = await apiClient.post('/api/resources', {});
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
