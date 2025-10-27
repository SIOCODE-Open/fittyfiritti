/**
 * Welcome Screen Tests
 * 
 * Tests the initial welcome screen functionality including:
 * - Language selection options
 * - Presentation mode options
 * - UI element visibility and state
 */

import { test, expect } from './fixtures/persistentContext';
import { AIAvailabilityPage } from './helpers/pages/AIAvailabilityPage';
import { WelcomeScreenPage } from './helpers/pages/WelcomeScreenPage';

test.describe('Welcome Screen', () => {
  let welcomePage: WelcomeScreenPage;
  let aiPage: AIAvailabilityPage;

  test.beforeEach(async ({ page }) => {
    aiPage = new AIAvailabilityPage(page);
    welcomePage = new WelcomeScreenPage(page);
    
    // Navigate to the app
    await page.goto('/');
    
    // Wait for AI to be ready (handles download if needed)
    await aiPage.waitForAIReady();
    
    // Now we should be on the welcome screen
    await expect(welcomePage.welcomeScreen).toBeVisible();
  });

  test.describe('UI Elements', () => {
    test('should display all main UI elements', async () => {
      // Check screen is visible
      await expect(welcomePage.welcomeScreen).toBeVisible();

      // Check logo section
      await expect(welcomePage.logoSection).toBeVisible();
      await expect(welcomePage.logoImage).toBeVisible();
      await expect(welcomePage.title).toBeVisible();
      await expect(welcomePage.title).toHaveText('FittyFiritti');

      // Check language settings panel
      await expect(welcomePage.languageSettingsPanel).toBeVisible();

      // Check start button
      await expect(welcomePage.startRecordingButton).toBeVisible();
      await expect(welcomePage.startRecordingButton).toBeEnabled();
    });

    test('should display microphone icon on start button', async () => {
      await expect(welcomePage.microphoneIcon).toBeVisible();
      await expect(welcomePage.loadingIcon).not.toBeVisible();
    });
  });

  test.describe('Speaker Language Selection', () => {
    test('should have speaker language select with label', async () => {
      await expect(welcomePage.speakerLanguageSection).toBeVisible();
      await expect(welcomePage.speakerLanguageSelect).toBeVisible();
    });

    test('should have all required language options', async () => {
      const options = await welcomePage.getSpeakerLanguageOptions();
      
      expect(options).toContain('English');
      expect(options).toContain('Spanish');
      expect(options).toContain('Japanese');
      expect(options.length).toBe(3);
    });

    test('should default to English', async () => {
      const currentLanguage = await welcomePage.getSpeakerLanguage();
      expect(currentLanguage).toBe('english');
    });

    test('should allow changing speaker language to Spanish', async () => {
      await welcomePage.setSpeakerLanguage('spanish');
      const currentLanguage = await welcomePage.getSpeakerLanguage();
      expect(currentLanguage).toBe('spanish');
    });

    test('should allow changing speaker language to Japanese', async () => {
      await welcomePage.setSpeakerLanguage('japanese');
      const currentLanguage = await welcomePage.getSpeakerLanguage();
      expect(currentLanguage).toBe('japanese');
    });
  });

  test.describe('Other Party Language Selection', () => {
    test('should have other party language select with label', async () => {
      await expect(welcomePage.otherPartyLanguageSection).toBeVisible();
      await expect(welcomePage.otherPartyLanguageSelect).toBeVisible();
    });

    test('should have all required language options', async () => {
      const options = await welcomePage.getOtherPartyLanguageOptions();
      
      expect(options).toContain('English');
      expect(options).toContain('Spanish');
      expect(options).toContain('Japanese');
      expect(options.length).toBe(3);
    });

    test('should default to Japanese', async () => {
      const currentLanguage = await welcomePage.getOtherPartyLanguage();
      expect(currentLanguage).toBe('japanese');
    });

    test('should allow changing other party language to English', async () => {
      await welcomePage.setOtherPartyLanguage('english');
      const currentLanguage = await welcomePage.getOtherPartyLanguage();
      expect(currentLanguage).toBe('english');
    });

    test('should allow changing other party language to Spanish', async () => {
      await welcomePage.setOtherPartyLanguage('spanish');
      const currentLanguage = await welcomePage.getOtherPartyLanguage();
      expect(currentLanguage).toBe('spanish');
    });
  });

  test.describe('Presentation Mode Selection', () => {
    test('should have presentation mode select with label', async () => {
      await expect(welcomePage.presentationModeSection).toBeVisible();
      await expect(welcomePage.presentationModeSelect).toBeVisible();
    });

    test('should have all required presentation mode options', async () => {
      const options = await welcomePage.getPresentationModeOptions();
      
      expect(options).toContain('Transcription & Translation Only');
      expect(options).toContain('Presentation from Your Speech');
      expect(options).toContain('Presentation from Both Speakers');
      expect(options.length).toBe(3);
    });

    test('should default to "both-speakers" mode', async () => {
      const currentMode = await welcomePage.getPresentationMode();
      expect(currentMode).toBe('both-speakers');
    });

    test('should display description for each presentation mode', async () => {
      // Check default description
      let description = await welcomePage.getPresentationModeDescription();
      expect(description.length).toBeGreaterThan(0);

      // Check transcription-only description
      await welcomePage.setPresentationMode('transcription-only');
      description = await welcomePage.getPresentationModeDescription();
      expect(description).toContain('transcription');

      // Check local-only description
      await welcomePage.setPresentationMode('local-only');
      description = await welcomePage.getPresentationModeDescription();
      expect(description).toContain('your');

      // Check both-speakers description
      await welcomePage.setPresentationMode('both-speakers');
      description = await welcomePage.getPresentationModeDescription();
      expect(description.toLowerCase()).toContain('both');
    });

    test('should allow changing to transcription-only mode', async () => {
      await welcomePage.setPresentationMode('transcription-only');
      const currentMode = await welcomePage.getPresentationMode();
      expect(currentMode).toBe('transcription-only');
    });

    test('should allow changing to local-only mode', async () => {
      await welcomePage.setPresentationMode('local-only');
      const currentMode = await welcomePage.getPresentationMode();
      expect(currentMode).toBe('local-only');
    });
  });

  test.describe('Configuration Combinations', () => {
    test('should allow English to English configuration', async () => {
      await welcomePage.setSpeakerLanguage('english');
      await welcomePage.setOtherPartyLanguage('english');
      
      const speaker = await welcomePage.getSpeakerLanguage();
      const otherParty = await welcomePage.getOtherPartyLanguage();
      
      expect(speaker).toBe('english');
      expect(otherParty).toBe('english');
    });

    test('should allow English to Japanese configuration', async () => {
      await welcomePage.setSpeakerLanguage('english');
      await welcomePage.setOtherPartyLanguage('japanese');
      
      const speaker = await welcomePage.getSpeakerLanguage();
      const otherParty = await welcomePage.getOtherPartyLanguage();
      
      expect(speaker).toBe('english');
      expect(otherParty).toBe('japanese');
    });

    test('should allow English to Spanish configuration', async () => {
      await welcomePage.setSpeakerLanguage('english');
      await welcomePage.setOtherPartyLanguage('spanish');
      
      const speaker = await welcomePage.getSpeakerLanguage();
      const otherParty = await welcomePage.getOtherPartyLanguage();
      
      expect(speaker).toBe('english');
      expect(otherParty).toBe('spanish');
    });
  });
});
