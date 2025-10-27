/**
 * Page Object Model for the Welcome Screen
 * 
 * Encapsulates all interactions with the Welcome Screen to provide
 * a clean API for tests and reduce duplication.
 */

import type { Locator, Page } from '@playwright/test';

// Type definitions matching the web app
export type Language = 'english' | 'spanish' | 'japanese';
export type PresentationMode =
  | 'transcription-only'
  | 'local-only'
  | 'both-speakers';

export class WelcomeScreenPage {
  readonly page: Page;
  
  // Screen locators
  readonly welcomeScreen: Locator;
  readonly logoSection: Locator;
  readonly logoImage: Locator;
  readonly title: Locator;
  
  // Language settings panel
  readonly languageSettingsPanel: Locator;
  readonly speakerLanguageSection: Locator;
  readonly speakerLanguageSelect: Locator;
  readonly otherPartyLanguageSection: Locator;
  readonly otherPartyLanguageSelect: Locator;
  
  // Presentation mode
  readonly presentationModeSection: Locator;
  readonly presentationModeSelect: Locator;
  readonly presentationModeDescription: Locator;
  
  // Start button
  readonly startRecordingButton: Locator;
  readonly loadingIcon: Locator;
  readonly microphoneIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Screen elements
    this.welcomeScreen = page.getByTestId('welcome-screen');
    this.logoSection = page.getByTestId('welcome-logo-section');
    this.logoImage = page.getByTestId('welcome-logo-image');
    this.title = page.getByTestId('welcome-title');
    
    // Language settings
    this.languageSettingsPanel = page.getByTestId('language-settings-panel');
    this.speakerLanguageSection = page.getByTestId('speaker-language-section');
    this.speakerLanguageSelect = page.getByTestId('speaker-language-select');
    this.otherPartyLanguageSection = page.getByTestId('other-party-language-section');
    this.otherPartyLanguageSelect = page.getByTestId('other-party-language-select');
    
    // Presentation mode
    this.presentationModeSection = page.getByTestId('presentation-mode-section');
    this.presentationModeSelect = page.getByTestId('presentation-mode-select');
    this.presentationModeDescription = page.getByTestId('presentation-mode-description');
    
    // Start button
    this.startRecordingButton = page.getByTestId('start-recording-button');
    this.loadingIcon = page.getByTestId('start-recording-loading-icon');
    this.microphoneIcon = page.getByTestId('start-recording-microphone-icon');
  }

  /**
   * Navigates to the welcome screen
   */
  async goto() {
    await this.page.goto('/');
    await this.welcomeScreen.waitFor({ state: 'visible' });
  }

  /**
   * Checks if the welcome screen is visible
   */
  async isVisible(): Promise<boolean> {
    return this.welcomeScreen.isVisible();
  }

  /**
   * Gets the current speaker language selection
   */
  async getSpeakerLanguage(): Promise<string> {
    return this.speakerLanguageSelect.inputValue();
  }

  /**
   * Sets the speaker language
   */
  async setSpeakerLanguage(language: Language) {
    await this.speakerLanguageSelect.selectOption(language);
  }

  /**
   * Gets all available speaker language options
   */
  async getSpeakerLanguageOptions(): Promise<string[]> {
    return this.speakerLanguageSelect.locator('option').allTextContents();
  }

  /**
   * Gets the current other party language selection
   */
  async getOtherPartyLanguage(): Promise<string> {
    return this.otherPartyLanguageSelect.inputValue();
  }

  /**
   * Sets the other party language
   */
  async setOtherPartyLanguage(language: Language) {
    await this.otherPartyLanguageSelect.selectOption(language);
  }

  /**
   * Gets all available other party language options
   */
  async getOtherPartyLanguageOptions(): Promise<string[]> {
    return this.otherPartyLanguageSelect.locator('option').allTextContents();
  }

  /**
   * Gets the current presentation mode selection
   */
  async getPresentationMode(): Promise<string> {
    return this.presentationModeSelect.inputValue();
  }

  /**
   * Sets the presentation mode
   */
  async setPresentationMode(mode: PresentationMode) {
    await this.presentationModeSelect.selectOption(mode);
  }

  /**
   * Gets all available presentation mode options
   */
  async getPresentationModeOptions(): Promise<string[]> {
    return this.presentationModeSelect.locator('option').allTextContents();
  }

  /**
   * Gets the presentation mode description text
   */
  async getPresentationModeDescription(): Promise<string> {
    const text = await this.presentationModeDescription.textContent();
    return text ?? '';
  }

  /**
   * Checks if the start recording button is enabled
   */
  async isStartButtonEnabled(): Promise<boolean> {
    return this.startRecordingButton.isEnabled();
  }

  /**
   * Checks if the start button is in loading state
   */
  async isStartButtonLoading(): Promise<boolean> {
    return this.loadingIcon.isVisible();
  }

  /**
   * Clicks the start recording button
   */
  async startRecording() {
    await this.startRecordingButton.click();
  }

  /**
   * Configures the recording settings and starts recording
   */
  async configureAndStart(
    speakerLanguage: Language,
    otherPartyLanguage: Language,
    presentationMode: PresentationMode
  ) {
    await this.setSpeakerLanguage(speakerLanguage);
    await this.setOtherPartyLanguage(otherPartyLanguage);
    await this.setPresentationMode(presentationMode);
    await this.startRecording();
  }

  /**
   * Waits for the welcome screen to disappear (recording started)
   */
  async waitForRecordingToStart(timeout = 60000) {
    await this.welcomeScreen.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Gets all text content from the welcome screen (for debugging)
   */
  async getAllText(): Promise<string> {
    const text = await this.welcomeScreen.textContent();
    return text ?? '';
  }
}
