import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for FittyFiritti Chrome Built-in AI tests
 * 
 * This configuration is optimized for testing Chrome's Built-in AI API features.
 * The persistent browser context is handled in tests/fixtures/persistentContext.ts
 * which ensures the AI model stays downloaded between test runs.
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel execution for AI tests to avoid resource conflicts
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1, // Single worker to avoid conflicts with AI model downloads
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global timeout for each test - increased for AI model downloads */
  timeout: 1800000, // 30 minutes per test (AI model download can take significant time)
  /* Expect timeout for assertions */
  expect: {
    timeout: 60000, // 1 minute for assertions
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording on failure */
    video: 'retain-on-failure',

    /* Increased action timeout for AI operations */
    actionTimeout: 60000, // 1 minute for actions
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'cd ../web && pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 300000, // 5 minutes for server startup
  },
});