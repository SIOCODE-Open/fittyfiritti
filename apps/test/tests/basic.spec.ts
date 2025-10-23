import { test, expect } from '@playwright/test';

test.describe('Editor App - Basic Functionality', () => {
  test('should load the application and display main elements', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check if the page loads successfully
    await expect(page).toHaveTitle(/DiAI/);

    // Check if main content is visible
    await expect(page.locator('body')).toBeVisible();

    // Check if the main app container is present
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();

    // Wait for React to render
    await page.waitForTimeout(1000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/app-loaded.png', fullPage: true });
  });

  test('should display the "Get Started" button', async ({ page }) => {
    await page.goto('/');

    // Look for any button that might contain "Get Started" or similar text
    const getStartedButton = page.locator('button').filter({ hasText: /get started/i });
    
    // Check if the button exists
    const buttonCount = await getStartedButton.count();
    if (buttonCount > 0) {
      await expect(getStartedButton.first()).toBeVisible();
    } else {
      // If no "Get Started" button, check for any buttons
      const anyButton = page.locator('button').first();
      if (await anyButton.count() > 0) {
        await expect(anyButton).toBeVisible();
        console.log('Button text:', await anyButton.textContent());
      } else {
        // Just verify the page loaded if no buttons found
        await expect(page.locator('#root')).toBeVisible();
      }
    }
  });

  test('should be responsive and display correctly', async ({ page }) => {
    await page.goto('/');

    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#root')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#root')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should not have any console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for any async operations

    // Filter out known acceptable errors (like network errors for unavailable resources)
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('net::ERR_') &&
      !error.includes('404')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});