import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-ai',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome flags to match manual browser setup
        launchOptions: {
          args: [
            // The main flag that enables Prompt API for Gemini Nano - this is the chrome://flags setting
            '--enable-features=PromptAPIForGeminiNano',
            // Enable multimodal input as well
            '--enable-features=PromptAPIForGeminiNanoMultimodalInput',
            // Enable on-device AI model support
            '--enable-features=OptimizationGuideOnDeviceModel',
            // Enable AI experimental features
            '--enable-features=Ai',
            // Allow experimental features
            '--enable-experimental-web-platform-features',
            // Allow localhost access
            '--allow-running-insecure-content',
            '--disable-web-security',
            // Disable sandbox for testing
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ],
          channel: 'chrome',
          headless: false
        }
      },
    },

    // Try with combined enable-features flag
    {
      name: 'chromium-ai-combined',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-features=PromptAPIForGeminiNano,PromptAPIForGeminiNanoMultimodalInput,OptimizationGuideOnDeviceModel,Ai',
            '--enable-experimental-web-platform-features',
            '--no-sandbox',
            '--disable-web-security'
          ],
          channel: 'chrome',
          headless: false
        }
      },
    },

    // Standard Chromium for comparison tests (without AI flags)
    {
      name: 'chromium-standard',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox and WebKit for cross-browser compatibility
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    cwd: '../editor'
  },
});