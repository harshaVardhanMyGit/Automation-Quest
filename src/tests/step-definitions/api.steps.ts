import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { ApiClient, ApiResponse } from '../../api/ApiClient';
import { expect } from '@playwright/test';

setDefaultTimeout(30000);

let apiClient: ApiClient;
let lastResponse: ApiResponse;
let createdResourceId: string;

Given('the API base URL is configured', async function () {
  apiClient = new ApiClient();
  await apiClient.init();
});

When('I send a POST request to the create endpoint with valid data', async function () {
  const payload = {
    name: 'Test Item',
    description: 'Created by automation',
    value: 42,
  };
  lastResponse = await apiClient.post('/api/resources', payload);
});

Then('the response status should be {int}', async function (status: number) {
  expect(lastResponse.status).toBe(status);
});

Then('the response should contain the created resource ID', async function () {
  createdResourceId = lastResponse.data.id;
  expect(createdResourceId).toBeTruthy();
});

When('I send a GET request with the created resource ID', async function () {
  lastResponse = await apiClient.get(`/api/resources/${createdResourceId}`);
});

Then('the response data should match the posted data', async function () {
  expect(lastResponse.data.name).toBe('Test Item');
  expect(lastResponse.data.description).toBe('Created by automation');
});

When('I send a POST request with invalid data', async function () {
  lastResponse = await apiClient.post('/api/resources', {});
});

Then('the response should contain an error message', async function () {
  expect(lastResponse.data.error || lastResponse.data.message).toBeTruthy();
});

When('I send a GET request to list all resources', async function () {
  lastResponse = await apiClient.get('/api/resources');
});

Then('the response should contain a list of resources', async function () {
  expect(Array.isArray(lastResponse.data)).toBeTruthy();
  await apiClient.dispose();
});
