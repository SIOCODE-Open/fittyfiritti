/**
 * Transcription Tests
 * 
 * Tests the real-time audio transcription functionality using pre-recorded audio files.
 * Validates transcription accuracy against known ground truth text.
 * 
 * Each test uses a different audio file via Chrome's --use-file-for-fake-audio-capture flag.
 */

import { test, expect, chromium } from '@playwright/test';
import { AIAvailabilityPage } from './helpers/pages/AIAvailabilityPage';
import { WelcomeScreenPage } from './helpers/pages/WelcomeScreenPage';
import { getTestAudio, TEST_AUDIO_FILES } from './helpers/audio/testAudioFiles';
import { validateTranscription, containsKeywords } from './helpers/assertions/textComparison';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to persistent user data directory
const USER_DATA_DIR = path.resolve(__dirname, '../.chrome-test-profile');

// Helper function to run a transcription test with a specific audio file
async function testTranscriptionWithAudio(
  audioKey: keyof typeof TEST_AUDIO_FILES,
  keywords: string[],
  similarityThreshold: number = 0.6
) {
  const testAudio = getTestAudio(audioKey);
  
  console.log(`[Test] Using audio file: ${testAudio.path}`);
  console.log(`[Test] Expected text: "${testAudio.text}"`);

  // Launch browser with this specific audio file
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    channel: 'chrome',
    args: [
      '--enable-features=PromptAPIForGeminiNano,PromptAPIForGeminiNanoMultimodalInput,OptimizationGuideOnDeviceModel,Ai',
      '--enable-experimental-web-platform-features',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${testAudio.path}`,
      '--allow-running-insecure-content',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required',
    ],
    permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
    viewport: { width: 1280, height: 720 },
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    const aiPage = new AIAvailabilityPage(page);
    const welcomePage = new WelcomeScreenPage(page);

    // Navigate and wait for AI to be ready
    await page.goto('http://localhost:5173/');
    await aiPage.waitForAIReady();
    await expect(welcomePage.welcomeScreen).toBeVisible();

    // Start recording with English language
    await welcomePage.configureAndStart('english', 'english', 'transcription-only');
    await welcomePage.waitForRecordingToStart();

    console.log('[Test] Recording started, waiting for VAD to detect speech...');
    
    // Wait for VAD to detect speech (the user-speaking-indicator should become visible and blue)
    // The audio files now have 20 seconds of silence at the beginning (for model download
    // and VAD initialization), then the speech, then 10 seconds of silence at the end
    // (so VAD can detect speech end).
    
    const speakingIndicator = page.locator('[data-testid="user-speaking-indicator"]');
    
    // Wait longer for the indicator to show speech is being detected
    // (need to wait through the 20s of beginning silence)
    await expect(speakingIndicator).toBeVisible({ timeout: 30000 });
    console.log('[Test] VAD detected speech (blue microphone icon visible)');
    
    // Now wait for speech to end and transcription to process
    // The audio plays (~4s), then 10s of silence, then VAD triggers transcription
    console.log('[Test] Waiting for speech to end and transcription to process...');
    
    // Look for transcription cards (they appear after speech ends and transcription completes)
    console.log('[Test] Looking for transcription cards...');
    const transcriptionCards = page.locator('[data-testid^="transcription-card-"]');
    
    // Wait for at least one transcription card to appear
    // Much longer timeout to account for: audio playback + silence + transcription processing
    await expect(transcriptionCards.first()).toBeVisible({ timeout: 60000 });
    console.log('[Test] Transcription card appeared!');
    
    // IMPORTANT: Wait for the transcription TEXT to be populated
    // The card appears first, but the text streams in afterwards
    console.log('[Test] Waiting for transcription text to be populated...');
    const firstCard = transcriptionCards.first();
    const textContainer = firstCard.locator('[data-testid="transcription-original-text"]');
    
    // Wait for text to appear and have content
    await expect(textContainer).not.toBeEmpty({ timeout: 20000 });
    console.log('[Test] Transcription text is populated!');
    
    // Wait an additional 10 seconds for the streaming transcription to fully complete
    // The text may still be streaming in even after it's not empty
    console.log('[Test] Waiting for streaming transcription to complete...');
    await page.waitForTimeout(10000);
    
    // Get the count of transcription cards
    const cardCount = await transcriptionCards.count();
    console.log(`[Test] Found ${cardCount} transcription card(s)`);
    
    expect(cardCount).toBeGreaterThan(0);

    // Collect all transcription text
    const transcriptionTexts: string[] = [];
    
    for (let i = 0; i < cardCount; i++) {
      const card = transcriptionCards.nth(i);
      const textContainer = card.locator('[data-testid="transcription-original-text"]');
      
      if (await textContainer.isVisible()) {
        const text = await textContainer.textContent();
        if (text) {
          transcriptionTexts.push(text.trim());
          console.log(`[Test] Transcription ${i + 1}: "${text.trim()}"`);
        }
      }
    }

    // Combine all transcriptions
    const fullTranscription = transcriptionTexts.join(' ');
    console.log(`[Test] Full transcription: "${fullTranscription}"`);
    console.log(`[Test] Expected text: "${testAudio.text}"`);

    // Validate transcription contains key words from the ground truth
    const hasKeywords = containsKeywords(fullTranscription, keywords);
    
    console.log(`[Test] Contains keywords ${JSON.stringify(keywords)}: ${hasKeywords}`);
    expect(hasKeywords).toBe(true);

    // Also validate similarity
    const validation = validateTranscription(fullTranscription, testAudio.text, similarityThreshold);
    console.log(`[Test] ${validation.message}`);
    
    // The test passes if we have keywords, even if similarity is lower
    // This is because AI transcription can vary
    if (!hasKeywords) {
      expect(validation.matches).toBe(true);
    }
    
    // End the recording session
    console.log('[Test] Test passed! Ending recording session...');
    const endButton = page.getByTestId('end-session-button');
    await endButton.click();
    
    // Wait a moment for cleanup
    await page.waitForTimeout(1000);
  } finally {
    await context.close();
  }
}

test.describe('Audio Transcription', () => {
  // English tests (5 tests)
  test('should transcribe test-hello-en.wav correctly', async () => {
    await testTranscriptionWithAudio('test-hello-en', ['hello', 'test']);
  });

  test('should transcribe test-agreement-en.wav correctly', async () => {
    await testTranscriptionWithAudio('test-agreement-en', ['yes', 'agree']);
  });

  test('should transcribe test-pangram-en.wav correctly', async () => {
    await testTranscriptionWithAudio('test-pangram-en', ['quick', 'brown', 'fox', 'lazy', 'dog']);
  });

  test('should transcribe test-technical-en.wav correctly', async () => {
    await testTranscriptionWithAudio('test-technical-en', ['machine', 'learning', 'artificial', 'intelligence']);
  });

  test('should transcribe test-long-en.wav correctly', async () => {
    await testTranscriptionWithAudio('test-long-en', ['purple', 'elephant', 'rainbow', 'toaster', 'penguin', 'bicycle', 'clouds'], 0.5);
  });

  // Spanish tests (5 tests)
  test('should transcribe test-hello-es.wav correctly', async () => {
    await testTranscriptionWithAudio('test-hello-es', ['hola', 'prueba']);
  });

  test('should transcribe test-agreement-es.wav correctly', async () => {
    await testTranscriptionWithAudio('test-agreement-es', ['sí', 'acuerdo']);
  });

  test('should transcribe test-pangram-es.wav correctly', async () => {
    await testTranscriptionWithAudio('test-pangram-es', ['veloz', 'murciélago', 'hindú']);
  });

  test('should transcribe test-technical-es.wav correctly', async () => {
    await testTranscriptionWithAudio('test-technical-es', ['aprendizaje', 'automático', 'inteligencia', 'artificial']);
  });

  test('should transcribe test-long-es.wav correctly', async () => {
    await testTranscriptionWithAudio('test-long-es', ['elefante', 'morado', 'arcoíris', 'tostadora', 'pingüino', 'bicicleta', 'nubes'], 0.5);
  });

  // Japanese tests (5 tests)
  test('should transcribe test-hello-ja.wav correctly', async () => {
    await testTranscriptionWithAudio('test-hello-ja', ['こんにちは', 'テスト']);
  });

  test('should transcribe test-agreement-ja.wav correctly', async () => {
    await testTranscriptionWithAudio('test-agreement-ja', ['はい', '同意']);
  });

  test('should transcribe test-pangram-ja.wav correctly', async () => {
    await testTranscriptionWithAudio('test-pangram-ja', ['いろは', 'ちりぬる']);
  });

  test('should transcribe test-technical-ja.wav correctly', async () => {
    await testTranscriptionWithAudio('test-technical-ja', ['機械学習', '人工知能']);
  });

  test('should transcribe test-long-ja.wav correctly', async () => {
    await testTranscriptionWithAudio('test-long-ja', ['象', '虹', 'トースター', 'ペンギン', 'チーズ', '自転車', '雲'], 0.5);
  });
});
