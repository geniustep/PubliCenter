import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PubliCenter/);
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should have health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
  });
});

test.describe('Articles', () => {
  test('should navigate to articles page', async ({ page }) => {
    await page.goto('/ar');

    // Look for articles link
    const articlesLink = page.getByText(/مقالات|articles/i);
    if (await articlesLink.isVisible()) {
      await articlesLink.click();
      await expect(page).toHaveURL(/\/articles/);
    }
  });
});
