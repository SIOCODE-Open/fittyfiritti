/**
 * Custom Playwright fixture for persistent browser context
 * This ensures the Chrome AI model stays downloaded between test runs
 */

import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to persistent user data directory
const USER_DATA_DIR = path.resolve(__dirname, '../../.chrome-test-profile');

type PersistentContextFixtures = {
  context: BrowserContext;
  page: any;
  audioFile: string | undefined;
};

/**
 * Custom fixture that uses launchPersistentContext to maintain browser state
 * including the downloaded AI model between test runs
 */
export const test = base.extend<PersistentContextFixtures>({
  // Add audioFile fixture that tests can set
  audioFile: undefined,

  // Override the context fixture to use persistent context
  context: async ({ audioFile }, use) => {
    const args = [
      // Combine all AI feature flags
      '--enable-features=PromptAPIForGeminiNano,PromptAPIForGeminiNanoMultimodalInput,OptimizationGuideOnDeviceModel,Ai',
      // Enable experimental web platform features
      '--enable-experimental-web-platform-features',
      // Allow microphone access for testing
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      // Allow localhost access
      '--allow-running-insecure-content',
      '--disable-web-security',
      // Disable sandbox for testing
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // Auto-grant permissions
      '--autoplay-policy=no-user-gesture-required',
    ];

    // Add audio file flag if provided
    if (audioFile) {
      args.push(`--use-file-for-fake-audio-capture=${audioFile}`);
    }

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false, // AI features require headed mode
      channel: 'chrome',
      args,
      permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
      viewport: { width: 1280, height: 720 },
      // Recording options
      recordVideo: process.env.CI ? { dir: 'test-results/videos' } : undefined,
    });

    // Use the context in tests
    await use(context);

    // Close context after all tests
    await context.close();
  },

  // Override the page fixture to use the first page from persistent context
  page: async ({ context }, use) => {
    // Get existing pages or create a new one
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0]! : await context.newPage();
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
