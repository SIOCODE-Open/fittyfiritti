/**
 * Page Object Model for AI Availability Screens
 * 
 * Handles the various AI model states (loading, downloadable, downloading, error)
 * that appear before the main application is ready.
 */

import type { Page } from '@playwright/test';

export class AIAvailabilityPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Waits for the AI availability check to complete and handles download if needed
   * This should be called at the start of tests to ensure the app is ready
   */
  async waitForAIReady(timeout = 3600000): Promise<void> {
    console.log('[AIAvailability] Waiting for AI to be ready (timeout: 60 minutes)...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Check if we're on the downloadable screen
      const downloadButton = this.page.getByRole('button', { name: /download ai model/i });
      const isDownloadable = await downloadButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isDownloadable) {
        console.log('[AIAvailability] ✓ Found "Download AI Model" button - clicking it now...');
        await downloadButton.click({ timeout: 10000 });
        console.log('[AIAvailability] ✓ Clicked download button');
        
        // Wait for downloading state to appear
        console.log('[AIAvailability] Waiting for download to start...');
        await this.page.getByText(/downloading ai model/i).waitFor({ state: 'visible', timeout: 30000 });
        console.log('[AIAvailability] ✓ Download started successfully');
        
        // Wait for download to complete (this can take a very long time)
        console.log('[AIAvailability] Waiting for model download to complete (this may take 10-15 minutes)...');
        await this.waitForDownloadComplete(timeout - (Date.now() - startTime));
        continue;
      }
      
      // Check if we're in loading state
      const loadingText = this.page.getByText(/checking ai availability|initializing ai model|loading voice detection/i);
      const isLoading = await loadingText.isVisible().catch(() => false);
      
      if (isLoading) {
        console.log('[AIAvailability] AI is loading, waiting...');
        await this.page.waitForTimeout(2000);
        continue;
      }
      
      // Check if we're in error state
      const errorText = this.page.getByText(/ai not available/i);
      const isError = await errorText.isVisible().catch(() => false);
      
      if (isError) {
        console.error('[AIAvailability] AI is not available - error state detected');
        const errorMessage = await this.page.locator('text=/failed|error|not available/i').first().textContent();
        throw new Error(`AI not available: ${errorMessage}`);
      }
      
      // Check if the main app is ready (welcome screen or main app is visible)
      const welcomeScreen = this.page.getByTestId('welcome-screen');
      const mainApp = this.page.getByTestId('main-application');
      
      const isReady = await Promise.race([
        welcomeScreen.isVisible().catch(() => false),
        mainApp.isVisible().catch(() => false)
      ]);
      
      if (isReady) {
        console.log('[AIAvailability] ✓ AI is ready and app is loaded!');
        return;
      }
      
      // Wait a bit before checking again
      await this.page.waitForTimeout(1000);
    }
    
    throw new Error('Timeout waiting for AI to be ready');
  }

  /**
   * Waits for the AI model download to complete
   */
  private async waitForDownloadComplete(timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Check if we're still downloading
      const downloadingText = this.page.getByText(/downloading ai model/i);
      const isDownloading = await downloadingText.isVisible().catch(() => false);
      
      if (!isDownloading) {
        console.log('[AIAvailability] Download appears to be complete');
        // Wait a bit for initialization to start
        await this.page.waitForTimeout(2000);
        return;
      }
      
      // Check download progress if available
      const progressText = await this.page.locator('text=/\\d+% complete/i').textContent().catch(() => null);
      if (progressText) {
        console.log(`[AIAvailability] Download progress: ${progressText}`);
      }
      
      // Wait before checking again
      await this.page.waitForTimeout(5000);
    }
    
    throw new Error('Timeout waiting for AI model download to complete');
  }

  /**
   * Checks if the AI error screen is showing
   */
  async isErrorShowing(): Promise<boolean> {
    return this.page.getByText(/ai not available/i).isVisible().catch(() => false);
  }

  /**
   * Gets the error message if in error state
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const errorText = await this.page.getByText(/ai not available/i).textContent();
      return errorText;
    } catch {
      return null;
    }
  }

  /**
   * Clicks the retry button on error screen
   */
  async retry(): Promise<void> {
    const retryButton = this.page.getByRole('button', { name: /retry/i });
    await retryButton.click();
  }
}
