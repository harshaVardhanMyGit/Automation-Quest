import { test, expect } from '@playwright/test';

test.describe('Inventory Control challenge', () => {
  test('API supports CRUD and rejects invalid data @api @smoke', async ({ request }) => {
    const created = await request.post('/api/items', { data: { name: 'Monitor', category: 'Hardware', quantity: 4 } });
    expect(created.status()).toBe(201);
    const item = await created.json();
    expect(item).toMatchObject({ name: 'Monitor', quantity: 4 });

    const updated = await request.put(`/api/items/${item.id}`, { data: { name: 'Display', category: 'Hardware', quantity: 6 } });
    expect(updated.status()).toBe(200);
    expect(await updated.json()).toMatchObject({ name: 'Display', quantity: 6 });

    const invalid = await request.post('/api/items', { data: { name: '', category: 'Hardware', quantity: 0 } });
    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toHaveProperty('error');

    const deleted = await request.delete(`/api/items/${item.id}`);
    expect(deleted.status()).toBe(200);
  });

  test('UI searches inventory and submits a valid item @ui @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Inventory Control');
    await expect(page.getByRole('heading', { name: 'Inventory Control' })).toBeVisible();

    await page.getByLabel('Search inventory').fill('Keyboard');
    await expect(page.locator('[data-item="1"]')).toContainText('Keyboard');
    await expect(page.locator('[data-item="2"]')).toHaveCount(0);

    await page.getByLabel('Name').fill('Mouse');
    await page.getByLabel('Category').fill('Hardware');
    await page.getByLabel('Quantity').fill('8');
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByRole('status')).toHaveText('Item added');
    await page.getByLabel('Search inventory').fill('');
    await expect(page.getByText('Mouse').first()).toBeVisible();
  });

  test('UI remains usable on mobile viewport @ui', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByLabel('Search inventory')).toBeVisible();
  });
});